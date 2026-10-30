---

description: "Task list for Schulbefreiung"
---

# Tasks: Schulbefreiung

**Input**: Design documents from `specs/020-school-release/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/school-release.md, quickstart.md

**Tests**: Unit tests for the pure modules (schemas, settings and address prefill, letter content,
WinAnsi sanitising, PDF smoke test, mail templates, link request decisions), as listed in plan.md.

**Order note**: Story 3 (Einrichten) runs first among the P1 stories, because Story 1 and Story 2
can only be switched on for a camp once the settings exist.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Amend `AGENTS.md` section 4 (school release letter, participant link request) and section 5 (`school_releases`, release settings) without dash punctuation (done during planning).
- [X] T002 Create branch `020-school-release` from the current state and add the dependency `pdf-lib@1.17.1` with `npm install pdf-lib@1.17.1` (exact version in `package.json`).

---

## Phase 2: Foundational

- [X] T003 Create `supabase/migrations/0015_school_release.sql` with header comment referencing specs/020: table `public.school_releases` exactly as in data-model.md (`registration_id uuid primary key references public.registrations(id) on delete cascade`, `camp_id uuid not null references public.camps(id) on delete cascade`, `teacher_name text not null`, `school_name text not null`, `school_address text not null`, `participant_address text not null`, `class_name text`, `updated_by text not null`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`), index on `(camp_id)`, `enable row level security`; `alter table public.camp_mail_info add column release_enabled boolean not null default false, release_dates date[] not null default '{}', release_signer_name text, release_signer_role text, release_signature_path text, release_address_keys text[] not null default '{}'`; `insert into storage.buckets (id, name, public) values ('signatures', 'signatures', false) on conflict (id) do nothing`; `drop index public.email_deliveries_once_idx` and recreate it unique on `(registration_id, kind) where kind not in ('payment_link', 'team_message', 'school_release', 'participant_link') and status in ('sending', 'sent')`. No CHECK constraints.
- [X] T004 Update `lib/database.types.ts` with `school_releases` (Row, Insert, Update) and the new `camp_mail_info` columns (by hand if no local database is available; note it in this task). Done by hand: no local database in this session.
- [X] T005 [P] Create `lib/school-release/limits.ts`: `TEACHER_NAME_MAX = 120`, `SCHOOL_NAME_MAX = 160`, `ADDRESS_MAX = 300`, `ADDRESS_LINES_MAX = 4`, `CLASS_NAME_MAX = 40`, `SIGNER_MAX = 120`, `RELEASE_DATES_MAX = 5`, `ADDRESS_KEYS_MAX = 4`, `SIGNATURE_MAX_BYTES = 512 * 1024`, `SIGNATURE_URL_TTL_S = 60`, `RELEASE_IP_WINDOW_MS = 10 * 60 * 1000`, `RELEASE_IP_MAX = 10`, `RELEASE_DUPLICATE_MS = 60 * 1000`, `LINK_IP_WINDOW_MS = 10 * 60 * 1000`, `LINK_IP_MAX = 5`, `LINK_COOLDOWN_MS = 10 * 60 * 1000`, `LINK_DAY_MAX = 3`, `RELEASE_ANCHOR = "schulbefreiung"`.
- [X] T006 [P] Create `lib/school-release/types.ts` with `ReleaseSettings` and `SchoolReleaseData` exactly as in data-model.md, plus `ReleaseLetterInput` (settings, data, participant name, camp name, camp start and end, sender lines, today).
- [X] T007 [P] Create `lib/school-release/messages.ts` with all German copy (participant card, landing section, PDF subject „Bitte um Unterrichtsbefreiung“, salutation, body sentences, closing, field labels, errors, admin reasons for a locked switch). No dashes.
- [X] T008 Create `lib/school-release/schema.ts` (pure): Zod `schoolReleaseInputSchema` (trimmed strings; teacherName "max 120" required, schoolName "max 160" required, schoolAddress and participantAddress "max 300, up to 4 lines" required, className "max 40" optional, empty becomes null) and `releaseSettingsInputSchema` (enabled boolean, dates ISO strings "1 to 5 dates within the camp period", signerName and signerRole "max 120", addressKeys "max 4"), German messages from T007.
- [X] T009 Create `lib/school-release/settings.ts` (pure): `toReleaseSettings(row)` from `camp_mail_info` (missing row = off and empty), `missingForEnable(settings)` returning the list of missing items (signature, dates, signer name), `isReleaseActive(settings)` = enabled and nothing missing, `datesWithinCamp(dates, start, end)`, `prefillAddress(formData, addressKeys)` (first key on line one, the rest joined with spaces on line two, empty answers skipped), `formatReleaseDates(dates)` in German long format („Freitag, 4. Juni 2027“, joined with „und“).
- [X] T010 Create `lib/school-release/letter.ts` (pure): `buildLetter(input)` returning sender lines, recipient lines, place and date line, subject, body paragraphs (participant name, participant address, class when set, camp name, camp period, release dates), closing, signer name and role. Create `lib/school-release/pdf.ts` (`server-only`): `toWinAnsi(text)` (map known letters to Latin, else `?`), `renderReleasePdf(letter, signature: { bytes, type } | null)` with pdf-lib, A4, Helvetica and Helvetica Bold, word wrap, signature scaled to max 160 × 60 pt, placeholder box „Unterschrift fehlt“ when null; returns `Uint8Array`.
- [X] T011 [P] Create `tests/unit/school-release-core.test.ts`: schema limits, trimming and class null; `missingForEnable` and `isReleaseActive`; `datesWithinCamp`; `prefillAddress` with missing answers; German date formatting; `buildLetter` contains name, school, dates, no prices; `toWinAnsi` keeps ä ö ü ß and replaces emoji; `renderReleasePdf` output starts with `%PDF` and loads again with `PDFDocument.load`.
- [X] T012 Create `lib/school-release/data.ts` (`server-only`): `getReleaseSettings(campId)`, `saveReleaseSettings(campId, patch)`, `getSchoolRelease(registrationId)`, `upsertSchoolRelease(registrationId, campId, data, updatedBy)` (returns whether data changed), `deleteSchoolRelease(registrationId)`, `loadSignature(path)` (download bytes and type from bucket `signatures`), `signatureSignedUrl(path)` (TTL `SIGNATURE_URL_TTL_S`), `buildReleasePdf(registrationId)` (loads registration, camp, settings, data, mail settings for sender lines, renders; null when unavailable).
- [X] T013 Extend mail infrastructure: `lib/email/provider.ts` optional `attachments: { filename: string; content: string }[]` in `OutgoingEmail`, sent as Resend `attachments`; `lib/email/deliveries.ts` add kinds `school_release` and `participant_link` to `EmailKind`, new `claimRepeatableDelivery({ registrationId, kind, trigger, actor })` without unique handling, `lastDeliveryAt(registrationId, kind)` and `countDeliveriesToday(registrationId, kind)`; `lib/email/history.ts` trigger `participant`; update `tests/unit/email-provider.test.ts` for attachments.

