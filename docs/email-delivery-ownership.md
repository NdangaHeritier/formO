# Email delivery ownership: who configures what

## The problem

The developer settings page currently presents raw SMTP transport settings
(`host`, `port`, `secure`, `username`, `fromEmail`, verification state) as
user-facing configuration, and `GET /api/settings/smtp` returned those fields to
**every** workspace member. That conflates two different things:

- **Transport configuration** — which mail server, port, and credentials actually
  send the message. This is platform/operator infrastructure.
- **Sending identity** — the address or domain recipients see in the `From`
  header. This is the only part a customer reasonably needs to control.

Formspree illustrates the right split: it owns the transport (SendGrid) and
never asks users for SMTP host/port/credentials. Users only add a sending
**domain**, prove ownership with DNS (DKIM/SPF), and select it for a project
([Formspree, "Setting Email Domain"](https://help.formspree.io/articles/advanced-features/setting-email-domain)).
Account notices still come from Formspree's own domain.

So the mistake is not "custom SMTP exists" — it is "transport details are
exposed as ordinary user settings". Custom mail transport is an advanced escape
hatch, not the default mental model.

## What FormO actually does today

Evidence from the current tree:

- Delivery picks a per-form `smtpConfig` if present, otherwise the system SMTP
  from env (`SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USER`/`SMTP_PASS`):
  `src/server/services/delivery.service.ts:130-160`, `from` at `:369`.
- `SmtpConfig` is **organization-scoped**, not global:
  `prisma/schema.prisma:219-241`; the form reference is `ProjectForm.smtpConfigId`
  at `:276`/`:283`.
- A form with no `smtpConfigId` already uses the platform's system SMTP. The
  non-developer path therefore needs no mail configuration at all.
- Before this change, `listWorkspaceSmtpConfigs` returned `host`, `port`,
  `secure`, and `username` (`src/server/services/forms.service.ts:479-496`) and
  `GET /api/settings/smtp` only required workspace `member`
  (`src/app/api/settings/smtp/route.ts:11-19`), while every other SMTP route
  already required `admin`.
- Credentials were never leaked: passwords are AES-256-GCM encrypted in the DB
  (`src/lib/crypto.ts:101-136`) and excluded from all API selects.
- `User.interest` (`developer` / `non_developer`) only drives post-login routing;
  it is **not** an authorization boundary (`prisma/schema.prisma:18-23`,
  `src/app/dashboard/page.tsx:14-38`, `src/proxy.ts:4-38`).
- The only roles that exist are workspace/organization roles
  (`member` < `admin` < `owner`, `src/server/auth/authorization.ts:7-28`). There
  is no platform admin role, no `/admin` route, and `User.role` is unused.
- `/non-dev` is currently a static marketing page, not a functional dashboard
  (`src/app/non-dev/page.tsx:10-21`).

## Recommended ownership model

1. **The platform owns delivery by default.** System SMTP (env or, later, a
   platform-admin-managed provider) sends all notification email. A workspace
   only overrides it explicitly.
2. **Customers control only the sending identity** — a friendly name and the
   `From` address/domain, with verification. Transport fields are operational
   data and are never returned to a browser client.
3. **Custom SMTP stays as an advanced, admin-only workspace option**, not a
   mainstream setting. It is useful for self-hosted/enterprise workspaces and
   for deliverability debugging, but it is not part of the basic onboarding.
4. **Platform administration is a separate concern from workspace ownership.**
   A workspace owner administers their workspace; a platform admin administers
   the shared delivery infrastructure, quotas, and cross-workspace support.

## What each surface should display

| Surface | Show | Do not show |
| --- | --- | --- |
| **Developer dashboard** | Projects, forms, endpoints/embed snippets, API keys, submissions, analytics, templates, sending identities (`name`, `fromEmail`, verified state) | SMTP host/port/username/password, system transport, other workspaces' data |
| **Non-developer dashboard** | Incoming submissions, a simple way to create/manage forms, notification address, template selection, delivery status | SMTP anything, API keys, raw endpoints, transport credentials, developer tooling |
| **Platform admin** | System mail provider and credentials, verified sending domains, delivery queue health/retry/dead-letter counts, per-workspace quotas and overrides, audit log, workspace support/impersonation | Customer SMTP passwords in plaintext (write-only rotation), end-user form data beyond what support needs |

## Privilege matrix

| Action | member | workspace admin | workspace owner | platform admin |
| --- | --- | --- | --- | --- |
| Read projects, forms, submissions, analytics | yes | yes | yes | support-only, audited |
| Create/edit forms and projects | yes | yes | yes | no |
| Delete forms/projects, rotate endpoints | no | yes | yes | support-only, audited |
| Manage API keys, templates, sending identities | no | yes | yes | no |
| Read raw SMTP transport fields | **no** | **no** (ops/DB only) | **no** (ops/DB only) | yes |
| Configure system SMTP provider / sending domains | no | no | no | yes |
| Set quotas, view queue health, retry/dead-letter | no | no | no | yes |
| Billing, workspace deletion, change workspace roles | no | no | yes | no |

## Change applied in this pass

- `listWorkspaceSmtpConfigs` no longer selects `host`, `port`, `secure`, or
  `username`; browser clients can only see the sending identity.
- `GET /api/settings/smtp` now requires workspace `admin`, matching every other
  SMTP route and the documented permission matrix.
- Developer settings now labels the section "Sending identities" and shows only
  `fromEmail` + verification state; the add/delete controls and the template
  test panel degrade gracefully for non-admins.

## Follow-ups (not yet implemented)

- Build the functional non-developer dashboard (submissions inbox, form setup,
  notification address) that relies exclusively on system SMTP.
- Introduce a real platform-admin identity (e.g. `User.role = "admin"`, currently
  unused) with a guarded `/admin` area for system mail, quotas, and queue health.
- Optionally add a verified sending-domain flow (DNS DKIM/SPF or email
  verification) so customers get Formspree-style branding without raw SMTP.
- Reconcile stale docs that describe a `POST /api/send-emails` "newest verified
  workspace config" fallback; no such route or selection logic exists
  (`docs/email-pipeline.md:81-94`).
