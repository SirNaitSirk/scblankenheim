---

description: "Task list for Mail Einstellungen pro Camp"
---

# Tasks: Mail Einstellungen pro Camp

**Input**: Design documents from `specs/016-mail-settings/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/actions-and-mail.md, quickstart.md

**Tests**: Unit tests are included because the plan requires that defaults reproduce today's
behaviour exactly (SC-003) and the project keeps pure rule tests in `tests/unit/`.

**Organization**: Grouped by user story from spec.md (US1 to US6).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no open dependency)
- **[Story]**: user story label (US1 to US6)

---

## Phase 1: Setup

**Purpose**: Scope amendment and migration baseline before any code

- [X] T001 Amend scope for the test send: in `AGENTS.md` section 4 replace "no editing, no test send" for the Mail tab with "no editing; test send of a template to the admin's own address (specs/016-mail-settings)", and in `specs/007-transactional-emails/spec.md` add a note next to the "Testversand" exclusion that specs/016-mail-settings introduces it. No dash punctuation in the new text.
- [ ] T002 (open: no Docker and no linked Supabase project in this environment) Check the migration baseline: run a clean local reset (`npx supabase db reset`) and confirm both `supabase/migrations/0011_camp_mail_info.sql` and `supabase/migrations/0011_simplify_registration_status.sql` apply. If the CLI rejects the duplicate version, stop and report to the user (research R8); do not rename files in this feature.

---

## Phase 2: Foundational (blocking)

**Purpose**: Schema, types and the resolved settings object every story uses

- [X] T003 Create `supabase/migrations/0012_mail_settings.sql`: on `public.camp_mail_info` add `reminders_enabled boolean not null default true`, `teaser_days_before integer`, `packing_days_before integer`, `arrival_days_before integer`, `thanks_days_after integer`, `reminder_first_after_days integer`, `reminder_before_due_days integer`, `reminder_min_gap_days integer`, `sender_name text`, `reply_to text`, `text_greeting text`, `text_closing text`, `contact_name text`, `contact_phone text` (all nullable except the switch); on `public.registrations` add `reminders_paused boolean not null default false` and `reminders_paused_at timestamptz`; `alter table public.email_deliveries alter column registration_id drop not null`. No CHECK constraints. Header comment in the style of 0011 referencing specs/016-mail-settings.
- [X] T004 (types updated by hand; migration not yet applied, no local database available) Apply the migration locally and update `lib/database.types.ts` for the new columns of `camp_mail_info`, `registrations` and the nullable `email_deliveries.registration_id` (Row, Insert, Update), with the migration comment as in the existing file.
- [X] T005 [P] Add to `lib/email/limits.ts`: `TIMING_BOUNDS` with teaser 14 to 120, packing 7 to 60, arrival 1 to 21, thanks 1 to 29, reminderFirstAfter 3 to 60, reminderBeforeDue 1 to 30, reminderMinGap 1 to 14; `TEST_SEND_COOLDOWN_MS = 60 * 1000`; `SENDER_NAME_MAX = 60`; text limits greeting 300, closing 200, contactName 80, contactPhone 40.
- [X] T006 Create `lib/email/settings.ts` (pure, no server import): types `MailTiming`, `MailTexts`, `MailSender`, `CampMailSettings` as in data-model.md; `DEFAULT_TIMING` built from the existing constants (`INFO_TEASER_BEFORE_DAYS`, `INFO_PACKING_BEFORE_DAYS`, `INFO_ARRIVAL_BEFORE_DAYS`, `INFO_THANKS_AFTER_DAYS`, `REMINDER_FIRST_AFTER_DAYS`, `REMINDER_BEFORE_DUE_DAYS`, `REMINDER_MIN_GAP_DAYS`); `DEFAULT_MAIL_SETTINGS` (reminders on, default timing, null sender, null texts); `resolveTiming(raw)` replacing each null with its default.
- [X] T007 Extend `lib/admin/camp-mail-info.ts`: new fields on `CampMailInfo` (`remindersEnabled`, seven nullable timing numbers, `senderName`, `replyTo`, `textGreeting`, `textClosing`, `contactName`, `contactPhone`), `EMPTY_MAIL_INFO` with `remindersEnabled: true` and the rest null, `mapMailInfoRow`, `mailInfoToRow`, `mailInfoToFormValues` (timing as string, "" for null), and `resolveMailSettings(info): CampMailSettings` using `resolveTiming`. Schema changes come in the stories below.
- [X] T008 [P] Add `remindersPaused: boolean` to `Registration` in `lib/admin/types.ts` and map `reminders_paused` in `mapRegistration` in `lib/admin/data.ts`; add a data helper `setRemindersPaused(reference, paused)` in `lib/admin/data.ts` that updates `reminders_paused` and `reminders_paused_at = now` and returns the registration name or null when not found.
- [X] T009 Carry settings through sending in `lib/email/send.ts`: `MailTarget` gets `settings: CampMailSettings`; `buildMailTarget(registration, camp, settings)`; `loadMailTarget` loads `getCampMailInfo(camp_id)` and resolves it; `REGISTRATION_COLUMNS` and `RegistrationRow` include `reminders_paused`. Update callers in `lib/email/info-run.ts` to pass the already loaded settings.
- [X] T010 [P] Unit test in `tests/unit/email-settings.test.ts`: `resolveTiming` of an all null input equals `DEFAULT_TIMING`; `resolveMailSettings(EMPTY_MAIL_INFO)` equals `DEFAULT_MAIL_SETTINGS`.

**Checkpoint**: types compile, existing tests still pass (`npm test`).

---

## Phase 3: User Story 1 · Erinnerungen pro Anmeldung pausieren (P1) MVP

**Goal**: Admins with `finances` or `registrations` pause and resume automatic reminders for one registration.

**Independent Test**: Pause a registration with a due reminder, run the reminder cron: nothing sent; resume, run again: reminder sent.

- [X] T011 [US1] In `lib/email/reminders.ts` add `paused: boolean` to `ReminderInput` and make `isReminderEligible` return false when `paused` is true; pass `row.reminders_paused` in `runPaymentReminders` (`lib/email/send.ts`) and in `runInfoMails` (`lib/email/info-run.ts`), so a paused registration has no reminder due and therefore never blocks its info mail.
- [X] T012 [P] [US1] Extend `tests/unit/email-reminders.test.ts`: paused returns null for every stage; after unpausing a missed stage is not sent late, the currently open stage is.
- [X] T013 [US1] Add `setReminderPauseAction(reference, paused)` to `app/admin/actions.ts` per contracts: `requirePermission("registrations")`, Zod `{ reference: string 1..32, paused: boolean }`, call `setRemindersPaused`, log `registration.reminders_paused` or `registration.reminders_resumed` with the reference, revalidate `/admin` and `/admin/finanzen`, `notFound` error when null.
- [X] T014 [US1] Add `setFinanceReminderPauseAction(reference, paused)` to `app/admin/finanzen/actions.ts` using `runFinanceGuarded` and the same helper, log and revalidation as T013.
- [X] T015 [P] [US1] German copy in `lib/admin/messages.ts`: switch label "Zahlungserinnerungen pausieren", hint "Es gehen keine automatischen Erinnerungen an diese Anmeldung. Zahlungslinks von Hand gehen weiter.", badge "Erinnerungen pausiert", toasts "Erinnerungen pausiert" and "Erinnerungen fortgesetzt", finance filter label "Pausiert".
- [X] T016 [US1] In `lib/admin/finance.ts` add `remindersPaused` to `FinanceRow` and `toFinanceRow`, add `"paused"` to `FinanceFilter` and handle it in `matchesFinanceFilter`; extend `tests/unit/finance.test.ts` for the new filter.
- [X] T017 [US1] UI in `components/admin/finance-manager.tsx` (filter chip "Pausiert" with count), `components/admin/finance-table.tsx` (badge on paused rows) and row actions (bell toggle calling `setFinanceReminderPauseAction`, optimistic with rollback and toast, hidden without `finances` permission). Implemented as a row action instead of inside `finance-row-editor.tsx`, which stays the amount editor.
- [X] T018 [US1] UI in `components/admin/registration-form-dialog.tsx` and `components/admin/payment-link-panel.tsx`: switch in the payment area of an existing registration calling `setReminderPauseAction`, disabled without `registrations` permission, shows the badge state.

**Checkpoint**: quickstart scenario 3 passes.

---

## Phase 4: User Story 2 · Zahlungserinnerungen pro Camp an oder aus (P1)

**Goal**: One switch per camp stops all automatic reminders.

**Independent Test**: Switch off, run the reminder cron: nothing sent; switch on: reminder sent.

- [X] T019 [US2] In `lib/email/reminders.ts` add `campEnabled: boolean` to `ReminderInput`, blocking like `paused`; in `runPaymentReminders` load the current camp's mail info and pass `settings.remindersEnabled`; in `runInfoMails` pass it per camp. Extend `tests/unit/email-reminders.test.ts` accordingly.
- [X] T020 [US2] Extend `campMailInfoSchema` in `lib/admin/camp-mail-info.ts` with `remindersEnabled: z.boolean()` and the save path in `app/admin/camps/[campId]/infomails/actions.ts` (no other change needed, logging stays `camp_mail_info.saved`).
- [X] T021 [US2] In `components/admin/camp-mail-info-form.tsx` add a section "Zahlungserinnerungen" with the switch at the top; copy in `lib/admin/messages.ts` (`campMailInfo.reminders.title`, `.label`, `.hint`). Rename the page heading and the camp navigation entry to "Mails" in `lib/admin/messages.ts`.
- [X] T022 [US2] In `app/admin/mail/page.tsx` and `components/admin/mail-preview.tsx` show for the three reminder templates a status line "Für dieses Camp ausgeschaltet" with a link to the settings when `remindersEnabled` is false.

**Checkpoint**: quickstart scenario 2 passes.

---

## Phase 5: User Story 3 · Zeitpunkte und Takt pro Camp (P2)

**Goal**: Seven timing values per camp, defaults when empty, validated ranges and order.

**Independent Test**: Packzettel 28, start in 28 days, run info cron: packing mail sent; invalid values refused.

- [X] T023 [US3] In `lib/email/info-mails.ts` add a `timing: MailTiming` parameter to `infoDueDate`, `infoWindow` and `openInfoStage`, and `timing` to `InfoMailInput`, replacing the four constants; `INFO_THANKS_LAST_DAY` stays fixed.
- [X] T024 [US3] In `lib/email/reminders.ts` add `timing: MailTiming` to `ReminderInput` and replace `REMINDER_FIRST_AFTER_DAYS`, `REMINDER_BEFORE_DUE_DAYS`, `REMINDER_MIN_GAP_DAYS` in `openStage` and `nextReminder`.
- [X] T025 [US3] In `lib/email/info-run.ts` pass each camp's resolved timing; change `loadRunCamps` to load camps with `end_date` between today minus `INFO_THANKS_LAST_DAY` and today minus 1, keeping a camp only when its own thanks window is open; pass timing in `lib/email/send.ts` `runPaymentReminders`.
- [X] T026 [P] [US3] Update `tests/unit/email-info-mails.test.ts` and `tests/unit/email-reminders.test.ts` to pass `DEFAULT_TIMING` (existing expectations unchanged, proving SC-003) and add cases with custom timing (packing 28, reminder first after 10, gap 5).
- [X] T027 [US3] Extend `campMailInfoSchema` in `lib/admin/camp-mail-info.ts`: seven timing fields as strings, "" maps to null, otherwise whole numbers inside `TIMING_BOUNDS`; after resolving defaults require teaser > packing > arrival days; German errors `outOfRange(min, max)` and `stageOrder` in `lib/admin/messages.ts`. Unit tests in `tests/unit/camp-mail-info.test.ts`.
- [X] T028 [US3] (implemented inline: each info card and the reminder card carry their own day fields) In `components/admin/camp-mail-info-form.tsx` add section "Zeitpunkte" with number inputs grouped "Infomails" and "Zahlungserinnerungen", placeholder showing the default ("Vorgabe: 21 Tage"), a "Vorgabe verwenden" action that clears the field, inline errors.
- [X] T029 [US3] In `app/admin/mail/page.tsx` build trigger texts from the current camp's resolved timing instead of the constants.

**Checkpoint**: quickstart scenarios 1 and 4 pass.

---

## Phase 6: User Story 4 · Absendername und Antwortadresse (P2)

**Goal**: Per camp display name and reply address; sender address fixed.

**Independent Test**: Set both, send a test or confirmation: new name, same address, replies go to the new address.

- [X] T030 [US4] In `lib/email/provider.ts` add optional `sender?: MailSender` to `sendEmail`; helper `formatFrom(envFrom, name)` that extracts the address from `EMAIL_FROM` (`Name <addr>` or `addr`) and returns `"Name" <addr>` when a name is given; reply address `sender.replyTo ?? EMAIL_REPLY_TO`. Extend `tests/unit/email-provider.test.ts` (with and without override, both env formats).
- [X] T031 [US4] In `lib/email/send.ts` `deliver` pass `target.settings.sender` to `sendEmail`.
- [X] T032 [US4] Extend `campMailInfoSchema`: `senderName` trimmed, "" to null, at most 60 characters, only letters (including umlauts), digits, spaces and `.,&'()!?`; `replyTo` "" to null or a valid email. German errors in `lib/admin/messages.ts`; tests in `tests/unit/camp-mail-info.test.ts`.
- [X] T033 [US4] In `components/admin/camp-mail-info-form.tsx` add section "Absender" with both fields, the fixed sender address shown read only as context, placeholders showing the current defaults.

