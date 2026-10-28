# Research: Anmeldestatus vereinfachen

## R1 · Two values: `active` and `cancelled`

- **Decision**: `RegistrationStatus = "active" | "cancelled"`, German „Aktiv“ / „Storniert“.
- **Rationale**: Every behavioural check in the code base already asks only „is it cancelled“.
  `pending` and `confirmed` never differ. A new name avoids keeping `pending`, which reads like
  „not done yet“ and collides mentally with the payment status „Offen“.
- **Alternatives**: keep `pending` as the stored value and only relabel it (cheaper, but leaves a
  misleading name in code and DB); set `confirmed` automatically on full payment (duplicates the
  payment status, rejected by the owner).

## R2 · One migration for rows, default and the public insert

- **Decision**: `0011_simplify_registration_status.sql` runs
  `update registrations set status = 'active' where status in ('pending', 'confirmed')`, sets
  `alter column status set default 'active'` and recreates `create_public_registration` from 0009
  with the literal `'active'` instead of `'pending'` (same signature, `security invoker`,
  `search_path`, revoke and grant).
- **Rationale**: Keeps the public insert, the column default and existing data consistent in one
  step. A trigger rewriting `pending` would hide the old value instead of removing it.
- **Alternatives**: a `before insert` trigger (indirect, harder to read); change only the app
  (public signups would still insert `pending`).

## R3 · No CHECK constraint

- **Decision**: no constraint on `registrations.status`.
- **Rationale**: AGENTS.md section 12 and the constitution prefer app level validation; Zod in the
  save action is the gate.

## R4 · Neutral badge for „Aktiv“

- **Decision**: table badge tone `neutral` for `active`, `danger` for `cancelled`.
- **Rationale**: Green (`paid`) means „Bezahlt“ in the payment column; a green „Aktiv“ would again
  suggest that something is finished.

## R5 · CSV writes the German label

- **Decision**: `csvValue` returns `REGISTRATION_STATUS_LABELS[r.status]` for the status column.
- **Rationale**: Today the export writes the raw English value, which breaks the German only UI rule
  and FR-005.

## R6 · Unknown values

- **Decision**: Zod enum `["active", "cancelled"]` in `registrationSchema`. On read,
  `toRegistrationStatus` maps `cancelled` to `cancelled` and anything else to `active`.
- **Rationale**: After the migration no other value exists, but a defensive mapper keeps the table
  from rendering an undefined label if a stray value ever appears. It matches the DB rule „not
  cancelled means active“. Filter state is held in memory only, so no stored old filter value can
  reach the page (FR-009 holds by construction; the filter resets to „Alle“ on load).
