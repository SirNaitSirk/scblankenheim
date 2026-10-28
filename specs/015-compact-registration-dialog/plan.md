# Implementation Plan: Kompakterer Anmeldedialog im Adminbereich

**Branch**: `015-compact-registration-dialog` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-compact-registration-dialog/spec.md`

## Summary

The registration dialog in the admin list is 512 px wide and renders every camp field in one column,
so camps with many fields produce a very long dialog. The fix is presentation only: widen this one
dialog on large screens, lay out short fields in a responsive grid (1, 2, 3 columns), let textareas
span the full row, collect checkbox fields into a compact toggle grid at the end of the camp field
section, and tighten vertical spacing slightly. No data, validation or behaviour changes.

## Technical Context

**Language/Version**: TypeScript, React 19, Next.js 16 (App Router)

**Primary Dependencies**: Tailwind CSS, existing `components/ui` primitives (`Dialog`, `Field`, `Input`, `Select`, `Textarea`, `Switch`)

**Storage**: none touched

**Testing**: Vitest unit test for the field grouping helper; manual check in the browser preview

**Target Platform**: admin dashboard in desktop and mobile browsers

**Project Type**: web application (Next.js full stack)

**Performance Goals**: no measurable change; layout only

**Constraints**: mobile (< 640 px) stays single column without horizontal scroll; light and dark admin theme; other dialogs unchanged

**Scale/Scope**: 1 component changed, 1 tiny helper plus test added

## Existing Code Inspected

- `components/ui/dialog.tsx`: panel is `max-w-lg`, accepts `className` merged via `cn`, so width can be overridden per dialog without touching the primitive. Header and footer are already sticky (body scrolls in between), FR-007 is satisfied by the existing structure.
- `components/admin/registration-form-dialog.tsx`: form uses `gap-7` between sections; contact and registration sections use `sm:grid-cols-2`; camp fields use `flex flex-col gap-4`; checkbox fields render as `Switch`.
- `components/ui/input.tsx` `Field`: `flex min-w-0 flex-col gap-1.5`, error and hint render below the control, so a grid cell keeps its error inside the cell.
- `components/admin/payment-link-panel.tsx`: self contained panel with `sm:flex-row`, works at any width.

## Decisions

1. **Width**: pass `className="max-w-lg sm:max-w-2xl lg:max-w-5xl"` to `Dialog` from the registration dialog only. `tailwind-merge` in `cn` resolves the conflict with the base `max-w-lg`. The outer wrapper keeps its `p-4 sm:p-6` margin to the viewport (FR-001).
2. **Contact section**: `grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4` (first name, last name, mail, gender in one row on desktop).
3. **Registration section**: same grid; tier, status, payment and the amount pair. The amount pair stays one cell with two inputs, so on desktop the row is tier, status, payment, amounts.
4. **Camp fields**: a pure helper `splitCampFields(fields)` returns `{ inputs, toggles }` preserving the configured order inside each group. `inputs` render in `grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3`; textarea fields get `sm:col-span-full`. `toggles` render below in `grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3`.
5. **Spacing**: form `gap-7` becomes `gap-5`; field rows `gap-4` become `gap-y-3`. Control heights and click targets stay unchanged (FR-006).
6. **Edge cases**: no camp fields keeps the section hidden (existing check); no toggles or no inputs skips the respective grid; grid items start left so one or two fields leave no odd gaps; `min-w-0` on `Field` lets long labels wrap.
7. **Accessibility order**: DOM order equals visual order (inputs, then toggles), so tab order matches what the admin sees. Grouping toggles at the end was approved with the spec.

## Files Likely to Change

- `components/admin/registration-form-dialog.tsx` (layout classes, use of the helper)
- `lib/admin/form-layout.ts` (new, `splitCampFields`)
- `tests/unit/form-layout.test.ts` (new)

## Security Requirements

None affected. No new data reaches the browser, no server code, no permissions.

## Constitution Check

| Principle | Status |
| --- | --- |
| I. Fixed Stack, Clerk Owns Auth | Complies: Tailwind and existing primitives only |
| II. Server Is the Security Boundary | Complies: no server or data change |
| III. Strict Scope | Complies: only the registration dialog, no new features |
| IV. Single Source of Truth | Complies: fields still come from `camp_form_fields`; one form component |
| V. Language Separation | Complies: code English, no new UI copy |
| VI. Tolerant Payment, Hidden Pricing | Complies: untouched |
| VII. Simplicity and Honest Quality Gates | Complies: one small typed helper with a test, no refactor of the shared `Dialog` |
| Writing Rules | Complies: no dash punctuation in comments or docs |

Post design re check: still compliant, no complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/015-compact-registration-dialog/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui-layout.md
└── tasks.md
```

### Source Code

```text
components/admin/registration-form-dialog.tsx
lib/admin/form-layout.ts
tests/unit/form-layout.test.ts
```

**Structure Decision**: existing Next.js layout; helper lives in `lib/admin/` next to other admin helpers so it can be unit tested without React.

## UI Notes (layout, typography, spacing, color, states)

- Layout and responsiveness: see [contracts/ui-layout.md](./contracts/ui-layout.md).
- Typography and color: unchanged tokens; section headings keep the small uppercase muted style.
- Spacing: tighter rhythm as in decision 5.
- States: saving, form error banner and field errors unchanged; empty camp field list hides the section as today.

## Checks to Run

- `npm run lint`
- `npm test`
- `npm run build` is not required (no routes, config or server code), but cheap to run as a type check.

## Acceptance Criteria

See spec FR-001 to FR-010 and SC-001 to SC-004.

## Manual Test Steps

See [quickstart.md](./quickstart.md).

## Complexity Tracking

No violations.
