---

description: "Task list for feature 021 bus ticket"
---

# Tasks: Busticket

**Input**: Design documents from `specs/021-bus-ticket/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/bus-ticket.md, quickstart.md

**Tests**: Unit tests for the pure rules and mail templates, as listed in plan.md (Testing). No
end to end tests.

**Organization**: Tasks are grouped by user story so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: User story from spec.md (US1 to US5)
- All user facing copy is German, without dash punctuation; code is English only.

---

## Phase 1: Setup

- [X] T001 Amend `AGENTS.md` section 4 (bus ticket) and section 5 (`camp_bus_settings`, `bus_tickets`, `bus_boardings`) without dash punctuation (done during planning).
- [X] T002 Commit the open work of `020-school-release` first (ask the user), then create branch `021-bus-ticket` from it and install the dependencies with `npm install qrcode jsqr` and `npm install -D @types/qrcode` (exact versions pinned in `package.json` like `pdf-lib`).

---

## Phase 2: Foundational (blocks every story)

- [X] T003 Create `supabase/migrations/0016_bus_ticket.sql` with a header comment referencing specs/021: table `public.camp_bus_settings` (`camp_id uuid primary key references public.camps(id) on delete cascade`, `enabled boolean not null default false`, `field_key text`, `answers text[] not null default '{}'`, `updated_by text not null`, `updated_at timestamptz not null default now()`); table `public.bus_tickets` (`id uuid primary key default gen_random_uuid()`, `code text not null unique`, `registration_id uuid not null references public.registrations(id) on delete cascade`, `camp_id uuid not null references public.camps(id) on delete cascade`, `created_at timestamptz not null default now()`, `created_by text`, `revoked_at timestamptz`, `revoked_by text`), unique partial index `bus_tickets_active_idx on (registration_id) where revoked_at is null`, index `bus_tickets_camp_idx on (camp_id)`; table `public.bus_boardings` (`registration_id uuid references public.registrations(id) on delete cascade`, `trip text`, `camp_id uuid not null references public.camps(id) on delete cascade`, `boarded_at timestamptz not null default now()`, `boarded_by text not null`, `method text not null`, `primary key (registration_id, trip)`), index `bus_boardings_camp_trip_idx on (camp_id, trip)`; `enable row level security` on all three, no policies; drop and recreate `email_deliveries_once_idx` unique on `(registration_id, kind) where kind not in ('payment_link', 'team_message', 'school_release', 'participant_link', 'bus_ticket') and status in ('sending', 'sent')`. No CHECK constraints.
- [X] T004 Update `lib/database.types.ts` with the three tables (Row, Insert, Update); regenerate if a database is reachable, otherwise by hand and note it in this task. Done by hand: no local database or Supabase CLI in this session.
- [X] T005 [P] Create `lib/bus/limits.ts`: `TICKET_CODE_BYTES = 16`, `TICKET_CODE_PATTERN = /^[A-Za-z0-9_-]{22}$/`, `TRIPS = ["outbound", "return"] as const`, `TRIP_PARAM = { outbound: "hin", return: "rueck" }`, `LIST_POLL_MS = 4000`, `RESULT_DISPLAY_MS = 3000`, `DECODE_INTERVAL_MS = 200`, `TRIP_STORAGE_KEY = "bus.trip"`, `TICKET_ANCHOR = "busticket"`, `SCAN_PATH = "/admin/bus"`.
- [X] T006 [P] Create `lib/bus/types.ts` with `Trip`, `BoardingMethod = "scan" | "manual"`, `BusSettings`, `ScanOutcome`, `BoardingListEntry` exactly as in data-model.md, plus `BoardingListState` (`ready` with `total`, `boarded`, `entries`; or `disabled`, `mapping_broken`, `no_camp`) and `AdminBusTicket` (`isBusPerson`, `state: "active" | "blocked" | "none"`, `issuedAt`, `boardings: Record<Trip, { at: string; method: BoardingMethod } | null>`).
- [X] T007 [P] Create `lib/bus/messages.ts` with German copy: trip labels „Hinfahrt“ and „Rückfahrt“, count „{x} von {y} eingestiegen“, outcomes („Eingestiegen“, „Kein Busticket“, „Storniert“, „Schon eingestiegen um {Uhrzeit}“, „Ticket ungültig“, „Ticket für ein anderes Camp“, „Busticket ist für dieses Camp ausgeschaltet“, „Unbekannter Code“, „Zahlung offen“, „Keine Verbindung, bitte erneut versuchen“), camera states (Erlaubnis, verweigert mit Hilfe, nicht vorhanden), list headings „Fehlen noch“ and „Eingestiegen“, „von Hand“, buttons, undo confirmation, empty states, participant card (title „Busticket“, hint to show the code at boarding and turn brightness up, blocked hint „Bitte melde dich beim Team“). No dashes.
- [X] T008 Create `lib/bus/code.ts` (pure): `isTicketCode(value)`, `scanUrl(baseUrl, code)` = `<base>/admin/bus?t=<code>`, `parseTicketCode(text)` accepting the scan URL (any host, path `SCAN_PATH`, param `t`) or a bare code, else null. Create `lib/bus/code-server.ts` (`server-only`): `generateTicketCode()` = `randomBytes(TICKET_CODE_BYTES).toString("base64url")` and `codeVersion(code)` = first 8 hex chars of `createHash("sha256")` for the image query.
- [X] T009 Create `lib/bus/rules.ts` (pure): `answerValueOf(formData, fieldKey)` (string trimmed, boolean to `"true"` / `"false"`, else null); `mappingProblem(settings, fields)` returning `"no_field" | "field_missing" | "wrong_type" | "no_answers" | "answers_missing" | null` (only `select` and `checkbox` allowed; checkbox valid answers are `"true"` and `"false"`, select answers must be in the field options); `isBusActive(settings, fields)` = enabled and no problem; `isBusRegistration({ status, deleted, formData }, settings, fields)`; `decideScan(input)` implementing the order of research R7 and returning `ScanOutcome` or `{ kind: "board" }` for the caller to insert; `buildBoardingList(registrations, boardings)` (missing first, then boarded, each sorted by last then first name in German collation, `total` and `boarded` counts).
- [X] T010 Create `lib/bus/schema.ts` (pure): Zod `tripSchema` (`outbound` | `return`), `scanInputSchema` (`code` matching `TICKET_CODE_PATTERN`, `trip`), `boardingInputSchema` (`registrationId` uuid, `trip`), `busSettingsInputSchema` (`campId` uuid, `enabled` boolean, `fieldKey` string max 64 or null, `answers` array of strings max 200 each, at most 20), German messages from T007.
- [X] T011 Create `lib/bus/qr.ts` (`server-only`): `qrSvg(text)` (error correction M, margin 4, black on white, `viewBox` only, no fixed size) and `qrPng(text, size = 480)` returning `Buffer`, both via `qrcode`.
- [X] T012 Create `lib/bus/data.ts` (`server-only`, service role client): `getBusSettings(campId)` (missing row = off, null field, empty answers), `saveBusSettings(campId, input, actor)`, `busContext(campId)` (settings plus question fields of the camp), `ensureTicket(registrationId, campId)` (insert with `generateTicketCode`, conflict on the active index then read), `activeTicket(registrationId)`, `findTicketByCode(code)` (including revoked), `revokeActiveTicket(registrationId, actor)`, `reissueTicket(registrationId, campId, actor)` (revoke then insert, keep boardings), `insertBoarding({ registrationId, campId, trip, actor, method })` returning the inserted row or the existing one with `alreadyBoarded: true` (`upsert` with `ignoreDuplicates`, then select), `deleteBoarding(registrationId, trip)`, `boardingsFor(campId, trip)`, `busRegistrations(campId)` (active, not deleted registrations of the camp filtered with `isBusRegistration`, fields `id`, `first_name`, `last_name`, `reference`, `amount_due`, `amount_paid`, `payment_status`, `status`, `deleted`, `form_data`).
- [X] T013 [P] Create `tests/unit/bus-code.test.ts` (code pattern, `scanUrl` and `parseTicketCode` with URL, bare code, foreign URL, garbage) and `tests/unit/bus-rules.test.ts` (`answerValueOf` for string, boolean, missing; every `mappingProblem` case; `isBusRegistration` for select and checkbox, cancelled, deleted; `decideScan` for each outcome in the R7 order including `paymentOpen`; `buildBoardingList` sorting and counts) and `tests/unit/bus-schema.test.ts`.
- [X] T014 Add permission and tab: `PERMISSION_LABELS.bus = "Bus"` and `de.nav.bus = "Bus"` in `lib/admin/messages.ts`, nav item `{ label: de.nav.bus, href: "/admin/bus" }` in `components/admin/nav-items.ts` (after Zeltkreise), icon in the client sidebar (Phosphor `Bus`).
- [X] T015 In `lib/admin/data.ts` soft delete of a registration also deletes its `bus_tickets` and `bus_boardings` rows (like `school_releases`).

**Checkpoint**: `npm test` passes for the new unit tests; migration applied.

---

## Phase 3: User Story 1 · Bus pro Camp einrichten (P1)

**Goal**: Admins with `camps` map the bus question and answers per camp.

**Independent Test**: quickstart scenario 1 and 10.

- [X] T016 [US1] Add admin copy under `bus.settings` in `lib/admin/messages.ts`: card title „Busticket“, switch, „Frage aus dem Formular“, „Antworten, die Bus bedeuten“, „Ja“ and „Nein“ for checkbox questions, counts („{n} Buspersonen“, „{n} ohne Antwort“), problem texts per `mappingProblem` value, saved, errors. No dashes.
- [X] T017 [US1] Add `saveBusSettingsAction` to `app/admin/camps/[campId]/felder/actions.ts` per contract: `requirePermission("camps")`, `busSettingsInputSchema`, load fields, reject enabling when `mappingProblem` is not null, `saveBusSettings`, return counts from `busRegistrations` plus count of active registrations whose `answerValueOf` is null, `writeLog` action `bus.settings_saved`, `revalidatePath`.
- [X] T018 [US1] Create `components/admin/bus-settings-card.tsx` (client) and render it in `app/admin/camps/[campId]/felder/page.tsx` below the field list (load settings, select and checkbox fields in form order, counts, current problem): switch, select of the question (only select and checkbox), answer checkboxes from the field options (for checkbox questions „Ja“ / „Nein“), inline counts and warning when the mapping is broken, save button with loading, saved and error states. Apply `impeccable` and `tasteskill`.

---

## Phase 4: User Story 2 · Einstieg scannen (P1) 🎯 MVP

**Goal**: Team members with `bus` scan codes per trip and get a clear green or red result.

**Independent Test**: quickstart scenarios 4, 5, 6 and 9. Until US4 is done, read a code from
`bus_tickets` in the database and show it as QR with any generator on a second screen.

- [X] T019 [US2] Create `app/admin/bus/actions.ts` with `scanBusTicket` per contract: `requirePermission("bus")`, `scanInputSchema`, current camp, `findTicketByCode`, `busContext`, registration row, `decideScan`; on `board` call `insertBoarding(method "scan")` and return `boarded` (with `paymentOpen` from `outstandingAmount`) or `already` with the stored time. Return only fields listed in FR-019.
- [X] T020 [US2] Create `app/admin/bus/page.tsx` (Server Component): `guardTab("/admin/bus")`, profile must have `bus` (else read only hint), current camp and `isBusActive` state, initial `?t=` and `?fahrt=` params; renders the client shell with camp name and state; empty states for no camp, off, broken mapping (link to settings when the user has `camps`).
- [X] T021 [US2] Create `components/admin/bus-scanner.tsx` (client): trip segmented control (persist in `localStorage` under `TRIP_STORAGE_KEY` in try/catch and in `?fahrt=`), camera via `getUserMedia({ video: { facingMode: "environment" } })`, `BarcodeDetector` when it supports `qr_code`, else dynamic `import("jsqr")` on a canvas every `DECODE_INTERVAL_MS`; `parseTicketCode` on each hit; pause while a request runs and while the result shows; call `scanBusTicket`; full width result overlay (green with check icon, name, reference, amber „Zahlung offen“ pill; red with cross icon and reason; grey „Keine Verbindung“ on thrown errors) closing after `RESULT_DISPLAY_MS` or on tap; vibration on result where supported; process an initial `?t=` code once a trip is chosen, then remove `t` from the URL; stop the camera on unmount and when hidden; camera denied and missing states with link to the list. Mobile first, touch targets at least 48 px. Apply `impeccable` and `tasteskill`.

---

## Phase 5: User Story 3 · Liste: wer fehlt noch (P1)

**Goal**: Live list per trip with manual boarding and undo.

**Independent Test**: quickstart scenario 8.

- [X] T022 [US3] Add `loadBoardingList`, `markBoardedManually` and `undoBoarding` to `app/admin/bus/actions.ts` per contract: all `requirePermission("bus")` and Zod; `loadBoardingList` returns `buildBoardingList(busRegistrations, boardingsFor)` or the non ready state; `markBoardedManually` uses the same checks as a scan for the registration (`isBusRegistration`, current camp) with `method "manual"`; `undoBoarding` deletes the row; both write `writeLog` (`bus.boarding_manual`, `bus.boarding_undone` with reference and trip).
- [X] T023 [US3] Create `components/admin/bus-boarding-list.tsx` (client) and render it through the client shell `components/admin/bus-station.tsx` (trip choice, count, polling) in `app/admin/bus/page.tsx` next to the scanner (below on narrow screens, tabs „Scannen“ / „Liste“): sticky count, search by name or reference, „Fehlen noch“ rows with button „Eingestiegen“, „Eingestiegen“ rows with time and „von Hand“ badge and undo through a confirm dialog; poll every `LIST_POLL_MS` while `document.visibilityState === "visible"`, refresh right after own scans and changes (shared callback from the scanner); loading, empty and error states.

**Checkpoint**: US1 to US3 give a working boarding check for the team.

---

## Phase 6: User Story 4 · Ticket auf der Teilnehmerseite und per Mail (P2)

**Goal**: Bus persons see their QR on the participant page and get it by mail.

**Independent Test**: quickstart scenarios 2 and 3.

- [X] T024 [P] [US4] Extend `lib/participant/view.ts` and `lib/participant/lookup.ts` with `busTicket: { svg: string; blocked: false } | { blocked: true } | null` (null when not a bus person, cancelled or the camp has it off; `ensureTicket` then `qrSvg(scanUrl(appBaseUrl(), code))`); update the 017 privacy test key list in `tests/unit/participant-view.test.ts`.
- [X] T025 [US4] Create `components/participant/bus-ticket-card.tsx` and render it in `components/participant/participant-summary.tsx` with `id="busticket"` before the packing list link: QR on white with quiet zone, at least 240 px wide, name and camp, hint lines; blocked variant with the team hint. Apply `impeccable` and `tasteskill`.
- [X] T026 [US4] Create `app/meine-anmeldung/[token]/busticket/route.ts`: GET, normalize token, participant miss throttle, registration active and not deleted, bus person, active ticket (`ensureTicket`), `qrPng(scanUrl(...))`; 200 `image/png` with `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`, otherwise the same 404 body as the release route.
- [X] T027 [US4] Mail context: add `busTicket?: { imageUrl: string; pageUrl: string } | null` to `EmailContext` in `lib/email/templates.ts`, `busTicketBlock(ctx)` (heading „Dein Busticket“, image with alt text, hint, link to `<participantUrl>#busticket`), and `busTicketEmail(ctx)`; copy in `lib/email/messages.ts`; `buildMailTarget` in `lib/email/send.ts` takes bus info (`isBusPerson`, `code`) and sets `imageUrl` = `<participantUrl>/busticket?v=<codeVersion>`; add the block to `arrivalInfoEmail` in `lib/email/info-templates.ts` after the arrival facts.
- [X] T028 [US4] In `lib/email/info-run.ts` load bus settings and fields once per camp and, for bus persons receiving the arrival mail, `ensureTicket` before rendering; add kind `bus_ticket` to `EmailKind` in `lib/email/deliveries.ts`; add `sendBusTicket(registrationId, actor)` to `lib/email/send.ts` (quota check like `sendSchoolRelease`, `claimRepeatableDelivery`, outcome).
- [X] T029 [US4] Add the bus ticket mail and an arrival mail variant with ticket to `lib/email/preview.ts` (sample image: a static sample QR rendered by `qrPng` as data URL is fine for the preview only); extend `tests/unit/email-templates.test.ts`, `tests/unit/email-info-templates.test.ts` (with and without ticket) and `tests/unit/email-preview.test.ts`.