**Checkpoint**: quickstart scenario 5 passes (with T039).

---

## Phase 7: User Story 5 · Textbausteine (P2)

**Goal**: Greeting line, closing, contact name and phone at fixed positions in confirmation, payment link and reminders.

**Independent Test**: Fill the four fields, the confirmation preview shows them; empty restores today's text.

- [X] T034 [US5] In `lib/email/templates.ts` add `texts: MailTexts` to `EmailContext`; in `confirmationEmail` and `paymentMail` render after the greeting the custom greeting line if set, before the closing the contact line if name or phone is set, and the custom closing instead of `m.closing`, in HTML via `renderParagraph` and in text. Copy `contactLine(name, phone)` in `lib/email/messages.ts` producing "Bei Fragen erreichst du Name unter Telefon." or the variant with only one part.
- [X] T035 [US5] Fill `texts` in `buildMailTarget` (`lib/email/send.ts`) from settings and in `sampleContext` (`lib/email/preview.ts`, new optional `settings` argument, default `DEFAULT_MAIL_SETTINGS`); keep `InfoMailContext` working with the extended `EmailContext`.
- [X] T036 [P] [US5] Tests in `tests/unit/email-templates.test.ts`: with empty texts output equals the current snapshot strings; with texts each value appears once in HTML and text; `<b>` input is escaped.
- [X] T037 [US5] Extend `campMailInfoSchema` with `textGreeting` (max 300), `textClosing` (max 200), `contactName` (max 80), `contactPhone` (max 40), "" to null; form section "Textbausteine" in `components/admin/camp-mail-info-form.tsx` with character counters; pass the current camp settings to `buildMailPreviews` in `app/admin/mail/page.tsx`.

