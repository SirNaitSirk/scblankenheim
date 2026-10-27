---

description: "Task list for the public camp registration feature"
---

# Tasks: Public Camp Registration

**Input**: Design documents from `/specs/001-registration-form/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Requested by the plan (research R8): Vitest unit tests for the pure modules only. End to
end and race behaviour are verified manually through quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing
of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 to US5 from spec.md)
- Paths are relative to the repository root (single Next.js app, see plan.md Project Structure)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Test runner for the pure modules (research R8)

- [X] T001 Add `vitest` as devDependency and the script `"test": "vitest run"` in package.json (run `npm install -D vitest`)
- [X] T002 [P] Create vitest.config.ts (created as vitest.config.mts, ESM, to avoid the Vite CJS warning) at the repository root with `test.include = ["tests/unit/**/*.test.ts"]`, `environment: "node"` and a `resolve.alias` mapping `@` to the repository root (mirrors the `@/*` path in tsconfig.json)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared copy, shared validation, race free insert. Every user story depends on these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Create lib/register/messages.ts (isomorphic, no `server-only`, exported `const registerMessages = {...} as const`) holding every German string of the public registration area: section copy for `open`, `countdown`, `closed` (moved from components/marketing/registration-section.tsx) plus new `full` (eyebrow "Anmeldung", heading "Das Camp ist ausgebucht", intro inviting contact, research R9); form copy and seat notes (moved from components/marketing/registration-form.tsx); validation messages `required`, `email`, `number`, `checkbox`, `full` (moved from lib/register/service.ts); API errors (moved from app/api/register/route.ts) plus `campFull: "Das Camp ist inzwischen ausgebucht."`; countdown copy (moved from components/marketing/countdown-panel.tsx); `invitationHint: "Du meldest dich über eine persönliche Einladung an."`. Rewrite every string without en dash, em dash or hyphenated words (for example "Bitte gib eine gültige Mailadresse ein", "Mail" as field label, period instead of the dash in the success text)
- [X] T004 [P] Create lib/register/validation.ts (isomorphic, no `server-only`) exporting `CORE_FIELDS` (`first_name` "Vorname", `last_name` "Nachname", `email` "Mail", all `required: true`, labels from registerMessages), `CORE_KEYS`, `mergeFields(dynamic)` (core first, dynamic deduped by key), `validateField(field, value)` and `validateFields(fields, values)` implementing the data-model.md rules verbatim: "any required non checkbox: trimmed value not empty", "checkbox required: value is true", "email: matches simple address pattern when not empty", "number: parses as number when not empty", returning messages from lib/register/messages.ts
- [X] T005 Create supabase/migrations/0005_public_registration_capacity.sql defining `public.create_public_registration(p_camp_id uuid, p_reference text, p_first_name text, p_last_name text, p_email text, p_form_data jsonb, p_amount_due int, p_price_tier_id uuid, p_option_limits jsonb) returns jsonb` exactly as in contracts/create-public-registration.md: `pg_advisory_xact_lock(hashtext(p_camp_id::text))`; active rows are "`deleted = false AND status <> 'cancelled'`"; `camp_full` when `camps.capacity` is not null and active count `>= capacity`; `option_full` with `keys` for every limit reached; insert with `status = 'pending'`, `payment_status = 'unpaid'`, `amount_paid = 0`; `duplicate_reference` on unique violation of `reference`; `language plpgsql`, `security invoker`, `set search_path = public`; `revoke execute on function ... from public, anon, authenticated`; `grant execute ... to service_role`; no CHECK constraints
- [X] T006 Apply the migration (`npx supabase db push` against the linked project) and regenerate lib/database.types.ts (`npx supabase gen types typescript --linked > lib/database.types.ts`); if no database is reachable, hand edit the `Functions` section of lib/database.types.ts to match the signature and note it in the task · DONE BY HAND: no Supabase CLI or linked project locally; Functions typed by hand in lib/database.types.ts. Migration still has to be applied to the database by the owner.
- [X] T007 [P] Update lib/marketing/availability.ts: count only active rows (`.eq("deleted", false).neq("status", "cancelled")`) in `getCampAvailability`, and add `getActiveRegistrationCount(campId: string): Promise<number>` using a head count with the same filter
- [X] T008 Refactor lib/register/service.ts: import `CORE_KEYS`, `mergeFields`, `validateFields` from lib/register/validation.ts and messages from lib/register/messages.ts (delete the local copies); replace `createRegistration` with a new local `insertPublicRegistration(campId, input, optionLimits)` that calls `getServiceClient().rpc("create_public_registration", ...)`, generates the reference (export `generateReference` from lib/admin/data.ts) and retries up to 5 times on `duplicate_reference`; build `p_option_limits` from capacity fields (`readFieldCapacity`) whose submitted value equals the limited option; map `option_full` to `{ ok: false, reason: "full", fieldErrors }` and `camp_full` to the new `{ ok: false, reason: "camp_full" }`; delete the JS `checkCapacity` precheck (the RPC is authoritative for option seats); keep `isThrottled` and `writeLog` unchanged
- [X] T009 Update app/api/register/route.ts: take every error string from lib/register/messages.ts and map `reason: "camp_full"` to status 409 with `registerMessages.api.campFull` (contracts/register-api.md)

**Checkpoint**: Foundation ready. Registrations go through the RPC; copy and validation have one source.

---

## Phase 3: User Story 1 · Für das aktuelle Camp anmelden (Priority: P1) 🎯 MVP

**Goal**: The form renders core fields then camp questions, validates with the shared rules, stores a pending and unpaid registration and shows the reference.

**Independent Test**: With registration open, submit a complete form: the reference appears and the row is `pending` / `unpaid` with base price (quickstart scenarios 1 and 2).

### Tests for User Story 1

- [X] T010 [P] [US1] Write tests/unit/validation.test.ts covering `mergeFields` (core first, dynamic order kept, duplicate core key dropped) and every `validateField` rule from data-model.md including empty optional values passing and messages equal to lib/register/messages.ts

### Implementation for User Story 1

- [X] T011 [US1] Refactor components/marketing/registration-form.tsx to use `mergeFields` and `validateField` from lib/register/validation.ts and all copy from lib/register/messages.ts; delete the local `copy`, `CORE_FIELDS`, `CORE_KEYS`, `mergeFields`, `fieldSchema` and `EMAIL_RE`; keep the existing markup, accessibility attributes and double submit guard
- [X] T012 [US1] Run quickstart.md scenarios 1 and 2 and confirm identical behaviour to before plus the new dash free wording · Verified 2026-10-27: scenario 2 (invalid POST 400 with German field errors) and scenario 1 (REG-87373896 stored pending, unpaid, amount_due 195 = base price, form_data correct) after migration 0005 was applied.

**Checkpoint**: User Story 1 works on its own and is the MVP.

---

## Phase 4: User Story 2 · Anmeldung nur im gültigen Zeitraum (Priority: P1)

**Goal**: Shared window rule with automatic opening, deadline and the `full` state for total capacity (research R1, R7).

**Independent Test**: Set the deadline into the past, set capacity to the active count, let a countdown expire: page and API react as in quickstart scenarios 3 to 6.

### Tests for User Story 2

- [X] T013 [P] [US2] Write tests/unit/registration-state.test.ts for `getRegistrationState` covering: no camp → closed; `now >= closes_at` → closed even when open; switch on → open; switch off with `now < opens_at` → countdown; switch off with `now == opens_at` → open; switch off without opens_at → closed; capacity null → never full; `activeCount == capacity` → full; `activeCount == capacity - 1` → open; countdown wins over full

### Implementation for User Story 2

- [X] T014 [P] [US2] Create lib/register/registration-state.ts (isomorphic, pure) exporting `type RegistrationState = "open" | "countdown" | "closed" | "full"`, `type RegistrationWindow = { registrationOpen: boolean; opensAt: string | null; closesAt: string | null; capacity: number | null }` and `getRegistrationState(camp: RegistrationWindow | null, now: Date, activeCount: number)` implementing research R1 steps 1 to 6 in that order
- [X] T015 [US2] Update lib/marketing/current-camp.ts: select `registration_closes_at` and `capacity`, extend `LandingCamp` with `registrationClosesAt` and `capacity`, delete the local `RegistrationState` and `getRegistrationState`, and change `getCountdownTarget` to use only `registrationOpensAt` (no `startDate` fallback)
- [X] T016 [US2] Update lib/register/service.ts `loadCurrentCamp` to also read `registration_opens_at`, `registration_closes_at`, `capacity`; at the start of `submitRegistration` compute the state with `getRegistrationState(camp, new Date(), await getActiveRegistrationCount(camp.id))` and return `closed` for `closed`/`countdown` and `camp_full` for `full`
- [X] T017 [US2] Update components/marketing/registration-section.tsx: compute `activeCount` with `getActiveRegistrationCount` (server side, only when a camp exists), derive state via lib/register/registration-state.ts, take all copy from lib/register/messages.ts, and render the new `full` state with `registerMessages.section.full` mirroring the closed layout (contact ButtonLink)
- [X] T018 [US2] Update components/marketing/countdown-panel.tsx: take copy from lib/register/messages.ts and, when the remaining time reaches zero, call `router.refresh()` exactly once (`useRouter` from `next/navigation`, guarded by a ref); show the short "wird geöffnet" fallback text only while refreshing
- [X] T019 [US2] Run quickstart.md scenarios 3, 4, 5 and 6 (including the parallel `curl` race for total capacity) · Verified 2026-10-27 on the current camp with exact restore: s3 countdown then form appears without reload (browser), s4 closed + 409, s5 full + 409 camp_full, s6 parallel pair gave exactly one 200 (REG-2D2ECD08) and one 409.

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 · Mit persönlichem Einladungslink zum Sonderpreis anmelden (Priority: P2)

**Goal**: `/?einladung=<token>#anmelden` applies the hidden tier price, shows a hint without amount and keeps the token for further registrations (research R4).

**Independent Test**: quickstart scenarios 8, 9 and 10.

### Implementation for User Story 3

- [ ] T020 [P] [US3] Create lib/register/invitation.ts (`server-only`) exporting `findValidTier(campId, token)` (moved from `resolveAmount` in lib/register/service.ts: token exists, `camp_id` matches, `now` inside `valid_from` / `valid_until`) returning `{ id, price } | null`, and `resolveInvitation(campId, token): Promise<{ valid: boolean }>` that never returns the price
- [ ] T021 [US3] Update lib/register/service.ts `resolveAmount` to use `findValidTier` from lib/register/invitation.ts (invalid token still falls back silently to `base_price`)
- [ ] T022 [US3] Update app/page.tsx to accept `searchParams: Promise<{ [key: string]: string | string[] | undefined }>`, await it, read `einladung` (first value when an array, ignore empty) and pass it as `invitationToken` to `RegistrationSection`
- [ ] T023 [US3] Update components/marketing/registration-section.tsx to accept `invitationToken?: string`, call `resolveInvitation` only when the state is `open`, and pass the token to the form only when valid
- [ ] T024 [US3] Update components/marketing/registration-form.tsx: new prop `invitationToken?: string`; send it as `priceTierToken` in the POST body; keep it across `resetForm` ("Noch jemanden anmelden"); render `registerMessages.invitationHint` above the fields in the muted notice style when present, with no amount (contracts/landing-registration-ui.md)
- [ ] T025 [US3] Run quickstart.md scenarios 8, 9 and 10 (view page source to confirm no tier name, price or token of other tiers in the HTML)

**Checkpoint**: Invitation pricing works without touching other stories.

---

## Phase 6: User Story 4 · Begrenzte Plätze bei einer Auswahloption (Priority: P2)

**Goal**: Seat notes and sold out options stay as today; the server check is now race free through the RPC (T005, T008) and ignores cancelled registrations (T007).

**Independent Test**: quickstart scenario 7.

- [ ] T026 [US4] Verify in components/marketing/registration-form.tsx that the seat note and the "ausgebucht" option label use lib/register/messages.ts without dashes (the current label joins option and "ausgebucht" with a dash; change it to `${opt} (ausgebucht)`)
- [ ] T027 [US4] Run quickstart.md scenario 7 (two parallel requests for the last seat of an option: exactly one 200, one 409 with field error)

**Checkpoint**: Option limits hold under concurrency.

---

## Phase 7: User Story 5 · Einheitliche, deutsche und regelkonforme Texte (Priority: P3)

**Goal**: Every visible string comes from one module, matches between browser and server, and follows the writing rules.

**Independent Test**: quickstart scenario 11.

- [ ] T028 [US5] Search lib/register/, components/marketing/registration-form.tsx, components/marketing/registration-section.tsx, components/marketing/countdown-panel.tsx and app/api/register/route.ts for remaining hardcoded German strings and for `–`, `—` or hyphenated German words in strings; move or rewrite every finding into lib/register/messages.ts
- [ ] T029 [US5] Run quickstart.md scenario 11 (each error once in the browser, once via `curl`; wording identical)

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T030 Run `npm run lint` and fix findings in touched files only
- [ ] T031 Run `npm test` and report the output verbatim
- [ ] T032 Run `npm run build` (routes, server code and types changed) and report the output verbatim
- [ ] T033 Run quickstart.md scenario 12 (320 px viewport, no horizontal scroll) and check the `full` state and the invitation hint on mobile
- [ ] T034 [P] Add the admin note from quickstart.md (closing early via `registration_closes_at` once the opening time has passed) to the Data model section of AGENTS.md under `camps`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: T003 and T004 first; T005 → T006 → T008 → T009; T007 parallel to T005. Blocks all stories
- **US1 (Phase 3)**: after Phase 2
- **US2 (Phase 4)**: after Phase 2; T014 before T015 to T017
- **US3 (Phase 5)**: after Phase 2; touches registration-section.tsx and registration-form.tsx, so run after US1 and US2 changes to those files are done
- **US4 (Phase 6)**: after Phase 2 and T011
- **US5 (Phase 7)**: after all story phases (final sweep)
- **Polish (Phase 8)**: last

### Story Completion Order

US1 (MVP) → US2 → US3 → US4 → US5. US2 and US3 are functionally independent but share two files with US1, so they run sequentially.

### Within Each Story

- Tests first where present (T010, T013), then pure modules, then server, then UI, then the quickstart run

## Parallel Example

```text
# Phase 2 start:
T003 lib/register/messages.ts
T004 lib/register/validation.ts   (imports T003 messages; write against the agreed keys)
T007 lib/marketing/availability.ts

# Phase 4 start:
T013 tests/unit/registration-state.test.ts
T014 lib/register/registration-state.ts

# Phase 5 start:
T020 lib/register/invitation.ts
```

## Implementation Strategy

### MVP First

1. Phase 1 and Phase 2
2. Phase 3 (US1), validate with quickstart 1 and 2, then stop and review

### Incremental Delivery

1. US2 closes the deadline and capacity gaps (highest business risk after MVP)
2. US3 restores invitation pricing
3. US4 and US5 are verification and cleanup on top
4. Polish runs all checks; commit after each completed phase

## Notes

- Spec 002 (landing page redesign) also touches components/marketing/; coordinate before editing registration-section.tsx in parallel
- Never render hidden tier prices; never call the RPC or the service role client from the browser
- Stop at any checkpoint to validate a story independently
