# Contract: Routes and Server Actions

## `GET /api/cron/payment-reminders` (new)

- **Caller**: Vercel Cron per `vercel.json`, or an operator with the secret.
- **Auth**: header `Authorization: Bearer <CRON_SECRET>`, constant time compare. Missing secret in env
  or mismatch → `401 { "error": "unauthorized" }`. Not Clerk authenticated; `proxy.ts` unchanged
  (only `/admin(.*)` is protected).
- **Input**: none.
- **Behaviour**: mark stale `sending` rows failed; load current camp and its eligible registrations;
  for each, `nextReminder()`; claim, send, update; stop at `REMINDER_RUN_CAP`; write one
  `reminders.run` log entry.
- **Response** `200`:
  ```json
  { "sent": 12, "failed": 1, "skipped": 140, "capped": false }
  ```
  No personal data in the body. Unexpected error → `500 { "error": "internal" }` plus `error` log.
- **Config**: `runtime = "nodejs"`, `maxDuration = 60`.

## `POST /api/register` (changed)

- Response shape unchanged (`reference`, `free`, `checkoutUrl`).
- New: after a successful insert, `after(() => sendConfirmationEmail(registrationId))`. Mail outcome
  never changes status code or body.

## Server Action `sendPaymentLinkAction(reference: string): Promise<ActionResult>` (new)

- File: `app/admin/actions.ts`.
- Guard: `requirePermission("registrations")`; `AuthError` → German forbidden message.
- Input: the registration reference (admin `Registration.id`), Zod `z.string().trim().min(1).max(32)`.
- Results (German messages from `lib/admin/messages.ts`):
  - `ok` → "Zahlungslink gesendet."
  - not eligible (paid, processing, refunded, cancelled, deleted, nothing due) → "Für diese Anmeldung
    ist keine Zahlung offen."
  - no email → "Keine Mailadresse hinterlegt."
  - rate limited (payment link to same registration in last 60 s) → "Der Zahlungslink wurde gerade
    erst gesendet. Bitte kurz warten."
  - provider error or not configured → "Die Mail konnte nicht gesendet werden. Bitte später erneut
    versuchen."
- Side effects: one `email_deliveries` row (`trigger = admin`, `actor` = profile id), one log entry.
  Registration itself unchanged; no `revalidatePath` needed except for reminder info refresh.

## Mail provider call (outbound)

- `POST https://api.resend.com/emails`, headers `Authorization: Bearer <RESEND_API_KEY>`,
  `Idempotency-Key`, `Content-Type: application/json`.
- Body: `from` = `EMAIL_FROM`, `to` = [registration email], `reply_to` = `EMAIL_REPLY_TO`, `subject`,
  `html`, `text`.
- Wrapped by `sendEmail(message, idempotencyKey): Promise<SendResult>` in `lib/email/provider.ts`,
  which never throws: `{ ok: true, id } | { ok: false, error: "not_configured" | "rejected" |
  "rate_limited" | "network" }`. Timeout 10 s via `AbortSignal.timeout`.

## Page `/admin/mail` (new, read only)

- Server Component, `guardTab("/admin/mail")` (redirects to `/admin` without the tab grant).
- Reads the current camp through the existing helper; no other data.
- Renders six previews from `lib/email/preview.ts`; no forms, no Server Actions, no route handler.
- No current camp → empty state, no previews.
