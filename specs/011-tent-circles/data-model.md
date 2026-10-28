# Data Model: Zeltkreise

Migration `supabase/migrations/0010_tent_circles.sql`. RLS on, no policies (service role only).

## `tent_circles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `camp_id` | uuid not null | FK `camps(id)` on delete cascade |
| `name` | text not null | Zod: 1 to 60 chars |
| `kind` | text not null default `'mixed'` | check in (`mixed`, `female`, `male`). Structural, not a registration value (constitution IV) |
| `leader_registration_id` | uuid null | FK `registrations(id)` on delete set null; unique index where not null |
| `sort_order` | int not null default 0 | |
| `created_at` | timestamptz not null default now() | |

Index: `(camp_id, sort_order)`.

## `tent_circle_members`

| Column | Type | Notes |
|--------|------|-------|
| `registration_id` | uuid PK | FK `registrations(id)` on delete cascade; one circle per participant |
| `camp_id` | uuid not null | FK `camps(id)` on delete cascade |
| `tent_circle_id` | uuid not null | FK `tent_circles(id)` on delete cascade |
| `assigned_at` | timestamptz not null default now() | |

Index: `(camp_id, tent_circle_id)`.

## Rules (enforced in functions, see contracts)

- A person is leader of at most one circle (unique index) and never leader and member at once.
- A person fits a circle when `kind = 'mixed'` or `kind = registrations.gender`. Without gender only
  `mixed` fits.
- Only active registrations of the same camp (`deleted = false`, `status <> 'cancelled'`) can be
  assigned or chosen as leader.

## Functions

- `fits_tent_circle(p_kind text, p_gender text) returns boolean` (immutable helper).
- `assign_tent_circle(p_camp_id, p_registration_id, p_circle_id) returns jsonb`
  status: `ok`, `is_leader`, `kind_mismatch`, `inactive`, `not_found`.
- `save_tent_circle(p_camp_id, p_circle_id uuid null, p_name, p_kind, p_leader_id) returns jsonb`
  status: `ok` (with `id`), `ok_leader_moved`, `leader_taken`, `leader_mismatch`, `leader_inactive`,
  `kind_conflict` (with `count`), `not_found`.

Execute revoked from `public, anon, authenticated`, granted to `service_role`.

## App types (`lib/admin/types.ts`)

```ts
type TentCircleKind = "mixed" | Gender;
type TentCircle = { id; name; kind; leaderId: string | null; sortOrder };
type CirclePerson = PlanningPersonBase & { circleId: string | null; leads: string | null };
type TentCirclePlan = { campId; campName; campStart; birthdateKey; circles; people; fields };
```

`PlanningPersonBase` is today's `PlanningPerson` without `roomId`; `PlanningPerson` extends it.

## Seed

`supabase/seed.sql`: three circles for the seeded camp (one mixed, one female, one male) with
leaders from seeded registrations and a few members.
