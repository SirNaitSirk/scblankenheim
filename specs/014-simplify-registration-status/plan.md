# Implementation Plan: Anmeldestatus vereinfachen

**Branch**: `014-simplify-registration-status` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-simplify-registration-status/spec.md`

## Summary

`RegistrationStatus` shrinks from `confirmed | pending | cancelled` to `active | cancelled`. One
migration rewrites existing rows (`pending`, `confirmed` to `active`), changes the column default to
`active` and recreates `create_public_registration` so public signups insert `active`. Types, Zod
schema, labels, badge tones, dialog default, filter options, CSV value, seed and tests follow. Every
check that today asks „not cancelled“ stays as it is, so capacity, sums, reminders, rooms and tent
circles keep their numbers.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 App Router (Server Actions, Client Components)

**Primary Dependencies**: existing Zod, supabase-js, Tailwind, `components/ui/*`. No new dependency.

**Storage**: Supabase Postgres, `registrations.status` (text, no CHECK constraint) plus the
`create_public_registration` function.

**Testing**: Vitest (`tests/unit/finance.test.ts`, `payment-checkout.test.ts`,
`email-reminders.test.ts` fixtures); manual steps in [quickstart.md](./quickstart.md).

**Target Platform**: Vercel; desktop, tablet and phone browsers.

**Project Type**: web application (single Next.js project).

**Performance Goals**: unchanged; the migration is one `update` over a few hundred rows.

**Constraints**: German UI without dashes; no CHECK constraint (AGENTS.md section 12); every
„not cancelled“ rule unchanged.

**Scale/Scope**: about 200 registrations per camp, all camps migrated.

## Existing code inspected

- `supabase/migrations/0001_init_schema.sql` (`status text not null default 'pending'`, no CHECK).
- `supabase/migrations/0009_room_planning.sql` (latest `create_public_registration`, inserts
  `'pending'` at line 294).
- `lib/admin/types.ts` (`RegistrationStatus`), `lib/admin/messages.ts`
  (`REGISTRATION_STATUS_LABELS`), `lib/admin/data.ts` (`mapRegistration` casts `row.status`,
  `mapRegistrationInputToRow`).
- `app/admin/actions.ts` (`registrationSchema.status` enum).
- `components/admin/registration-form-dialog.tsx` (default `"pending"`, options from labels),
  `components/admin/registrations-table.tsx` (`statusTone`), `components/admin/registrations-filters.tsx`
  (options from labels), `components/admin/registrations-manager.tsx` (`csvValue` returns the raw
  English value for `status`, filter state in memory only).
- „Not cancelled“ consumers, unchanged: `lib/marketing/availability.ts`, `lib/admin/finance.ts`,
  `lib/admin/data.ts`, `lib/admin/planning-data.ts`, `lib/admin/rooms-data.ts`,
  `lib/email/reminders.ts`, `lib/payment/eligibility.ts`, SQL in 0005 and 0009.
- Not affected: invitation and admin status (`admin_invitations`, `profiles`), price tier status,
  the `Badge` tone named `pending`, `components/admin/dashboard-preview.tsx` (marketing mock), the
  dashboard tile „Offen“ (counts unpaid payments).
- `supabase/seed.sql`, `tests/unit/*.test.ts` fixtures with `pending` / `confirmed`.

## Decisions

See [research.md](./research.md): R1 two values `active` and `cancelled`, R2 one migration rewrites
rows, default and the public insert function, R3 no CHECK constraint, R4 neutral badge for „Aktiv“,
R5 CSV writes the German label, R6 unknown values are rejected by Zod and mapped defensively on read.

## UI design

No new layout. The status badge in the table uses tone `neutral` for „Aktiv“ and `danger` for
„Storniert“, so green stays reserved for „Bezahlt“. The dialog select and the filter list two
options. Empty, loading and error states are unchanged.

## Files likely to change

New:

- `supabase/migrations/0011_simplify_registration_status.sql`
- `lib/admin/registration-status.ts` (`toRegistrationStatus`, pure and testable)

Changed:

- `lib/admin/types.ts`, `lib/admin/messages.ts`, `lib/admin/data.ts` (uses the mapper)
- `app/admin/actions.ts`
- `components/admin/registration-form-dialog.tsx`, `components/admin/registrations-table.tsx`,
  `components/admin/registrations-manager.tsx`
- `lib/database.types.ts` (regenerated; column stays `string`)
- `supabase/seed.sql`
- `tests/unit/finance.test.ts`, `tests/unit/payment-checkout.test.ts`,
  `tests/unit/email-reminders.test.ts`, new cases in `tests/unit/registration-status.test.ts`
- `AGENTS.md` section 5 (one line on the two statuses)

## Scope amendment

AGENTS.md section 5, after the gender sentence: „A registration status is `active` or `cancelled`
(specs/014-simplify-registration-status); only `cancelled` changes behaviour, payment progress lives
in `payment_status`.“ Constitution unchanged.

## Security requirements

- The save action keeps `requirePermission("registrations")`; Zod rejects any status other than
  `active` or `cancelled`.
- The migration runs as a normal schema migration; the recreated function keeps its
  `security invoker`, `search_path` and grants exactly as in 0009.

## Constitution Check

| Principle | Status |
|-----------|--------|
| I. Fixed Stack, Clerk Owns Auth | Pass. No new dependency. |
| II. Server Is the Security Boundary | Pass. Validation stays in the guarded Server Action. |
| III. Strict Scope | Pass. Removes a value, adds no feature. |
| IV. Single Source of Truth | Pass. Schema change via migration, labels in `messages.ts`. |
| V. Language Separation | Pass. Code `active` / `cancelled`, UI „Aktiv“ / „Storniert“. |
| VI. Tolerant Payment, Hidden Pricing | Pass. Payment status untouched; unpaid stays a valid state. |
| VII. Simplicity and Honest Quality Gates | Pass. No CHECK constraint; lint, test, build reported verbatim. |

Post design recheck: unchanged, all pass.

## Acceptance criteria

The acceptance scenarios of user stories 1 to 4 and FR-001 to FR-010 in [spec.md](./spec.md).

## Checks to run

`npm run lint`, `npm test`, `npm run build`.

## Manual test steps

See [quickstart.md](./quickstart.md).

## Project Structure

```text
specs/014-simplify-registration-status/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/registration-status.md
├── checklists/requirements.md
└── tasks.md
```
