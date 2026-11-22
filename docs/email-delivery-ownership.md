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

If a non-developer is also a workspace admin/owner, `/non-dev` shows an explicit
**"Switch to developer view"** link to `/developer` rather than silently
granting config access on the marketing surface.

## Privileges

| Action | member | workspace admin | workspace owner |
| --- | --- | --- | --- |
| Read forms, recipients, delivery status | yes | yes | yes |
| Create/edit forms and projects | yes | yes | yes |
| Manage SMTP, API keys, templates, workspace default sender | no | yes | yes |
| Rotate endpoints, delete forms/projects | no | yes | yes |
| Billing, roles, workspace deletion | no | no | yes |

The SMTP read API now requires `admin`, matching every other SMTP route. The
non-developer overview is member-readable but its response is an audience-scoped
read model with no transport fields at all.

## Implementation

- `src/app/api/settings/smtp/route.ts` — `GET` requires workspace `admin`;
  the response includes full transport configuration for that admin audience.
- `prisma/schema.prisma` + `prisma/migrations/0005_workspace_default_smtp` —
  `SmtpConfig.isSystemDefault`, with a partial unique index allowing at most one
  default sender per workspace.
- `src/app/api/settings/smtp/system/route.ts` + `setWorkspaceDefaultSmtp` —
  set or clear the workspace default (admin-only, audited).
- `src/server/services/delivery.service.ts` — selection is now
  form sender → workspace default → system SMTP from env, in the same worker.
- `src/server/services/non-developer.service.ts` + `/api/non-dev/overview` —
  read-only projection of forms, recipients, templates and delivery status.
- `src/components/Non-Developer/DashboardOverview.tsx` — calm non-dev dashboard
  with "Managed by your workspace — read-only" and a developer-view switch for
  admins/owners.
- `/developer/settings` — full SMTP senders for admins plus a workspace default
  sender selector; transport controls hidden from non-admins.

## Operational notes

- The new migration must be applied to each deployed database
  (`npm run db:migrate:deploy`) before the new code reads `is_system_default`.
- Secrets remain AES-256-GCM encrypted (`src/lib/crypto.ts`); no API response
  includes `encryptedPassword`, `iv`, `authTag`, or the plaintext password.
- Existing docs describing a `POST /api/send-emails` "newest verified config"
  fallback (`docs/email-pipeline.md:81-94`) are stale — no such route exists.
