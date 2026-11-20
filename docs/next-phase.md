# FormO — next-phase instructions and global-scale roadmap

**Status read from the existing OpenCode result** (`FormO Phase 1 Completed Work and Remaining Plan.md`):
Phase 1 (safe foundations), Phase 2 (keep the database alive) and Phase 3 (receive and deliver
submissions) are complete on `feat/phase-1-2-wiring`. The plan still contains Phases 4 and 5 plus
five open decisions. This document carries those phases forward and adds the five features that
would turn FormO from a self-hosted utility into a globally used platform.

---

## Where the code actually stands

| Phase | State | Evidence |
|---|---|---|
| 1 — safe foundations | complete | strict schemas, Prisma error mapping, scoped project lookup, boot-time env, dev-secret fail-closed |
| 2 — database alive | complete | `POST /api/cron/maintenance`, DEFAULT partitions, `/api/health?ready=1`, `docs/scheduling.md`, `docs/operations.md` |
| 3 — submission pipeline | complete | `POST /api/f/{endpoint}`, `POST /api/cron/deliver`, idempotency, rate limits, honeypot, Turnstile, retries, roll-up |
| 4 — trust and control | **not started** | see below |
| 5 — read APIs and polish | **not started** | see below |

Verified with real infrastructure: `npx tsc --noEmit` (0), `npx vitest run` (65/65), `npm run test:unit`
(13/13), `npm audit --omit=dev` (0), `npx prisma migrate deploy` (0004 applied), and both e2e scripts
against local Postgres (`e2e maintenance: PASS`, `e2e submission pipeline: PASS`).

---

## Phase 4 — trust and control

**Gate:** private-range SMTP hosts are rejected; a revoked or expired API key returns 401; a
`<script>` in a submitted value is escaped in the email.

1. **SSRF guard on SMTP.** Validate host and port on save (`forms.service.createWorkspaceSmtpConfig`)
   and again at connect time (`delivery.service.getCachedTransporter`). Reject loopback, link-local,
   private, IPv6 ULA and metadata addresses unless an explicit local-dev flag is set. Resolve DNS and
   check every returned address. Return 400 on save; mark the delivery permanently failed on connect.
   // DECISION: test-send and delivery must use the same guard.
2. **Real API-key authentication.** Implement `authenticateApiKey(request, scope)`:
   `fmo_live_<prefix>_<secret>` parsing, prefix lookup, `timingSafeEqualBytes` against the stored
   HMAC digest, revoked/expired checks, scope check, throttled `lastUsedAt` update. Replace
   `requireApiKey` in every API-key route. A revoked or expired key must return 401.
3. **Template safety.** The renderer already substitutes `{{field}}` with HTML-escaped values and
   strips CRLF. Add: reject deleting a template still assigned to a form (409), sanitize owner HTML
   on save (allow email-safe tags only), and keep the preview endpoint authenticated and scoped.
4. **Security headers** in `next.config.ts`: `X-Content-Type-Options`, `Referrer-Policy`,
   `X-Frame-Options`, `Permissions-Policy`, HSTS in production. No `Access-Control-Allow-Credentials`
   on `/api/f/*`.
5. **Auth completion.** Email verification, Google and GitHub providers — or remove the dead social
   buttons. Replace the single `trustedOrigins` value with `TRUSTED_ORIGINS` (comma separated) read
   from the validated env object, not `process.env` directly.
6. **One permission matrix.** A single helper used by every route so role checks cannot drift.

**Files likely touched:** `src/server/services/forms.service.ts`, `src/server/services/delivery.service.ts`,
`src/server/auth/api-key.ts`, `src/server/auth/authorization.ts`, `src/lib/env.ts`,
`src/lib/auth.ts`, `next.config.ts`.

---

## Phase 5 — read APIs and polish

**Gate:** dashboard numbers match a direct SQL count; every route returns the documented status
codes; service tests pass in CI.

