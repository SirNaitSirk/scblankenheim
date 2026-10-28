---

description: "Task list for Infomails an Angemeldete"
---

# Tasks: Infomails an Angemeldete

**Input**: Design documents from `specs/012-info-mails/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/http-and-actions.md, quickstart.md

**Tests**: plan.md asks for Vitest unit tests of the stage function, the info templates and the preview builder.

**Organization**: grouped by user story; every phase ends in a testable increment.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (scope and copy)

- [X] T001 Amend AGENTS.md section 4 (transactional email bullet for info mails), section 5 (`camp_mail_info`) and section 6 (cron route `cron/info-mails`) with the wording from plan.md „Scope amendment“
- [X] T002 [P] Add constants `DAILY_EMAIL_BUDGET = 100`, `CONFIRMATION_RESERVE = 15`, `INFO_TEASER_BEFORE_DAYS = 56`, `INFO_PACKING_BEFORE_DAYS = 21`, `INFO_ARRIVAL_BEFORE_DAYS = 5`, `INFO_THANKS_AFTER_DAYS = 5`, `INFO_THANKS_LAST_DAY = 30` to lib/email/limits.ts with short English comments
- [X] T003 [P] Add the admin copy block `de.campMailInfo` (page title „Infomails“, description, card titles „Vorfreude“, „Packliste“, „Anreise“, „Danke“, send day sentences such as „8 Wochen vor Campstart, am {Datum}“, switch label „Versand aktiv“, field labels, required marker, hints for missing camp dates, toasts, errors `arrivalMissing(fields)`, `invalidUrl`, `tooLong(max)`, `notFound`, `unauthorized`) and the camp card menu label „Infomails“ in lib/admin/messages.ts, German only and without dashes

---

## Phase 2: Foundational (blocking)

- [X] T004 Write supabase/migrations/0011_camp_mail_info.sql per data-model.md: table `camp_mail_info` (`camp_id uuid primary key references camps(id) on delete cascade`, nullable text columns `highlights`, `team_greeting`, `arrival_address`, `arrival_time`, `pickup_time`, `first_day`, `emergency_phone`, `phone_rules`, `photos_url`, `feedback_url`, `next_camp_note`, booleans `teaser_enabled`, `packing_enabled`, `arrival_enabled`, `thanks_enabled` `not null default false`, `updated_at timestamptz not null default now()`), RLS enabled, no policies, no CHECK constraints on the text values, header comment like 0008
- [X] T005 Update the hand written lib/database.types.ts for `camp_mail_info` (no local Supabase CLI; the migration still has to be applied to the hosted database)
- [X] T006 Create lib/admin/camp-mail-info.ts: type `CampMailInfo` (camelCase, text `string | null`, four `enabled` flags), `EMPTY_MAIL_INFO`, row mapping, `arrivalMissingFields(info)` returning the missing ones of `arrivalAddress`, `arrivalTime`, `emergencyPhone`, and Zod `campMailInfoSchema` (trim, empty to null, „500 characters, 2000 for `first_day` and `phone_rules`“, `photosUrl` and `feedbackUrl` must start with `https://`, `arrivalEnabled` true requires the three arrival fields with one German field error each)
- [X] T007 Add server only reads and writes to lib/admin/camp-mail-info.ts or a sibling lib/admin/camp-mail-info-data.ts: `getCampMailInfo(campId)` (missing row yields `EMPTY_MAIL_INFO`), `getCampMailInfos(campIds)`, `upsertCampMailInfo(campId, info)` with the service role client
- [X] T008 Create lib/email/info-mails.ts: `InfoMailKind = "info_teaser" | "info_packing" | "info_arrival" | "info_thanks"`, `INFO_KINDS`, `infoDueDate(kind, startDate, endDate)`, `infoWindow(kind, startDate, endDate)` per the stage windows table in data-model.md, and pure `nextInfoMail(input: InfoMailInput, today)` implementing research R3 (deleted or cancelled, no address, disabled, already sent, registration day, info mail already today, reminder today, arrival not ready, missing camp date all return null; only the one open window counts)
- [X] T009 [P] Add tests/unit/email-info-mails.test.ts: each window opens and closes on the right Berlin day, a late registration skips overtaken stages (7 weeks before gets teaser, 2 weeks before gets only arrival), registration day returns null, a reminder day returns null, disabled kind returns null, arrival without required fields returns null, missing start or end date returns null, already sent kind returns null
- [X] T010 Extend lib/email/deliveries.ts: add the four kinds to `EmailKind`, `isInfoKind`, `infoHistory(registrationIds)` (sent info kinds plus last info send date per registration, chunked like `reminderHistory`) and `countDeliveriesSince(isoStart)` counting `sending` and `sent` rows of any kind
- [X] T011 [P] Add `packingUrl()` built from `APP_URL` to lib/email/links.ts, returning null without `APP_URL` like `paymentUrl`
- [X] T012 Create lib/email/info-run.ts (server only): `runInfoMails(today)` that fails stale deliveries, computes `budget = max(0, DAILY_EMAIL_BUDGET − CONFIRMATION_RESERVE − countDeliveriesSince(Berlin midnight))`, loads the current camp plus camps with `end_date` between today − 30 and today − 5 (research R7), loads their registrations oldest first with `REGISTRATION_COLUMNS`, the camp mail infos, reminder and info history, asks `nextReminder` (reminder due today) and `nextInfoMail` per registration, sends through `deliver` with `trigger: "cron"` and `SEND_SPACING_MS`, stops at the budget with `capped: true`, logs `info_mails.run` with counts, returns `{ sent, failed, skipped, budget, capped }`; render functions come from a kind to template map filled in the story phases
- [X] T013 Create app/api/cron/info-mails/route.ts per contracts/http-and-actions.md (`runtime = "nodejs"`, `maxDuration = 60`, `isAuthorizedCronRequest`, `401` without secret, `500` with log `info_mails.failed`) and add `{ "path": "/api/cron/info-mails", "schedule": "30 6 * * *" }` to vercel.json
- [X] T014 Create app/admin/camps/[campId]/infomails/actions.ts with `saveCampMailInfoAction(campId, values)` per the contract (`requirePermission("camps")`, camp exists check, Zod, `upsertCampMailInfo`, log `camp_mail_info.saved`, `revalidatePath` for the subpage and `/admin/mail`, existing `ActionResult` shape)
- [X] T015 Create app/admin/camps/[campId]/infomails/page.tsx (guard like the `felder` page, loads camp and mail info) and components/admin/camp-mail-info-form.tsx (client, react hook form with the Zod schema): four cards in timeline order with name, send day sentence from `infoDueDate`, switch „Versand aktiv“, save button, hint when camp dates are missing; field groups are added per story
- [X] T016 Add the menu entry „Infomails“ next to „Felder“ in components/admin/camps-board.tsx linking to `/admin/camps/${camp.id}/infomails`

