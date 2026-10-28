# Implementation Plan: Mailübersicht pro Anmeldung

**Branch**: `013-registration-mail-history` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-registration-mail-history/spec.md`

## Summary

The registration dialog gets a read only section „Mails“ that lists every delivery attempt of that
registration from the existing `email_deliveries` log: German mail name, Berlin date and time, status
and trigger (including the admin who sent a payment link). The list is loaded by a new Server Action
when the dialog opens in edit mode and reloaded after „Zahlungslink senden“. No schema change, no new
dependency; mapping lives in a pure, tested function.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 App Router (Server Actions, Client Components)

**Primary Dependencies**: existing Clerk, supabase-js (service role, server only), Zod, Tailwind,
`components/ui/*`, Phosphor icons. No new dependency.

**Storage**: Supabase Postgres, read only on `email_deliveries` and `profiles`.

**Testing**: Vitest for `toMailHistory` in `tests/unit/email-history.test.ts`; manual steps in
[quickstart.md](./quickstart.md).

**Target Platform**: Vercel; desktop, tablet and phone browsers.

**Project Type**: web application (single Next.js project).

**Performance Goals**: section filled within 1 s after opening (one indexed query plus one profiles
read); list page unchanged.

**Constraints**: permission `registrations`; no address, subject, body, provider id or raw error in
the response; German UI without dashes.

**Scale/Scope**: about 10 deliveries per registration and year, capped at 50 rows.

## Existing code inspected

- `supabase/migrations/0008_email_deliveries.sql` (columns, `email_deliveries_registration_idx`).
- `lib/email/deliveries.ts` (`EmailKind`, `reminderHistory` chunking), `lib/email/send.ts`
  (`deliver` sets `trigger` and `actor`).
- `lib/admin/data.ts` (`loadReminderInfo`, `mapRegistration`), `lib/admin/types.ts` (`Registration`,
  `ActionResult`).
- `app/admin/actions.ts` (`runGuarded`, `referenceSchema`, `sendPaymentLinkAction`, `actorLabel`).
- `components/admin/registration-form-dialog.tsx` (`Section`, edit mode, `PaymentLinkPanel`),
  `components/admin/payment-link-panel.tsx`, `components/admin/registrations-manager.tsx`.
- `lib/format.ts` (`formatDateTime` without time zone), `lib/admin/messages.ts` (`de.registrations`,
  `de.paymentLink`, `de.mail.templates`).

## Decisions

See [research.md](./research.md): R1 load on open via Server Action, R2 one indexed query plus
profiles, R3 pure mapping with German labels and fallback, R4 nothing private leaves the server, R5
reload after sending, R6 Berlin time formatter.

## UI design

Design work uses the `impeccable` and `tasteskill` skills during implementation and matches the
dialog's existing sections.

- **Placement**: section „Mails“ after the payment block and before the camp fields, same heading
  style as `Section`.
- **Rows**: a compact list, one row per attempt: left the mail name in medium weight with the trigger
  line below in muted text; right the date and time (tabular numbers) and a small status badge with
  icon and text. Failed rows use the danger tone on the badge only, not on the whole row.
- **States**: skeleton rows while loading, a calm one line empty state, an inline error with
  „Erneut versuchen“; nothing blocks the form.
- **Phone**: date and badge wrap under the name; no horizontal scrolling.

## Files likely to change

New:

- `lib/email/history.ts` (`MailHistoryEntry`, `toMailHistory`)
- `components/admin/mail-history.tsx` (client section)
- `tests/unit/email-history.test.ts`

Changed:

- `lib/email/deliveries.ts` (`getMailHistory`)
- `app/admin/actions.ts` (`getRegistrationMailsAction`)
- `components/admin/registration-form-dialog.tsx` (render section, reload after sending)
- `components/admin/registrations-manager.tsx` (pass the action)
- `lib/admin/messages.ts` (`de.registrations.mails`: title, labels per kind, fallback, statuses,
  triggers, empty, error, retry, notFound, loadFailed)
- `lib/format.ts` (`formatDateTimeBerlin`)
- `AGENTS.md` section 4 (one line under Registrations)

## Scope amendment

AGENTS.md section 4 already covers the registrations table with inline edit. Add to the admin
registrations bullet: „The registration dialog shows a read only mail history per registration from
`email_deliveries` (specs/013-registration-mail-history).“ Constitution unchanged.

## Security requirements

- `getRegistrationMailsAction` runs through `runGuarded` with `requirePermission("registrations")`.
- Reference validated with Zod and resolved on the server; ids never come from the client.
- Only mapped fields leave the server; `provider_message_id` and `error` stay server side.
- Read only: no writes, no resend from the history.

## Constitution Check

| Principle | Status |
|-----------|--------|
| I. Fixed Stack, Clerk Owns Auth | Pass. No new dependency. |
| II. Server Is the Security Boundary | Pass. Service role read inside a guarded Server Action; minimal response. |
| III. Strict Scope | Pass after the one line AGENTS.md amendment; no template editor or resend feature. |
| IV. Single Source of Truth | Pass. Reads the existing delivery log, no schema change. |
| V. Language Separation | Pass. Code English (`MailHistoryEntry`, `toMailHistory`), German labels in `de.registrations.mails`. |
| VI. Tolerant Payment, Hidden Pricing | Pass. No payment behaviour or prices touched. |
| VII. Simplicity and Honest Quality Gates | Pass. One action, one pure mapper, one component; lint, test, build reported verbatim. |

Post design recheck: unchanged, all pass.

## Acceptance criteria

The acceptance scenarios of user stories 1 and 2 and FR-001 to FR-011 in [spec.md](./spec.md).

## Checks to run

`npm run lint`, `npm test`, `npm run build`.

## Manual test steps

See [quickstart.md](./quickstart.md).

## Project Structure

```text
specs/013-registration-mail-history/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/server-action.md
├── checklists/requirements.md
└── tasks.md
```

**Structure Decision**: single Next.js project; mapping in `lib/email/`, UI in `components/admin/`.

## Complexity Tracking

No violations.