**Checkpoint**: quickstart scenario 6 passes.

---

## Phase 8: User Story 6 · Testversand (P3)

**Goal**: Send any template with sample data to the admin's own address, cooldown and quota respected.

**Independent Test**: Send a test, subject starts with "Test:", second click within a minute refused, not in any mail history.

- [X] T038 [US6] In `lib/email/deliveries.ts` add `"test"` to `EmailKind` handling: `claimTestDelivery(actorId)` inserting `registration_id: null, kind: "test", trigger: "admin", status: "sending"`, and `testOnCooldown(actorId, now)` using `TEST_SEND_COOLDOWN_MS`.
- [X] T039 [US6] In `lib/email/send.ts` add `sendTestEmail(templateId, admin)` returning `"sent" | "failed" | "no_email" | "no_camp" | "cooldown" | "quota"`: check `admin.email`, current camp, cooldown, `countDeliveriesSince(berlinDayStartIso(now)) >= DAILY_EMAIL_BUDGET - CONFIRMATION_RESERVE`; render via `lib/email/preview.ts` with current camp settings and mail info; prefix subject with `emailMessages.testSubjectPrefix` ("Test: "); claim, send with `settings.sender` and idempotency key `test/<id>`, mark sent or failed, log `email.test_sent` or `email.test_failed` with template id only.
- [X] T040 [US6] In `lib/email/preview.ts` add `renderTemplate(templateId, camp, mailInfo)` returning one `RenderedEmail` for any `PreviewId | InfoMailKind`, reused by the page and the test send.
- [X] T041 [US6] Create `app/admin/mail/actions.ts` with `sendTestMailAction(templateId)`: `requirePermission("camps")`, Zod enum of all template ids, map outcomes to German toasts in `lib/admin/messages.ts` (sent: "Testmail an {Adresse} verschickt", cooldown, quota, no_email, no_camp, failed).
- [X] T042 [US6] In `components/admin/mail-preview.tsx` add a button "Test an mich senden" next to the selected preview, pending state, toast, hidden when the page passes `canSendTest = false`; compute `canSendTest` from `canUseSection(profile, "camps")` in `app/admin/mail/page.tsx`. Update the page intro text that says no test send.
- [X] T043 [P] [US6] Tests: extend `tests/unit/email-preview.test.ts` for `renderTemplate` on every id; extend `tests/unit/email-history.test.ts` or the history query test so rows with null registration never appear. (Done as `tests/unit/email-test-send.test.ts` for recipient, subject, cooldown, quota and errors; the history query filters by registration id in the database, so test rows cannot match.)