---

## Phase 3: User Story 3 · Befreiung pro Camp einrichten (P1)

**Goal**: Admins configure and switch on the release per camp, with preview.

**Independent Test**: quickstart section 1.

- [X] T014 [US3] Add admin copy to `lib/admin/messages.ts` under `schoolRelease.settings` (card title „Schulbefreiung“, switch, dates, signer, address fields, upload, replace, remove, preview, locked reasons, saved, errors). No dashes.
- [X] T015 [US3] Add Server Actions to `app/admin/camps/[campId]/infomails/actions.ts` per contract: `saveReleaseSettingsAction` (`requirePermission("camps")`, Zod, `datesWithinCamp`, address keys must be question fields of the camp, reject enabling when `missingForEnable` is not empty), `uploadSignatureAction` (PNG `89 50 4E 47` or JPEG `FF D8 FF` magic bytes, at most `SIGNATURE_MAX_BYTES`, path `<campId>/signature-<timestamp>.<ext>`, remove previous object), `removeSignatureAction` (remove object, clear path, set `release_enabled = false`); `writeLog` without file content; `revalidatePath`.
- [X] T016 [US3] Create `app/api/admin/school-release/preview/[campId]/route.ts`: GET, `requirePermission("camps")` (401/403), sample data from `lib/school-release/messages.ts`, current settings, signature or placeholder, `application/pdf`, `Content-Disposition: inline`, `Cache-Control: no-store`.
- [X] T017 [US3] Create `components/admin/release-settings-card.tsx` (client) and render it in `app/admin/camps/[campId]/infomails/page.tsx` (load settings, signed URL thumbnail, question fields of the camp in form order): switch disabled with reason list, up to five date inputs, signer name and role, ordered address field selection, upload with thumbnail, replace and remove, „Vorschau“ link opening the preview route in a new tab; loading, saved and error states.

