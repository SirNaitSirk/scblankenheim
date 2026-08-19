# Remove `camps.room_capacity` — replaced by per-field option capacity

## Goal

Delete the now-redundant `room_capacity` ("Zimmerplätze") field on `camps`.
Since the room-capacity counter feature (see
[prompts/room-capacity-counter.md](room-capacity-counter.md)) moved the real,
enforced seat limit into `camp_form_fields.config.capacity`, the camp-level
`room_capacity` is a loose number that nothing displays or enforces — keeping it
would leave two sources of truth for the same thing.

**Keep `camps.capacity`** (total-camp "Auslastung") — it is a different concept
(whole-camp headcount) and is actively used on the admin dashboard and camps
board. This change touches **only** `room_capacity` / `roomCapacity`.

## Existing code inspected (every `room_capacity` / `roomCapacity` touch point)

- Schema: [supabase/migrations/0001_init_schema.sql](../supabase/migrations/0001_init_schema.sql#L23)
  — `room_capacity int` column on `camps`.
- Seed: [supabase/seed.sql](../supabase/seed.sql#L11) — `room_capacity` is in the
  `camps` insert column list + both value rows (`60`); the comment at
  [seed.sql:52](../supabase/seed.sql#L52) calls `accommodation` the "future room
  counter" (now implemented).
- DB types: [lib/database.types.ts](../lib/database.types.ts#L27) — `room_capacity`
  in the `camps` `Row`/`Insert`/`Update`.
- Domain types: [lib/admin/types.ts](../lib/admin/types.ts) — `roomCapacity` on
  `Camp` (L83), `CampFormValues` (L104), `CampInput` (L121).
- Data layer: [lib/admin/data.ts](../lib/admin/data.ts) — reads `roomCapacity:
  row.room_capacity` (L128) and writes `room_capacity: input.roomCapacity` (L494).
- Camp form action: [app/admin/camps/actions.ts](../app/admin/camps/actions.ts)
  — `roomCapacity` in `INTEGER_KEYS` (L28), the Zod object (L41), the transform
  (L87).
- Camp dialog: [components/admin/camp-form-dialog.tsx](../components/admin/camp-form-dialog.tsx)
  — `EMPTY.roomCapacity` (L21), `fromCamp` mapping (L43), and the "Zimmerplätze"
  `Field` (L186–199) which is the 3rd cell of a `sm:grid-cols-3` row
  (capacity · basePrice · roomCapacity, L161).
- Copy: [lib/admin/messages.ts](../lib/admin/messages.ts#L214) — `roomCapacity`
  + `roomCapacityPlaceholder`.

Nothing reads `room_capacity` for display or enforcement anywhere (confirmed by
grep) — the field-level `config.capacity` fully supersedes it.

## Decisions / assumptions

- Full removal (not "hide the input") — no consumer remains, so leaving the
  column/type would just be dead weight.
- Data loss on the dropped column is acceptable: the value was never used, and
  the real limit now lives in `camp_form_fields.config.capacity`.
- No data migration to backfill config from `room_capacity` (the seed's `60` was
  illustrative; admins set the real limit on the `accommodation` field).

## Files to change

1. **New migration** `supabase/migrations/0003_drop_camps_room_capacity.sql`:
   ```sql
   -- room_capacity is superseded by camp_form_fields.config.capacity
   -- (per-option seat limits). Drop the unused camp-level column.
   alter table public.camps drop column if exists room_capacity;
   ```
2. [lib/database.types.ts](../lib/database.types.ts) — remove `room_capacity`
   from the `camps` `Row`, `Insert`, and `Update`. Prefer regenerating
   (`supabase gen types typescript`) if a DB is reachable; otherwise hand-edit
   the three lines to match.
3. [lib/admin/types.ts](../lib/admin/types.ts) — remove the `roomCapacity` line
   from `Camp`, `CampFormValues`, and `CampInput`.
4. [lib/admin/data.ts](../lib/admin/data.ts) — remove the `roomCapacity` read
   (L128) and the `room_capacity` write (L494).
5. [app/admin/camps/actions.ts](../app/admin/camps/actions.ts) — remove
   `roomCapacity` from `INTEGER_KEYS`, the Zod object, and the transform output.
6. [components/admin/camp-form-dialog.tsx](../components/admin/camp-form-dialog.tsx)
   — remove `EMPTY.roomCapacity`, the `fromCamp` mapping, and the "Zimmerplätze"
   `Field`; change that row's `sm:grid-cols-3` → `sm:grid-cols-2` so capacity +
   basePrice stay evenly laid out.
7. [lib/admin/messages.ts](../lib/admin/messages.ts) — remove `roomCapacity` and
   `roomCapacityPlaceholder`.
8. [supabase/seed.sql](../supabase/seed.sql) — remove `room_capacity` from the
   `camps` insert column list and drop the `60` from both value rows. Reword the
   [L52](../supabase/seed.sql#L52) comment (the counter is no longer "future":
   e.g. "`accommodation` (zimmer/zelt) is the capacity-limited option — the limit
   lives in that field's `config.capacity`.").

## Implementation requirements

- TypeScript stays clean (no `any`); the build must pass with no lingering
  `roomCapacity` references (grep to confirm zero remain outside prompt files).
- Do not touch `camps.capacity` / `camp.capacity` / the "Auslastung" display.
- Keep the migration idempotent (`drop column if exists`).

## Acceptance criteria

- `grep -rn "roomCapacity\|room_capacity" app lib components supabase` returns
  nothing (prompt files excluded).
- The camp create/edit dialog no longer shows a "Zimmerplätze" input; creating
  and editing a camp still works, and the capacity + base-price inputs sit in a
  balanced two-column row.
- Per-option seat limits on the registration form are unaffected (they never
  used `room_capacity`).

## Checks to run

- `npm run lint`
- `npm run build`

## Manual test steps

1. Apply the migration to the dev DB (`supabase db push` / `supabase migration up`
   or run `0003_drop_camps_room_capacity.sql`), then reload seed if desired.
2. `npm run dev` → Admin → Camps → create a new camp and edit an existing one:
   the "Zimmerplätze" field is gone; both save successfully; the capacity and
   base-price fields fill the row cleanly.
3. Landing page registration form: the Zimmer/Zelt seat counter still shows and
   still enforces its limit (unchanged — it reads `config.capacity`).