---

## Phase 7: User Story 5 · Ticket ungültig machen und neu ausstellen (P2)

**Goal**: Admins see ticket state and boardings, reissue, block and send the ticket.

**Independent Test**: quickstart scenario 7.

- [X] T030 [US5] Add `loadBusTicket`, `reissueBusTicket`, `blockBusTicket` and `sendBusTicket` (action) to `app/admin/actions.ts` per contract, all `requirePermission("registrations")` keyed by reference; reissue and block write `writeLog` (`bus.ticket_reissued`, `bus.ticket_blocked`); send returns German errors for no email, not a bus person, blocked, quota and provider failure.
- [X] T031 [US5] Add panel copy under `bus.panel` in `lib/admin/messages.ts` and create `components/admin/bus-ticket-panel.tsx` (client, like `school-release-panel.tsx`): state badge (aktiv, gesperrt, noch nicht ausgestellt), boardings per trip with time and method, buttons „Busticket senden“, „Neues Ticket ausstellen“ and „Ticket sperren“ with confirm dialogs; shown only for bus persons or when a ticket exists. Wire it in `components/admin/registration-form-dialog.tsx` and `components/admin/registrations-manager.tsx` like the release panel.

---

## Phase 8: Polish and cross cutting

- [X] T032 Check every new German string for dash punctuation and English leaks (`lib/bus/messages.ts`, `lib/admin/messages.ts`, `lib/email/messages.ts`).
- [X] T033 Run `npm run lint`, `npm test`, `npm run build` and record the exact output.
- [ ] T034 Walk through `specs/021-bus-ticket/quickstart.md` on a Vercel preview with an iPhone and an Android phone; note results in this file. Open: needs a Vercel preview and the migration applied.

