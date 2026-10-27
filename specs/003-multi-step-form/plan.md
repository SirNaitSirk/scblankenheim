# Implementation Plan: Multi Step Registration Form

**Branch**: `003-multi-step-form` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-multi-step-form/spec.md`

## Summary

The public registration form (`components/marketing/registration-form.tsx`) renders every field in
one list. This plan turns that same component into a stepped flow:

1. A new field type `step` in the existing `camp_form_fields` list marks where a step starts and
   carries its title and subtitle; no migration ([R1](./research.md#r1--how-a-step-break-is-stored-fr-009-fr-011-fr-012)).
2. A pure module `lib/register/steps.ts` derives steps (core step, admin steps or automatic chunks
   of 4) and filters step breaks out of every data path ([R2](./research.md#r2--keeping-step-breaks-out-of-data-paths-fr-012), [R3](./research.md#r3--automatic-split-when-no-step-break-exists-fr-010-fr-011)).
3. The form shows one step at a time with a progress header, per step validation, a review with
   edit links, server error routing to the right step, and direction aware `motion` transitions
   that fall back to a fade for reduced motion ([R4](./research.md#r4--animation-approach-fr-013-fr-014-sc-004) to [R8](./research.md#r8--editing-from-the-review-user-story-2)).
4. The field editor gets a `Schrittwechsel` button, a reduced dialog for that type, a distinct
   list row and a stepped preview ([contract](./contracts/field-editor-step-break.md)).
5. Unit tests for the step rules.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.3 (App Router)

**Primary Dependencies**: `motion` 13.1 (already installed, `motion/react`), `zod` 4, Tailwind CSS 4,
`@phosphor-icons/react`, UI primitives in `components/ui/`

**Storage**: Supabase Postgres, table `camp_form_fields` (existing columns only)

**Testing**: Vitest (`tests/unit/`), manual scenarios in [quickstart.md](./quickstart.md)

**Target Platform**: Vercel; modern mobile and desktop browsers

**Project Type**: Web application (single Next.js app)

**Performance Goals**: step transition finished under 0.5s, no visible jank on mid range phones
(transform and opacity only)

**Constraints**: no new dependency, no migration, one public form, German copy in the messages
module, no dashes in copy

**Scale/Scope**: one camp, typically 5 to 25 questions, a few hundred registrations per year

## Constitution Check

*Gate before Phase 0 and rechecked after Phase 1.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Fixed stack, Clerk owns auth | Pass | Uses installed `motion`; no auth change. react-hook-form is still not installed; the form keeps its existing `useState` pattern (spec 001 precedent), adding it now would be an unrelated refactor. |
| II. Server is the security boundary | Pass | Field editor writes keep `requirePermission`; register API unchanged and still validates everything server side. |
| III. Strict scope | Pass | Improves the in scope public form and field configuration; nothing from the drop list. |
| IV. Single source of truth | Pass | Still exactly one public form; steps derive from `camp_form_fields`; no CHECK constraint, no migration. |
| V. Language separation | Pass | New copy in `lib/register/messages.ts` and `lib/admin/messages.ts`; code English (`buildSteps`, `isStepBreak`). Generated key prefix `schritt_` is data, not an identifier. |
| VI. Tolerant payment, hidden pricing | Pass | Untouched; invitation token passes through unchanged. |
| VII. Simplicity, honest gates | Pass | One pure module, limits as constants, lint, test and build run after implementation. |
| Writing rules | Pass | Copy reviewed for dashes; button text `Zurück zur Übersicht`, `Verbindlich anmelden`. |

Post design recheck: no violations, Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-multi-step-form/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── stepped-form-ui.md
│   └── field-editor-step-break.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code

```text
lib/register/
├── steps.ts                      # NEW: FormStep, isStepBreak, questionFields, buildSteps, stepIndexOf, limits
├── messages.ts                   # + steps copy group
└── service.ts                    # questionFields() before mergeFields()
lib/admin/
├── field-types.ts                # + "step"; isQuestionType helper
└── messages.ts                   # + step break editor copy, type label
app/admin/
├── page.tsx                      # questionFields() for table, columns, CSV, edit dialog
├── dashboard-actions.ts          # questionFields() for metrics
└── camps/[campId]/felder/actions.ts  # schema branch for "step", generated key
components/marketing/
├── registration-form.tsx         # stepped flow, review, motion
└── registration-steps.tsx        # NEW: StepProgress, ReviewList (presentational)
components/admin/
├── fields-manager.tsx            # Schrittwechsel button, distinct row
├── field-form-dialog.tsx         # reduced fields for type "step"
└── field-preview.tsx             # grouped by steps, long step hint
tests/unit/
└── steps.test.ts                 # NEW
```

**Structure Decision**: Single Next.js app as in spec 001. The form component stays the only public
form; presentational parts move to one sibling file to keep `registration-form.tsx` readable.

## Files likely to change and why

- `lib/register/steps.ts` (new): all step derivation, shared by public form, preview and filters.
- `components/marketing/registration-form.tsx`: core of the feature.
- `lib/register/service.ts`, `app/admin/page.tsx`, `app/admin/dashboard-actions.ts`: keep step
  breaks out of answers, columns, CSV and metrics (FR-012).
- Field editor trio and `felder/actions.ts`: User Story 3.

## Security

- No new route; the field editor actions keep `requirePermission` and Zod validation.
- A crafted public submission with a step break key is ignored because the service validates and
  splits only `questionFields` (unit tested).

## Acceptance criteria

The acceptance scenarios of [spec.md](./spec.md) User Stories 1 to 3, FR-001 to FR-020 and SC-001
to SC-006, verified through [quickstart.md](./quickstart.md).

## Coordination

`specs/002-landing-page-redesign` (draft, untracked) embeds the form anew in a new landing layout.
This plan changes only the inside of the form card and keeps the component props, so both can land
in either order.

## Complexity Tracking

None.
