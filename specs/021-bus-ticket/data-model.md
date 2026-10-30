# Data Model: Busticket

Migration `supabase/migrations/0016_bus_ticket.sql`. RLS on for all new tables, no policies; only
the service role reads and writes. No CHECK constraints; values are validated with Zod.

## camp_bus_settings

One row per camp; a missing row means "off".

| Column | Type | Notes |
|---|---|---|
| `camp_id` | uuid, pk, fk `camps(id)` on delete cascade | |
| `enabled` | boolean not null default false | FR-001 |
| `field_key` | text null | `camp_form_fields.key` of the bus question in this camp |
| `answers` | text[] not null default '{}' | Answer values meaning bus: option texts for `select`, `true` / `false` for `checkbox` |
| `updated_by` | text not null | Clerk user id |
| `updated_at` | timestamptz not null default now() | |

**Validation (app)**: enabling requires a `field_key` that exists in the camp with type `select`
or `checkbox` and at least one answer that is still a valid option (FR-003). A row whose mapping
no longer fits stays stored but counts as broken: no ticket is valid (US1.6).

## bus_tickets

One row per issued code. At most one active (not revoked) row per registration.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk default gen_random_uuid() | |
| `code` | text not null unique | 22 characters base64url (research R1) |
| `registration_id` | uuid not null, fk `registrations(id)` on delete cascade | |
| `camp_id` | uuid not null, fk `camps(id)` on delete cascade | Camp of the registration at issue time |
| `created_at` | timestamptz not null default now() | |
| `created_by` | text null | Clerk user id for reissues, null when created automatically |
| `revoked_at` | timestamptz null | Set by reissue or block |
| `revoked_by` | text null | Clerk user id |

Indexes: unique partial `bus_tickets_active_idx (registration_id) where revoked_at is null`;
`bus_tickets_camp_idx (camp_id)`.

**States**

```text
(none) ── ensureTicket ──▶ active ── reissue ──▶ revoked  +  new active
                             │
                             └── block ──▶ revoked (no active row; participant sees hint)
(blocked) ── reissue ──▶ new active
```

## bus_boardings

At most one boarding per registration and trip.

| Column | Type | Notes |
|---|---|---|
| `registration_id` | uuid, fk `registrations(id)` on delete cascade | pk part |
| `trip` | text | pk part; `outbound` or `return` (Zod) |
| `camp_id` | uuid not null, fk `camps(id)` on delete cascade | |
| `boarded_at` | timestamptz not null default now() | |
| `boarded_by` | text not null | Clerk user id |
| `method` | text not null | `scan` or `manual` (Zod) |

Primary key `(registration_id, trip)`; index `bus_boardings_camp_trip_idx (camp_id, trip)`.
Undo deletes the row and writes a log entry (FR-024). Reissue keeps boardings (US5.4).

## Changes to existing objects

- `email_deliveries_once_idx` recreated with `bus_ticket` added to the excluded kinds, so the
  ticket mail can be sent repeatedly.
- Soft delete of a registration in `lib/admin/data.ts` also deletes its `bus_tickets` and
  `bus_boardings` rows (hard delete is covered by cascade).

## Derived values (not stored)

- **Bus person**: registration active, not deleted, camp settings enabled and mapping valid, and
  `form_data[field_key]` (string, or boolean turned into `true` / `false`) is in `answers`.
- **Payment open**: `outstandingAmount(registration) > 0`.

## TypeScript types (`lib/bus/types.ts`)

```ts
type Trip = "outbound" | "return";
type BusSettings = { enabled: boolean; fieldKey: string | null; answers: string[] };
type ScanOutcome =
  | { kind: "boarded"; name: string; reference: string; at: string; paymentOpen: boolean }
  | { kind: "already"; name: string; reference: string; at: string }
  | { kind: "no_ticket" | "cancelled"; name: string; reference: string }
  | { kind: "invalid" | "other_camp" | "disabled" | "unknown" };
type BoardingListEntry = {
  registrationId: string; name: string; reference: string;
  boardedAt: string | null; method: "scan" | "manual" | null;
};
```