1. `GET /api/forms/{id}/submissions` with cursor pagination and a `status` filter;
   `GET /api/submissions/{id}`; `POST /api/submissions/{id}/retry`.
2. Analytics from `form_daily_stats` with a date range, UTC month bounds and labelled windows.
3. Pagination on project and form list endpoints.
4. One error shape `{ error, code, fields }`, camelCase only, ISO dates everywhere.
5. SMTP `PATCH` and last-test result; template `PATCH`; block deleting an SMTP config in use.
6. Per-workspace retention setting and a partition-drop job; request ids in logs.
7. Service tests on a throwaway Postgres in CI. Update README/metadata that still mentions PocketBase.
8. Frontend wiring order: create-form flow with copyable endpoint snippet, edit form, submissions
   table, settings pages, login `next` handling, toasts.

---

## Open decisions — recommended answers

| Question | Recommendation | Why |
|---|---|---|
| Empty `allowedOrigins` | **Allow any** (current `EMPTY_ALLOWED_ORIGINS_POLICY = "allow"`), but show a warning in the dashboard | Server-to-server callers have no Origin; blocking browsers by default would break the simplest embed |
| Scheduler location | **External pinger + Vercel cron**; keep the route scheduler-agnostic | Already implemented with Bearer auth; `docs/scheduling.md` has all three variants |
| Free-tier cap | **1,000 submissions/month per workspace**, then queue but warn, never silently drop | Protects shared infra without breaking a self-hosted deployment |
| File uploads | **Text fields only for now**; count and ignore file parts | Keeps the byte-capped streaming reader simple and safe |
| Sign-in methods | **Email + password plus magic link**; add OAuth after Phase 4 SSRF/secret work | Fewer third-party dependencies for a self-hosted product |

---

# Top 5 features that would make FormO a globally used platform

The differentiator is not "another form builder". It is **self-hosted, privacy-sovereign, durable
form-to-anything infrastructure with a developer-grade API**. These five compound: each one makes
the next more valuable.

## 1. Multi-channel delivery fabric — "form to anything"

Email alone caps the market. Every serious platform becomes an event router. Add webhooks, Slack,
Microsoft Teams, Discord, SMS and push as first-class destinations, with the same durable delivery
row, retry policy and dead-letter handling already built for SMTP. Expose a subscription API and an
event stream (`submission.created`, `delivery.sent`, `delivery.failed`). Future-facing: an **MCP
server** and agent-friendly webhook schemas so AI assistants can consume submissions directly.

- **Why now:** the queue, attempt/backoff and idempotency machinery already exists — adding a channel
  is a transporter, not a new architecture.
- **Gate:** one submission fans out to N channels; a failing channel never blocks the others; every
  channel has the same retry/dead-letter semantics and audit events.
- **KPI:** % of workspaces using ≥2 channels; webhook delivery success rate.

## 2. Edge ingestion with regional data planes

A global product cannot make a visitor in São Paulo wait for a database in Frankfurt. Put validation,
origin checks and rate limiting at the edge (Cloudflare Workers / Vercel Edge), enqueue durably, and
let regional workers write to a regional Postgres. Self-hosted users keep a single-region deployment;
the hosted control plane adds region pinning. Future: WASM validation modules shipped to the edge and
compiled from the same zod schemas used server-side.

- **Why now:** the public endpoint already separates validation from SMTP — the seam is exactly where
  an edge layer fits.
- **Gate:** p95 ingestion < 50 ms from three continents; rate-limit decisions consistent between edge
  and origin; no submitted values in edge logs.
- **KPI:** global p95 latency; edge-blocked abuse rate.

## 3. Privacy sovereignty and compliance as a product

"Self-hosted" is a feature; "provably private" is a platform. Tenant-held encryption keys (BYOK),
per-workspace region pinning, GDPR/CCPA export-and-delete workflows, immutable audit logs, data
retention policies and a compliance dashboard. Offer a signed data-processing addendum and a
SOC 2-ready evidence bundle. Future: confidential computing and verifiable audit trails for regulated
industries.