**Checkpoint**: switches can be saved, the cron route answers with counts and sends nothing yet because no template is registered.

---

## Phase 3: User Story 1 · Packliste rechtzeitig vor dem Camp (P1) 🎯 MVP

**Goal**: three weeks before start every active registration gets the packing mail once.

**Independent Test**: quickstart scenario 1.

- [X] T017 [US1] Add the `info` section to lib/email/messages.ts with the shared copy (labels, closings) and the `packing` copy: subject „Deine Packliste für das {Camp}“, preheader, title, intro, list heading, button „Zur Packliste“, note on medication and food needs („Antworte einfach auf diese Mail“), German without dashes
- [X] T018 [US1] Create lib/email/info-templates.ts with type `InfoMailContext` (per data-model.md), an HTML escaping helper for admin text that keeps line breaks, and `packingInfoEmail(ctx)` listing `featuredPackingItems()` from lib/marketing/packing-list.ts with a button to `packingUrl`, HTML and text version
- [X] T019 [US1] Register `info_packing` in the template map of lib/email/info-run.ts and build `InfoMailContext` from `buildMailTarget` plus camp mail info
- [X] T020 [P] [US1] Create tests/unit/email-info-templates.test.ts with packing cases: featured items present, button link, text version without HTML, no tier names or invitation links

