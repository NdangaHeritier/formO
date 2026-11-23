# Form submission and email delivery

## Public submissions

Each active form exposes its unique token as a public endpoint:

```text
POST /api/f/{endpoint}
```

Example using URL-encoded fields from a website:

```html
<form action="https://your-domain.com/api/f/fmo_your_endpoint" method="POST">
  <input name="email" type="email" required>
  <!-- The default honeypot field must stay empty. -->
  <input name="_gotcha" type="text" tabindex="-1" autocomplete="off" hidden>
  <button type="submit">Contact us</button>
</form>
```

Example with JSON and an idempotency key:

```sh
curl https://your-domain.com/api/f/fmo_your_endpoint \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: checkout-01983-client-id' \
  -d '{"email":"alice@example.com","message":"Hello FormO"}'
```

Successful submissions return `200` with `{ "ok": true, "id": "..." }` for JSON callers, or a `303` redirect for plain HTML form posts. Replayed idempotent requests return `200` and do not duplicate the submission, delivery, or daily counters. Requests with an inactive or unknown token return `404`.

Behavior:

- Accepts JSON, URL-encoded forms, and multipart fields (file uploads return `415`).
- Payload size is bounded by the form's `maxPayloadBytes`.
- Honeypot hits are recorded as spam without storing their submitted payload.
- Requests are rate limited per client (10/minute by default) and per form (600/minute by default). Both limits are configurable with `FORMO_RATE_LIMIT_PER_CLIENT` and `FORMO_RATE_LIMIT_PER_FORM`.
- `allowedOrigins` controls browser CORS. An empty list allows any source; `*` explicitly allows wildcard origins. Server-to-server requests have no `Origin` header.
- Valid submissions are persisted **before** email delivery is attempted. SMTP failures never discard a submission.
- Recipients receive independent messages; CC/BCC addresses are not expanded into a shared To header.

## SMTP and templates

Assign an SMTP configuration to the form through the existing form API. Submissions made before SMTP assignment remain queued and become deliverable after assignment.

- Each active recipient produces a durable `email_deliveries` row and queued event.
- Form submissions and user-initiated broadcasts enqueue into the same `email_deliveries` table and are sent by the single `runDeliveryBatch()` worker. Form submissions select a sender in this order: the form's SMTP config, the workspace default sender, then system SMTP from the environment. Broadcasts start at the workspace default sender and fall back to environment SMTP; they never use a form-specific sender.
- Successful sends update the recipient row, its event, the parent submission, and daily stats.
- Retries use bounded exponential backoff, up to five attempts per recipient.
- `subjectTemplate`, `customSubject`, and `htmlTemplate` support `{{...}}` variables including `{{form.title}}`, `{{site.name}}`, and submission fields. Submitted values are HTML-escaped when interpolated into a custom HTML template.
- A form without a custom template uses the built-in responsive form-submission notification.

## Template studio

`GET /developer/templates` shows saved templates and pre-designed starting points. Opening a design navigates to `/developer/templates/presets/{presetId}`; saved templates open `/developer/templates/{templateId}`. There are no preview modals.

The editor is a Tiptap/ProseMirror-based WYSIWYG canvas inside realistic browser and mobile-device frames. Text is edited in place, with font, size, color, emphasis, alignment, lists, links, CTA buttons, and images. A selected text range shows a floating Link/CTA action; it and the image action open a small, focused URL dialog rather than a persistent form in the canvas. Images use existing external URLs onlyâ€”there is no upload handler, asset database, or additional blob hosting requirement. The toolbar contracts for the frame width and wraps secondary actions naturally. Native device scrollbars are hidden without disabling wheel/touch scrolling. Template metadata and SMTP test delivery use a focused modal opened from the editor header rather than a persistent form below the canvas. Inserted images are constrained by their available frame in both the WYSIWYG canvas and compiled email HTML, preserving aspect ratio without upscaling smaller assets.

Presets and raw HTML are separate representations: structured preset edits store the ProseMirror document in `email_templates.design`, with legacy fields and compiled HTML preserved for wire compatibility. Preview and save both compile through `POST /api/templates/preview` using the same extension set on client and server. Saving always uses a fresh compilation, not an older debounced preview. Sanitization allows only email-safe formatting and link/image URLs. Legacy HTML-only templates can still be edited in the raw HTML editor. Surrounding controls use `FormButton`, `LinkButton`, `InputField`, `TextAreaField`, `SelectField`, and `SmallBtn`.

## Retry and maintenance workers

Two authenticated routes are scheduled in `vercel.json`:

| Route | Vercel schedule | Purpose |
| --- | --- | --- |
| `/api/cron/deliver` | Daily 04:00 UTC | Claim and send queued email deliveries, retry failures |
| `/api/cron/maintenance` | Daily 03:00 UTC | Provision partitions and clean expired rate-limit/idempotency rows |

`/api/cron/partitions` is also available for on-demand partition provisioning but is not scheduled. There is no second delivery worker — all delivery goes through `runDeliveryBatch`.

Set `CRON_SECRET` in production; Vercel supplies it as `Authorization: Bearer <CRON_SECRET>`. Production routes return `503` when the secret is not configured and `401` for an incorrect secret. On Vercel Hobby, cron schedules must run at most once per day; use an external scheduler for a shorter delivery cadence.

To run a worker locally:

```sh
curl -X POST http://localhost:3000/api/cron/deliver -H "Authorization: Bearer $CRON_SECRET"
curl -X POST http://localhost:3000/api/cron/maintenance -H "Authorization: Bearer $CRON_SECRET"
```

## API keys and broadcasts

There is no `POST /api/send-emails` route and no "newest verified config" fallback. API keys currently authenticate read access to `GET /api/v1/forms` with the `forms:read` scope; revoked or expired keys are rejected. Listing, creating and revoking keys is admin-only under `/api/settings/api-keys`.

User-initiated broadcasts go through `POST /api/non-dev/messages`. The route resolves the audience, writes an `OutboundMessage` with one `email_deliveries` row per recipient, and returns immediately. The same `runDeliveryBatch()` worker that sends form submissions sends those rows, using the workspace default sender and then system SMTP from the environment. There is no second delivery pipeline.

## Deployment and verification

1. Run `npm run db:migrate:deploy` to apply all pending migrations. `0007_non_dev_audience` and `0008_user_onboarding` must be applied before deploying the non-dev code.
2. Set the production `DATABASE_URL`, `FORMO_ENCRYPTION_KEY`, `FORMO_HMAC_PEPPER`, auth secrets, and `CRON_SECRET` environment variables.
3. Verify SMTP through the existing settings test endpoint before expecting form notifications.
4. Verify `npm run test:unit`, `npm run lint`, and `npm run build` before deploying.

`prisma migrate` provisions the initial partition set. The maintenance route invokes `ensure_monthly_partitions` under a PostgreSQL advisory transaction lock, so concurrent workers can safely provision future partitions.