- **Why now:** `audit_logs`, `SmtpConfig` encryption and the retention discussion in Phase 5 are
  already in the schema — this turns existing tables into a selling point.
- **Gate:** a tenant can export and permanently delete all its data with one action; the encryption
  key can be rotated without decrypting old records; a region can be changed.
- **KPI:** number of regulated-industry workspaces; time to complete a data-subject request.

## 4. AI-assisted form creation and submission intelligence

Use models to generate a form and its email template from a plain-language brief, detect field
semantics automatically, score spam/abuse beyond honeypot and Turnstile, and route or summarise
submissions by intent. Keep the model **local or tenant-controlled** so privacy is never traded away.
Future: small local models at the edge, and agents that draft replies using the tenant's own data.

- **Why now:** the template studio and strict schemas give AI a safe, structured output target — it
  cannot inject template logic because the renderer only allows `{{field}}` substitution.
- **Gate:** generated forms pass the same zod schemas as hand-written ones; no model output is ever
  interpolated unescaped; AI features work fully offline in self-hosted mode.
- **KPI:** time from idea to first live endpoint; false-positive spam rate.

## 5. Open ecosystem and network effects

First-party SDKs (TypeScript, Python, Go), a template marketplace, one-click embeds for major site
builders, integrations with Zapier/Make/n8n, a public REST API with stable versioning, and an MCP
server. Publish an open schema for form definitions so forms are portable. Future: a package registry
for form themes and validators.

- **Why now:** the API is the product; without SDKs and integrations every user re-implements the
  same fetch call, and there is no reason for anyone else to build on FormO.
- **Gate:** an SDK can create a form, submit to it and read results in under 20 lines; a template can
  be exported/imported; the public API has a versioned contract and changelog.
- **KPI:** external integrations active; submissions created via SDK vs raw HTTP; community templates.

---

## Mapping the README "Future Plans" to phases

All three items are partially pre-built in the schema — do not rebuild them.

| README plan | Already present | Remaining work | Phase |
|---|---|---|---|
| Advanced analytics (opens, clicks) | `EmailEventType` already has `opened`, `clicked`, `delivered`; `email_events` is partitioned | Nothing writes those events. Add an opt-in tracking pixel + click-through redirect, webhook/ingest endpoints, and analytics aggregation by event type. Respect the privacy positioning: tracking is per-form opt-in, never default-on | **5b** |
| Enhanced template customization (color/font variants) | `template-design.ts` already has `brandColor`, `fontFamily`, `fontSize`, `brandName`; the studio renders them | Add a saved brand-kit library, named variants, font pairing presets and per-form template selection in the UI. The renderer stays `{{field}}`-only | **5c** |
| Multi-recipient support (upcoming Pro) | `FormRecipient` (`to`/`cc`/`bcc`), strict recipient schemas, and one delivery row per active recipient are **already implemented and e2e-verified** | Expose recipients in the create/edit UI; add an entitlement flag if this is truly Pro. Do not add a fake paywall before a billing layer exists | **5d** |

Recommended order: Phase 5a (read APIs) → 5d (expose existing multi-recipient) → 5b (tracking) → 5c (brand kits), then the five global-scale features.

## Suggested execution order

```
Phase 4 (trust)  →  Phase 5 (read APIs + UI wiring)
                 →  Feature 1 (multi-channel)
                 →  Feature 3 (privacy/compliance)
                 →  Feature 2 (edge)
                 →  Feature 4 (AI)
                 →  Feature 5 (ecosystem)
```

Ship the trust layer before anything that increases the attack surface. Ship multi-channel before
edge work, because the event model must be stable before it is replicated regionally. Ship the
ecosystem last — an API is worth exposing only once its contract and security are settled.
