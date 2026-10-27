# Contract: `public.create_public_registration` (Postgres RPC)

Added in `supabase/migrations/0005_public_registration_capacity.sql`.

## Signature

```text
create_public_registration(
  p_camp_id        uuid,
  p_reference      text,
  p_first_name     text,
  p_last_name      text,
  p_email          text,
  p_form_data      jsonb,
  p_amount_due     int,
  p_price_tier_id  uuid,      -- nullable
  p_option_limits  jsonb      -- array of { "key": text, "option": text, "limit": int }
) returns jsonb               -- { "status": "ok" | "camp_full" | "option_full" | "duplicate_reference", "keys": text[] }
```

`p_option_limits` contains only the capacity limited options the person actually selected.

## Behaviour

1. `pg_advisory_xact_lock(hashtext(p_camp_id::text))` serializes calls per camp.
2. Active rows: `camp_id = p_camp_id AND deleted = false AND status <> 'cancelled'`.
3. If `camps.capacity` is not null and active count `>= capacity` → `{ status: "camp_full" }`.
4. For each entry in `p_option_limits`: if active rows with `form_data ->> key = option` reach
   `limit`, collect the key → `{ status: "option_full", keys: [...] }`.
5. Insert the row with `status = 'pending'`, `payment_status = 'unpaid'`, `amount_paid = 0`.
   Unique violation on `reference` → `{ status: "duplicate_reference" }` so the caller retries with a
   new reference.
6. Return `{ status: "ok" }`.

## Security

- `language plpgsql`, `security invoker`, `set search_path = public`.
- `revoke execute ... from public, anon, authenticated`; `grant execute ... to service_role`.
- No CHECK constraints added; RLS on `registrations` stays default deny.