---

## Phase 4: User Story 1 · Befreiung auf der Teilnehmerseite (P1) 🎯 MVP

**Goal**: Active registrations create, download and receive their release letter.

**Independent Test**: quickstart section 2.

- [X] T018 [P] [US1] Add mail copy to `lib/email/messages.ts` under `schoolRelease` (subject „Deine Schulbefreiung für <Camp>“, intro, dates line, attachment hint, link to participant page) and create `schoolReleaseEmail(ctx)` in `lib/email/templates.ts` using the layout helpers; add it to `lib/email/preview.ts`.
- [X] T019 [US1] Add `sendSchoolRelease(registrationId, trigger, actor?)` to `lib/email/send.ts`: `loadMailTarget`, quota check against `DAILY_EMAIL_BUDGET - CONFIRMATION_RESERVE`, `buildReleasePdf`, `claimRepeatableDelivery` kind `school_release`, idempotency key `school_release/<claimId>`, attachment `Schulbefreiung-<Nachname>.pdf` base64, mark and log like `deliver`; returns `DeliveryOutcome`.
- [X] T020 [US1] Add `saveSchoolReleaseAction(token, prev, formData)` to `app/meine-anmeldung/[token]/actions.ts` per contract: ip throttle kind `school_release` (`RELEASE_IP_MAX` within `RELEASE_IP_WINDOW_MS`), `findRegistrationForToken`, status `active`, `isReleaseActive`, Zod, `upsertSchoolRelease(..., "participant")`; skip the mail when data unchanged and `lastDeliveryAt` is within `RELEASE_DUPLICATE_MS`; result `mail: "skipped"` without address or quota; else `after(() => sendSchoolRelease(id, "participant"))`; `revalidatePath`.
- [X] T021 [US1] Create `app/meine-anmeldung/[token]/befreiung/route.ts`: GET, normalize token, participant page miss throttle, registration active and not deleted, release active, data present, `buildReleasePdf`; 200 with headers from the contract (`Content-Disposition: attachment; filename="Schulbefreiung-<Nachname>.pdf"`, `Cache-Control: no-store`, `X-Robots-Tag: noindex`), otherwise the same 404 body.
- [X] T022 [US1] Extend `lib/participant/view.ts` and `lib/participant/lookup.ts` with `schoolRelease: { dates: string; data: SchoolReleaseData | null; prefillAddress: string } | null` (null when inactive or cancelled); update the 017 privacy test key list.
- [X] T023 [US1] Create `components/participant/school-release-form.tsx` (client, `useActionState`) and render it in `components/participant/participant-summary.tsx` as a card with `id="schulbefreiung"` after the payment block: explanation with dates, read only name, address textarea, teacher, school, school address, class; „Befreiung erstellen“; saved state with „PDF herunterladen“ (link to `befreiung`), mail status line, „Angaben ändern“; inline errors; mobile first. Apply `impeccable` and `tasteskill`.

