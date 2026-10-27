# Research: Multi Step Registration Form

Feature: [spec.md](./spec.md) · Plan: [plan.md](./plan.md)

## R1 · How a step break is stored (FR-009, FR-011, FR-012)

**Decision**: A step break is a regular `camp_form_fields` row with `field_type = 'step'`. The
row's `label` is the step title, `config.helpText` is the optional subtitle, `required` is always
`false`, `options` is `null`. Its `key` is generated automatically (`schritt_<slug>` plus a numeric
suffix on collision) and is never shown or edited.

**Rationale**:
- `field_type` is plain `text` without a CHECK constraint (`0001_init_schema.sql:52`), so no
  migration and no type regeneration are needed (constitution IV: no rigid constraints).
- The field editor already orders rows by `sort_order` with drag and drop plus up and down
  buttons. A step break placed in that list gets reordering, deleting and editing for free (SC-006).
- One list stays the single source of truth for the form (constitution IV).

**Alternatives considered**:
- `config.step` number on every question: the admin would have to keep numbers consistent on each
  move; titles would need a second place to live. Rejected.
- New `camp_form_steps` table with a foreign key on fields: migration, new RLS, new admin CRUD and
  a join in three loaders for pure grouping. Rejected as overbuilt (constitution VII).

## R2 · Keeping step breaks out of data paths (FR-012)

**Decision**: One pure module `lib/register/steps.ts` with `isStepBreak(field)`,
`questionFields(fields)` and `buildSteps(fields)`. Every consumer that treats fields as answers
calls `questionFields` at its entry point:

| Consumer | Where filtered |
|----------|----------------|
| Register service validation and `form_data` split | `lib/register/service.ts` after `loadDynamicFields` |
| Registrations table, columns, CSV, admin edit dialog | `app/admin/page.tsx` after `getCampFormFields` |
| Dashboard metrics | `app/admin/dashboard-actions.ts` after `getCampFormFields` |
| Public form | uses `buildSteps`, renders only questions |

The field editor page keeps the unfiltered list because it must show and order step breaks.

**Rationale**: Filtering at the few loaders is cheaper and safer than teaching every renderer a new
type. A unit test asserts that `questionFields` never returns a step break.

**Alternatives considered**: filtering inside `getCampFormFields` with a flag. Rejected because the
same function feeds the editor, and a flag hides intent at call sites.

## R3 · Automatic split when no step break exists (FR-010, FR-011)

**Decision**: `buildSteps` returns:
1. Step 1 `Deine Daten` with the three core fields (always).
2. If the camp list contains at least one step break: questions before the first break form a
   step titled `Weitere Angaben`; each break opens a step with its title and subtitle; steps
   without questions are dropped.
3. If there is no break at all: questions are chunked in order into steps of at most
   `AUTO_STEP_SIZE = 4`, each titled `Weitere Angaben`.

The review is not part of `buildSteps`; the form appends it. The limits (`AUTO_STEP_SIZE = 4`,
`LONG_STEP_HINT = 6`) live as named constants in `lib/register/steps.ts` (constitution VII:
centralized limits).

## R4 · Animation approach (FR-013, FR-014, SC-004)

**Decision**: Use `motion/react` (already a dependency, v13.1, used in `mountain-hero.tsx` and
`parallax-image.tsx`). `AnimatePresence mode="popLayout"` with a `custom` direction value; the
entering step slides 24px from the direction of travel with opacity 0 to 1, the leaving step slides
24px the other way and fades. Duration 0.32s, easing `[0.22, 1, 0.36, 1]` (ease out quint like
curve). The card wraps the step in a `motion.div layout` so the height eases to the new content.
The progress bar fill animates its `scaleX` (transform only, no layout thrash).

`useReducedMotion()` switches variants to opacity only, 0.15s, and disables `layout`.

**Rationale**: Transform and opacity animations stay on the compositor and keep 60 fps on mid
range phones (SC-004). Reusing the installed library adds no dependency (constitution I).

**Alternatives considered**: CSS transitions with keyed remounts (no exit animation without extra
state), View Transitions API (uneven browser support, harder height handling). Rejected.

## R5 · Focus, announcements and scroll (FR-015, SC-005)

**Decision**: After a step change the step heading (`<h3 tabIndex={-1}>`) receives focus in an
effect keyed on the step index; a visually hidden `aria-live="polite"` region announces
`Schritt 2 von 5: Gesundheit`. If the form card top is above the viewport, it is scrolled into view
(`scrollIntoView({ block: "start" })`, `behavior: "smooth"` unless reduced motion). On validation
failure the first invalid input is focused instead. Step changes do not push history entries
(spec edge case).

## R6 · Enter key and submit semantics (FR-016)

**Decision**: The whole flow stays one `<form noValidate>`. `onSubmit` dispatches: on a question
step it runs "next"; on the review it sends. Enter in single line inputs therefore triggers "next"
natively, textareas keep newline behaviour, and screen reader users keep normal form semantics. The
back button is `type="button"`.

## R7 · Server field errors map to steps (FR-008)

**Decision**: `buildSteps` output is indexed with `stepIndexOf(steps, key)`. When `/api/register`
answers with `fieldErrors`, the form sets errors, finds the lowest step index among the keys and
navigates there (direction backwards). General errors (`closed`, `camp_full`, `throttled`,
`generic`) stay on the review above the submit button. The API contract is unchanged.

## R8 · Editing from the review (User Story 2)

**Decision**: Form state carries `returnToReview: boolean`. "Ändern" sets it and jumps to the step;
the primary button then reads `Zurück zur Übersicht`, validates the step and returns to the review.
Back from that step clears the flag and behaves normally.

## R9 · Design direction (constitution: UI work)

**Decision**: The form keeps the landing card (`rounded-card border bg-surface shadow-card`).
Inside, top to bottom: a compact progress header (step labels as small segments on wide screens,
`Schritt 2 von 5` plus a thin bar under 640px), the step title in `font-display` with optional
subtitle, the fields with the existing `gap-5`, then a sticky footer row with `Zurück` (ghost) left
and the primary action right, full width on phones. The review lists each step as a group with a
small `Ändern` text button aligned right and a definition list of label and value. `impeccable` and
`tasteskill` are applied during implementation for spacing, states and polish.

## R10 · Testing

**Decision**: Vitest unit tests for `lib/register/steps.ts` (`buildSteps` with no breaks, with
breaks, leading questions before the first break, consecutive and trailing breaks, empty camp;
`questionFields`; `stepIndexOf`) and an added case in the register service validation path that a
step break produces no `form_data` entry. Animation, focus and layout are checked manually per
[quickstart.md](./quickstart.md).
