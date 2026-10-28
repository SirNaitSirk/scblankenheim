---

description: "Task list for Mailübersicht pro Anmeldung"
---

# Tasks: Mailübersicht pro Anmeldung

**Input**: Design documents from `specs/013-registration-mail-history/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-action.md, quickstart.md

**Tests**: plan.md asks for a Vitest unit test of the pure mapper.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (scope and copy)

- [X] T001 Add the line from plan.md „Scope amendment“ to the admin registrations bullet in AGENTS.md section 4
- [X] T002 [P] Add `de.registrations.mails` to lib/admin/messages.ts: `title` „Mails“, `labels` per kind from data-model.md (Anmeldebestätigung, Zahlungslink, Erinnerung 1, 2, 3, Vorfreude, Packliste, Anreise, Danke), `fallback` „Mail“, `status` („Verschickt“, „Fehlgeschlagen“, „Wird gesendet“), `trigger` („bei Anmeldung“, „automatisch“, `byAdmin(name)` „von {Name}“, `byUnknownAdmin` „von einem Admin“), `empty` „Noch keine Mails verschickt“, `loadFailed` „Mails konnten nicht geladen werden“, `retry` „Erneut versuchen“, `notFound`; German only and without dashes
- [X] T003 [P] Add `formatDateTimeBerlin(iso)` to lib/format.ts using `Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" })`

---

## Phase 2: Foundational (blocking)

- [X] T004 Create lib/email/history.ts: type `MailHistoryEntry` exactly as in data-model.md and pure `toMailHistory(rows, adminNames)`: status `sent`, `failed` (also when `error` is `stale`), `sending`; unknown trigger values fall back to `cron`; `at` is `updated_at` for sent rows, else `created_at`; `actorName` from `adminNames` or null; ordered newest `created_at` first; at most 50; never copies `error` or `provider_message_id`
- [X] T005 [P] Create tests/unit/email-history.test.ts covering stale as failed, sent uses `updated_at`, unknown kind kept as kind (label fallback happens in the UI), actor name and missing actor, ordering, cap at 50, no `error` field on the result
- [X] T006 Add server only `getMailHistory(registrationId)` to lib/email/deliveries.ts: select `id, kind, status, trigger, actor, error, created_at, updated_at` from `email_deliveries` where `registration_id` equals the id, `order created_at desc`, `limit 50`; read `profiles (id, name, email)` for the distinct actor ids (name first, then email); return `toMailHistory(rows, names)`

**Checkpoint**: the mapper is tested and the history can be read on the server.

---

## Phase 3: User Story 1 · Mails einer Person nachsehen (P1) 🎯 MVP

**Goal**: the dialog shows the mail history of the opened registration.

**Independent Test**: quickstart scenarios 1, 2, 4 and 5.

- [X] T007 [US1] Add `getRegistrationMailsAction(reference)` to app/admin/actions.ts per contracts/server-action.md: inside `runGuarded`, validate with `referenceSchema`, look up the registration id by `reference`, return `{ ok: true, mails }` or `{ ok: false, error }` with `de.registrations.mails.notFound` or `loadFailed`; export a `MailHistoryResult` type next to it or in lib/admin/types.ts
- [X] T008 [US1] Create components/admin/mail-history.tsx (client): props `reference` and `load: (reference) => Promise<MailHistoryResult>` plus a `reloadKey`; loads on mount and when `reloadKey` changes; renders loading skeleton (three rows), empty state, inline error with „Erneut versuchen“, and rows per the UI contract (label via `de.registrations.mails.labels[kind] ?? fallback`, status badge with Phosphor icon and text, `formatDateTimeBerlin`, trigger line)
- [X] T009 [US1] Render `MailHistory` in components/admin/registration-form-dialog.tsx only in edit mode, after the payment block and before the camp fields, with a new optional prop `onLoadMails`; bump `reloadKey` after `onSendPaymentLink` resolves
- [X] T010 [US1] Pass `onLoadMails={getRegistrationMailsAction}` from components/admin/registrations-manager.tsx

**Checkpoint**: quickstart scenarios 1, 2, 4 and 5 pass.

---

## Phase 4: User Story 2 · Nur für Berechtigte, ohne Inhalte (P1)

**Goal**: only admins with „Anmeldungen“ can read the history and nothing private leaves the server.

**Independent Test**: quickstart scenarios 3 and 6.

- [X] T011 [US2] Verify in app/admin/actions.ts that the action returns only `MailHistoryEntry` fields (no spread of raw rows) and that `AuthError` maps to `de.registrations.toast.unauthorized`; adjust if needed
- [X] T012 [P] [US2] Extend tests/unit/email-history.test.ts with a case asserting the result objects have exactly the keys `id, kind, status, trigger, actorName, at`

---

## Phase 5: Polish and cross cutting

- [X] T013 Design pass on components/admin/mail-history.tsx with the `impeccable` and `tasteskill` skills: spacing in the dialog, phone wrapping, badge contrast in light and dark theme
- [X] T014 Scan new copy and comments for dash punctuation and hyphenated words (constitution writing rules)
- [X] T015 Run `npm run lint`, `npm test` and `npm run build` and report the output verbatim
- [ ] T016 Walk through quickstart.md scenarios 1 to 6 locally and note results
  - 2026-10-28: scenario 4 (empty state in the dialog) and 5 (no section in create mode) checked in the browser. Scenarios 1 to 3 and 6 need real deliveries; the database has none yet and sending a payment link would send a real mail. List rendering, statuses, triggers and the response shape are covered by tests/unit/email-history.test.ts.

---

## Dependencies and execution order

- Phase 1: T002 and T003 in parallel with T001.
- Phase 2 needs nothing from Phase 1 except T004 before T005 and T006.
- US1 needs Phase 2 and T002, T003. T008 needs T007 for the result type; T009 needs T008; T010 needs T009.
- US2 needs T007; T012 runs in parallel with T011.
- Phase 5 runs last.
- Independent of feature 012: info mail labels exist already and show up once 012 sends mails.

## Parallel examples

- T002, T003 and T004 can run at the same time.
- T005 alongside T006 once T004 exists.

## Implementation strategy

1. MVP: Phases 1 to 3. The team can look up every mail per person.
2. US2 hardening and the unit test for the response shape.
3. Polish, checks, quickstart, then ask for review before committing.