**Checkpoint**: quickstart scenario 1 passes.

---

## Phase 4: User Story 2 · Letzte Infos zur Anreise (P1)

**Goal**: five days before start everyone gets address, times and emergency phone; unpaid ones get a friendly payment note.

**Independent Test**: quickstart scenarios 2 and 3.

- [X] T021 [US2] Add the `arrival` copy to lib/email/messages.ts: subject „Bald geht es los: alles zur Anreise“, labels Adresse, Ankunft, Abholung, Ablauf am ersten Tag, Notfallnummer, Handy, packing link sentence, payment note with amount and button „Jetzt bezahlen“
- [X] T022 [US2] Add `arrivalInfoEmail(ctx)` to lib/email/info-templates.ts: required facts, optional sections only when filled (FR-016), packing link always (FR-011), payment block only when `outstanding > 0` (FR-010)
- [X] T023 [US2] Register `info_arrival` in lib/email/info-run.ts and pass `arrivalReady` from `arrivalMissingFields` into `nextInfoMail`
- [X] T024 [US2] Add the arrival field group to components/admin/camp-mail-info-form.tsx (address textarea, arrival and pickup time, first day and phone rules textareas, emergency phone) with required markers and the `arrivalMissing` field errors shown when the switch is on
- [X] T025 [P] [US2] Extend tests/unit/email-info-templates.test.ts: payment block only with outstanding amount, missing optional fields leave no empty heading, packing link present, admin text is escaped

**Checkpoint**: quickstart scenarios 2 and 3 pass.

---

## Phase 5: User Story 3 · Vorfreude acht Wochen vorher (P2)

**Goal**: teaser with motto, highlights and greeting.

**Independent Test**: quickstart scenario 4.

- [X] T026 [US3] Add the `teaser` copy to lib/email/messages.ts: subject „Noch 8 Wochen bis zum {Camp}“, motto line, highlights heading, team greeting heading; no invite friends section
- [X] T027 [US3] Add `teaserInfoEmail(ctx)` to lib/email/info-templates.ts: motto from `camps.tagline`, highlights split by line into a list, greeting, each section only when filled
- [X] T028 [US3] Register `info_teaser` in lib/email/info-run.ts
- [X] T029 [US3] Add the teaser field group (highlights textarea with „ein Highlight pro Zeile“, team greeting textarea) to components/admin/camp-mail-info-form.tsx
- [X] T030 [P] [US3] Extend tests/unit/email-info-templates.test.ts: highlights list, missing motto or greeting, no invite friends text and no link to the landing page

---

## Phase 6: User Story 4 · Danke und Rückblick (P2)

**Goal**: thank you mail five days after the end, also for the just ended camp after the current camp switched.

**Independent Test**: quickstart scenario 5.

- [X] T031 [US4] Add the `thanks` copy to lib/email/messages.ts: subject „Danke für das {Camp}“, thanks paragraph, buttons „Fotos ansehen“ and „Feedback geben“, next camp sentence
- [X] T032 [US4] Add `thanksInfoEmail(ctx)` to lib/email/info-templates.ts with optional photos, feedback and next camp sections
- [X] T033 [US4] Register `info_thanks` in lib/email/info-run.ts and verify the extra camps from research R7 are processed
- [X] T034 [US4] Add the thanks field group (photos link, feedback link, next camp note) with the `https://` error to components/admin/camp-mail-info-form.tsx
- [X] T035 [P] [US4] Extend tests/unit/email-info-templates.test.ts and tests/unit/email-info-mails.test.ts: optional thanks sections, thanks window closes at end + 30

