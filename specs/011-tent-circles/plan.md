# Implementation Plan: Zeltkreise

**Branch**: `011-tent-circles` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-tent-circles/spec.md`

## Summary

A new admin tab „Zeltkreise“ (`/admin/zeltkreise`) lets the planner create tent circles for the
current camp, each with a name, a kind (gemischt, nur weiblich, nur männlich) and exactly one leader
chosen from the camp's registrations, and then assign active registrations as participants by drag
and drop or a „Zeltkreis wählen“ picker. There is no capacity. Leader and member rules (one circle per
person, leader never member, gender fits kind) are enforced in two Postgres functions under row locks.
The board, filters, person chips and unassigned panel are reused from room planning
(specs/008-room-planning) after small generalizing refactors. Includes stats and a print view.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 App Router (Server Components + Server Actions)

**Primary Dependencies**: existing Clerk, supabase-js (service role, server only), Zod, Tailwind,
`components/ui/*`, Phosphor icons, `@dnd-kit/core` (already installed). No new dependency.

**Storage**: Supabase Postgres. New tables `tent_circles`, `tent_circle_members`; functions
`fits_tent_circle`, `assign_tent_circle`, `save_tent_circle`.

**Testing**: Vitest for pure rules in `lib/admin/tent-circles.ts` (fits, summary, grouping, Zod);
existing `room-planning.test.ts` must stay green after the refactor; manual steps in
[quickstart.md](./quickstart.md).

**Target Platform**: Vercel; desktop, tablet and phone browsers.

**Project Type**: web application (single Next.js project).

**Performance Goals**: tab renders with 4 queries; moves feel instant (optimistic UI).

**Constraints**: all writes behind `requirePermission("tentCircles")`; rules in the database under
lock; German UI; no dashes in UI copy.

**Scale/Scope**: under 40 circles, under 300 registrations per camp.

## Existing code inspected

- `supabase/migrations/0009_room_planning.sql`: `assign_room` lock pattern, grants.
- `lib/admin/rooms-data.ts`: `loadPeople`, `loadCamp`, `getRoomPlan`, `syncRoomAssignment`,
  `setRegistrationGender`.
- `lib/admin/room-planning.ts`: Zod name field, `matchesFilter`, `groupUnassigned`, `ageAt`,
  `findBirthdateKey`, `PersonFilter`.
- `components/admin/room-planner.tsx`, `room-card.tsx`, `person-chip.tsx`, `person-filters.tsx`,
  `unassigned-panel.tsx`, `room-picker-dialog.tsx`, `room-forms.tsx`, `room-styles.ts`.
- `app/admin/zimmerplanung/{page.tsx, actions.ts, druck/page.tsx}`: guard, actions, print.
- `lib/admin/access.ts`, `components/admin/nav-items.ts`, `components/admin/admin-sidebar.tsx`,
  `lib/admin/messages.ts` (`PERMISSION_LABELS`, `de.nav`, `de.rooms`).
- `app/admin/actions.ts`: registration update calls `syncRoomAssignment`.

## Decisions

See [research.md](./research.md): R1 table shape with leader column, R2 two locked functions, R3
cancel keeps rows and reads filter, gender change syncs, R4 reuse room planning UI, R5 permission
`tentCircles`, R6 optimistic board and print.

## UI design

Design work uses the `impeccable` and `tasteskill` skills during implementation and stays visually
consistent with the Zimmerplanung.

- **Layout (desktop ≥ 1024 px)**: header with camp badge, „Zeltkreis anlegen“ and „Drucken“; a row of
  4 stat cards (Zeltkreise, Verteilt, Noch ohne Zeltkreis, Ø Teilnehmer); below the split from room
  planning: left the sticky panel „Noch ohne Zeltkreis“ with the same filters, right a responsive grid
  of circle cards (2 to 3 columns).
- **Circle card**: name, kind tag (text plus color: neutral for gemischt, female and male tones from
  `room-styles.ts`), a leader row set apart (crown or star icon, label „Leitung“, name, age; or a
  dashed „Leiter fehlt · Leiter wählen“ slot), count „12 Teilnehmer“ with a small split bar weiblich
  and männlich, participant chips (draggable, menu: Zeltkreis wechseln, Aus Zeltkreis entfernen), card
  menu: Bearbeiten, Löschen. No capacity, so the card grows; above 12 chips the list gets a calm
  „alle anzeigen“ toggle.
- **Circle dialog**: name, kind as segmented control, leader as a searchable list of active
  registrations filtered to fitting and not leading people; people who are currently participants are
  marked „ist Teilnehmer in X“.
- **Drag feedback**: drag overlay chip; fitting circles get the accent outline, non fitting circles
  dim with a short reason („Nur weiblich“). Leaders are not draggable.
- **Tablet and phone (< 1024 px)**: circles stack; panel becomes the bottom sheet; tap → „Zeltkreis
  wählen“ lists only fitting circles.
- **States**: empty (no circles: short explanation and „Zeltkreis anlegen“; everyone assigned: „Alle
  sind in einem Zeltkreis“), no current camp hint, error toasts.
- **Print**: `/admin/zeltkreise/druck`, circles as boxes with leader on top and sorted participants,
  `break-inside: avoid`.

## Files likely to change

New:

- `supabase/migrations/0010_tent_circles.sql`
- `lib/admin/tent-circles.ts` (Zod schemas, `fitsCircle`, `summarizeCircles`, grouping)
- `lib/admin/tent-circles-data.ts` (server only reads and writes, `syncTentCircle`)
- `lib/admin/planning-data.ts` (shared camp and people loaders moved from `rooms-data.ts`)
- `app/admin/zeltkreise/page.tsx`, `actions.ts`, `druck/page.tsx`
- `components/admin/tent-circle-planner.tsx`, `tent-circle-card.tsx`, `tent-circle-dialog.tsx`,
  `tent-circle-picker-dialog.tsx`
- `tests/unit/tent-circles.test.ts`

Changed:

- `lib/database.types.ts` (regenerated), `lib/admin/types.ts`, `lib/admin/messages.ts`
  (`de.tentCircles`, `de.nav.tentCircles`, `PERMISSION_LABELS.tentCircles`),
  `components/admin/nav-items.ts`, `components/admin/admin-sidebar.tsx` (icon)
- `lib/admin/rooms-data.ts`, `lib/admin/room-planning.ts` (take `PlanningPersonBase`),
  `components/admin/unassigned-panel.tsx` (title and empty text as props),
  `components/admin/room-planner.tsx` (pass those props)
- `app/admin/actions.ts` (call `syncTentCircle`)
- `supabase/seed.sql`
- `AGENTS.md` sections 4, 5 and quick reference (scope amendment, see below)

## Scope amendment

Constitution III only allows features listed in AGENTS.md section 4. Zeltkreise are on no MUST NOT
list, so the constitution stays unchanged. Before implementation AGENTS.md gets:

- Section 4 admin dashboard: „Tent circles (`/admin/zeltkreise`): per camp circles with name, kind
  (mixed, female, male) and exactly one leader from the camp's registrations; drag and drop or click
  assignment of active registrations as participants, no capacity; print view (specs/011-tent-circles).“
- Section 5: `tent_circles`, `tent_circle_members`.

## Security requirements

- Page guarded by `guardTab("/admin/zeltkreise")`; every action by `requirePermission("tentCircles")`.
- Camp id resolved on the server; circle and registration ids checked against the camp inside the
  database functions and in `deleteTentCircleAction` (`eq("camp_id", campId)`).
- New tables have RLS on and no policies; only the service role client touches them.
- Names of minors only in the protected admin area and the protected print route.

## Constitution Check

| Principle | Status |
|-----------|--------|
| I. Fixed Stack, Clerk Owns Auth | Pass. No new dependency. |
| II. Server Is the Security Boundary | Pass. Server Actions with `requirePermission`, service role only on the server, rules in DB functions. |
| III. Strict Scope | Pass after the AGENTS.md section 4 amendment above. |
| IV. Single Source of Truth | Pass. Schema via migration, types regenerated; `kind` check is structural, not a registration value; filters and person UI reused, not duplicated. |
| V. Language Separation | Pass. Code English (`tent_circles`, `kind`, `leader`), UI German in `de.tentCircles`. |
| VI. Tolerant Payment, Hidden Pricing | Pass. Unpaid registrations take part like paid ones. |
| VII. Simplicity and Honest Quality Gates | Pass. No auto assignment, no copy from last year; lint, test, build reported verbatim. |

Post design re-check: unchanged, all pass.

## Acceptance criteria

The acceptance scenarios of user stories 1 to 5 and FR-001 to FR-025 in [spec.md](./spec.md).

## Checks to run

`npm run lint`, `npm test`, `npm run build`.

## Manual test steps

See [quickstart.md](./quickstart.md).

## Project Structure

```text
specs/011-tent-circles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/server-actions.md
└── tasks.md            (next: /speckit-tasks)
```

**Structure Decision**: single Next.js project, following the room planning tab layout.

## Complexity Tracking

No violations.
