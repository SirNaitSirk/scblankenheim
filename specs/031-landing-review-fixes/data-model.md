# Data Model: Landingpage Review Fixes

No schema change, no migration.

## Derived values

- **CountdownRemaining** (pure, client and server safe): `{ kind: "days"; value: number }` ·
  `{ kind: "hours"; value: number }` · `{ kind: "underHour" }` · `null` when the opening is reached.
  Input: opening instant (`camps.registration_opens_at`) and the current time.
- **LandingState.schoolRelease**: still `ReleaseSettings | null`; now additionally `null` when the
  current camp has zero active registrations (`registrations` with `deleted = false` and
  `status <> 'cancelled'`).