---

## Phase 5: User Story 2 · Link über die Landingpage (P1)

**Goal**: People request the link to their participant page by email.

**Independent Test**: quickstart section 3.

- [X] T024 [P] [US2] Add mail copy and `participantLinkEmail(ctx)` (first name, camp, button „Zur Schulbefreiung“ with deep link) to `lib/email/messages.ts` and `lib/email/templates.ts`; add to `lib/email/preview.ts`.
- [X] T025 [US2] Create `lib/school-release/link-request.ts` (`server-only`): `isLinkThrottled(ip)` (kind `participant_link`, count then record), `findLinkTargets(email)` (current camp, not deleted, status `active`, `lower(trim(email))` match filtered in JS), `mayReceiveLink(registrationId)` (`lastDeliveryAt` older than `LINK_COOLDOWN_MS` and `countDeliveriesToday` below `LINK_DAY_MAX`). Add `sendParticipantLink(registrationId, target)` to `lib/email/send.ts` (quota check, `claimRepeatableDelivery` kind `participant_link`, trigger `participant`, URL `participantUrl(token) + "#" + RELEASE_ANCHOR`).
- [X] T026 [US2] Create `app/actions/participant-link.ts` (`"use server"`): `requestParticipantLinkAction(prev, formData)` per contract; Zod email (trimmed, lowercased, max 254) and target allow list `["school_release"]`; ip throttle returns the German retry message; otherwise always `{ status: "done" }`; lookup and sending in `after()`, one mail per matching registration, nothing when the release is not active for the current camp.
- [X] T027 [P] [US2] Create `tests/unit/school-release-link.test.ts` for the pure parts: email normalisation, target allow list, cooldown and day limit decision helper.
- [X] T028 [US2] Create `components/marketing/school-release-section.tsx` (server wrapper plus small client form) and render it in `app/page.tsx` before `PaymentFaq` when the current camp's release is active and its end date has not passed: heading „Schule am Brückentag?“, two sentences with dates, email field, button „Link zur Befreiung senden“, neutral confirmation, throttle message. Match the marketing style; apply `impeccable` and `tasteskill`.

---

## Phase 6: User Story 4 · Anmeldedialog (P2)

**Goal**: Admins enter, correct, download and send releases.

**Independent Test**: quickstart section 4.

- [X] T029 [US4] Add Server Actions to `app/admin/actions.ts`: `loadSchoolReleaseAction(registrationId)` (`requireAdmin`; data, `available`, `canEdit`, last change label), `saveSchoolReleaseAdminAction(registrationId, input)` (`requirePermission("registrations")`, Zod, `upsertSchoolRelease(..., admin.id)`), `sendSchoolReleaseAction(registrationId)` (`requirePermission("registrations")`, `sendSchoolRelease(id, "admin", actor)`, German result); logs without values.
- [X] T030 [US4] Create `app/api/admin/school-release/[reference]/route.ts` (path segment is the registration reference, see contract): GET, `requireAdmin` (401/403), `buildReleasePdf`, 404 without data, same headers as the participant route.
- [X] T031 [US4] Create `components/admin/school-release-panel.tsx` and render it in `components/admin/registration-form-dialog.tsx` after the messages section (pass actions through `components/admin/registrations-manager.tsx`): read view with last change, „Bearbeiten“ form, „PDF herunterladen“, „Per Mail senden“; edit and send hidden without `canEdit`; hidden when not available and no data; loading, empty „Noch keine Befreiung angefordert“, error states.
- [X] T032 [US4] In `lib/admin/data.ts` `setRegistrationDeleted`: when marking deleted, call `deleteSchoolRelease(id)` (research R8). Add German labels for kinds `school_release` („Schulbefreiung“), `participant_link` („Link zur Anmeldung“) and trigger `participant` („Teilnehmerseite“) to the mail history copy in `lib/admin/messages.ts`.

