# Email delivery ownership: audience boundaries

## The problem

This is a **role/audience boundary problem**, not a "remove SMTP" problem.

The developer settings page exposes SMTP transport settings (host, port,
credentials, encryption) to anyone who can open it. For a non-developer that
creates cognitive load and fear — "did I break delivery?" — and it is the wrong
audience for a mail transport. Formspree avoids this because it owns the sending
infrastructure and the user only chooses a recipient and a template.

FormO is self-hosted, so *someone* must own SMTP. Hiding transport from
developers too would make FormO a Formspree-lite with Formspree's operational
burden and none of the self-hosted positioning. The fix is to decide **who** owns
it and draw the boundary accordingly, not to delete the capability.

## Decisions

1. **Non-developers get read-only delivery status.** They see that delivery is
   active, when the last message went out, and which recipients are configured —
   never host, port, credentials or endpoints.
2. **System SMTP is workspace-level with an env fallback.** A workspace admin
   selects one sender as the workspace default; forms with no explicit sender
   use it. If no workspace default exists, delivery falls back to system SMTP
   from the environment.

There is still **one** delivery pipeline: `email_deliveries` +
`src/server/services/delivery.service.ts`. Non-developers do not get a second
delivery path.

## What each surface displays

| Surface | Audience | Shows | Never shows |
| --- | --- | --- | --- |
| `/developer/settings` | Developer / workspace admin | Full SMTP configs (host, port, encryption, from), workspace default sender, API keys, templates, delivery logs | Secrets (credentials are write-only / one-time reveal) |
| `/non-dev` | Marketer / non-developer | Forms, recipients, templates, read-only delivery status, "Managed by your workspace" | Host, port, credentials, endpoints, API keys, system transport |
| System SMTP | Platform fallback | Used automatically when a form has no sender and no workspace default | Exposed in any user-facing UI |

The audience is chosen once at onboarding and is **locked**: a non-developer
account can never render `/developer` or call developer APIs, even if it also
holds an admin/owner workspace role. Server layouts in `src/app/developer` and
`src/app/non-dev` enforce this with a forbidden view, and `requireDeveloperWorkspace`
/ `requireNonDeveloperWorkspace` enforce it on API routes. There is no
"Switch view" control.

### Non-developer surfaces

All of these views use the same shell geometry as the developer surface and are
backed by `/api/non-dev/*`:

| Route | Purpose |
| --- | --- |
| `/non-dev` | Overview: forms, recipients, templates and read-only delivery status |
| `/non-dev/contacts`, `/non-dev/lists` | Build an audience from contacts and named lists |
| `/non-dev/compose` | Pick a template and audience, then queue a broadcast |
| `/non-dev/messages`, `/non-dev/messages/[id]` | Manage messages, inspect recipients, cancel or retry |
| `/non-dev/analytics` | Delivery outcomes only — no open or click tracking yet |

The matching APIs are `/api/non-dev/overview`, `/api/non-dev/contacts`,
`/api/non-dev/lists`, `/api/non-dev/lists/{id}/members`,
`/api/non-dev/templates`, `/api/non-dev/templates/{id}`,
`/api/non-dev/messages`,
`/api/non-dev/messages/{id}/cancel`, `/api/non-dev/messages/{id}/retry`,
`/api/non-dev/deliveries` and `/api/non-dev/analytics`.

## Privileges

| Action | member | workspace admin | workspace owner |
| --- | --- | --- | --- |
| Read forms, recipients, delivery status | yes | yes | yes |
| Create/edit forms and projects | yes | yes | yes |
| Manage SMTP, templates, workspace default sender | no | yes | yes |
| List, create and revoke API keys | no | yes | yes |
| Rotate endpoints, delete forms/projects | no | yes | yes |
| Billing, roles, workspace deletion | no | no | yes |

The SMTP read API now requires `admin`, matching every other SMTP route.
Listing, creating and revoking API keys is also admin-only; keys authenticate
read access to `GET /api/v1/forms` with the `forms:read` scope and never send
mail. Non-developer routes and `/api/non-dev/*` are gated by
`requireNonDeveloperWorkspace` (the account's `interest` must be
`non_developer`) plus the normal workspace role: members can read the audience
and delivery state, while mutations follow the roles above. Responses are
audience-scoped read models with no transport fields at all.

## Implementation

- `src/app/api/settings/smtp/route.ts` — `GET` requires workspace `admin`;
  the response includes full transport configuration for that admin audience.
- `prisma/schema.prisma` + `prisma/migrations/0005_workspace_default_smtp` —
  `SmtpConfig.isSystemDefault`, with a partial unique index allowing at most one
  default sender per workspace.
- `src/app/api/settings/smtp/system/route.ts` + `setWorkspaceDefaultSmtp` —
  set or clear the workspace default (admin-only, audited).
- `src/server/services/delivery.service.ts` — form submission sender selection
  is form sender → workspace default → system SMTP from env, in the same worker.
  `OutboundMessage` broadcasts start at the workspace default and fall back to
  env SMTP; both are sent by `runDeliveryBatch()`.
- `src/server/auth/authorization.ts` — `requireNonDeveloperWorkspace` enforces
  the audience boundary on every `/api/non-dev/*` route before normal workspace
  role checks.
- `src/server/services/non-developer.service.ts` + `/api/non-dev/*` — read model
  for contacts, lists, templates, messages, deliveries and analytics, plus the
  `POST /api/non-dev/messages` broadcast path; no transport fields are returned.
- `src/app/api/settings/api-keys/route.ts` and
  `src/app/api/settings/api-keys/[keyId]/route.ts` — list, create and revoke all
  require workspace `admin`.
- `src/components/Non-Developer/NonDevShell.tsx` and
  `src/components/Non-Developer/DashboardOverview.tsx` — calm non-dev shell that
  mirrors `DeveloperShell`, a read-only dashboard with "Managed by your
  workspace — read-only", and a developer-view switch for admins/owners.
- `/developer/settings` — full SMTP senders for admins plus a workspace default
  sender selector; transport controls hidden from non-admins.

## Operational notes

- Migrations `0005_workspace_default_smtp`, `0007_non_dev_audience` and
  `0008_user_onboarding` must be applied to each deployed database
  (`npm run db:migrate:deploy`) before the code reads those columns and tables.
  Apply 0007 and 0008 before deploying the non-dev code; they are not applied to
  production yet.
- Secrets remain AES-256-GCM encrypted (`src/lib/crypto.ts`); no API response
  includes `encryptedPassword`, `iv`, `authTag`, or the plaintext password.
- Form submissions and `OutboundMessage` broadcasts both enqueue into
  `email_deliveries` and are sent by the single `runDeliveryBatch()` worker.
  Submissions use form sender → workspace default → system SMTP from the
  environment; broadcasts use workspace default → environment SMTP. There is no
  `POST /api/send-emails` route, no "newest verified config" fallback and no
  second delivery pipeline.
