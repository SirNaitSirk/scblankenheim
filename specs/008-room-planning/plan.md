# Implementation Plan: Zimmerplanung

**Branch**: `008-room-planning` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-room-planning/spec.md`

## Summary

A new admin tab „Zimmerplanung“ (`/admin/zimmerplanung`) lets the planner maintain global houses and
rooms, mark each room female or male for the current camp, and assign active registrations to rooms
by drag and drop or by a „Zimmer wählen“ menu. Gender becomes a fixed core field of the one
registration form, stored in a new `registrations.gender` column. Capacity and gender rules are
enforced in Postgres functions under a row lock, so rooms are never overbooked or mixed. An empty
room automatically adopts the gender of the first person dropped in. People can be searched and
filtered by name, gender, age and any field of the camp's registration form; matches are highlighted
in the rooms. Includes summary stats and a print view.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 App Router (Server Components + Server Actions)

**Primary Dependencies**: existing Clerk, supabase-js (service role, server only), Zod, Tailwind,
`components/ui/*`, Phosphor icons, motion. **New**: `@dnd-kit/core` (research R5).

**Storage**: Supabase Postgres. New tables `houses`, `rooms`, `camp_rooms`, `room_assignments`;
new column `registrations.gender`; three plpgsql functions; replaced `create_public_registration`.

**Testing**: Vitest (`npm test`) for pure rules in `lib/admin/room-planning.ts` and the gender core
field validation; manual steps in [quickstart.md](./quickstart.md).

**Target Platform**: Vercel; desktop, tablet and phone browsers.

**Project Type**: web application (single Next.js project).

**Performance Goals**: tab renders with 4 queries; a move feels instant (optimistic UI), server
confirmation within a normal round trip.

**Constraints**: all writes server side behind `requirePermission("rooms")`; rules enforced in the
database under lock; German UI; no dashes in UI copy.

**Scale/Scope**: under 10 houses, under 50 rooms, under 300 registrations per camp.

## Existing code inspected

- `lib/register/validation.ts`: `CORE_FIELDS` / `CORE_KEYS` pattern for fixed, column backed fields
  rendered on the first form step. Gender joins as a `select` core field.
- `lib/register/service.ts`: `splitValues` splits core vs `form_data`; calls
  `create_public_registration` RPC (migration 0005) with core columns.
- `lib/admin/access.ts`, `components/admin/nav-items.ts`, `lib/admin/messages.ts`
  (`PERMISSION_LABELS`, `de.nav`): tab and permission registry.
- `lib/admin/guard.ts`: `guardTab` for pages, `requirePermission` for actions.
- `app/admin/preise/actions.ts`: `runGuarded`, `fieldErrorResult`, `actorLabel`, `writeLog` pattern
  to copy.
- `lib/admin/data.ts`: service role reads and writes, `reorderFormFields` ownership check pattern,
  `updateRegistration`, `setRegistrationDeleted`.
- `components/admin/registration-form-dialog.tsx`: admin edit dialog (gets a gender select).
- `components/admin/fields-manager.tsx`, `price-tiers-manager.tsx`: client manager style
  (`useTransition`, `router.refresh`, dialogs, toasts), `components/ui/menu.tsx` for the room picker.
- `supabase/seed.sql`: seed data (add houses, rooms and genders for local testing).

## Decisions

See [research.md](./research.md): R1 gender as core column, R2 table shape, R3 database functions
with row lock, R4 drop assignment on cancel, delete or gender change, R5 `@dnd-kit/core`, R6
`useOptimistic`, R7 separate print route, R8 permission key `rooms`, R9 empty room adopts gender,
R10 client side search and filter.

## UI design

Design work uses the `impeccable` and `tasteskill` skills during implementation.

- **Layout (desktop ≥ 1024 px)**: header with camp badge and „Drucken“; a row of 4 stat cards
  (Weiblich belegt/frei, Männlich belegt/frei, Unverteilt, Betten gesamt); below a two column split:
  left a sticky panel (about 300 px) „Noch ohne Zimmer“ with search and three groups (Weiblich,
  Männlich, Geschlecht fehlt); right the houses as sections, each with a header (name, bed summary,
  menu: umbenennen, alle Zimmer weiblich/männlich, löschen) and a responsive grid of room cards.
- **Room card**: name, gender tag (text plus color, never color alone), occupancy „3 / 4“, a row of
  bed pips (filled per occupant), occupant chips with name and age, each chip draggable and with a
  menu (Zimmer wechseln, Aus Zimmer entfernen). „Nicht festgelegt“ cards are neutral with an inline
  Weiblich/Männlich toggle and accept anyone with a gender (adopting it). Full cards show a calm „Voll“ state.
- **Colors**: two calm, distinguishable tones from the existing design tokens (`lib/design-tokens.ts`)
  for female and male, a neutral ink tone for unset; checked for contrast in light and dark.
- **Drag feedback**: drag overlay chip; while dragging, fitting rooms get an accent outline, empty
  rooms that would adopt the gender show „wird weiblich/männlich“, non fitting rooms dim with a short
  reason („Männlich“, „Voll“).
- **Search and filter**: filter bar on top of the unassigned panel: search field, gender segmented
  control (Alle, Weiblich, Männlich, fehlt), age von/bis, „Filter hinzufügen“ menu with the camp's
  form fields; active filters as removable chips with the hit count and „Filter zurücksetzen“. While
  filters are active, matching chips in rooms get an accent ring, others fade to 40 % opacity.
- **Tablet/phone (< 1024 px)**: houses stack; the unassigned panel becomes a bottom sheet toggled by
  a floating button showing the unassigned count; assignment via tap → „Zimmer wählen“ menu listing
  only fitting rooms with free beds, grouped by house.
- **States**: loading skeleton (route `loading.tsx` exists at admin level), empty (no houses, no
  registrations, everyone assigned: „Alle haben ein Zimmer“), no current camp hint, error toasts,
  shortage banner when people of a gender exceed matching beds.
- **Print**: `/admin/zimmerplanung/druck`, one house per page, rooms as boxes with names, no chrome.

## Files likely to change

New:

- `supabase/migrations/0009_room_planning.sql`
- `lib/admin/room-planning.ts` (types helpers, Zod schemas, `canAssign`, `summarize`, grouping)
- `app/admin/zimmerplanung/page.tsx`, `actions.ts`, `druck/page.tsx`
- `components/admin/room-planner.tsx` (client board, DnD context, optimistic state)
- `components/admin/room-card.tsx`, `person-chip.tsx`, `unassigned-panel.tsx`, `person-filters.tsx`,
  `house-form-dialog.tsx`, `room-form-dialog.tsx`
- `tests/unit/room-planning.test.ts`

Changed:

- `lib/database.types.ts` (regenerated), `lib/admin/types.ts`, `lib/admin/data.ts`,
  `lib/admin/messages.ts`, `lib/admin/access.ts`, `components/admin/nav-items.ts`,
  `components/admin/admin-sidebar.tsx` (icon)
- `lib/register/validation.ts`, `lib/register/messages.ts`, `lib/register/service.ts`,
  `components/marketing/registration-form.tsx` (render select core field if needed)
- `app/admin/actions.ts`, `components/admin/registration-form-dialog.tsx`,
  `components/admin/registration-columns.ts` (optional Geschlecht column)
- `supabase/seed.sql`, `package.json`, `tests/unit/validation.test.ts`

## Security requirements

- Page guarded by `guardTab("/admin/zimmerplanung")`; every action by `requirePermission("rooms")`.
- Camp id always resolved on the server; registration and room ids checked against the current camp
  inside the database functions.
- New tables have RLS on and no policies; only the service role client touches them.
- Names of minors are shown only in the protected admin area and the protected print route.

## Constitution Check

| Principle | Status |
|-----------|--------|
| I. Fixed Stack, Clerk Owns Auth | Pass. Next.js, Clerk, Supabase as DB only. One small UI dependency (`@dnd-kit/core`), justified in R5. |
| II. Server Is the Security Boundary | Pass. Server Actions with `requirePermission`, service role only on the server, rules in DB functions. |
| III. Strict Scope | Pass after amendment 1.1.0 (room planning in scope, waitlist still excluded). |
| IV. Single Source of Truth | Pass. Gender is a core field of the one form; schema via migration; no CHECK on registration values (`rooms.beds` and `camp_rooms.gender` are structural, not registration values). |
| V. Language Separation | Pass. Code English (`houses`, `rooms`, `female`), UI German in `de.rooms`. |
| VI. Tolerant Payment, Hidden Pricing | Pass. Unpaid registrations are assigned like paid ones; no pricing touched. |
| VII. Simplicity and Honest Quality Gates | Pass. No realtime, no auto assignment; lint, test, build reported verbatim. |

Post design re-check: unchanged, all pass.

## Acceptance criteria

The acceptance scenarios of user stories 1 to 5 and FR-001 to FR-030 in [spec.md](./spec.md).

## Checks to run

`npm run lint`, `npm test`, `npm run build`.

## Manual test steps

See [quickstart.md](./quickstart.md).

## Project Structure

```text
specs/008-room-planning/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/server-actions.md
└── tasks.md            (next: /speckit-tasks)

app/admin/zimmerplanung/{page.tsx, actions.ts, druck/page.tsx}
components/admin/{room-planner, room-card, person-chip, unassigned-panel, house-form-dialog, room-form-dialog}.tsx
lib/admin/room-planning.ts
supabase/migrations/0009_room_planning.sql
tests/unit/room-planning.test.ts
```

**Structure Decision**: single Next.js project, following the existing admin tab layout
(`app/admin/<tab>/page.tsx` + `actions.ts`, client managers in `components/admin`).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New dependency `@dnd-kit/core` | Touch and keyboard drag, styled drag overlay, per target disabled state | Native HTML5 DnD cannot drag on touch and its ghost image cannot be styled |
