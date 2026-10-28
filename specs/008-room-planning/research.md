# Research: Zimmerplanung

## R1 · Where gender lives

- **Decision**: New nullable column `registrations.gender` (`female` | `male`), exposed as a fourth
  fixed core field next to `first_name`, `last_name`, `email` in `lib/register/validation.ts`
  (`CORE_FIELDS`). German labels „Weiblich“ / „Männlich“, stored values English.
- **Rationale**: The core field pattern already exists (synthetic fields rendered first, backed by
  columns). It keeps exactly one form, admins cannot delete or un-require it (it is not in
  `camp_form_fields`), and room planning can filter and lock on a real column.
- **Alternatives considered**: a locked `camp_form_fields` row per camp (needs seeding for every new
  camp and a "locked" flag in the field editor, value lives in `form_data` as a German label);
  gender only inside room planning (rejected by the owner).
- **No CHECK constraint** on `registrations.gender` (constitution IV); Zod validates.

## R2 · Data shape for houses, rooms and per camp state

- **Decision**: `houses` and `rooms` are global. `camp_rooms (camp_id, room_id, gender)` holds the
  per camp gender; a missing row means „Nicht festgelegt“. `room_assignments (registration_id PK,
  camp_id, room_id)` holds the assignment.
- **Rationale**: Matches the owner's answers (rooms reused every year, gender per room and camp).
  `registration_id` as primary key enforces "at most one room per registration" in the database.
- **Alternatives considered**: gender on `rooms` (not per camp), copying rooms per camp (owner chose
  global).

## R3 · Never overbook, never mix genders (SC-003)

- **Decision**: Three `security invoker` plpgsql functions, called only through the service role
  client from Server Actions: `assign_room`, `set_room_gender`, `update_room_beds`. Each takes a
  row lock on the room (`select ... for update`) before counting active assignments, so two
  concurrent writers serialize.
- **Rationale**: Same approach as `create_public_registration` (capacity under lock). A count then
  insert in TypeScript would race.
- **Alternatives considered**: unique slot rows per bed (more rows, awkward when beds change);
  optimistic check in app code (races).

## R4 · Cancelled, deleted and gender changes

- **Decision**: When a registration is cancelled, soft deleted, or its gender changes, the server
  deletes its `room_assignments` row in the same action (`updateRegistration`,
  `setRegistrationDeleted`, `setRegistrationGenderAction`). Reads additionally ignore inactive
  registrations as a safety net.
- **Rationale**: If assignments survived a cancellation, reactivating the registration could put it
  back into a room that was filled meanwhile. Removing it makes the spec's "reactivated person is
  unassigned" rule hold automatically.

## R5 · Drag and drop library

- **Decision**: `@dnd-kit/core` (one new dependency, about 10 kB gzip).
- **Rationale**: Works with mouse, touch and keyboard sensors, provides a drag overlay for a polished
  look and per target `disabled` state for highlighting rooms that fit or not (FR-018). Native HTML5
  drag and drop does not work on touch screens and shows a browser ghost image we cannot style.
- **Alternatives considered**: native HTML5 DnD plus click fallback (no new dependency, but the drag
  look is crude and touch drag is impossible); `react-beautiful-dnd` (unmaintained, list oriented).
- The click path (person → „Zimmer wählen“ menu) stays the primary path on phones and for keyboard
  users, so the feature is fully usable even without dragging.

## R6 · Instant feedback with server truth

- **Decision**: Client board keeps the board state in `useOptimistic`; each move calls a Server
  Action inside `startTransition`. On `{ ok: false }` the optimistic state is dropped automatically
  and a German toast explains why (full, wrong gender, connection). On success the action calls
  `revalidatePath("/admin/zimmerplanung")`.
- **Rationale**: Same building blocks as the other managers (`router.refresh`, `useTransition`),
  no TanStack Query needed.

## R7 · Print view

- **Decision**: Separate route `/admin/zimmerplanung/druck` rendered as a plain Server Component
  with print CSS (`@media print`, one house per page via `break-before: page`), opened in a new tab,
  auto `window.print()` via a tiny client button.
- **Rationale**: Keeps the interactive board free of print hacks; sidebar and topbar hidden on print.

## R9 · Empty room adopts gender

- **Decision**: `assign_room` sets `camp_rooms.gender` to the person's gender when the room has no
  active assignment in the camp, inside the same locked transaction. Applies to unset rooms and to
  empty rooms set to the other gender (owner: „wenn ein Zimmer leer ist“).
- **Rationale**: Saves the separate step of marking rooms; the row lock guarantees that two people
  of different gender dropped into the same empty room at once cannot both succeed.
- **Alternatives considered**: only unset rooms adopt (safer against accidental flips, but contrary
  to the owner's wording); a confirmation dialog on every flip (slows down the main flow). A toast
  names the new gender so an accidental flip is noticed and can be undone by removing the person.

## R10 · Search and filter

- **Decision**: Client side filtering in a pure `matchesFilters` helper. Filter bar above the
  unassigned list: name search, gender segmented control, age von/bis, and „Filter hinzufügen“ for
  any question field of the current camp (select → option list, checkbox → Ja/Nein, others → text).
  Reuses `formatFieldValue` from `components/admin/registration-columns.ts` (moved to `lib/admin` if
  it needs to be server safe). Matching people in rooms are highlighted, others dimmed.
- **Rationale**: Under 300 people per camp, everything is already on the client; no extra queries.
  Mirrors the dashboard's custom filters so admins know the pattern.
- **Alternatives considered**: server side filtering via search params (more round trips, no gain at
  this size).

## R8 · Permission

- **Decision**: New nav item `/admin/zimmerplanung` and permission key `rooms` („Zimmerplanung“) in
  `PERMISSION_LABELS` and `PERMISSION_BY_HREF`. Superadmins have it implicitly; plain admins get it
  through the existing user dialog. No data migration (existing admins simply do not see the tab
  until granted).