---

## Phase 7: User Story 5 · Hinweis in Mails (P2)

**Goal**: Confirmation and teaser mail point to the release.

**Independent Test**: quickstart section 5.

- [X] T033 [US5] Extend `EmailContext` in `lib/email/templates.ts` with `schoolRelease: { dates: string; url: string } | null`; fill it in `buildMailTarget` in `lib/email/send.ts` from the camp's release settings (`isReleaseActive`) and `participantUrl + "#" + RELEASE_ANCHOR`; set it in the preview sample context.
- [X] T034 [US5] Add `schoolReleaseBlock(ctx)` to `lib/email/templates.ts` (heading „Schulbefreiung“, dates, button) and render it in `confirmationEmail` and in `teaserInfoEmail` (`lib/email/info-templates.ts`) after the calendar block; extend `tests/unit` mail template tests: block present when set, absent when null.

---

## Phase 8: Polish

- [X] T035 Scan all new copy and comments for dash punctuation and hyphenated words; fix.
- [X] T036 Run `npm run lint`, `npm test`, `npm run build` and report output verbatim.
- [X] T037 Walk through quickstart.md; apply the migration only after the project owner confirms.
  Result (2026-10-30, migration applied by the owner): sections 1 to 5 checked in the browser. Fixed on the way: the admin panel nested a form inside the dialog form (native GET submit), the mail history now refreshes after failed sends too, and the Schulbefreiung preview uses the configured dates. Not checked: removing the signature switches the release off (would change live settings) and real mail delivery (Resend test account only sends to the owner's address).

---

## Phase 9: Payment gate (amendment 2026-10-30, FR-006a)

- [X] T038 Add pure `isReleaseUnlocked` to lib/school-release/settings.ts and cover paid, partial, unpaid with and without amount paid, processing, refunded and nothing due in tests/unit/school-release-core.test.ts
- [X] T039 Add `locked` to `ParticipantRelease` in lib/participant/view.ts, no card for refunded, extend tests/unit/participant-view.test.ts
- [X] T040 Show the locked state with dates, hint and pay button in components/participant/school-release-form.tsx (pass `payHref` from components/participant/participant-summary.tsx), copy in lib/school-release/messages.ts
- [X] T041 Gate `saveSchoolReleaseAction` in app/meine-anmeldung/[token]/actions.ts, the route app/meine-anmeldung/[token]/befreiung/route.ts and `buildReleasePdf` with `requireActive` in lib/school-release/data.ts
- [X] T042 Add `afterPayment` to the release context in lib/email/templates.ts and lib/email/send.ts, the extra sentence in lib/email/messages.ts for the hint and the link mail, extend tests/unit/email-templates.test.ts
- [X] T043 Return `participantLocked` from `loadSchoolReleaseAction` in app/admin/actions.ts and show the muted line in components/admin/school-release-panel.tsx, copy in lib/admin/messages.ts
- [X] T044 Update AGENTS.md section 4 and quickstart.md section 2 with the unpaid case; run lint, test, build and check an unpaid and a partly paid test registration in the browser

## Dependencies

- Phase 1 → Phase 2 → Story 3 → Story 1 → Story 2. Story 4 needs Phase 2 and T019. Story 5 needs
  Phase 2 only.
- T013 before T019 and T025. T012 before T016, T019, T021, T030.

## Parallel Opportunities

- Phase 2: T005, T006, T007 together; T011 once T008 to T010 exist.
- Story 1: T018 parallel to T020 to T022.
- Story 2: T024 and T027 parallel to T025.
- Story 4 and Story 5 can run side by side after Story 1.

## Implementation Strategy

1. MVP: Phase 1, Phase 2, Story 3 and Story 1. The team can switch the release on and participants
   get their letter through the participant page.
2. Add Story 2 so people without the link find their way.
3. Add Story 4 and Story 5, then Polish.
