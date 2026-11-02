---

description: "Task list for 037-conditional-form-fields"
---

# Tasks: Bedingte Formularfelder

**Input**: Design documents from `/specs/037-conditional-form-fields/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: Unit tests for the pure rules, as in every feature of this project (Vitest, `tests/unit/`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no open dependency)
- **[Story]**: user story from spec.md (US1 to US5)
- All user facing text is German, lives in the central messages modules and contains no dashes.

---

## Phase 1: Setup

- [X] T001 Amend `AGENTS.md` section 4 (one sentence on conditional fields, specs/037) without dash punctuation (done during planning).

---

## Phase 2: Foundational (blocks every story)

- [X] T002 Add `FieldCondition = { fieldKey: string; values: string[] }` and `showWhen?: FieldCondition | null` to `FieldConfig`, plus `showWhenField: string` (`""` means no condition) and `showWhenValues: string[]` to `FieldFormValues` in `lib/admin/types.ts`.
- [X] T003 Create `lib/register/conditions.ts` with `readCondition`, `isFieldVisible`, `visibleFields`, `dropHiddenAnswers`, `conditionProblems`, `newConditionProblems` exactly as in `contracts/server-actions.md`. Rules from data-model.md: `fieldKey` is a select field of the same camp or `gender`, "nicht der eigene Schlüssel", "Auslöser hat selbst kein `showWhen`", `values` "mindestens ein Eintrag; jeder Eintrag ist eine Option des Auslösers; ohne Doppelte", never on `step` fields or core fields. `readCondition` returns `null` for any malformed value. `conditionProblems` adds `CORE_FIELDS` so `gender` resolves as trigger. Pure, isomorphic, no database.
- [X] T004 [P] Create `tests/unit/form-conditions.test.ts`: visibility with and without condition, multiple values, gender as trigger with German option text, malformed config, `dropHiddenAnswers` keeps visible and drops hidden keys, every `ConditionProblem.reason`, `newConditionProblems` ignores problems already present.
- [X] T005 Change `validateFields` in `lib/register/validation.ts` to validate only `visibleFields(fields, values)`; import from `lib/register/conditions.ts` without creating an import cycle (move shared types if needed).

**Checkpoint**: `npm test` green; behaviour of camps without conditions unchanged.

---

## Phase 3: User Story 1 · Bedingung im Feldeditor einstellen (P1) 🎯 MVP

**Goal**: admins set, change and remove a condition; the list shows it.

**Independent Test**: quickstart scenario 1.

- [X] T006 [P] [US1] Add German copy to `lib/admin/messages.ts` under `de.fields`: switch label „Nur anzeigen, wenn“, „Auslöserfeld“, „Antworten“, order hint „Dieses Feld steht vor seinem Auslöserfeld. Sinnvoll ist es danach.“, badge text function `(trigger, values) => "Nur bei ${trigger}: ${values.join(", ")}"`, errors for `no_values`, `trigger_missing`, `trigger_not_select`, `trigger_self`, `trigger_conditional`, `value_missing`, `not_allowed`.
- [X] T007 [US1] Extend `fieldSchema` in `app/admin/camps/[campId]/felder/actions.ts`: accept `showWhenField` and `showWhenValues` (`z.array(z.string())`), require at least one value when a trigger is set (`fieldErrors.showWhenValues`), drop the condition for `step` types, and write `config.showWhen` in `transform` (`null` when off; values trimmed and deduped).
- [X] T008 [US1] In `createFieldAction` and `updateFieldAction` build the next field list from `getCampFormFields(campId)` with the new or changed field, run `newConditionProblems(current, next)`, and map problems on the edited field to `fieldErrors.showWhenField` or `fieldErrors.showWhenValues`.
- [X] T009 [US1] Pass all camp fields from `components/admin/fields-manager.tsx` into `FieldFormDialog` as a new prop `fields`.
- [X] T010 [US1] In `components/admin/field-form-dialog.tsx` add the switch, the trigger select (only select fields without own condition, not the field itself, plus core gender with `GENDER_OPTIONS`), and the answers as checkboxes; prefill from `config.showWhen`; hide the section for `step`; show the order hint when the field sorts before its trigger; show field errors like the existing ones.
- [X] T011 [P] [US1] Show the badge „Nur bei …“ for conditional fields in `components/admin/fields-manager.tsx` and `components/admin/field-preview.tsx` in the style of existing badges.

**Checkpoint**: condition saved, shown in list and dialog, removable.

---

## Phase 4: User Story 2 · Bedingtes Feld im öffentlichen Formular (P1)

**Goal**: field appears only on the matching answer, required only then, server drops hidden values.

**Independent Test**: quickstart scenarios 2 to 4.

- [X] T012 [US2] In `lib/register/service.ts` make `splitValues` keep only fields visible for the submitted values (hidden answers never reach `form_data`).
- [X] T013 [P] [US2] Add `registerMessages.steps.fieldShown(label)` = „Neues Feld: <label>“ in `lib/register/messages.ts`.
- [X] T014 [US2] In `components/marketing/registration-form.tsx` render only `visibleFields(step.fields, values)`, validate steps and submit with visible fields only, clear errors of fields that become hidden, announce newly visible fields in the existing `aria-live` region, keep focus on the trigger, and fade in with the existing motion settings (no movement under `prefers-reduced-motion`).
- [X] T015 [US2] In `components/marketing/registration-steps.tsx` make `ReviewList` list only visible fields.

**Checkpoint**: Testansicht and landing behave as in spec US2; `testRegistrationAction` needs no change.

---

## Phase 5: User Story 5 · Schutz vor kaputten Bedingungen (P2)

**Goal**: renaming, removing answers, type or key change and deletion of a trigger are rejected.

**Independent Test**: quickstart scenario 7.

- [X] T016 [US5] Add copy `de.fields.errors.dependentBlocked(label)` = „„${label}“ hängt an diesem Feld. Passe zuerst dessen Bedingung an.“ in `lib/admin/messages.ts`.
- [X] T017 [US5] In `updateFieldAction` return `{ ok: false, error: dependentBlocked(label) }` when `newConditionProblems` reports problems on other fields (rename or removal of a referenced answer, type change, key change, trigger gets a condition).
- [X] T018 [US5] In `deleteFieldAction` reject with the same message when another field uses the deleted field as trigger.
- [X] T019 [US5] Mirror the check in `components/admin/field-form-dialog.tsx` before submit, so the admin sees the message without a round trip (server stays authoritative).

**Checkpoint**: every case of quickstart scenario 7 rejected; adding other answers still works.

---

## Phase 6: User Story 3 · Angabe im Adminbereich (P2)

**Goal**: same condition in the registration dialog; hidden values removed on save.

**Independent Test**: quickstart scenarios 3 and 5.

- [X] T020 [US3] In `components/admin/registration-form-dialog.tsx` compute visibility from `values.formData` plus `gender: GENDER_OPTIONS[values.gender]`, render and validate only visible dynamic fields.
- [X] T021 [US3] In `createRegistrationAction` and `updateRegistrationAction` in `app/admin/actions.ts` load the camp fields and apply `dropHiddenAnswers` to `formData` before saving (before any bus discount calculation).

**Checkpoint**: table, filters and CSV show the column with no extra code; dialog hides and prunes.

---

## Phase 7: User Story 4 · Teilnehmerseite (P3)

**Goal**: conditional field shown and changeable only when visible.

**Independent Test**: quickstart scenario 6.

- [X] T022 [US4] In `lib/participant/view.ts` filter `fieldRows` and `editableFields` by visibility of the stored answers (gender via `storedFieldValue`).
- [X] T023 [US4] In `lib/admin/participant-messages.ts` `applyParticipantChange`: after the patch apply `dropHiddenAnswers`; return `{ ok: false, reason: "field_gone" }` when the requested field is hidden after the patch.
- [X] T024 [P] [US4] Extend `tests/unit/participant-contact.test.ts` (or a view test next to it) for hidden rows and the pruned patch.

---

## Phase 8: Polish

- [X] T025 Run `npm run lint`, `npm test`, `npm run build` and report the output verbatim.
- [ ] T026 Walk through `quickstart.md` scenarios 1 to 9 in the dev server, including a camp without conditions (scenario 8).
- [X] T027 Check all new copy and comments for dash punctuation.

---

## Dependencies

- Phase 2 blocks all stories. T003 before T004 and T005.
- US1 (Phase 3) before US5 (Phase 5 uses the same actions and dialog).
- US2, US3, US4 depend only on Phase 2 and can follow US1 in any order.
- Polish last.

## Parallel examples

- After T003: T004 and T006 and T013 together.
- After Phase 2: T012 to T015 (US2), T020 to T021 (US3), T022 to T024 (US4) touch different files.

## Implementation strategy

MVP is Phase 2 plus US1 and US2: admins set „Eingeladen von“ and the public form asks for it.
Then US5 (protection), US3 (admin dialog), US4 (participant page), each testable on its own.
