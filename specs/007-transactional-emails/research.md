# Research: Mails und Zahlungserinnerungen

Feature: [spec.md](./spec.md) · Plan: [plan.md](./plan.md)

## R1 · Mail provider: Resend over its HTTP API, no SDK

- **Decision**: Resend (owner decision 2026-10-27), called with `fetch` against its REST endpoint
  `POST https://api.resend.com/emails` from a single server module. No `resend` npm package and no
  React Email.
- **Rationale**: one endpoint with JSON in and an id out does not justify a runtime dependency
  (constitution I asks for a justification per new dependency). `fetch` keeps the module tiny and easy
  to unit test with a stubbed fetch. Resend supports an `Idempotency-Key` header, EU sending region,
  domain verification via DNS and a free plan (3000 mails per month, 100 per day).
- **Alternatives considered**: `resend` SDK (adds a dependency for one call); Brevo (EU, but heavier
  API); Postmark (paid from the start); SMTP via nodemailer (new dependency, weaker deliverability).

## R2 · Templates as plain TypeScript functions

- **Decision**: each template is a pure function `(data) => { subject, html, text }` in `lib/email/`.
  A shared `layout()` wraps content in a table based, inline styled HTML shell (camp name header,
  footer with sender and contact). All German strings live in `lib/email/messages.ts`. Every
  interpolated value goes through `escapeHtml`.
- **Rationale**: matches constitution III (code defined, no editor, no table) and V (central German
  copy). Pure functions are unit testable without rendering infrastructure. Mail clients need inline
  styles and tables anyway; React Email would add two packages for three short mails.
- **Alternatives considered**: React Email (`@react-email/components` plus render step), rejected as a
  dependency without enough benefit; MJML, same reason.

## R3 · Sending the confirmation without slowing registration

- **Decision**: `app/api/register/route.ts` schedules `sendConfirmationEmail(registrationId)` with
  `after()` from `next/server` once the response with the checkout URL is built. The callback never
  throws; every outcome is logged.
- **Rationale**: FR-006 and SC-002: the redirect to Stripe must not wait for the mail provider.
  `after` runs within the route's max duration on Vercel (see
  `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`), so the work is not lost
  when the response has been sent.
- **Alternatives considered**: awaiting the send inline (adds provider latency and a failure path to
  registration); a queue table processed by cron (delays the confirmation by up to a day).

## R4 · Delivery record and duplicate protection

- **Decision**: new table `email_deliveries`, one row per send attempt. Before sending, the sender
  inserts a row with status `sending`; a partial unique index on `(registration_id, kind)` for all
  kinds except `payment_link`, limited to rows with status `sending` or `sent`, makes the insert fail
  when the mail was already sent or is in flight. After the provider call the row becomes `sent`
  (with provider message id) or `failed` (with a short error code). A failed row no longer blocks,
  so the next run retries (spec edge case "Mailanbieter nicht erreichbar").
- Each provider call carries `Idempotency-Key: <kind>/<registration_id>` (payment links:
  `payment_link/<delivery_id>`), so a retry within the provider's 24 hour window cannot deliver twice.
- Rows stuck in `sending` for more than 30 minutes (crash between claim and update) are marked
  `failed` at the start of each cron run and retried with the same idempotency key.
- **Rationale**: FR-014 and FR-015 (each reminder at most once, also under parallel or repeated runs),
  FR-019 (admin sees count and last reminder) and FR-022 (one manual mail per minute) all read from
  the same rows. The database enforces uniqueness atomically instead of a read then write race.
- **Alternatives considered**: counters on `registrations` (`reminder_count`, `last_reminder_at`):
  no atomic claim, no history, and a column per concern; storing state only in `logs`: free text,
  not queryable safely.

## R5 · Reminder schedule as a pure function

- **Decision**: `nextReminder(input, today)` in `lib/email/reminders.ts` returns
  `reminder_1 | reminder_2 | reminder_3 | null`. Input: payment status, outstanding amount, deleted,
  status, has email, registration date, camp start date, camp payment due date, already sent kinds,
  last reminder date. Rules, all on Berlin calendar dates:
  1. Not eligible (FR-012) or `today >= camp start date` → `null`.
  2. Stage windows: `reminder_3` when due date set and `today > due`; `reminder_2` when due date set
     and `due minus 7 <= today <= due`; `reminder_1` when `today >= registered + 7`.
  3. Take the highest stage whose window is open. If it, or any higher stage, was already sent →
     `null` (earlier stages that were overtaken are skipped, never sent late).
  4. Require `today >= registered + 3` and `today >= last reminder + 3`, else `null`.
- **Rationale**: the full rule set from FR-013 and FR-014 lives in one deterministic, table tested
  function; the cron route only loads data and loops.
- **Alternatives considered**: SQL only selection (hard to read and test, rules spread over a query).

## R6 · Cron trigger and authentication