---

## Dependencies and Execution Order

- Phase 1 → Phase 2 → stories. T003 before T004 before T012; T005 to T007 parallel; T008 to T011 depend on T005 to T007; T012 depends on T004, T008, T009, T011.
- US1 (Phase 3) depends only on Phase 2.
- US2 (Phase 4) depends on Phase 2; settings from US1 are needed to get a valid result, so build US1 first.
- US3 (Phase 5) depends on US2 (shared page and actions file).
- US4 (Phase 6) depends on Phase 2 and US1; independent of US2 and US3.
- US5 (Phase 7) depends on Phase 2; T030 `sendBusTicket` depends on T028.
- Polish last.

## Parallel Opportunities

- Phase 2: T005, T006, T007 together; T013 alongside T012 once T008 to T010 exist.
- After US1: US2 plus US3 (one person) and US4 (another person) in parallel; they touch different files except `lib/admin/messages.ts` (merge carefully).
- Within US4: T024 and T027 in parallel.

## Implementation Strategy

1. MVP: Phase 1, Phase 2, US1, US2, US3. The team can scan and see who is missing; codes for the
   test come from the database.
2. Then US4 so participants actually have their code (needed before the first real trip).
3. Then US5 for support cases.
4. Polish and the phone walkthrough before the camp.
