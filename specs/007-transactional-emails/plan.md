# Implementation Plan: Mails und Zahlungserinnerungen

**Branch**: `007-transactional-emails` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-transactional-emails/spec.md`

## Summary

A small `lib/email/` module sends three code defined German mails through Resend's HTTP API with
plain `fetch` (no new dependency): registration confirmation (scheduled with `after()` from the
register route so the Stripe redirect never waits), payment link (admin Server Action) and up to three
payment reminders. A daily Vercel Cron route, authenticated by `CRON_SECRET`, picks due reminders for
the current camp through a pure, table tested `nextReminder()` function. A new `email_deliveries`
table records every attempt and, through a partial unique index, guarantees each confirmation and
reminder is sent at most once even under repeated or parallel runs. Admins get "Zahlungslink senden"
and "Link kopieren" plus reminder info in the registration dialog, and a read only tab "Mail"
(`/admin/mail`) that renders every template with sample data through the same template functions.
Nothing ever cancels a registration.

## Technical Context

**Language/Version**: TypeScript, Next.js 16.3 App Router (Route Handlers, Server Actions, `after`).

**Primary Dependencies**: existing only (Clerk, supabase-js, Zod, Tailwind, Phosphor). Resend is
called via `fetch`; no `resend` SDK, no React Email (research R1, R2).

**Storage**: Supabase Postgres. Migration `0008_email_deliveries.sql`, regenerated
`lib/database.types.ts`. See [data-model.md](./data-model.md).

**Testing**: Vitest (`npm test`): `nextReminder()` rule table, templates (content, escaping, no tier
name, partial amount), provider wrapper with stubbed `fetch` (status mapping, idempotency header,
never throws), cron auth helper. End to end per [quickstart.md](./quickstart.md).

**Target Platform**: Vercel (Node runtime), Vercel Cron daily at 06:00 UTC.

**Project Type**: web application (single Next.js project).

**Performance Goals**: registration response time unchanged (mail sent after response); cron run
finishes well under 60 s (at most 80 sends at about 2 per second).

**Constraints**: provider key and `CRON_SECRET` server only; mail failures never affect
registration or payment; no duplicate reminders; free plan limit of 100 mails per day respected via
`REMINDER_RUN_CAP`.

**Scale/Scope**: a few hundred registrations per camp, at most a few hundred mails per week.

## Existing code inspected

- `app/api/register/route.ts`: thin handler; after `submitRegistration` it creates the checkout and
  returns `{ reference, free, checkoutUrl }`. Hook point for `after(sendConfirmationEmail)`.
- `lib/register/service.ts`: returns `registrationId` (nullable) and `amountDue`; no change needed.
- `lib/payment/eligibility.ts`: `outstandingAmount()` and `checkoutEligibility()`; reused for mail
  eligibility so mail and payment page never disagree.
- `lib/payment/checkout.ts`: `resolveOrigin()` prefers `APP_URL`; mails use `APP_URL` only (R8).
- `lib/admin/data.ts`: `writeLog()` (never throws), `getRegistrations()` (maps rows, `registeredAt`),
  service role via `getServiceClient()`.
- `lib/admin/guard.ts`: `requirePermission("registrations")` for Server Actions; `access.ts` maps
  `/admin` to the `registrations` permission.
- `app/admin/actions.ts`: Zod validated Server Actions returning `ActionResult` with German messages
  from `lib/admin/messages.ts`.
- `components/admin/registration-form-dialog.tsx`, `registrations-manager.tsx`,
  `registrations-table.tsx`: edit dialog opened per row; place for the payment link block.
- `lib/format.ts`: `formatCurrency`, `formatDate` for German formatting.
- `supabase/migrations/0001_init_schema.sql`: `camps.payment_due_date`, `start_date`, `end_date`
  exist; `registrations.registered_at`; `logs`. Latest migration is `0007_stripe_payments.sql`.
- `proxy.ts`: only `/admin(.*)` protected, so `/api/cron/*` reaches the handler, which checks the
  secret itself.
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md` and
  `.../02-route-segment-config/maxDuration.md`.
- No `vercel.json` exists yet; no mail code exists anywhere.

## Decisions

All in [research.md](./research.md): Resend over `fetch` (R1); templates as pure functions with
central German copy (R2); confirmation via `after()` (R3); `email_deliveries` claim row plus partial
unique index plus provider idempotency key (R4); `nextReminder()` pure rule function (R5); Vercel
Cron with bearer secret (R6); sequential sends, run cap 80 (R7); links from `APP_URL` only (R8);
admin send as Server Action, copy client side (R9); log entries without personal data (R10); no
bounce webhook (R11); read only preview tab rendered from the real templates in a sandboxed iframe
(R12).

Product decisions by the owner (2026-10-27): Resend; reminders 7 days after registration, 7 days
before due date, day after due date, max 3; recipients unpaid and partial of current camp; admin send
and copy; read only tab "Mail" to view the templates (added the same day).

## Constitution Check

*Checked again after Phase 1 design: all pass.*

| Principle | Status | How |
|-----------|--------|-----|
| I. Fixed stack, Clerk owns auth | ✅ | Vercel Cron is in the stack; Resend is the email provider AGENTS.md anticipates and is used without an SDK, so no new runtime dependency; no Supabase Auth |
| II. Server is the security boundary | ✅ | `RESEND_API_KEY`, `EMAIL_*`, `CRON_SECRET` server only (`server-only` modules); cron verifies `CRON_SECRET` in constant time; admin send checks Clerk session and `registrations` permission; inputs Zod validated; new table RLS on, no grants |
| III. Strict scope | ✅ | Code defined templates, payment reminders via Vercel Cron and transactional email are listed in AGENTS.md section 4; the read only preview tab is added to section 4 by this feature (owner request 2026-10-27); no template editor, no `email_templates` table, no test send, no newsletters |
| IV. Single source of truth | ✅ | One migration plus regenerated types; no CHECK constraints on status values; current camp read through the existing helper; eligibility reuses `lib/payment/eligibility.ts` |
| V. Language separation | ✅ | Mail copy in `lib/email/messages.ts`, admin copy in `lib/admin/messages.ts`; code English |
| VI. Tolerant payment, hidden pricing | ✅ | Reminders never change registration data and never threaten cancellation; mails show only the person's own amount, never tier names |
| VII. Simplicity and honest gates | ✅ | Pure functions for rules and templates; thin cron handler; constants in `lib/email/limits.ts`; lint, test and build run and reported |
| Writing rules | ✅ | Mail copy, UI copy and comments without dash punctuation |

## Project Structure

### Documentation (this feature)

```text
specs/007-transactional-emails/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http-and-actions.md
│   └── email-templates.md
├── checklists/requirements.md
└── tasks.md              # next: /speckit-tasks
```

### Source Code

```text
supabase/migrations/0008_email_deliveries.sql      new
lib/database.types.ts                              regenerated
lib/email/
├── provider.ts                                    new · sendEmail() over fetch, server-only, never throws
├── layout.ts                                      new · HTML shell, escapeHtml, text helpers (pure)
├── templates.ts                                   new · confirmation, paymentLink, reminder(1..3) (pure)
├── messages.ts                                    new · German mail copy
├── reminders.ts                                   new · nextReminder() (pure)
├── deliveries.ts                                  new · claim, mark sent/failed, stale cleanup, counts (server-only)
├── send.ts                                        new · sendConfirmationEmail, sendPaymentLinkEmail, sendReminder (server-only)
├── limits.ts                                      new · REMINDER_RUN_CAP, spacing, gaps, stale timeout
└── links.ts                                       new · paymentUrl(reference) from APP_URL
lib/time/berlin.ts                                 new · Berlin calendar date helpers (pure)
app/api/cron/payment-reminders/route.ts            new · GET, CRON_SECRET, maxDuration 60
app/api/register/route.ts                          changed · after(sendConfirmationEmail)
app/admin/actions.ts                               changed · sendPaymentLinkAction
lib/admin/data.ts                                  changed · reminder info in getRegistrations
lib/admin/types.ts                                 changed · reminderCount, lastReminderAt
lib/admin/messages.ts                              changed · German admin copy
components/admin/registration-form-dialog.tsx      changed · payment link block, reminder info
components/admin/registrations-manager.tsx         changed · passes appUrl, wires action
app/admin/page.tsx                                 changed · passes APP_URL to client
vercel.json                                        new · crons entry
tests/unit/email-reminders.test.ts                 new
tests/unit/email-templates.test.ts                 new
tests/unit/email-provider.test.ts                  new
lib/email/preview.ts                               new · sample context + list of six previews (server-only)
app/admin/mail/page.tsx                            new · guardTab("/admin/mail"), server rendered previews
components/admin/mail-preview.tsx                  new · client, template list, HTML/Text switch, sandboxed iframe
components/admin/nav-items.ts                      changed · tab "Mail"
components/admin/admin-sidebar.tsx                 changed · icon EnvelopeSimple
tests/unit/email-preview.test.ts                   new
AGENTS.md                                          changed · section 4 lists the preview tab
```

**Structure Decision**: single Next.js project; mail logic grouped in `lib/email/` next to
`lib/payment/` and `lib/register/`; route handler and Server Action stay thin.

## UI notes (admin block in the registration dialog)

- Layout: a compact "Zahlung" section under the payment fields: line "Erinnerungen: 2, zuletzt am
  14.11.2026" (or "Noch keine Erinnerung"), then two secondary buttons side by side, stacking on
  narrow screens: "Zahlungslink senden" (Phosphor `PaperPlaneTilt`) and "Link kopieren" (`Copy`).
- States: send button shows a pending state and is disabled while running; success and error as the
  existing toasts; disabled send with hint "Keine Mailadresse hinterlegt" when no email; section
  hidden when nothing is due (paid, processing, refunded, cancelled, 0 €); copy confirms with
  "Link kopiert".
- Uses existing tokens, spacing and button styles of the dialog; no new visual language. Design pass
  with `impeccable` during implementation.

## UI notes (tab "Mail")

- Layout: page header "Mail" with one sentence ("So sehen die Mails aus, die Teilnehmende
  bekommen. Ändern lassen sich die Vorlagen nur im Code."). Below, two columns from `lg`: left a
  list of the six mails (title plus one line "wann": for example "7 Tage nach der Anmeldung"), right
  a card with subject line, a small segmented switch "Ansicht | Textfassung" and the preview. Below
  `lg` the list becomes a horizontal, scrollable row of chips above the card.
- Preview: `iframe` with `srcDoc`, `sandbox="allow-same-origin"` (no scripts), height set from the
  document on load, `pointer-events: none` so links and the pay button inside do nothing; width
  follows the card up to 600 px, centered on a muted background like a mail client. Textfassung as a
  `pre` block with wrapping.
- States: hint banner when the current camp has no due date (spec US4 scenario 4); empty state when
  no current camp is set ("Kein aktuelles Camp ausgewählt").
- Existing tokens, cards and spacing; no new visual language; design pass with `impeccable`.

## Security requirements

- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `CRON_SECRET` only in Vercel env and
  `.env.local`; never `NEXT_PUBLIC_*`; modules importing them start with `import "server-only"`.
- Cron route: rejects missing or wrong bearer with `401`; returns counts only.
- Admin action: Clerk session plus `registrations` permission on the server; registration id Zod
  validated; rate limit one payment link mail per registration per minute.
- Mails contain only the recipient's own data; values HTML escaped; no tier names.
- Logs and `email_deliveries` store no address or body.
- Preview tab: guarded by `guardTab("/admin/mail")`; shows only sample person data and the public
  base price of the current camp, never real registrations or hidden prices; no actions.

## Acceptance criteria

Spec FR-001 to FR-027 and SC-001 to SC-007, verified by quickstart scenarios 1 to 16.

## Checks to run

`npm run lint`, `npm test`, `npm run build` (routes, config and server code change). Output reported
verbatim.

## Manual test steps

See [quickstart.md](./quickstart.md).

## Open points for the owner

- Create the Resend account (EU region) and verify the sending domain via DNS records; until then only
  the test sender works.
- Choose sender name, sender address and reply address (for example the camp team mailbox).
- Set `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `CRON_SECRET` and `APP_URL` in Vercel.
- Set `payment_due_date` on the current camp, otherwise only the first reminder is sent.
- Grant the new tab "Mail" to admins who should see it (Benutzerverwaltung); superadmins see it
  automatically.
- Free plan: at most 100 mails per day; the run cap of 80 keeps reminders inside it. Raise the cap
  only after upgrading the plan.

## Complexity Tracking

No constitution violations.
