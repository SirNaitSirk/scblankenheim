# Research: Zeltkreise

## R1 · Table shape

- **Decision**: `tent_circles (id, camp_id, name, kind, leader_registration_id, sort_order)` per camp
  and `tent_circle_members (registration_id PK, camp_id, tent_circle_id)`. The leader is a nullable
  column on the circle with a unique index, the members are rows.
- **Rationale**: Owner chose per camp circles. `registration_id` as primary key enforces "at most one
  circle per participant", the unique index enforces "at most one circle per leader". A nullable
  leader lets the card show „Leiter fehlt“ after a hard delete (`on delete set null`).
- **Alternatives considered**: one membership table with a `role` column (leader and member). Would
  make "exactly one leader per circle" a partial unique index plus a check that every circle has one,
  and the leader would vanish from the circle row. Global circles like houses (owner chose per camp).

## R2 · Leader and member rules under concurrency (FR-006, FR-010, FR-011, FR-017)

- **Decision**: Two `security invoker` plpgsql functions called only by the service role:
  `assign_tent_circle(camp, registration, circle)` and `save_tent_circle(camp, circle | null, name,
  kind, leader)`. Both lock the registration row first, then the circle row (`for update`), always in
  that order, so they serialize per person and per circle without deadlocks.
- **Rationale**: Same pattern as `assign_room` (specs/008 R3). Checks like "this person is not a
  leader" plus insert in TypeScript would race between two admins.
- `save_tent_circle` creates or updates in one transaction: validates the leader (active, in camp,
  gender fits kind, leads no other circle), removes the leader's own membership if any (status
  `ok_leader_moved`), and for a kind change counts active members that do not fit (`kind_conflict`,
  with `count`).

## R3 · Cancel, delete, gender change

- **Decision**: Cancel and soft delete do not touch circle rows. Reads ignore inactive registrations,
  so the person disappears and the leader shows as „Leiter fehlt“. Reactivation brings them back.
  A gender change runs `syncTentCircle` next to the existing `syncRoomAssignment`: it removes the
  membership or clears the leader when the gender no longer fits the circle kind.
- **Rationale**: Circles have no capacity, so a reactivated person can never overfill anything,
  unlike rooms (specs/008 R4). The only rule that can break is gender vs kind, which the sync covers.
  `save_tent_circle` also drops memberships of inactive registrations that do not fit a new kind, so
  a reactivation can never produce a mismatch.
- Leader selection excludes nobody inactive: the picker lists only active registrations, and saving
  a new leader replaces an inactive one.

## R4 · Reuse of the room planning UI

- **Decision**: Reuse `@dnd-kit/core`, `PersonChip`, `PersonFilters`, `UnassignedPanel`, the filter
  logic in `lib/admin/room-planning.ts` and the camp and people loaders from `lib/admin/rooms-data.ts`.
  Small, behaviour neutral refactors make them generic: `UnassignedPanel` gets its title and empty
  text as props, the filter functions take a `PlanningPersonBase` (without `roomId`), and the shared
  loaders move to `lib/admin/planning-data.ts`.
- **Rationale**: Spec FR-020 and FR-023 ask for identical behaviour; one implementation keeps both
  tabs consistent (constitution IV spirit, no duplicate components).
- **Alternatives considered**: copy the room components (drift, double maintenance).

## R5 · Permission and route

- **Decision**: New permission key `tentCircles` (label „Zeltkreise“), route `/admin/zeltkreise`,
  print route `/admin/zeltkreise/druck`.
- **Rationale**: Zeltkreise are often planned by other people than the room planner, so a separate
  grant is useful. Superadmins hold it implicitly.

## R6 · Optimistic board and print

- **Decision**: Same as specs/008 R6 and R7: `useOptimistic` board state, Server Actions in
  `startTransition`, toast on failure, `revalidatePath`. Print as a plain Server Component, two
  circles per A4 page where they fit (`break-inside: avoid`).
