---

description: "Task list for 042-church-release-letter"
---

# Tasks: Schulbefreiung im Gemeindebriefkopf

**Input**: Design documents from `specs/042-church-release-letter/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/letter-layout.md, quickstart.md

**Tests**: Unit tests are part of the project's quality gate (plan "Testing"), so they are included.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 Extract image `Im0` (1075 × 203, indexed colour with soft mask) from `specs/042-church-release-letter/template-2026.pdf` into `lib/school-release/assets/church-logo.png` with transparency, using a one off script in the scratchpad (not committed); check visually that cross, wordmark and green line are complete (research R2)
- [x] T002 [P] Extract image `Im1` (531 × 420 JPEG, stamp with signature) from the template into the scratchpad for the admin to upload later; do not commit it (research R3)

## Phase 2: Foundational (blocks all stories)

- [x] T003 Write `supabase/migrations/0020_church_release_letter.sql`: add `school_releases.school_location text`; backfill as "last line of `school_address` with a leading five digit postal code removed and trimmed; when that leaves nothing, the full last line"; set `not null`; drop `teacher_name`, `school_address`, `participant_address`, `class_name`; drop `camp_mail_info.release_signer_name`, `release_signer_role`, `release_address_keys`; no CHECK constraints; header comment referencing specs/042-church-release-letter (research R7, data-model.md)
- [ ] T004 Apply the migration to the Supabase project (types in `lib/database.types.ts` are hand written and already updated); apply together with the deploy, because the live code still reads the dropped columns
- [x] T005 [P] Update `lib/school-release/limits.ts`: add `SCHOOL_LOCATION_MAX = 80`; remove `TEACHER_NAME_MAX`, `ADDRESS_MAX`, `ADDRESS_LINES_MAX`, `CLASS_NAME_MAX`, `SIGNER_MAX`, `ADDRESS_KEYS_MAX` once no longer referenced
- [x] T006 Update `lib/school-release/types.ts`: `SchoolReleaseData = { schoolName: string; schoolLocation: string }`; `ReleaseSettings = { enabled; dates; signaturePath }`; `ReleaseLetterInput` per data-model.md (`data`, `participantName`, `gender: "female" | "male" | null`, `campStart`, `campEnd`, `campLocation`, `today`); `AdminSchoolRelease` without `prefillAddress`
- [x] T007 Update `lib/school-release/schema.ts`: `schoolReleaseInputSchema` with `schoolName` "one line, required, max `SCHOOL_NAME_MAX`" and `schoolLocation` "one line, required, max `SCHOOL_LOCATION_MAX` (80)"; `releaseSettingsInputSchema` without `signerName`, `signerRole`, `addressKeys`; drop `normalizeMultiline` if unused
- [x] T008 Update `lib/school-release/settings.ts`: `toReleaseSettings` reads only enabled, dates, signature path; `missingForEnable(settings, camp)` also returns `campPeriod` when camp start or end date is missing (research R5); remove `prefillAddress`, `addressFieldOptions`, `CORE_KEYS`, `ADDRESS_FIELD_TYPES`; keep date helpers for website hints
- [x] T009 Create `lib/school-release/letterhead.ts` with the church data of contracts/letter-layout.md (sender line, phone "+49(0)2449 7945", four footer columns), reusing `lib/legal/operator.ts` values where identical; no dashes in text (office hours "Mo. bis Fr. 9.00 Uhr bis 13.00 Uhr", "VR Bank Nordeifel eG") (research R4)
- [x] T010 Update `lib/school-release/data.ts`: select and upsert `school_name, school_location`; `sameData` on two fields; settings columns without signer and address keys; drop `senderLines` and the contact columns from the select; load `camps.location` and `registrations.gender` for rendering; pass the camp facts to `missingForEnable` wherever the switch is evaluated

**Checkpoint**: types compile against the new schema.

## Phase 3: User Story 1 · Bescheinigung mit zwei Angaben erstellen (P1) 🎯 MVP

**Goal**: Participant enters school name and location only and gets PDF plus mail.

**Independent Test**: quickstart step 3.

- [x] T011 [P] [US1] Update participant copy in `lib/school-release/messages.ts` `card`: fields `schoolName` "Name der Schule", `schoolLocation` "Ort der Schule" with hint "Zum Beispiel Nettersheim"; `steps` "Trag Name und Ort deiner Schule ein. Die Bescheinigung bekommst du sofort als PDF und zusätzlich per Mail."; `savedFor(school, location)` "Für {school}, {location}"; remove teacher, address and class strings
- [x] T012 [US1] Rebuild `components/participant/school-release-form.tsx` with name (read only) plus two single line inputs, existing error, saved and locked states, 16px controls unchanged
- [x] T013 [US1] Update `app/meine-anmeldung/[token]/actions.ts` to parse the two field schema and store via `upsertSchoolRelease`
- [x] T014 [P] [US1] Update `lib/participant/lookup.ts` and `lib/participant/view.ts` to drop the address prefill and pass gender and camp location where the letter is rendered
- [x] T015 [P] [US1] Update release mail copy in `lib/email/messages.ts` `schoolRelease`: `dates` line names the camp period ("Sie gilt für den Campzeitraum {period}."), `attachment` "Druck sie aus oder gib sie an deine Schule weiter. Stempel und Unterschrift der Gemeinde sind schon drauf."; adapt the caller in `lib/email/templates.ts`
- [x] T016 [US1] Update `tests/unit/school-release-core.test.ts` (schema: two fields, required, max lengths; `missingForEnable` with missing camp period) and `tests/unit/participant-view.test.ts`

**Checkpoint**: form works end to end with the old PDF layout replaced in US2.

## Phase 4: User Story 2 · PDF wie das gewohnte Schreiben (P1)

**Goal**: PDF matches `template-2026.pdf` per contracts/letter-layout.md.

**Independent Test**: quickstart step 1 and 4, admin preview next to the template.

- [x] T017 [P] [US2] Replace `releaseMessages.letter` in `lib/school-release/messages.ts` with the template wording of contracts/letter-layout.md: `title` "Teilnehmer Bescheinigung", `subject(period, location)`, `salutation` "Sehr geehrte Damen und Herren,", `legal` paragraph, `legalSource` "(AV Schulpflicht Nr. 2 Abs. 7)", `request(period, person, name)`, `person` by gender ("den Teilnehmer", "die Teilnehmerin", "die teilnehmende Person"), `understanding`, `questions`, `closing` "Mit freundlichen Segensgrüßen", `organization` "FCG Blankenheim eV", `placeDate(date)` "Blankenheim, {date}", `signatureMissing` "Stempel und Unterschrift fehlen"; update `sample` to John Hacatrian, Gesamtschule Eifel, Nettersheim, male
- [x] T018 [US2] Rewrite `lib/school-release/letter.ts`: new `ReleaseLetter` (recipient lines, place date, title, subject, salutation, paragraphs as runs with bold or oblique parts, closing, organization); period formatter "DD.MM. bis DD.MM.YYYY", both with year across the year change; subject drops " in …" without location; date as DD.MM.YYYY (research R5, R6)
- [x] T019 [US2] Rewrite `lib/school-release/pdf.ts` per contracts/letter-layout.md: logo from `assets/church-logo.png` (read once, cached), sender line, recipient, right aligned date and phone, title, bold subject, paragraphs with mixed runs (bold period, oblique source note) and wrapping at 455 pt, closing, stamp about 170 × 135 pt or placeholder box, fixed footer with four columns; body never enters the footer area (20 pt gap); keep `toWinAnsi`
- [x] T020 [US2] Ensure the logo file is bundled for the server functions (Next.js `outputFileTracingIncludes` in `next.config.ts` for the release routes, or import path that tracing picks up) and verify in `npm run build` output
- [x] T021 [US2] Tests in `tests/unit/school-release-core.test.ts`: letter text for male, female, no gender; period same year and across years; missing location; PDF smoke test (one page, parses) with and without stamp and at max field lengths

**Checkpoint**: PDF matches the template side by side.

## Phase 5: User Story 3 · Admins mit denselben zwei Feldern (P2)

**Independent Test**: quickstart steps 1, 2, 5.

- [x] T022 [P] [US3] Rebuild `components/admin/school-release-panel.tsx` with school name and location inputs; update `app/admin/actions.ts` to the two field schema
- [x] T023 [P] [US3] Update `components/admin/release-settings-card.tsx`, `app/admin/camps/[campId]/infomails/page.tsx` and `actions.ts`: remove signer name, role and address field selection; show missing reason "Campzeitraum im Camp eintragen"; upload label and hint "Stempel mit Unterschrift als ein Bild (PNG oder JPG)"
- [x] T024 [US3] Update admin copy in `lib/admin/messages.ts` and `releaseMessages.missing` (`campPeriod`, drop `signerName`); verify `app/api/admin/school-release/preview/[campId]/route.ts` renders the new sample

## Phase 6: User Story 4 · Bestehende Einträge bleiben nutzbar (P3)

**Independent Test**: quickstart step 6.

- [x] T025 [US4] Before applying T003 to the project, query existing `school_releases` rows and print `school_address` last line next to the derived location for a dry check; after migration download one old entry

## Phase 7: Polish

- [x] T026 [P] Update privacy copy in `lib/legal/messages.ts` (release section: only school name and school location) (FR-013)
- [x] T027 [P] Update `AGENTS.md` section 4 (school release letter: church letterhead, two fields, full camp period, specs/042-church-release-letter) and section 5 (`school_releases` fields, release settings)
- [x] T028 [P] Update `tests/unit/email-preview.test.ts` and `tests/unit/email-templates.test.ts` for the new release mail copy
- [x] T029 Grep the touched files for leftover `teacherName`, `participantAddress`, `className(`, `addressKeys`, `signerName` and for dashes in new German copy
- [x] T030 Run `npm run lint`, `npm test`, `npm run build` and report the output verbatim
- [ ] T031 Manual run per quickstart.md: preview PDF next to `template-2026.pdf`, screenshot as proof

## Dependencies

- Phase 1 and 2 before all stories; T003 → T004 → T006 to T010.
- US1 and US2 can run in parallel after Phase 2 (different files except `messages.ts`, where T011 and T017 touch different sections).
- US3 after T008 (missing reasons) and T017 (sample).
- US4 needs only T003 and T004.
- Polish last.

## Parallel examples

- After T004: T005, T009, T011, T017 together.
- US3: T022 and T023 together.
- Polish: T026, T027, T028 together.

## Implementation Strategy

MVP is US1 plus US2 (both P1): two fields and the new letter ship together, since the old letter
needs the removed fields. US3 follows in the same change, so the admin dialog does not break.
US4 is verified during the migration. One commit for the whole feature.