---

## Phase 7: User Story 5 · Inhalte pflegen und Vorschau ansehen (P2)

**Goal**: the mail tab shows the four info mails with real camp content, state, hints and counts.

**Independent Test**: quickstart scenario 8.

- [X] T036 [US5] Extend lib/email/preview.ts: preview ids `info_teaser`, `info_packing`, `info_arrival`, `info_thanks`, `sampleInfoContext(camp, mailInfo)` with the sample person, outstanding amount for the arrival preview
- [X] T037 [US5] Add `infoMailCounts(campId)` to lib/email/info-run.ts (or a small server only helper next to it): per kind erhalten, noch nicht erhalten (active with address, not sent), ohne Mailadresse, ids filtered in JS
- [X] T038 [US5] Extend `de.mail` in lib/admin/messages.ts: template names, trigger sentences from the limits constants, group label „Infomails“, status „Aktiv“ and „Aus“, count labels, missing field hints
- [X] T039 [US5] Update app/admin/mail/page.tsx and components/admin/mail-preview.tsx: group „Infomails“ in the list, status line, three count chips and missing field hints above the preview, link to the camp subpage; layout otherwise unchanged and read only
- [X] T040 [P] [US5] Extend tests/unit/email-preview.test.ts: four info previews render with sample data, arrival preview contains the payment block, empty mail info yields no empty sections

---

## Phase 8: Polish and cross cutting

- [X] T041 [P] Add a `camp_mail_info` row for the seed camp with sample texts and all switches off to supabase/seed.sql (fictional data only)
- [X] T042 Design pass on components/admin/camp-mail-info-form.tsx and the mail tab additions with the `impeccable` and `tasteskill` skills: spacing, phone layout, sticky save bar on phone, loading and error states
- [X] T043 Scan all new copy and comments for dash punctuation and hyphenated words (constitution writing rules)
- [X] T044 Run `npm run lint`, `npm test` and `npm run build` and report the output verbatim
- [ ] T045 Walk through quickstart.md scenarios 1 to 8 locally and note results
  - 2026-10-28: scenario 2 (arrival gate, field errors, save), 7 (route answers 401 without secret) and 8 (mail tab with state, counts, hints, desktop and phone) checked in the browser. Scenarios 1, 3 to 6 need a real cron run with `CRON_SECRET` and the mail provider; not run yet. Fixes found on the way: camp card buttons wrap, switch label on one line, validation toast, line breaks in fact values, mail tab grid on phones.

---

## Dependencies and execution order

- Phase 1 has no dependencies; T002 and T003 run in parallel with T001.
- Phase 2 depends on Phase 1. T005 needs T004; T006 and T007 need T005; T008 needs T002; T009 needs T008; T012 needs T007, T008, T010, T011; T013 needs T012; T014 needs T006 and T007; T015 needs T014; T016 is independent of T012 to T015.
- User stories depend on Phase 2. US1 and US2 share the template file and messages module, so run them one after the other (US1 first). US3 and US4 follow the same files and also run in sequence. US5 needs the templates of the stories it previews; it can start after US1 and add previews as the other stories land.
- Phase 8 runs last.

## Parallel examples

- Phase 2: T009 (tests) alongside T010 and T011 once T008 exists.
- US1: T020 alongside T019 once T018 exists.
- US2: T025 alongside T024 once T022 exists.
- US5: T040 alongside T039 once T036 exists.

## Implementation strategy

1. MVP: Phases 1 and 2 plus US1. The team can already switch on the packing mail for this year.
2. Add US2 (arrival), the most important mail before the camp.
3. Add US3 and US4, then US5 for preview and counts.
4. Polish, checks, quickstart walk through, then ask for review before committing.
