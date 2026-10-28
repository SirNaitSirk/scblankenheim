# Implementation Plan: Infomails an Angemeldete

**Branch**: `012-info-mails` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-info-mails/spec.md`

## Summary

Four code defined info mails (Vorfreude, Packliste, Anreise, Danke) go to active registrations at
fixed days relative to camp start and end. A second daily cron route `/api/cron/info-mails` runs 30
minutes after the payment reminders, decides per registration with a pure stage function
(`nextInfoMail`), and sends through the existing `deliver` pipeline and `email_deliveries` log, so
each mail goes out at most once. It only uses what is left of the daily provider quota after
confirmations and reminders. Per camp content and on/off switches live in a new table
`camp_mail_info`, edited on a new camp subpage `/admin/camps/[campId]/infomails`. The read only tab
`/admin/mail` gains the four previews with enabled state, missing field hints and delivery counts.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 App Router (Server Components, Server Actions, route
handlers)

**Primary Dependencies**: existing Clerk, supabase-js (service role, server only), Zod, Tailwind,
`components/ui/*`, Phosphor icons, Resend over `fetch` (`lib/email/provider.ts`). No new dependency.

**Storage**: Supabase Postgres. New table `camp_mail_info`; existing `email_deliveries` gets four new
`kind` values without schema change.

**Testing**: Vitest for `nextInfoMail`, the info templates and the preview builder; existing mail
tests stay green; manual steps in [quickstart.md](./quickstart.md).

**Target Platform**: Vercel (Cron, Node runtime); mails read in common clients on phone and desktop.

**Project Type**: web application (single Next.js project).

**Performance Goals**: one run sends up to 85 mails within the 60 s function limit (500 ms spacing).

**Constraints**: provider quota 100 per day shared with confirmations and reminders; Berlin calendar
days; German copy without dashes; no personal data in logs or route responses.

**Scale/Scope**: under 300 registrations per camp, four mails each, one camp per year.

## Existing code inspected

- `lib/email/send.ts`: `deliver`, `buildMailTarget`, `REGISTRATION_COLUMNS`, `runPaymentReminders`.
- `lib/email/deliveries.ts`: claim pattern, `failStaleDeliveries`, `reminderHistory`.
- `lib/email/reminders.ts`, `lib/email/limits.ts`, `lib/time/berlin.ts`: stage pattern and dates.
- `lib/email/templates.ts`, `layout.ts`, `messages.ts`, `links.ts`, `preview.ts`: renderers and copy.
- `app/api/cron/payment-reminders/route.ts`, `lib/email/cron-auth.ts`, `vercel.json`.
- `app/admin/mail/page.tsx`, `components/admin/mail-preview.tsx`, `lib/admin/messages.ts` (`de.mail`).
- `app/admin/camps/actions.ts`, `app/admin/camps/[campId]/felder/*`, `components/admin/camps-board.tsx`.
- `lib/marketing/packing-list.ts` (`featuredPackingItems`), `supabase/migrations/0008_email_deliveries.sql`.

## Decisions

See [research.md](./research.md): R1 table `camp_mail_info`, R2 camp subpage, R3 pure stage function
with windows, R4 reuse `email_deliveries`, R5 quota budget, R6 separate cron route at 06:30 UTC, R7
thanks for the just ended camp, R8 templates, R9 preview and counters.

## UI design

Design work uses the `impeccable` and `tasteskill` skills during implementation and matches the
existing camp field page and the mail tab.

- **Camp subpage „Infomails“**: header with camp name and back link to Camps. Four stacked cards in
  timeline order, each with the mail name, the send day as a sentence („8 Wochen vor Campstart, am
  12. Juni 2027“), a switch „Versand aktiv“, and its fields (textareas for highlights, greeting,
  first day, phone rules; inputs for times, phone, links). Arrival card marks the three required
  fields. One sticky save bar at the bottom on phone, inline button on desktop. A link „Vorschau
  ansehen“ opens `/admin/mail`.
- **States**: missing camp dates show a calm hint in the affected cards and the switch stays usable;
  save success and errors as the existing toasts; field errors under the fields.
- **Mail tab**: the template list gets a group „Infomails“ below the 007 mails. The detail column
  above the preview shows a status line (Aktiv or Aus), the three counts as small stat chips, and
  hints for missing fields. Layout of `mail-preview.tsx` otherwise unchanged.
- **Mails**: same layout as 007, max one button per section, short paragraphs, readable on phones.
- **Responsiveness**: cards single column below 768 px, two column field grid above.

## Files likely to change

New:

- `supabase/migrations/0011_camp_mail_info.sql`
- `lib/email/info-mails.ts` (kinds, windows, `nextInfoMail`)
- `lib/email/info-templates.ts`
- `lib/email/info-run.ts` (`runInfoMails`, budget, camp selection, counts)
- `lib/admin/camp-mail-info.ts` (Zod schema, mapping, server reads and upsert)
- `app/api/cron/info-mails/route.ts`
- `app/admin/camps/[campId]/infomails/page.tsx`, `actions.ts`
- `components/admin/camp-mail-info-form.tsx`
- `tests/unit/email-info-mails.test.ts`, `tests/unit/email-info-templates.test.ts`

Changed:

- `lib/database.types.ts` (regenerated), `lib/email/limits.ts`, `lib/email/messages.ts`,
  `lib/email/deliveries.ts` (`EmailKind`, info history, count today), `lib/email/links.ts`
  (packing and home URLs), `lib/email/preview.ts`
- `app/admin/mail/page.tsx`, `components/admin/mail-preview.tsx`, `lib/admin/messages.ts`
- `components/admin/camps-board.tsx` (menu entry „Infomails“)
- `vercel.json`, `supabase/seed.sql`, `tests/unit/email-preview.test.ts`
- `AGENTS.md` section 4 and section 6 (scope amendment, see below)

## Scope amendment

AGENTS.md section 4 lists confirmation, payment link and reminder as the code defined templates. Info
mails are on no MUST NOT list, so the constitution stays unchanged. Before implementation AGENTS.md
gets:

- Section 4 transactional email: „Info mails to active registrations (teaser 8 weeks before start,
  packing list 3 weeks before, arrival 5 days before, thank you 5 days after the end), code defined,
  per camp content and switches in `camp_mail_info`, sent by the cron route
  `app/api/cron/info-mails` within the remaining daily quota (specs/012-info-mails). No marketing
  mails to people without registration.“
- Section 5: `camp_mail_info`. Section 6: the new cron route.

## Security requirements

- Cron route gated by `CRON_SECRET`; response and logs carry counts, kind and reference only.
- Subpage guarded like the fields page; the save action calls `requirePermission("camps")` and checks
  the camp id exists on the server.
- `camp_mail_info` has RLS on and no policies; only the service role client touches it.
- Free text from admins is HTML escaped in mails; links accepted only with `https://`.
- Info mails show only the recipient's own outstanding amount, never tier names or invitation links.

## Constitution Check

| Principle | Status |
|-----------|--------|
| I. Fixed Stack, Clerk Owns Auth | Pass. Vercel Cron, Resend over `fetch`, no new dependency. |
| II. Server Is the Security Boundary | Pass. Sending only in the cron route; writes behind `requirePermission`; service role on the server. |
| III. Strict Scope | Pass after the AGENTS.md amendment above. No template editor, no `email_templates` table, no marketing list. |
| IV. Single Source of Truth | Pass. Schema via migration, types regenerated, no CHECK constraints on text, packing items from the one packing list, motto from `camps.tagline`. |
| V. Language Separation | Pass. Code English (`camp_mail_info`, `info_arrival`), mail and UI copy German in `lib/email/messages.ts` and `de.mail` / `de.campMailInfo`. |
| VI. Tolerant Payment, Hidden Pricing | Pass. Unpaid registrations get every info mail; the arrival mail only adds a friendly payment note and never cancels. |
| VII. Simplicity and Honest Quality Gates | Pass. Pure stage function like reminders, reused delivery pipeline; lint, test, build reported verbatim. |

Post design recheck: unchanged, all pass.

## Acceptance criteria

The acceptance scenarios of user stories 1 to 5 and FR-001 to FR-019 in [spec.md](./spec.md).

## Checks to run

`npm run lint`, `npm test`, `npm run build`.

## Manual test steps

See [quickstart.md](./quickstart.md).

## Project Structure

```text
specs/012-info-mails/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/http-and-actions.md
├── checklists/requirements.md
└── tasks.md            (next: /speckit-tasks)
```

**Structure Decision**: single Next.js project, mail logic in `lib/email/`, admin content on a camp
subpage like the form fields.

## Complexity Tracking

No violations.
