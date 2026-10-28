---

description: "Task list for Persönliche Teilnehmerseite"
---

# Tasks: Persönliche Teilnehmerseite

**Input**: Design documents from `specs/017-participant-page/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/page-actions-mail.md, quickstart.md

**Tests**: Unit tests are included because the plan names them and the project keeps pure view,
token and template tests in `tests/unit/`.

**Organization**: Grouped by user story from spec.md (US1 to US6), P1 stories first.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no open dependency)
- **[Story]**: user story label (US1 to US6)

---

## Phase 1: Setup

**Purpose**: Scope amendment before any code (constitution, principle III)

- [X] T001 Amend `AGENTS.md`: in section 4 under "Public" add "Participant page (`/meine-anmeldung/<token>`): private, read only page per registration with status, amounts, pay button, own answers, camp facts and packing list link; reachable only through an unguessable link that every mail to the registration contains; admins copy and renew it in the registration dialog (specs/017-participant-page)". In section 5 add to `registrations` that `access_token` holds that link secret. In the Quick reference add `app/meine-anmeldung/[token]` to the public routes. No dash punctuation in the new text.

---

## Phase 2: Foundational (blocking)

**Purpose**: Schema, types, token helpers and links every story uses

- [X] T002 Create `supabase/migrations/0013_participant_access.sql`: `alter table public.registrations add column access_token text not null default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));` then `create unique index registrations_access_token_key on public.registrations (access_token);`. No CHECK constraint, no change to `create_public_registration`. Header comment in the style of 0012 referencing specs/017-participant-page, stating that the volatile default backfills existing rows and only the service role reads the column.
- [X] T003 (types updated by hand; no Docker and no Supabase config in this environment, migration not yet applied) Apply the migration locally (`npx supabase db reset` or `npx supabase migration up`) and update `lib/database.types.ts` for `registrations.access_token` (Row `string`, Insert and Update optional `string`). If no local database is available, update the types by hand and note that in this task.
- [X] T004 [P] Create `lib/participant/limits.ts`: `ACCESS_TOKEN_PATTERN = /^[0-9a-f]{64}$/`, `ACCESS_TOKEN_BYTES = 32`, `PARTICIPANT_THROTTLE_WINDOW_MS = 10 * 60 * 1000`, `PARTICIPANT_THROTTLE_MAX = 20` (misses per ip within the window), each with a short comment.
- [X] T005 [P] Create `lib/participant/token.ts`: pure `isAccessToken(value: unknown): value is string` using `ACCESS_TOKEN_PATTERN`; `normalizeAccessToken(value: string | string[] | undefined): string | null` (first value, trimmed, lowercased, then format check). Server side generator `generateAccessToken(): string` with `randomBytes(ACCESS_TOKEN_BYTES).toString("hex")` from `node:crypto` in a separate `lib/participant/token-server.ts` marked `import "server-only"`.
- [X] T006 [P] Add to `lib/email/links.ts`: `participantPath(token: string): string` returning `/meine-anmeldung/${encodeURIComponent(token)}` and `participantUrl(token: string): string | null` built from `appBaseUrl()`, with a doc comment like the existing helpers.
- [X] T007 [P] Create `tests/unit/participant-token.test.ts`: valid 64 hex accepted, uppercase normalized, 63 and 65 characters, non hex, empty, array input and undefined rejected; `participantPath` encodes the token into the expected path.

**Checkpoint**: column exists, types compile, token and link helpers tested.

---

## Phase 3: User Story 1 · Eigenen Stand jederzeit nachsehen (P1) 🎯 MVP

**Goal**: The page shows status, amounts, own answers and camp facts for a valid token.

**Independent Test**: Open the link of a registration with a partial payment; change the paid amount in the admin and reload: the new values show (spec US1).

- [X] T008 [P] [US1] Create `lib/participant/messages.ts` with all German page copy: page title "Meine Anmeldung", greeting `(firstName) => …`, status labels "aktiv" and "storniert", amount labels "Gesamtbetrag", "Bezahlt", "Offen", pay states (pay button "Jetzt bezahlen", "Alles bezahlt", "Zahlung wird geprüft", "Erstattet", "Keine Zahlung nötig", cancelled refund hint "Wenn du schon bezahlt hast, melde dich wegen einer Erstattung beim Team."), section headings "Deine Angaben", "Camp", "Packzettel", labels "Vorname", "Nachname", "Mail", "Geschlecht", gender values "weiblich" and "männlich", "Ja" and "Nein", "Zeitraum", "Ort", change hint "Etwas stimmt nicht? Melde dich beim Team, wir ändern es für dich.", neutral notice and throttle notice copy from contracts/page-actions-mail.md. No dashes.
- [X] T009 [US1] Create `lib/participant/view.ts` (pure, no server import): types `ParticipantView`, `ParticipantRow`, `PayState` exactly as in data-model.md; `buildParticipantView(input)` where input holds the registration row (reference, first_name, last_name, email, gender, form_data, status, payment_status, amount_due, amount_paid, deleted), camp (name, start_date, end_date, location) and form fields (key, label, field_type, sort_order). Rows: core fields first (skip empty), then question fields in `sort_order` skipping `step` and `CORE` keys (`first_name`, `last_name`, `email`, `gender`), skipping empty values and values without a current field; checkbox → "Ja"/"Nein", date → `formatGermanDate`, others `String(value).trim()`. `campDates` only when both dates exist. Amounts via `outstandingAmount`. `payState` mapping from `checkoutEligibility` as in data-model.md; `payHref` = `paymentPath(reference)` only for `pay`. Must not read or return price tier, pause flag, room or tent circle data.
- [X] T010 [P] [US1] Create `tests/unit/participant-view.test.ts`: row order and filtering (step rows, empty values, removed fields, core keys not duplicated), checkbox and date formatting, gender mapping, campDates null when one date missing, each payState mapping incl. overpayment (outstanding 0, `paid`) and total 0 (`free`), cancelled with partial payment keeps paid amount and has no `payHref`, and a check that the returned object has no keys beyond the data-model shape.
- [X] T011 [US1] Create `lib/participant/lookup.ts` (`import "server-only"`): `findParticipantByToken(token: string): Promise<ParticipantView | null>` using `getServiceClient()`: select registration by `access_token` (`maybeSingle`), return null when missing or `deleted`; load camp (`name, start_date, end_date, location`) and that camp's `camp_form_fields` (`key, label, field_type, sort_order`) unfiltered by join (AGENTS.md gotcha), then `buildParticipantView`.
- [X] T012 [P] [US1] Create `components/participant/participant-summary.tsx` (Server Component, presentational): status card with badge (success tone for active and paid, muted for active and open, danger for cancelled), amounts in tabular numbers, pay area per `payState` (button as link to `payHref` for `pay`), camp block, answers as a definition list that stacks under `sm`, change hint. Existing tokens and `Button` only; copy from `lib/participant/messages.ts`. Apply `impeccable` and `tasteskill` guidance for layout and hierarchy.
- [X] T013 [US1] Create `app/meine-anmeldung/[token]/page.tsx`: `metadata` with title "Meine Anmeldung · FCG Blankenheim Summercamp", `robots: { index: false, follow: false }`, `referrer: "no-referrer"`; await `params`, `normalizeAccessToken`, call `findParticipantByToken`, render inside `PaymentShell`: `ParticipantSummary` on a hit, `PaymentNotice` with the neutral copy otherwise. HTTP 200 in all cases, no `notFound()`.

**Checkpoint**: US1 works end to end with a token copied from the database.

---

## Phase 4: User Story 5 · Unbekannte oder ungültige Links (P1)

**Goal**: One neutral notice for every bad link, misses throttled per ip.

**Independent Test**: Open a malformed, an unknown and a renewed link: same notice. 21 misses in 10 minutes from one ip show the throttle notice (spec US5).

- [X] T014 [US5] Add to `lib/participant/lookup.ts`: `isParticipantThrottled(ip: string | null): Promise<boolean>` counting `submission_attempts` rows with `kind = 'participant'` and this `ip` since `PARTICIPANT_THROTTLE_WINDOW_MS` (head count, no insert); `recordParticipantMiss(ip: string | null): Promise<void>` inserting `{ ip, kind: "participant" }`. Reuse `requestIp` from `lib/payment/lookup.ts`.
- [X] T015 [US5] Wire the flow in `app/meine-anmeldung/[token]/page.tsx` exactly as contracts/page-actions-mail.md: malformed token → neutral notice without query and without recording; throttled → throttle notice (danger tone) and no lookup; lookup null → `recordParticipantMiss` then neutral notice. A hit records nothing.

**Checkpoint**: US1 and US5 together are a safe MVP.

---

## Phase 5: User Story 2 · Offenen Betrag direkt bezahlen (P1)

**Goal**: "Jetzt bezahlen" starts the existing flow; paid, processing, free and cancelled states show the right text.

**Independent Test**: Pay the outstanding amount with a Stripe test card from the page; after the webhook the page shows "Alles bezahlt" (spec US2).

- [X] T016 [US2] Verify in `components/participant/participant-summary.tsx` that the pay link targets `/bezahlen?ref=<reference>` from `payHref`, that no button renders for `paid`, `processing`, `refunded`, `free` and `cancelled`, and that each state shows its copy from `lib/participant/messages.ts`. Add any missing state rendering.

**Checkpoint**: pay flow reachable from the page; no changes to `app/bezahlen/*` or `app/api/checkout`.

---

## Phase 6: User Story 3 · Link aus Mails und vom Team bekommen (P1)

**Goal**: Every mail to a registration carries the link; admins copy it in the dialog.

**Independent Test**: `/admin/mail` shows the link in all nine previews; "Link kopieren" in the dialog yields a working link (spec US3).

- [X] T017 [P] [US3] Add mail copy to `lib/email/messages.ts`: `participant: { intro: "Deinen Anmeldestand, Zahlungen und Daten findest du jederzeit hier:", button: "Meine Anmeldung ansehen" }`.
- [X] T018 [US3] In `lib/email/templates.ts` add `participantUrl: string` to `EmailContext`; add a helper that renders the block (HTML paragraph plus `renderButton`, text sentence plus `${button}: ${url}`) and insert it before the closing in `confirmationEmail` and in `paymentMail` (payment link and reminders).
- [X] T019 [US3] In `lib/email/info-templates.ts` insert the same block before the closing in all four info mails, reusing the helper from T018 (export it from `templates.ts`).
- [X] T020 [US3] In `lib/email/send.ts` add `access_token` to `REGISTRATION_COLUMNS` and `RegistrationRow`, and in `buildMailTarget` set `participantUrl` from `participantUrl(registration.access_token)`; context stays null when either url is null. Update every other place that selects registration rows for `buildMailTarget` (`lib/email/reminders.ts`, `lib/email/info-run.ts`) so the column is selected.
- [X] T021 [US3] In `lib/email/preview.ts` add `SAMPLE_ACCESS_TOKEN = "0".repeat(64)` and set `participantUrl` in `sampleContext` to `participantUrl(SAMPLE_ACCESS_TOKEN) ?? participantPath(SAMPLE_ACCESS_TOKEN)`.
- [X] T022 [P] [US3] Update `tests/unit/email-templates.test.ts`, `tests/unit/email-info-templates.test.ts` and `tests/unit/email-preview.test.ts` (and any test fixture building an `EmailContext`): each of the nine templates contains the participant url in HTML and text.
- [X] T023 [P] [US3] In `lib/admin/data.ts` add `getAccessToken(reference: string): Promise<{ token: string } | null>` (service role, non deleted registration by reference).
- [X] T024 [P] [US3] Add to `lib/admin/messages.ts` under `de.participantLink`: title "Teilnehmerseite", hint "Private Seite, auf der die Person ihren Stand sieht. Nur an die angemeldete Person weitergeben.", "Link kopieren", "Link öffnen", "Link kopiert", "Kopieren fehlgeschlagen", "Anmeldung nicht gefunden", "Link wird geladen". No dashes.
- [X] T025 [US3] In `app/admin/actions.ts` add `getParticipantLinkAction(reference: string)` per contract: `runGuarded`, `referenceSchema`, `getAccessToken`, return `{ ok: true, url }` with `participantUrl(token) ?? participantPath(token)`; not found → `de.participantLink.notFound`. Add the result type to `lib/admin/types.ts`.
- [X] T026 [US3] Create `components/admin/participant-link-panel.tsx` (client) in the style of `payment-link-panel.tsx`: section with title and hint, "Link kopieren" fetches the url through the action on click and writes it to the clipboard, "Link öffnen" fetches and opens it in a new tab with `noopener,noreferrer`, inline feedback. The url is not kept in props or table data.
- [X] T027 [US3] Render `ParticipantLinkPanel` in `components/admin/registration-form-dialog.tsx` in edit mode for non deleted registrations (also cancelled ones), below the payment panel; pass the action through `components/admin/registrations-manager.tsx` like `onSendPaymentLink`.

**Checkpoint**: link reaches families by mail and by the team.

---

## Phase 7: User Story 6 · Link erneuern (P2)

**Goal**: Admins renew a leaked link; the old one stops working at once; renewal is logged.

**Independent Test**: Renew in the dialog; old link shows the neutral notice, new link works, `/admin/logs` lists it (spec US6).

- [X] T028 [US6] In `lib/admin/data.ts` add `renewAccessToken(reference: string): Promise<{ token: string; name: string } | null>`: update `access_token` to `generateAccessToken()` for the non deleted registration with that reference, return the new token and display name.
- [X] T029 [US6] Add to `de.participantLink` in `lib/admin/messages.ts`: "Link erneuern", confirm title "Link erneuern?", confirm body "Der bisherige Link funktioniert danach nicht mehr, auch nicht in älteren Mails. Neue Mails enthalten den neuen Link.", confirm button "Erneuern", "Neuer Link erstellt und kopiert", "Erneuern fehlgeschlagen".
- [X] T030 [US6] In `app/admin/actions.ts` add `renewParticipantLinkAction(reference: string)`: `runGuarded`, `referenceSchema`, `renewAccessToken`, `writeLog({ actor, action: "registration.access_renewed", message: \`${reference} ${name}\`.trim() })`, return the new url.
- [X] T031 [US6] In `components/admin/participant-link-panel.tsx` add "Link erneuern" with the existing confirm dialog pattern; on success copy the new url and show the feedback.

---

## Phase 8: User Story 4 · Packzettel griffbereit (P3)

**Goal**: The page links to the packing list.

**Independent Test**: Tap "Packzettel ansehen" on the page: `/packzettel` opens (spec US4).

- [X] T032 [US4] Add the packing list section with a link to `/packzettel` ("Packzettel ansehen", copy in `lib/participant/messages.ts`) to `components/participant/participant-summary.tsx`.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T033 (desktop and 375px checked with sample data on a temporary page, no horizontal scroll) Check the page at 360px and desktop in the browser preview (no horizontal scroll, readable amounts), in light and dark if the site supports both; fix spacing and hierarchy with `impeccable`.
- [X] T034 (checked against the live database for a registration with price tier, room and tent circle: no room, house or circle name in the HTML; the tier name "Standard" only appears inside Clerk's localization strings, not as page content) View the page source for a registration with a hidden price tier, a room and a tent circle: no tier name, room or circle string; meta contains `noindex` and `no-referrer`.
- [X] T035 Run `npm run lint`, `npm test` and `npm run build`; report the output verbatim.
- [ ] T036 (done: step 1 backfill 30 of 30 valid and unique, step 3 page with real data, step 8 neutral notice, step 9 throttle after 20 misses per ip, step 10 privacy and meta. Open, needs an admin login or a test payment: steps 2, 4, 5, 6, 7) Walk through `specs/017-participant-page/quickstart.md` and note any step that could not be run.

---

## Dependencies & Execution Order

- **Phase 1 (T001)** before any code.
- **Phase 2** blocks all stories. T002 → T003; T004 to T007 parallel after T003 (T007 needs T005 and T006).
- **US1 (Phase 3)** after Phase 2. T008, T010 (with T009), T012 parallel; T009 → T011 → T013.
- **US5 (Phase 4)** after T013.
- **US2 (Phase 5)** after T012.
- **US3 (Phase 6)** after Phase 2; independent of the page except for manual testing. T017 → T018 → T019; T020 and T021 after T018; T022 after T019 to T021; T023, T024 parallel → T025 → T026 → T027.
- **US6 (Phase 7)** after T026.
- **US4 (Phase 8)** after T012.
- **Polish** last.

## Parallel Examples

- Phase 2: T004, T005, T006 together.
- US1: T008, T012 and T010 (tests against the T009 contract) together.
- US3: T017, T023, T024 together; T022 alongside T025 to T027.

## Implementation Strategy

1. MVP: Phase 1, Phase 2, US1 and US5 (page safe and visible with a token from the database).
2. Add US2 (pay) and US3 (mails and admin copy): feature usable by families.
3. Add US6 (renew) and US4 (packing link).
4. Polish and checks.
