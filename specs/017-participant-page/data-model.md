# Data Model: Persönliche Teilnehmerseite

## registrations (changed)

| Column | Type | Rule |
|---|---|---|
| `access_token` | `text not null unique` | Default: two `gen_random_uuid()` values without separators, 64 lowercase hex characters. Existing rows are filled by the default when the column is added. Replaced on renewal. Readable only through the service role. |

Migration `supabase/migrations/0013_participant_access.sql`:

- add the column with the default
- unique index `registrations_access_token_key`
- no change to `create_public_registration` (the default applies on insert)
- no CHECK constraint; format validated in the app (`lib/participant/token.ts`)

Regenerate `lib/database.types.ts` afterwards.

## submission_attempts (unchanged schema)

New `kind` value `participant`, one row per miss with `ip`. Used for the miss throttle (research R6).

## logs (unchanged schema)

New action `registration.access_renewed`, message `<reference> <name>`, actor is the admin label.

## ParticipantView (not stored)

Pure result of `buildParticipantView(registration, camp, fields)` in `lib/participant/view.ts`:

```text
ParticipantView
  firstName: string
  campName: string
  campDates: { start: string; end: string } | null   ISO dates, both present or null
  campLocation: string | null
  status: "active" | "cancelled"
  amounts: { total: number; paid: number; outstanding: number }   whole euros
  payState: "pay" | "paid" | "processing" | "refunded" | "cancelled" | "free"
  payHref: string | null           /bezahlen?ref=…, only for payState "pay"
  rows: Array<{ label: string; value: string }>   core fields, then answers
```

Mapping of `payState` from `checkoutEligibility`: `ok` → `pay`, `paid` and `nothing_due` with a
total above 0 → `paid`, total 0 → `free`, `processing` → `processing`, `refunded` → `refunded`,
`cancelled` → `cancelled`.

Never part of the view: `price_tier_id` and tier names, `reminders_paused`, notes, mail history,
room and tent circle data.
