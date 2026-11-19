# Deployment: Neon in production, local Postgres in development

FormO uses one Prisma client with two drivers. The choice is made from the connection
string, so **your local setup does not change**.

| Environment | `DATABASE_URL` | Driver | CLI / migrations |
|---|---|---|---|
| Local dev | `127.0.0.1:5432` | `pg.Pool` + `@prisma/adapter-pg` | `DATABASE_URL` |
| Vercel / Neon | `-pooler` Neon host | `@prisma/adapter-neon` (WebSocket) | `DATABASE_URL_UNPOOLED` |

`src/lib/db-target.ts` picks the driver by hostname (`*.neon.tech`) unless
`DATABASE_DRIVER` overrides it. Code elsewhere never branches on environment.

## 1. Local development (unchanged)

```bash
cp .env.example .env.local
npm run dev
```

Keep `DATABASE_URL` pointing at your local Postgres. Do **not** set
`DATABASE_URL_UNPOOLED` locally — `prisma.config.ts` falls back to `DATABASE_URL`.

```bash
npx prisma migrate deploy
npm run test:e2e
```

## 2. Create the Neon database

1. In the Neon Console, create a project and a branch (e.g. `main`).
2. Click **Connect** and copy **both** connection strings:
   - **Pooled** — hostname contains `-pooler` → `DATABASE_URL`
   - **Direct** — hostname has no `-pooler` → `DATABASE_URL_UNPOOLED`
3. Add `?sslmode=require&channel_binding=require&connect_timeout=15` to both.
   `connect_timeout` matters because Neon computes scale to zero and need a few
   seconds to wake.

Why two strings: the application pooler handles many short-lived serverless
connections; Prisma CLI needs a direct connection for DDL such as
`CREATE TABLE ... PARTITION OF` and advisory locks.

## 3. Vercel environment variables

Set these in **Project → Settings → Environment Variables** (Production and Preview):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon **pooled** string |
| `DATABASE_URL_UNPOOLED` | Neon **direct** string |
| `BETTER_AUTH_SECRET` | 32+ random chars |
| `FORMO_ENCRYPTION_KEY` | 32+ random chars |
| `FORMO_HMAC_PEPPER` | 32+ random chars |
| `CRON_SECRET` | 32+ random chars |
| `BETTER_AUTH_URL` | your deployed origin, e.g. `https://formo.vercel.app` |
| `TRUSTED_ORIGINS` | comma-separated extra browser origins, if any |

Do **not** set `FORMO_ALLOW_DEV_SECRETS` or `FORMO_ALLOW_LOCAL_SMTP` in production —
boot validation rejects them.

## 4. Deploy

```bash
npm run build          # prisma generate && next build
npx prisma migrate deploy   # uses DATABASE_URL_UNPOOLED
```

`npx prisma migrate deploy` can run as a Vercel build step or from your machine
against the Neon direct URL. The build itself needs `DATABASE_URL` but Prisma
Client is lazy, so no live connection is required during `next build`.

## 5. Schedules

`vercel.json` registers the two cron jobs:

- `/api/cron/deliver` every minute — sends queued email.
- `/api/cron/maintenance` daily at 03:00 UTC — provisions partitions and cleans
  expired rows.

Both use `Authorization: Bearer $CRON_SECRET`; Vercel injects that header
automatically when the variable is named `CRON_SECRET`. See
[docs/scheduling.md](scheduling.md) for systemd and curl alternatives.

**Check your Vercel plan's cron limits.** Hobby projects may restrict the number
of cron jobs or their minimum frequency. If the every-minute job is unavailable
on your plan, use an external pinger — the route is scheduler-agnostic.

## 6. Verify

```bash
curl https://your-domain/api/health
curl https://your-domain/api/health?ready=1
```

The readiness response reports partition headroom per table; it returns 503 when
any table has less than 30 days. It does not expose the connection string.

## Operational notes

- **Cold starts:** Neon's WebSocket adapter keeps a single pooled connection per
  serverless instance (capped at 3). The first query after idle may take a few
  seconds while the compute wakes.
- **Statement timeout:** local `pg.Pool` sets `statement_timeout=15000`. Neon's
  pooler rejects startup `options`, so that guard is not applied there — the
  repository's own bounded queries and backoff are the protection.
- **Raw SQL:** all readiness/maintenance SQL lives in `src/server/services/*`.
  It uses no `search_path` overrides, so it works on Neon's pooled connection.
- **Never** put a Neon password in client-side code or in `NEXT_PUBLIC_*` variables.
