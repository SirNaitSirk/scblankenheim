---

description: "Task list for the multi step registration form"
---

# Tasks: Multi Step Registration Form

**Input**: Design documents from `/specs/003-multi-step-form/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Requested by the plan (research R10): Vitest unit tests for `lib/register/steps.ts` and
the step break filter in the register service. Motion, focus and layout are verified manually
through quickstart.md.

**Organization**: Tasks are grouped by user story (US1 to US3 from spec.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Paths are relative to the repository root

---

## Phase 1: Setup

**Purpose**: None needed. `motion` 13.1 and Vitest are already installed; no migration.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Step type, step derivation and copy that every story uses.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 Add `"step"` to `FIELD_TYPES` and add `isQuestionType(type: string): boolean` (true for every type except `"step"`) in lib/admin/field-types.ts; add the German type label `step: "Schrittwechsel"` to `de.fields.types` in lib/admin/messages.ts so the `Record<FieldType, string>` stays complete
- [X] T002 [P] Add a `steps` group to `registerMessages` in lib/register/messages.ts with exactly the keys from contracts/stepped-form-ui.md: `coreTitle: "Deine Daten"`, `autoTitle: "Weitere Angaben"`, `reviewTitle: "Angaben prüfen"`, `reviewIntro: "Schau kurz drüber, bevor du die Anmeldung abschickst."`, `next: "Weiter"`, `back: "Zurück"`, `backToReview: "Zurück zur Übersicht"`, `edit: "Ändern"`, `submit: "Verbindlich anmelden"`, `progress: (n, total) => "Schritt n von total"`, `announce: (n, total, title) => "Schritt n von total: title"`, `yes: "Ja"`, `no: "Nein"`, `empty: "Keine Angabe"`, `editStep: (title) => "title ändern"` (accessible label); no dashes in any string
- [X] T003 Create lib/register/steps.ts with `AUTO_STEP_SIZE = 4`, `LONG_STEP_HINT = 6`, type `FormStep = { id: string; title: string; subtitle: string | null; fields: CampFormField[] }`, `isStepBreak(field)`, `questionFields(fields)` (drops every step break), `buildSteps(dynamicFields): FormStep[]` per data-model.md rules (step 0 `core` with `CORE_FIELDS` and `steps.coreTitle`; with breaks: leading questions into a `steps.autoTitle` step, each break opens a step using `label` as title and `config.helpText` as subtitle, steps with zero questions dropped; without breaks: chunks of `AUTO_STEP_SIZE` titled `steps.autoTitle` with ids `auto-<n>`), and `stepIndexOf(steps, key): number` (−1 when not found); dynamic core keys are excluded the same way `mergeFields` does
- [X] T004 [P] Create tests/unit/steps.test.ts covering: no dynamic fields gives only the core step; 9 questions without breaks give chunks 4, 4, 1; leading questions before the first break; consecutive breaks and a trailing break produce no empty step; subtitle read from `config.helpText`; `questionFields` never returns a `step` row; `stepIndexOf` for core key, dynamic key and unknown key
- [X] T005 Use `questionFields` in lib/register/service.ts right after `loadDynamicFields` so validation, `splitValues` and `selectedOptionLimits` never see step breaks; add a case to tests/unit/validation.test.ts (or steps.test.ts) asserting `mergeFields(questionFields(fields))` drops a `step` row whose key was posted in `values`
- [X] T006 [P] Use `questionFields` on the result of `getCampFormFields` in app/admin/page.tsx (table, columns, CSV, registration dialogs) and app/admin/dashboard-actions.ts (metrics)

**Checkpoint**: `npm test` green; step rows can exist in the DB without leaking into answers.

---

## Phase 3: User Story 1 · Anmeldung Schritt für Schritt ausfüllen (Priority: P1) 🎯 MVP

**Goal**: The public form shows one step at a time with progress, per step validation, back
without data loss, Enter as Next and calm, direction aware motion with a reduced motion fallback.

**Independent Test**: Camp with at least 8 questions and no breaks; only one step visible at a
time, Next validates, Back keeps values (quickstart scenarios 1 to 3, 8 to 10).

- [X] T007 [P] [US1] Create components/marketing/registration-steps.tsx with `StepProgress({ steps, current, total })`: segments with titles at ≥640px, `progress(n, total)` text plus a thin bar below 640px, bar fill animated via `motion` `scaleX` (0.32s, ease `[0.22, 1, 0.36, 1]`, none under `useReducedMotion`), segments `aria-hidden`, colors from existing tokens (`bg-accent`, `bg-ink-100`)
- [X] T008 [US1] Restructure components/marketing/registration-form.tsx: derive `steps = buildSteps(fields)` (memoised), keep `values`/`errors`, add `stepIndex`, `direction: 1 | -1`; `onSubmit` on a question step validates only `steps[stepIndex].fields` with `validateField`, on failure sets errors and focuses the first invalid input (by id `reg-<key>`), on success moves forward; Back button `type="button"` shown from step 2, moves back without validation; invitation hint renders inside step 1; keep `FormField`, `SeatNote`, `Notice` unchanged
- [X] T009 [US1] Add motion to components/marketing/registration-form.tsx: wrap the step body in `AnimatePresence mode="popLayout" initial={false} custom={direction}` with variants `enter: x = 24 * direction, opacity 0`, `center: x 0, opacity 1`, `exit: x = −24 * direction, opacity 0`, duration 0.32s, ease `[0.22, 1, 0.36, 1]`; the card body is a `motion.div layout` so height eases; with `useReducedMotion()` use opacity only at 0.15s and no `layout`
- [X] T010 [US1] Add focus, announcement and scroll in components/marketing/registration-form.tsx: step heading `<h3 tabIndex={-1}>` in `font-display` with optional subtitle, focused after each step change (not on first render); visually hidden `aria-live="polite"` region with `steps.announce(n, total, title)`; if the card top is above the viewport, `scrollIntoView({ block: "start", behavior })` with `"auto"` under reduced motion; no history entries
- [X] T011 [US1] Footer layout in components/marketing/registration-form.tsx: `Zurück` ghost left, primary `Weiter` right on ≥640px; on phones stacked full width with the primary first; min touch height 44px

**Checkpoint**: Stepping works end to end except the final submit (temporarily the last question step submits as before until US2 lands).

---

## Phase 4: User Story 2 · Angaben prüfen und absenden (Priority: P1)

**Goal**: A review after the last question step, edit per step with return to review, submit from
the review only, server field errors routed to the right step, reset after success.

**Independent Test**: quickstart scenarios 5 to 7.

- [X] T012 [P] [US2] Add `ReviewList({ steps, values, onEdit })` to components/marketing/registration-steps.tsx: one group per step with heading and an `Ändern` text button (`aria-label` from `steps.editStep(title)`), a `<dl>` of label and value; checkbox as `Ja`/`Nein`, empty as `Keine Angabe`, `date` formatted `de-DE` (`TT.MM.JJJJ`), select and text as entered
- [X] T013 [US2] In components/marketing/registration-form.tsx treat `stepIndex === steps.length` as the review: title `steps.reviewTitle`, intro, `ReviewList`, server error banner above primary `Verbindlich anmelden` (`Wird gesendet …` while submitting); `onSubmit` on the review validates all fields, on failure jumps to the first invalid step, else posts to `/api/register` exactly as today; progress counts the review as the last station
- [X] T014 [US2] Add `returnToReview` state in components/marketing/registration-form.tsx: `onEdit(i)` sets it and jumps to step i (direction −1); the primary button then reads `steps.backToReview` and returns to the review after validating; Back clears the flag
- [X] T015 [US2] Route server `fieldErrors` in components/marketing/registration-form.tsx: set errors, compute the lowest `stepIndexOf` among the keys, navigate there with direction −1 and focus the first invalid field; general errors stay on the review
- [X] T016 [US2] Update `resetForm` in components/marketing/registration-form.tsx to also reset `stepIndex` to 0, `direction` to 1 and `returnToReview` to false; invitation token stays

**Checkpoint**: User Stories 1 and 2 complete the public flow; MVP shippable with automatic steps.

---

## Phase 5: User Story 3 · Admin legt die Schritte fest (Priority: P2)

**Goal**: Admins insert, edit, move and delete titled step breaks in the field editor; the preview
shows the steps.

**Independent Test**: quickstart scenario 4.

- [X] T017 [P] [US3] Add admin copy to lib/admin/messages.ts: `de.fields.addStep: "Schrittwechsel"`, `de.fields.stepBadge: "Schritt"`, dialog titles `createStepTitle: "Schrittwechsel hinzufügen"`, `editStepTitle: "Schrittwechsel bearbeiten"`, labels `stepTitle: "Titel"`, `stepSubtitle: "Untertitel"`, hint `stepSubtitleHint: "Optional, erscheint unter dem Titel."`, preview hint `longStep: "Langer Schritt: Überleg, ihn zu teilen."`, errors `stepTitleTooLong: "Höchstens 60 Zeichen"`, `stepSubtitleTooLong: "Höchstens 140 Zeichen"`
- [X] T018 [US3] Extend `fieldSchema` in app/admin/camps/[campId]/felder/actions.ts: for `fieldType === "step"` require label "max 60 characters", helpText "max 140 characters", skip key checks, and in `transform` force `required: false`, `options: null`, `config: { placeholder: null, helpText, capacity: null }`; on create generate the key `schritt_<slug>` (same slug rules as the dialog, extracted to a shared `slugifyKey` in lib/admin/field-types.ts) and retry with suffix `_2` to `_5` on `isUniqueViolation`; on update keep the stored key; permissions and `writeLog` unchanged
- [X] T019 [US3] Update components/admin/field-form-dialog.tsx: accept an optional `initialType` prop; when `fieldType === "step"` show only `Titel` (maxLength 60) and `Untertitel` (maxLength 140, stored in `helpText`) and hide key, required, placeholder, options and capacity; use the step dialog titles; switch to the shared `slugifyKey`
- [X] T020 [US3] Update components/admin/fields-manager.tsx: second header button `Schrittwechsel` (phosphor `Rows` icon, `variant="outline"`) opening the dialog with `initialType="step"`, also in the empty state; render step rows distinctly (accent left border, `Schritt` badge, semibold title, muted subtitle, no key line, no required badge) while keeping drag, up, down, edit and delete
- [X] T021 [US3] Update components/admin/field-preview.tsx to group with `buildSteps` and render each step title as a small heading with its questions; show `de.fields.longStep` muted under a step with more than `LONG_STEP_HINT` questions; step rows themselves are never rendered as inputs

**Checkpoint**: All three stories work independently.

---

## Phase 6: Polish & Cross Cutting

- [X] T022 Design pass on the stepped form and review with the `impeccable` and `tasteskill` skills: spacing rhythm, heading scale, focus rings, error and loading states, 375px and 1280px widths; fix findings in components/marketing/registration-form.tsx and components/marketing/registration-steps.tsx
- [X] T023 [P] Scan all new copy in lib/register/messages.ts and lib/admin/messages.ts and new comments for dash punctuation and hyphenated words (writing rules)
- [X] T024 Run `npm run lint`, `npm test`, `npm run build` and report output verbatim
- [X] T025 Walk through quickstart.md scenarios 1 to 10 in the browser preview and record results

---

## Dependencies & Execution Order

- Phase 2 (T001 to T006) blocks all stories. T003 depends on T001 and T002; T004 and T005 depend on T003; T006 depends on T003.
- US1 (T007 to T011) depends on Phase 2.
- US2 (T012 to T016) depends on US1 (same component, review is the last station).
- US3 (T017 to T021) depends only on Phase 2 and can run in parallel with US1 and US2 (different files).
- Polish depends on all stories.

## Parallel Opportunities

- T002 alongside T001; T004 and T006 alongside T005 once T003 is done.
- T007 and T012 (registration-steps.tsx) can be drafted while T008 is in progress, but touch the same file as each other, so run them one after the other.
- The whole of US3 alongside US1 and US2.

## Implementation Strategy

1. Phase 2, then US1 and US2 together: the public form is stepped with automatic chunks and a review. This is the MVP and already solves "zu lang".
2. US3: admins name and place steps.
3. Polish pass and checks.
