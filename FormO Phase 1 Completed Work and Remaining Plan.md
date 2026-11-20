# FormO Phase 1: Completed Work and Remaining Plan

Nov 18, 2026 · @Daady

## Status at a glance

Phase 1 (safe foundations) is finished and committed locally, but not pushed anywhere and not yet tested against a database. Eight fixes landed; phases 2 to 5 (database upkeep, the submission pipeline, security hardening, read APIs) have not been started.

| Item | State |
| --- | --- |
| Phase 1 commit | `996b73c` on branch `feat/backend-phase-1`, branched from `master` at `2460bfc` |
| Theme system commit | `46ea263` on branch `feat/theme-system` (separate from phase 1) |
| Pushed to GitHub | No. `NdangaHeritier/formo` returned 403 (no write access); `alituanfamous/formo` cannot be attached in this session |
| Patch files | Both commits were delivered as `0001-theme-system.patch` and `0002-backend-phase-1.patch` |
| Tests run | Strict schema and production env checks run directly; type check shows only the missing generated Prisma client |
| Tested against Postgres | No; the sandbox cannot download Prisma's engine |
| Next step | Phase 2: partition maintenance, because writes fail about 12 months after the first migration |

## Phase 1 changes

Each of the eight fixes below maps to a defect from the earlier audit doc, with the files touched and how it was checked.

| # | Fix | Files | Before | After | Checked |
| --- | --- | --- | --- | --- | --- |
| 1 | Safe JSON reading | `src/server/auth/authorization.ts` (`readJson`); eight `route.ts` files | A malformed or empty body threw `SyntaxError` and returned `500` | Returns `400 Request body must be valid JSON` | Code review only |
| 2 | Strict request schemas | `src/lib/validation/forms.ts`, `projects.ts`, `auth.ts` | Unknown keys were silently dropped, so wrong field names looked like success | Unknown keys return `400 Unrecognized key: "..."` | Run directly: `recipientEmail` is rejected, `emailTo`-only is accepted |
| 3 | Edit form field name | `src/components/Developer/Modals/Forms/EditForm.tsx` | Sent `recipientEmail`; the recipient never changed | Sends `emailTo` | Code review; follows from fix 2 |
| 4 | Database error mapping | `authorization.ts` (`jsonErrorResponse`) | A unique-constraint race (`P2002`) returned `500` | `P2002` returns `409`, `P2025` returns `404` | Code review only |
| 5 | Recipient data loss | `src/server/services/forms.service.ts` (`updateProjectForm`) | Changing `emailTo` alone deleted every CC and BCC recipient | A full `recipients` list replaces all; `emailTo` alone swaps only the old primary row | Code review only |
| 6 | Scoped project lookup | `authorization.ts` (`requireProjectAccess`) | Slug or name searched every workspace the user belongs to and could return the wrong project | Resolved inside the active workspace; slug first, then name; two name matches return `409` | Type check only |
| 7 | Boot-time env validation | `src/instrumentation.ts` (new), `src/lib/env.ts` | Missing secrets surfaced on the first request that needed them | Production refuses to start without `BETTER_AUTH_SECRET`, `FORMO_ENCRYPTION_KEY`, `FORMO_HMAC_PEPPER`; development logs a warning | Run directly: production without secrets is rejected |
| 8 | Dev secrets fail closed | `src/lib/crypto.ts`, `.env.example` | Hard-coded public fallback keys were used whenever `NODE_ENV` was not `production` | Fallbacks need `FORMO_ALLOW_DEV_SECRETS=1`, and that flag is rejected in production | Code review only |

The change set is 18 files in one commit: 8 route handlers, 3 validation files, `authorization.ts`, `forms.service.ts`, `crypto.ts`, `env.ts`, the new `instrumentation.ts`, `.env.example` and `EditForm.tsx`.

Two details worth knowing:

- **Recipient swap logic (fix 5).** When only `emailTo` changes, the code reads the previous address first, deletes the `to` row for that address, and inserts the new one with `skipDuplicates`. If the new address already exists as a CC, it is kept and a `to` row is added.
- **Lookup order (fix 6).** A UUID is matched directly. Otherwise the user's active workspace is used; if the session has none or the membership is gone, the user's oldest workspace is used. Slug match wins over name match.

## Behavior changes to expect

Four changes can break an existing caller or local setup; all are intentional and each has a one-line fix.

| Change | Who is affected | What to do |
| --- | --- | --- |
| Unknown JSON keys now return `400` | Any client sending extra fields, such as the old edit form or scripts | Remove the extra key or use the documented name. The only in-repo caller that sent a wrong key, `EditForm.tsx`, is fixed |
| Dev fallback secrets need `FORMO_ALLOW_DEV_SECRETS=1` | A local environment with `FORMO_ENCRYPTION_KEY` or `FORMO_HMAC_PEPPER` unset or shorter than 32 characters | Set both to 32 or more characters (the values in `.env.example` already qualify), or add `FORMO_ALLOW_DEV_SECRETS=1` locally. Never on shared servers |
| Production boot fails without three secrets | Any production or staging deploy running with `NODE_ENV=production` | Set `BETTER_AUTH_SECRET`, `FORMO_ENCRYPTION_KEY`, `FORMO_HMAC_PEPPER` (32 or more characters each) before deploying |
| Project slug or name resolves only in the active workspace | A user with the same slug in two workspaces, or an old link into a non-active workspace | Switch workspace first, or link by project id (UUID), which still works across workspaces the user belongs to |

Also new: a project name shared by two projects in one workspace returns `409 More than one project has that name; use its slug or id` instead of picking one. Project list links already use the slug, so normal navigation is unaffected.

## How to test phase 1 by hand

Run these against a local database after `npm ci`, `npx prisma migrate deploy` and `npm run dev`, signed in through the browser so you have a session cookie. Copy the cookie from the browser's developer tools into `COOKIE`.

```bash
BASE=http://localhost:3000
COOKIE='better-auth.session_token=...'
```

- [ ] **Bad JSON returns 400.** `curl -i -X POST $BASE/api/projects -H "Cookie: $COOKIE" -H 'Content-Type: application/json' -d '{oops'` should show `400` and `Request body must be valid JSON`, not `500`.
- [ ] **Unknown key is rejected.** `curl -i -X PATCH $BASE/api/forms/<formId> -H "Cookie: $COOKIE" -H 'Content-Type: application/json' -d '{"recipientEmail":"a@b.co"}'` should show `400` and `Unrecognized key`.
- [ ] **Edit form saves the recipient.** In the dashboard, edit a form's recipient email and reload; the new address should persist.
- [ ] **CC and BCC survive an `emailTo` change.** Create a form with `recipients` containing one `cc` and one `bcc` (POST to `/api/projects/<id>/forms`). PATCH only `{"emailTo":"new@example.com"}`. Query `SELECT email, type FROM form_recipients WHERE form_id = '<id>';`: the `to` row is `new@example.com` and both CC and BCC rows remain.
- [ ] **Full recipient list still replaces.** PATCH `{"recipients":[{"email":"only@example.com","type":"cc"}]}`; the table should hold the primary `to` row plus that one CC.
- [ ] **Duplicate endpoint returns 409.** Create two forms with the same custom `endpoint`; the second returns `409`. For the race itself, send both requests at the same moment and confirm neither returns `500`.
- [ ] **Slug lookup is scoped.** With two workspaces that each have a project with slug `demo`, `GET /api/projects/slug/demo` returns the one in the active workspace. Two same-name projects in one workspace and a lookup by that name returns `409`.
- [ ] **Production boot check.** `NODE_ENV=production DATABASE_URL=... npm start` without the three secrets must exit with `Invalid server environment configuration`. With them set (32 or more characters), it starts.
- [ ] **Dev secrets gate.** In development with both keys unset and no flag, creating an SMTP config returns a `generic 500, and the server log shows the error` naming `FORMO_ENCRYPTION_KEY`. Setting `FORMO_ALLOW_DEV_SECRETS=1` makes it work.