- **Decision**: `vercel.json` registers one cron, `GET /api/cron/payment-reminders` at `0 6 * * *`
  (06:00 UTC, 07:00 or 08:00 German time). Vercel sends `Authorization: Bearer <CRON_SECRET>`; the
  route compares it in constant time and answers `401` otherwise. `export const maxDuration = 60`.
- **Rationale**: constitution II and VI; daily schedules work on every Vercel plan. A GET handler that
  reads request headers is dynamic, so it is never cached.
- **Alternatives considered**: Supabase `pg_cron` (moves logic into the database, outside the stack
  rule); GitHub Actions schedule (second secret store).

## R7 · Volume, rate and daily cap

- **Decision**: sends are sequential with about 500 ms spacing (Resend's default limit is a few
  requests per second). Each run sends at most `REMINDER_RUN_CAP = 80` reminders, ordered by oldest
  registration first; the rest follow on the next days. Constants live in `lib/email/limits.ts`.
- **Rationale**: the free plan allows 100 mails per day; 80 leaves headroom for same day
  confirmations and manual links. The 2nd reminder window lasts 7 days, so a backlog of a few hundred
  unpaid registrations is still covered. 80 sends at 2 per second fit easily into 60 seconds.
  Upgrading the plan only means raising the constant.
- **Alternatives considered**: batch endpoint (one idempotency key for many mails, loses per mail
  duplicate protection); hourly cron (not available on every plan, no real benefit).

## R8 · Links and configuration

- **Decision**: `paymentUrl(reference)` builds `${APP_URL}/bezahlen?ref=<encoded reference>` on the
  server. Mails never fall back to a request origin; if `APP_URL` is missing, sending is skipped and
  logged as `not_configured`. New server only env vars: `RESEND_API_KEY`, `EMAIL_FROM` (for example
  `FCG Blankenheim Summercamp <camp@domain>`), `EMAIL_REPLY_TO`, `CRON_SECRET`.
- **Rationale**: FR-004 (always the public address), FR-008 (sender configurable without code), and
  a cron run has no meaningful request origin.
- **Alternatives considered**: storing sender settings in `camp_settings` (an admin UI would be
  needed; not requested).

## R9 · Admin actions as Server Actions

- **Decision**: "Zahlungslink senden" is a Server Action `sendPaymentLinkAction(registrationId)` in
  `app/admin/actions.ts`, guarded by `requirePermission("registrations")`, Zod validated, rate limited
  through `email_deliveries` (no `payment_link` row for this registration in the last 60 seconds).
  "Link kopieren" needs no server call: the admin page passes `APP_URL` to the client, which composes
  the link with the reference it already shows and uses the clipboard API.
- **Rationale**: all existing admin writes use Server Actions with `requirePermission`; a separate
  route handler would duplicate the guard. Copying needs no secret.
- **Alternatives considered**: `app/api/admin/payment-link` route (duplicates auth wiring).

## R10 · What gets logged

- **Decision**: `writeLog` with actions `email.sent`, `email.failed`, `email.skipped` and
  `reminders.run`; the message holds kind and reference (and the summary counts for a run), never
  the address or body. Admin triggered sends set `actor` to the admin's profile id.
- **Rationale**: FR-007, FR-018, FR-022; reuses the existing log view.

## R11 · Asynchronous bounces

- **Decision**: only synchronous provider rejections are recorded. Later bounces stay visible in the
  Resend dashboard; no provider webhook in this feature.
- **Rationale**: keeps scope small; the spec edge case was adjusted accordingly.

## R12 · Read only preview tab

- **Decision**: `lib/email/preview.ts` builds one fixed sample `EmailContext` (first name "Lena",
  reference `REG-BEISPIEL`, amount = current camp `base_price`, outstanding = same, current camp
  name, dates and due date, `payUrl` from `paymentUrl`) and returns six entries
  (`confirmation`, `confirmation_free`, `payment_link`, `reminder_1..3`) by calling the real template
  functions. The Server Component page passes the rendered `{ subject, html, text }` to a small client
  component that only switches entries and views. HTML is shown in a sandboxed `iframe` via `srcDoc`
  so mail styles cannot leak into the admin UI and vice versa.
- **Rationale**: FR-025 (preview equals real output) is guaranteed by reusing the same functions;
  rendering on the server keeps `server-only` modules out of the client bundle. Base price is public,
  so no hidden price can appear (constitution VI). Sending trigger texts are built from the constants
  in `lib/email/limits.ts`, so the description never drifts from the rules.
- **Tab access**: a normal nav entry `/admin/mail` in `NAV_ITEMS`; `guardTab` enforces
  `visibleTabs`. No permission key, because there are no write actions. No migration: existing admins
  get the tab through user management.
- **Alternatives considered**: picking a real registration for the preview (shows personal data,
  rejected); a test send button (owner said "nur anschauen", out of scope); rendering HTML directly
  into the page with `dangerouslySetInnerHTML` (style leakage, rejected).