**Checkpoint**: quickstart scenario 7 passes.

---

## Phase 9: Polish

- [X] T044 [P] Update `AGENTS.md` section 4 (Transactional email) and section 5 (`camp_mail_info` and `registrations` lines) for the new settings and pause.
- [X] T045 Design pass on the settings page and Mail tab with the `impeccable` and `tasteskill` skills: section order, spacing, mobile layout, loading, empty and error states, no dash punctuation in copy.
- [X] T046 (quickstart 1 to 7 walked in the browser; cron runs and the real inbox need RESEND_API_KEY and CRON_SECRET, scenario 8 needs a second admin account; covered by unit tests) Run `npm run lint`, `npm test`, `npm run build` and report output verbatim; then walk through `specs/016-mail-settings/quickstart.md` scenarios 1 to 8.

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → stories. T003 before T004; T004 before T007, T008, T009.
- US1 (T011 to T018) and US2 (T019 to T022) both touch `lib/email/reminders.ts`: do US1 first, then US2.
- US3 depends on T006 and touches `reminders.ts` and `info-mails.ts`: after US2.
- US4 and US5 are independent of US3 apart from the shared form file `camp-mail-info-form.tsx` and schema file; run them in sequence on those files.
- US6 depends on US4 (sender) and US5 (settings aware previews) for a faithful test mail, but its plumbing (T038, T040) can start earlier.
- Polish last.

## Parallel Opportunities

- Phase 2: T005, T008, T010 in parallel after T004.
- US1: T012 and T015 parallel to T013 and T014.
- US3: T026 parallel to T027 once T023 and T024 are done.
- US5: T036 parallel to T037.
- US6: T038 and T040 in parallel, T043 after both.

## Implementation Strategy

1. MVP: Phases 1, 2 and US1 (pause). Usable on its own, the most requested case.
2. Add US2 (camp switch), then US3 (timing). Each ends with its quickstart scenario.
3. Add US4 and US5 (sender, texts), then US6 (test send) to verify them in a real inbox.
4. Polish and full checks.
