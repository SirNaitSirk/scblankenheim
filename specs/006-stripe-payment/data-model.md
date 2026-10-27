# Data Model: Online bezahlen mit Stripe (Kern)

One migration: `supabase/migrations/0007_stripe_payments.sql`, then regenerate `lib/database.types.ts`.
No CHECK constraints on status values (constitution IV); values are validated with Zod and TypeScript
unions. RLS enabled on the new tables, no grants to `anon` (only the service role reads and writes).

## registrations (existing, unchanged columns)

| Column | Use in this feature |
|--------|---------------------|
| `amount_due` int (euros) | total price, set at registration |
| `amount_paid` int (euros) | recomputed from `stripe_payments` after each Stripe event, still editable by admins |
| `payment_status` text | now one of `unpaid`, `processing`, `partial`, `paid`, `refunded` |
| `stripe_session_id` text | latest Checkout Session, used to expire it before a new one (R8) |
| `status`, `deleted` | block new checkouts when `cancelled` or deleted |

### payment_status transitions

```text
unpaid ──checkout (card, PayPal, Klarna)──▶ paid
unpaid ──checkout (SEPA submitted)───────▶ processing ──succeeded──▶ paid
                                           processing ──failed─────▶ unpaid
paid   ──partial refund──▶ partial ──refund rest──▶ refunded
paid   ──full refund─────▶ refunded
any    ──admin edit──────▶ any (until the next Stripe event recomputes)
```

The status is never stored by an event directly; it is the result of `derivePaymentState`
(see [research.md R5](./research.md)).

## stripe_payments (new)

One row per Stripe payment intent.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk default `gen_random_uuid()` | |
| `registration_id` | uuid not null, fk `registrations(id)` on delete cascade | indexed |
| `payment_intent_id` | text not null unique | event key |
| `checkout_session_id` | text | for support lookups |
| `status` | text not null | `processing`, `succeeded`, `failed` |
| `amount_cents` | int not null | `session.amount_total` |
| `refunded_cents` | int not null default 0 | cumulative `charge.amount_refunded` |
| `created_at` | timestamptz not null default now() | |
| `updated_at` | timestamptz not null default now() | |

Rank guard: `processing (1) < succeeded (2) = failed (2)`. An update with lower rank than the stored
status is ignored.

## stripe_events (new)

| Column | Type | Notes |
|--------|------|-------|
| `id` | text pk | Stripe `event.id` |
| `type` | text not null | for debugging |
| `received_at` | timestamptz not null default now() | |

Insert first; unique violation = already processed (R6).

## submission_attempts (existing, one new column)

| Column | Type | Notes |
|--------|------|-------|
| `kind` | text not null default `'registration'` | `registration` or `payment` |

Existing rows become `registration`. Index `(kind, ip, created_at)` added for the throttle query.

## TypeScript types

* `lib/admin/types.ts`: `PaymentStatus = "unpaid" | "processing" | "partial" | "paid" | "refunded"`.
* `lib/payment/status.ts`: `StripePaymentRow`, `StripePaymentStatus = "processing" | "succeeded" |
  "failed"`, `derivePaymentState(amountDueEuros, rows) → { paymentStatus, amountPaid }`.
