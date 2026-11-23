# FormO

FormO is a self-hosted, developer-grade form backend. Projects contain forms; forms own a unique submission endpoint; submissions are persisted in Postgres and delivered to configured email recipients through a durable delivery queue. A dashboard provides projects, forms, analytics, settings, and a template studio.

## Stack

| Concern | Implementation |
| --- | --- |
| App | Next.js 16 App Router, React 19, Tailwind CSS 4 |
| Database | PostgreSQL via Prisma 7 — `pg` pool locally, Neon WebSocket adapter in production |
| Auth | Better Auth: email/password plus Google and GitHub OAuth, organizations and members |
| Email | Nodemailer/SMTP with a persisted delivery queue and retries |
| Templates | React Email presets and a Tiptap-based studio |
| Hosting | Vercel (or any Node host), with cron routes for delivery and maintenance |

## How it works

1. Create a **project**, then a **form** inside that project.
2. Post your HTML form (or JSON) to `POST /api/f/{endpoint}`. The endpoint is permanent and unique per form.
3. The submission is written to a partitioned `form_submissions` table before any email work starts.
4. Each active recipient gets an `email_deliveries` row; the delivery worker sends and retries them.
5. Honeypot, Turnstile, allowed origins, payload caps, custom subjects, reply-to fields, CC/BCC recipients and SMTP/template bindings are form settings.

## Route map

| Route | Purpose |
| --- | --- |
| `/developer` | Operations overview: attention band, recent submissions, quick actions, quick start |
| `/developer/projects` | Projects list, create/edit/archive/delete |
| `/developer/projects/[slug]` | Project detail: stats, forms, recent submissions |
| `/developer/forms` | Workspace-wide form list, endpoint utilities and endpoint rotation |
| `/developer/submissions` | Submission inbox, detail, delivery attempts and admin-only deletion |
| `/developer/analytics` | Submission and delivery analytics |
| `/developer/settings` | SMTP senders, delivery logs, retention, API keys, email templates |
| `/developer/templates` | Template library and presets |
| `/developer/account` | Profile, credentials, sessions and account deletion |
| `/api/f/{endpoint}` | **Public** form submission endpoint |
| `/api/forms`, `/api/forms/{id}` | List, read, update, delete forms |
| `/api/forms/{id}/submissions`, `/api/forms/{id}/rotate-endpoint` | List form submissions, **DELETE all submissions for a form**, rotate endpoint |
| `/api/projects`, `/api/projects/{id}`, `/api/projects/slug/{slug}` | Project management |
| `/api/projects/{id}/forms` | Create and list a project's forms |
| `/api/submissions`, `/api/submissions/{id}`, `/api/submissions/{id}/retry` | Workspace inbox, submission detail, **DELETE one submission**, delivery retry |
| `/api/developer/overview` | Workspace overview: attention counts and recent submissions |
| `/api/settings/*`, `/api/templates/*`, `/api/analytics` | Workspace settings (SMTP, delivery logs, retention, API keys), templates, analytics |
| `/api/auth/*` | Better Auth handlers |
| `/api/cron/deliver`, `/api/cron/maintenance` | Authenticated scheduled workers |
| `/api/health` | Liveness; add `?ready=1` for readiness |

## Local development

Requires Node 24+ and a local PostgreSQL database.

```sh
npm install
cp .env.example .env.local   # fill in the required values
npx prisma migrate deploy
npm run dev
```

Keep `DATABASE_URL` pointing at local Postgres. Do not set `DATABASE_URL_UNPOOLED` locally — Prisma falls back to `DATABASE_URL`.

## Production (Neon + Vercel)

Create a Neon project and set these Vercel environment variables (Production and Preview):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string |
| `DATABASE_URL_UNPOOLED` | Neon **direct** connection string, used by Prisma CLI |
| `FORMO_DATABASE_URL` | Optional explicit app connection string when the host injects its own `DATABASE_URL` |
| `BETTER_AUTH_SECRET`, `FORMO_ENCRYPTION_KEY`, `FORMO_HMAC_PEPPER`, `CRON_SECRET` | 32+ character secrets |
| `BETTER_AUTH_URL` | Deployed origin, e.g. `https://form-o.vercel.app` |
| `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` | OAuth app credentials |
| `SMTP_*` | SMTP transport and credentials for verification and delivery email |
| `TURNSTILE_SECRET_KEY` | Optional bot protection |
| `FORMO_SUBMISSION_RETENTION_DAYS` | Optional workspace-wide default; a workspace setting in `/developer/settings` overrides it. Unset keeps all submissions. |

Register the exact OAuth callbacks `{BETTER_AUTH_URL}/api/auth/callback/google` and `/api/auth/callback/github` with the providers.

`vercel.json` schedules `/api/cron/maintenance` at 03:00 UTC and `/api/cron/deliver` at 04:00 UTC. Vercel Hobby allows at most daily schedules; use an external scheduler for a shorter delivery cadence. Both routes require `Authorization: Bearer $CRON_SECRET`.

See [docs/deployment.md](docs/deployment.md), [docs/email-pipeline.md](docs/email-pipeline.md) and [docs/scheduling.md](docs/scheduling.md) for details.

## Checks

```sh
npm run lint
npx tsc --noEmit
npx vitest run
npm run build
npm run test:unit
```

End-to-end scripts (`npm run test:e2e`, `test:e2e:maintenance`, `test:e2e:recipients`) expect local Postgres and Mailpit as described in `docs/deployment.md`.
