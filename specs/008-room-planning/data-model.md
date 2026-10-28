# Data Model: Zimmerplanung

Migration `supabase/migrations/0009_room_planning.sql`, then regenerate `lib/database.types.ts`.
RLS enabled on every new table with no policies (service role only, like the other admin tables).

## New tables

### `houses`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `name` | text not null | 1 to 60 chars (Zod) |
| `sort_order` | int not null default 0 | |
| `created_at` | timestamptz not null default now() | |

### `rooms`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `house_id` | uuid not null → `houses.id` on delete cascade | |
| `name` | text not null | 1 to 60 chars (Zod) |
| `beds` | int not null, `check (beds >= 1)` | structural, not a registration value |
| `sort_order` | int not null default 0 | |
| `created_at` | timestamptz not null default now() | |

### `camp_rooms` (room gender per camp)

| Column | Type | Notes |
|--------|------|-------|
| `camp_id` | uuid → `camps.id` on delete cascade | PK part |
| `room_id` | uuid → `rooms.id` on delete cascade | PK part |
| `gender` | text not null, `check (gender in ('female','male'))` | missing row = „Nicht festgelegt“ |

### `room_assignments`

| Column | Type | Notes |
|--------|------|-------|
| `registration_id` | uuid PK → `registrations.id` on delete cascade | one room per registration |
| `camp_id` | uuid not null → `camps.id` on delete cascade | denormalized for per camp reads |
| `room_id` | uuid not null → `rooms.id` on delete cascade | deleting a room unassigns its people |
| `assigned_at` | timestamptz not null default now() | |

Index: `room_assignments (camp_id, room_id)`.

## Changed table

### `registrations`

- `gender text null` (no CHECK, constitution IV). Values `female` | `male`; null for old rows.
- `create_public_registration` gets a new parameter `p_gender text` (function replaced in the same
  migration; old signature dropped).

## Database functions (security invoker, service role only)

| Function | Lock | Rules | Result codes |
|----------|------|-------|--------------|
| `assign_room(p_camp_id, p_registration_id, p_room_id)` | `rooms` row `for update` | registration active (not deleted, not cancelled) and in `p_camp_id`; registration has a gender; if the room has no active assignments in the camp (ignoring the person itself when moving within the room), upsert `camp_rooms.gender` = person gender (auto adopt, FR-031); else registration gender must equal `camp_rooms.gender`; active assignments < `beds`; upsert by `registration_id` (moves are one call) | `ok`, `ok_gender_set` (room adopted a gender, returns it), `full`, `gender_mismatch`, `no_gender`, `inactive` |
| `set_room_gender(p_camp_id, p_room_id, p_gender)` | `rooms` row | only when the room has no assignments in that camp; `p_gender` null deletes the row | `ok`, `not_empty` |
| `update_room_beds(p_room_id, p_beds, p_camp_id)` | `rooms` row | `p_beds >= assignments in p_camp_id` | `ok`, `below_occupancy` |

Unassign is a plain `delete from room_assignments where registration_id = ...` (cannot violate rules).

## Domain types (`lib/admin/types.ts`)

```ts
type Gender = "female" | "male";
type RoomGender = Gender | null;              // null = Nicht festgelegt
type Room = { id; houseId; name; beds; sortOrder; gender: RoomGender; occupantIds: string[] };
type House = { id; name; sortOrder; rooms: Room[] };
type PlanningPerson = { id; firstName; lastName; gender: Gender | null; birthdate: string | null; roomId: string | null; formData: Record<string, unknown> };
type RoomPlan = { campId; campStart: string | null; houses: House[]; people: PlanningPerson[]; fields: CampFormField[] }; // question fields of the current camp, for filters
type PersonFilter = { search: string; gender: "all" | Gender | "missing"; ageMin: number | null; ageMax: number | null; fields: { id: string; key: string; value: string }[] };
```

`Registration` gains `gender: Gender | null`; `RegistrationFormValues`/`RegistrationInput` gain `gender`.

## Derived values (pure, `lib/admin/room-planning.ts`, unit tested)

- `canAssign(person, room)` → `ok | adopts_gender | full | gender_mismatch | no_gender` (same rules
  as `assign_room`, for instant UI feedback and target highlighting; `adopts_gender` when the room is
  empty and unset or set to the other gender).
- `matchesFilters(person, filters, fields, campStart)` → boolean. Filters: name text, gender
  (`female` | `male` | `missing` | all), age range, and a list of field filters `{ key, value }`
  (select: equal option; checkbox: `yes`/`no`; others: case insensitive contains via the shared
  `formatFieldValue`).
- `summarize(plan)` → per gender: beds, occupied, free, unassigned people, shortage flag.
- `groupUnassigned(people, query)` → `{ female, male, missing }` sorted by last name, filtered by name.
- `age(birthdate, campStart)` → age at camp start, for the person chip.

## State rules

- Room gender may change only while the room is empty in that camp, either explicitly or by the first
  assignment (auto adopt).
- Filters are client state only (not persisted).
- Cancel, soft delete or gender change of a registration deletes its assignment (R4).
- Deleting a room or house cascades its assignments; the UI confirms with the affected count first.