Any failure in this list is a phase 1 bug and should be fixed before starting phase 2.

## Theme system (separate branch)

The light, dark and system theme work is complete in commit `46ea263` on `feat/theme-system`, independent of phase 1. The root cause was a commented-out `@custom-variant dark` in `globals.css` plus a hard-coded `dark` class on `<main>`, which kept every `dark:` style permanently on.

- **Dark variant:** re-enabled and keyed to a `.dark` class on `<html>`; the `#ffff` foreground typo is fixed.
- **`ThemeProvider.tsx`:** stores `light`, `dark` or `system` (default `system`), follows OS changes live in `system` mode, and syncs across tabs.
- **No flash:** an inline script in `<head>` sets the class before hydration.
- **`ThemeToggle.tsx`:** the footer Sun, Monitor and Moon buttons now work and show the active choice.
- **Light variants:** added by script to 20 previously dark-only files, skipping any class that already had a `dark:` pair. `Non-Developer/*` and the login graphics were left alone on purpose.

Light-mode contrast on dashboard cards and the yellow accents still needs a visual pass in a browser; it was type-checked but never viewed.

## Known limits and what was not verified

Nothing in phase 1 has touched a real database, so treat the database-dependent fixes as unproven until the checklist above passes.

- **No Prisma client in the sandbox.** Prisma's engine download returned 403, so `src/generated/prisma/client` does not exist and `tsc` reports only missing-module and implicit-any errors from it. Because those types resolve to nothing, a type error inside the new `requireProjectAccess` code could be hidden. Run `npm ci && npx prisma generate && npx tsc --noEmit` locally first.
- **Fixes 1, 4, 5, 6, 8 are review-verified only.** Fixes 2 and 7 were executed directly; the rest were read, not run.
- **`P2002` mapping is generic.** The message is `That value is already in use`, not field-specific. Endpoint and slug conflicts keep their own clearer `409` messages from the pre-check; only the race falls through to the generic text.
- **Error messages stay generic for unexpected failures.** Missing-secret errors in development appear in the server log, not in the API response.
- **Boot validation does not cover `auth.ts`.** `auth.ts` still reads `process.env` directly; production now refuses to start without `BETTER_AUTH_SECRET`, but the value is not passed through the validated object yet.
- **Only one trusted origin remains.** `trustedOrigins` in `auth.ts` is unchanged and planned for phase 4.
- **Strict schemas apply to bodies only.** Query strings and headers are not validated yet.
- **Frontend untouched except `EditForm.tsx`.** `NewForm`, the settings pages, login `next` handling and social sign-in are still as before.

## Remaining work

Four phases remain, in this order; each ends with a gate you can test, and phase 3 is blocked on your answers to the open decisions below. Phase 1 items already done are not repeated here. Full reasoning for each item is in the backend audit doc.

### Phase 2: keep the database alive

Gate: `/api/health?ready=1` reports at least 30 days of partition headroom, and creating a project with the clock set 13 months ahead succeeds.

- [ ] Add `POST /api/cron/maintenance`, guarded by `CRON_SECRET`, that runs `SELECT ensure_monthly_partitions(6)`
- [ ] Delete expired rows from `rate_limit_buckets` and `submission_idempotency_keys` in the same job
- [ ] Add a `DEFAULT` partition to `form_submissions`, `email_deliveries`, `email_events` and `audit_logs` as a safety net, with an alert when rows land in it
- [ ] Extend `/api/health?ready=1` to report the newest partition end date and fail under 30 days
- [ ] Document the schedule in the README and `.env.example`

### Phase 3: receive and deliver submissions

Gate: one post creates one submission and one delivery per recipient; a worker killed mid-run sends each email exactly once; a dead SMTP host ends in `failed` after the retry budget; 100 rapid posts from one IP are limited.

