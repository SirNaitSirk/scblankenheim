# Data Model: Public Camp Registration

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

No new tables or columns. The schema from `0001_init_schema.sql` already holds every field this
feature needs. The only schema change is one function (see
[contracts/create-public-registration.md](./contracts/create-public-registration.md)).

## Entities

### Camp (`camps`)

| Field | Type | Used for |
|-------|------|----------|
| `id` | uuid | identity |
| `registration_open` | boolean | manual switch (R1 step 3) |
| `registration_opens_at` | timestamptz, nullable | countdown target and automatic opening |
| `registration_closes_at` | timestamptz, nullable | deadline, wins over everything except "no camp" |
| `capacity` | int, nullable | total seats for public registration; null means unlimited (FR-031) |
| `base_price` | int (whole euros) | default amount due |

### Current camp (`camp_settings`)

Singleton row; `current_camp_id` selects the camp shown on the landing page and used by the server.

### Question (`camp_form_fields`)

| Field | Notes |
|-------|-------|
| `key` | unique per camp; core keys `first_name`, `last_name`, `email` are reserved and win on conflict |
| `field_type` | `text`, `textarea`, `email`, `tel`, `number`, `date`, `select`, `checkbox` |
| `required`, `sort_order`, `options` | as today |
| `config.placeholder`, `config.helpText` | optional strings |
| `config.capacity` | optional `{ option: string, limit: int >= 1 }` for one option of a `select` |

### Price tier (`price_tiers`)

`invitation_token` (unique), `price`, `camp_id`, `valid_from`, `valid_until`, `hidden`. A token is
valid when it exists, belongs to the current camp and `now` lies inside the validity window.

### Registration (`registrations`)

Created by the public flow with `status = 'pending'`, `payment_status = 'unpaid'`,
`amount_due` from base price or tier, `amount_paid = 0`, `price_tier_id` when a valid tier applied,
`form_data` with answers keyed by question `key`, unique `reference`.

**Active registration** (FR-030): `deleted = false AND status <> 'cancelled'`. Counts toward camp
capacity and option seats regardless of payment status.

### Submission attempt (`submission_attempts`)

`email`, `ip`, `camp_id`, `created_at`. Throttle: more than 5 attempts per email or ip within
10 minutes are rejected (unchanged).

## Derived: registration state

Computed per request by `getRegistrationState(camp, now, activeCount)`; never stored.

```text
                 no current camp ──────────────────────────────► closed
                 now >= closes_at ─────────────────────────────► closed
registration_open = true ───────────────► open candidate
registration_open = false, now < opens_at ─────────────────────► countdown
registration_open = false, now >= opens_at ► open candidate
otherwise ─────────────────────────────────────────────────────► closed

open candidate, capacity set and activeCount >= capacity ──────► full
open candidate otherwise ──────────────────────────────────────► open
```

Transitions happen through time passing (countdown to open, open to closed), admin edits, and
registrations being added, deleted or cancelled (open to full and back).

## Validation rules (shared, `lib/register/validation.ts`)

| Type | Rule | Message key |
|------|------|-------------|
| any required non checkbox | trimmed value not empty | `required` |
| `checkbox` required | value is `true` | `checkbox` |
| `email` | matches simple address pattern when not empty | `email` |
| `number` | parses as number when not empty | `number` |
| unknown keys in payload | ignored, not stored | none |
