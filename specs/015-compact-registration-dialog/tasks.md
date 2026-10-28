# Tasks: Kompakterer Anmeldedialog im Adminbereich

**Input**: Design documents from `specs/015-compact-registration-dialog/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-layout.md, quickstart.md

**Tests**: one small unit test for the pure grouping helper (plan decision 4); everything else is verified manually per quickstart.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

No setup needed (no dependencies, no migration).

## Phase 2: Foundational

- [X] T001 [P] Create `splitCampFields(fields: CampFormField[]): SplitCampFields` in `lib/admin/form-layout.ts`, returning `{ inputs, toggles }` where `toggles` holds every field with `fieldType === "checkbox"` and `inputs` all others, "each in the original configured order"
- [X] T002 [P] Add unit tests in `tests/unit/form-layout.test.ts`: mixed list keeps order within both groups, empty list returns two empty arrays, list without checkboxes returns empty `toggles`

**Checkpoint**: `npm test` passes for the helper.

## Phase 3: User Story 1 · Mehr Felder auf einen Blick (P1) 🎯 MVP

**Goal**: wider dialog with multi column grids so many camp fields fit on screen.

**Independent Test**: quickstart scenario 1 (1440 × 900, 12 camp fields, at most one scroll).

- [X] T003 [US1] Pass `className="max-w-lg sm:max-w-2xl lg:max-w-5xl"` to `Dialog` in `components/admin/registration-form-dialog.tsx` (only this dialog, shared `components/ui/dialog.tsx` stays untouched)
- [X] T004 [US1] Change the contact and registration grids in `components/admin/registration-form-dialog.tsx` to `grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4`; keep the amount pair as one cell
- [X] T005 [US1] Render camp fields via `splitCampFields` in `components/admin/registration-form-dialog.tsx`: inputs in `grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3`, textarea fields with `sm:col-span-full`, toggles below in `grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3`; skip a grid when its group is empty
- [X] T006 [US1] Tighten form rhythm in `components/admin/registration-form-dialog.tsx`: form `gap-7` to `gap-5`, no change to control heights

**Checkpoint**: desktop layout matches contracts/ui-layout.md.

## Phase 4: User Story 2 · Mobil bleibt bedienbar (P2)

**Goal**: no regression on small screens.

**Independent Test**: quickstart scenarios 2 and 3.

- [X] T007 [US2] Verify in the browser preview at 375 px and 768 px that `components/admin/registration-form-dialog.tsx` shows 1 and 2 columns without horizontal scrolling; fix classes there if not

## Phase 5: Polish & Cross Cutting

- [X] T008 Verify edge cases from spec.md in the preview: field errors stay in their cell, payment link panel intact, create mode prefills the amount, dark theme, another dialog keeps its width
- [X] T009 Run `npm run lint` and `npm test`, report output verbatim

## Dependencies & Execution Order

- T001 and T002 run in parallel (different files); T005 depends on T001.
- T003, T004, T006 touch the same file as T005, so they run sequentially after T001.
- Phase 4 and 5 depend on Phase 3.

## Parallel Example

```text
T001 lib/admin/form-layout.ts
T002 tests/unit/form-layout.test.ts
```

## Implementation Strategy

MVP is Phase 2 plus Phase 3 (User Story 1). Phase 4 is a verification pass that confirms mobile is unchanged; Phase 5 closes with checks.
