---

description: "Task list for Anmeldestatus vereinfachen"
---

# Tasks: Anmeldestatus vereinfachen

**Input**: Design documents from `specs/014-simplify-registration-status/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/registration-status.md, quickstart.md

**Tests**: plan.md asks for a Vitest unit test of the read mapper and updated fixtures.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (scope)

- [x] T001 Add the line from plan.md „Scope amendment“ to AGENTS.md section 5, after the sentence on the registration gender

---

## Phase 2: Foundational (blocking)

- [x] T002 Create supabase/migrations/0011_simplify_registration_status.sql: header comment explaining the change; `update public.registrations set status = 'active' where status in ('pending', 'confirmed')`; `alter table public.registrations alter column status set default 'active'`; drop and recreate `public.create_public_registration` copied verbatim from supabase/migrations/0009_room_planning.sql (signature, body, `security invoker`, `search_path`, revoke and grant) with the inserted literal `'pending'` replaced by `'active'`; no CHECK constraint
- [x] T003 Change `RegistrationStatus` in lib/admin/types.ts to `"active" | "cancelled"`
- [x] T004 Replace `REGISTRATION_STATUS_LABELS` in lib/admin/messages.ts with `active: "Aktiv"`, `cancelled: "Storniert"`
- [x] T005 Create pure `toRegistrationStatus(value: string): RegistrationStatus` in lib/admin/registration-status.ts (lib/admin/data.ts is server only) (`cancelled` stays, everything else becomes `active`) and use it in `mapRegistration` in lib/admin/data.ts instead of the cast
- [x] T006 Change the `status` enum in `registrationSchema` in app/admin/actions.ts to `["active", "cancelled"]`

**Checkpoint**: `npx tsc --noEmit` lists every remaining use of the old values.

---

## Phase 3: User Story 1 und 2 · Eindeutiger Status, neue Anmeldungen aktiv (P1)

- [x] T007 [US1] In components/admin/registrations-table.tsx set `statusTone` to `active: "neutral"`, `cancelled: "danger"`
- [x] T008 [US2] In components/admin/registration-form-dialog.tsx change the default from `"pending"` to `"active"`
- [x] T009 [P] [US1] Update supabase/seed.sql: every `'confirmed'` and `'pending'` registration status becomes `'active'` (payment statuses untouched)

---

## Phase 4: User Story 3 · Stornieren und aufheben (P2)

- [x] T010 [US3] Confirm by search that every behavioural check still compares against `cancelled` only (lib/marketing/availability.ts, lib/admin/finance.ts, lib/admin/data.ts, lib/admin/planning-data.ts, lib/admin/rooms-data.ts, lib/admin/tent-circles-data.ts, lib/email/reminders.ts, lib/payment/eligibility.ts); change nothing there unless a check names `pending` or `confirmed`

---

## Phase 5: User Story 4 · Filtern und Export (P2)

- [x] T011 [US4] In components/admin/registrations-manager.tsx make `csvValue` return `REGISTRATION_STATUS_LABELS[r.status]` for the status column
- [x] T012 [US4] Check components/admin/registrations-filters.tsx builds its options from `REGISTRATION_STATUS_LABELS` (yields „Alle“, „Aktiv“, „Storniert“); no code change expected

---

## Phase 6: Tests and polish

- [x] T013 [P] Update fixtures in tests/unit/finance.test.ts, tests/unit/payment-checkout.test.ts and tests/unit/email-reminders.test.ts from `pending` / `confirmed` to `active`
- [x] T014 [P] Create tests/unit/registration-status.test.ts for `toRegistrationStatus`: `cancelled` stays, `active`, `pending`, `confirmed` and an unknown value become `active`
- [x] T015 Search the repo (`app`, `components`, `lib`, `tests`, `supabase/seed.sql`) for registration status uses of `pending` and `confirmed` and the labels „Bestätigt“ as status; none may remain (invitation, admin, price tier and badge tone uses are out of scope)
- [x] T016 Apply the migration and regenerate lib/database.types.ts. Applied by the owner in the Supabase SQL editor on 2026-10-28; rows verified (only `active` and `cancelled`); types unchanged because the column stays `text` and the function signature is the same
- [x] T017 Run `npm run lint`, `npm test`, `npm run build` and report the output verbatim
- [ ] T018 Walk through quickstart.md steps 1 to 8. Done: 1, 2, 3 (dashboard count), 4 (filter options). Open: 5 to 8 need writes on the hosted database

## Dependencies

T002 to T006 block all later phases. T007 to T012 depend on T003 and T004. T013 and T014 depend on
T003 and T005. T016 depends on T002. T017 and T018 come last.