- [ ] `POST /api/f/[endpoint]` with the ten ordered checks (lookup, size cap, origin, rate limit, content type, honeypot, Turnstile, idempotency, transaction, response) and an `OPTIONS` handler
- [ ] Delivery worker at `POST /api/cron/deliver`: claim with `FOR UPDATE SKIP LOCKED`, send outside the transaction, back off at 1, 5, 30 minutes and 2 hours, fail after about 5 attempts
- [ ] Roll delivery results up to `form_submissions.status` and `form_daily_stats`
- [ ] Reuse SMTP transporters per run; stop building a new one per message in `mailer.ts`
- [ ] Remove the `/api/send-emails` stub (or replace it with the API-key route in phase 4)

### Phase 4: trust and control

Gate: private-range SMTP hosts are rejected; a revoked or expired API key returns `401`; a `<script>` in a submitted value is escaped in the email.

- [ ] SSRF guard on SMTP host and port, on save and at connect time
- [ ] Template renderer with escaping, sanitising and a preview endpoint; block deleting a template that forms use
- [ ] `authenticateApiKey(request, scope)`: prefix lookup, constant-time compare, revoked and expiry checks, scope check, throttled `lastUsedAt`
- [ ] One permission-matrix helper used by every route
- [ ] Security headers in `next.config.ts`
- [ ] Email verification; Google and GitHub providers in `auth.ts`, or remove the buttons
- [ ] `TRUSTED_ORIGINS` env var replacing the single trusted origin; pass validated env into `auth.ts`

### Phase 5: read APIs and polish

Gate: dashboard numbers match a direct SQL count; every route returns the documented status codes; the service tests pass in CI.

- [ ] `GET /api/forms/[id]/submissions` with cursor pagination and a status filter; `GET /api/submissions/[id]`; a retry action
- [ ] Analytics from `form_daily_stats` with a date range, UTC month bounds and labelled windows
- [ ] Pagination on the project and form list endpoints
- [ ] One error shape (`error`, `code`, `fields`), camelCase fields only (drop `email_to`), ISO dates everywhere
- [ ] SMTP `PATCH` and last-test result; template `PATCH`; block deleting an SMTP config that forms use
- [ ] Per-workspace retention setting and partition-drop job; request ids in logs
- [ ] Service tests on a throwaway Postgres; update README and metadata that still mention PocketBase

After phase 3, connect the existing frontend in this order: create-form flow with a copyable endpoint snippet, edit form, submissions table, settings pages, then login `next` handling and toasts.

### Open decisions

These are carried over unanswered from the audit doc; phase 3 cannot start until the first two are settled.

- [ ] What does an empty `allowedOrigins` list mean: block browsers, or allow any origin?
- [ ] Where will the scheduler run: Vercel cron, a container sidecar, or an external pinger?
- [ ] Should the free tier have a monthly submission cap, and what happens at the cap?
- [ ] Are file uploads in scope, or text fields only for now?
- [ ] Which sign-in methods ship at launch?

## Applying the commits

Both commits exist only inside the Claude session that made them, so apply the patch files to your own clone to keep them. The session cannot push: `NdangaHeritier/formo` returned 403 even after access was granted, and `alituanfamous/formo` could not be attached because two repositories named `formo` cannot share one session.

In a clone of `alituanfamous/formo`:

```bash
git checkout master
git checkout -b feat/theme-system
git am 0001-theme-system.patch

git checkout master
git checkout -b feat/backend-phase-1
git am 0002-backend-phase-1.patch

git push -u origin feat/theme-system feat/backend-phase-1
```

The patches were cut from `master` at `2460bfc` of the original repository. If `alituanfamous/formo` has moved on, `git am` may stop on a conflict; run `git am --3way` and resolve, or ask for a rebase. Apply the two branches independently: the``  theme commit edits UI files only, and phase 1 edits backend files plus `EditForm.tsx`, which the theme commit does not touch, so they do not `` overlap.

To have Claude do the push, start a new session with `alituanfamous/formo` as the only `formo` source, attach the two patch files, and ask for phase 2. Do not rely on this session for pushing.
