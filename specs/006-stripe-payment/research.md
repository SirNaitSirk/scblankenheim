# Research: Online bezahlen mit Stripe (Kern)

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

## R1 · Hosted Stripe Checkout, payment methods from the Dashboard

**Decision**: Stripe Checkout (hosted page, `mode: "payment"`), one line item built with `price_data`
(`currency: "eur"`, `unit_amount` = outstanding euros × 100, product name "Teilnahme {Campname}"),
`locale: "de"`. We do **not** pass `payment_method_types`; Checkout uses the methods enabled in the
Stripe Dashboard (dynamic payment methods). Card, Apple Pay, Google Pay, PayPal, SEPA Direct Debit and
Klarna are switched on there. Stripe hides a method automatically when amount, currency or country do
not fit (spec edge case "Zahlungsart nicht verfügbar").

**Rationale**: No card data touches our app, Stripe handles SCA, wallets and German localisation, and
methods can change without a deploy. Fits FR-001, FR-003, FR-018.

**Alternatives considered**: Embedded Checkout or Payment Element (more UI work, no benefit for a
once a year camp). Hardcoded `payment_method_types` (needs a deploy per change, breaks when a method
is not activated in the account).

## R2 · Amount is resolved on the server only

**Decision**: Checkout amount = `amount_due − amount_paid` of the stored registration, read with the
service role client at checkout creation. The browser only ever sends the reference. No `price` or
`amount` input exists on any public route.

**Rationale**: FR-002. `amount_due` is already resolved by `lib/register/service.ts` (base price or a
valid hidden tier) and stored, so hidden prices never travel through the client.

## R3 · Checkout creation happens inside the register route, plus a separate pay route

**Decision**:
* `POST /api/register` creates the registration as today and then, in the same request, tries to create
  a Checkout Session. It answers `{ reference, checkoutUrl }`. `checkoutUrl` is `null` when the amount is
  0 or Stripe failed; the registration stays valid either way (FR-005, User Story 1 scenario 5).
* `POST /api/checkout` (HTML form post with `reference`) creates a new session for an existing open
  registration and answers `303` to the Stripe URL. Used by `/bezahlen` and the "Jetzt bezahlen" button.
  Works without JavaScript.
* Both call one shared function `createCheckoutForRegistration` in `lib/payment/checkout.ts`.

**Rationale**: One round trip after submit, no second public endpoint needed for the main path, and a
single place that builds sessions.

**Alternatives considered**: Client calls `/api/checkout` after `/api/register` (extra round trip,
extra failure mode between the two calls). Payment Links (static, cannot carry the per registration
amount cleanly).

## R4 · The webhook is the only writer of Stripe derived status

**Decision**: `app/api/stripe-webhook/route.ts`, `runtime = "nodejs"`, reads the raw body with
`request.text()` (per `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`,
section Webhooks) and verifies it with `stripe.webhooks.constructEvent(body, signature,
STRIPE_WEBHOOK_SECRET)`. Invalid signature → `400`, logged as a warning (FR-017). Handled events:

| Event | Effect on the payment row |
|-------|---------------------------|
| `checkout.session.completed` with `payment_status = "paid"` | succeeded, amount set |
| `checkout.session.completed` with `payment_status = "unpaid"` | processing (SEPA submitted) |
| `checkout.session.async_payment_succeeded` | succeeded |
| `checkout.session.async_payment_failed` | failed |
| `charge.refunded` | `refunded_cents` = `charge.amount_refunded` (cumulative) |

Everything else is acknowledged with `200` and ignored. `/bezahlen/danke` never writes status (FR-009).

**Rationale**: Stripe guarantees signed, retried delivery. The success redirect can be skipped, faked or
arrive before the webhook.

## R5 · One row per Stripe payment, registration status is derived

**Decision**: New table `stripe_payments` keyed by `payment_intent_id`. Each event updates exactly one
row. After every change the registration's `payment_status` and `amount_paid` are **recomputed** from all
its payment rows by a pure function `derivePaymentState` (`lib/payment/status.ts`):

1. net cents = Σ (`amount_cents − refunded_cents`) over rows with status `succeeded`
2. if net ≥ amount due and amount due > 0 → `paid`
3. else if net > 0 → `partial`
4. else if any row is `processing` → `processing`
5. else if any `succeeded` row is fully refunded → `refunded`
6. else → `unpaid`

`amount_paid` = net cents ÷ 100, rounded down (project stores whole euros). Overpayment (net > due,
e.g. two sessions paid) stays `paid`; the admin table shows an "Überzahlt" hint derived from
`amount_paid > amount_due` (spec edge case).

**Ordering guard**: a row only moves forward in rank `processing → succeeded | failed`; a late
`completed (unpaid)` never downgrades a `succeeded` row. Refund amounts are cumulative from Stripe, so a
late or repeated `charge.refunded` cannot double count.

**Rationale**: Correct for double payments, partial and full refunds and out of order delivery
(FR-010, FR-011, SC-005) without any running totals that could drift. The derivation is pure and unit
testable.

**Alternatives considered**: Incrementing `amount_paid` per event (double counts on retries, cannot
handle cumulative refund amounts). Storing only `registrations.stripe_session_id` (loses the first
payment when a second session is created).

## R6 · Idempotency

**Decision**: Table `stripe_events (id text primary key)`. The handler inserts `event.id` first; a unique
violation means "already processed" → `200` immediately. If processing then throws, the event row is
deleted again and the handler answers `500`, so Stripe retries.

**Rationale**: FR-011. Combined with R5 even a duplicate that slipped through would be harmless.

## R7 · Mapping events to registrations

**Decision**: Sessions carry `client_reference_id = registration.id` and
`metadata.registration_id`; `payment_intent_data.metadata.registration_id` is set too, so `charge.refunded`
(which only knows the payment intent) can find the registration via the payment intent metadata or via
the existing `stripe_payments` row. Unknown registration → log warning, answer `200` (nothing to retry).

## R8 · Previous open sessions are expired

**Decision**: Before creating a new session, if `registrations.stripe_session_id` points to a session
that Stripe reports as `open`, call `stripe.checkout.sessions.expire`. Errors are ignored (best effort).
The new id is stored in `registrations.stripe_session_id`. Sessions expire after 24 h by default; we keep
that.

**Rationale**: FR-014; reduces, but cannot fully prevent, double payment. R5 handles the rest.

## R9 · When a new checkout is allowed

**Decision**: `createCheckoutForRegistration` refuses when the registration is deleted, `status =
cancelled`, `payment_status` is `paid`, `processing` or `refunded`, or outstanding ≤ 0. Each refusal maps to
a German notice on `/bezahlen`. `refunded` asks the person to contact the team, because a full refund
usually means a cancellation agreed with an admin.

## R10 · Public lookup by reference, minimal data, throttled

**Decision**: `/bezahlen?ref=…` is a Server Component that looks the registration up by `reference`
(case insensitive, trimmed) and renders only first name, camp name and outstanding amount (FR-015).
Unknown, deleted or malformed references all render the same neutral notice (User Story 2 scenario 5).
Throttling reuses `submission_attempts` with a new `kind` column: lookups and checkout posts record
`kind = 'payment'` per IP; more than 40 per 10 minutes (thank you page and its refreshes included) → throttled notice. The registration throttle in
`lib/register/service.ts` filters on `kind = 'registration'` so the two never interfere. Limits live as
constants in `lib/payment/limits.ts`.

**Rationale**: References have 32 random bits (`REG-` + 8 hex). With 40 tries per IP per 10 minutes,
guessing a valid one is impractical, and a hit reveals only a first name and an amount.

## R11 · Free registrations

**Decision**: When `amount_due = 0`, the register service sets `payment_status = 'paid'` right after the
insert and returns `checkoutUrl: null` (FR-016).

## R12 · Thank you page shows stored state and waits briefly

**Decision**: `success_url = {origin}/bezahlen/danke?ref={reference}`; `cancel_url =
{origin}/bezahlen?ref={reference}&abgebrochen=1`. The thank you page reads the stored status. If it is
still `unpaid`, it shows "Wir bestätigen gerade deine Zahlung" and a tiny client component calls
`router.refresh()` every 3 s for at most 30 s; afterwards it shows "Noch offen" with "Jetzt bezahlen".
It never shows "Bezahlt" before the webhook wrote it (SC-004).

`origin` comes from the env var `APP_URL` when set (production), otherwise from the request URL (local
development).

## R13 · Manual admin changes vs. Stripe

**Decision**: Admin edits keep writing `payment_status` and `amount_paid` directly, as today. The next
Stripe event for the same registration recomputes both from `stripe_payments` and wins (spec
assumption). Registrations without Stripe payments are never touched by the webhook.

## R14 · Dependency and versions

**Decision**: add `stripe@23.0.0` (released 2026-10-01). The SDK pins its own API version; we do not
override `apiVersion`. Server only module `lib/stripe/server.ts` with `import "server-only"`.

**Env** (server only, Vercel + `.env.local`, never committed): `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, optional `APP_URL`. No publishable key is needed because Checkout is hosted.

## R15 · Local testing

**Decision**: Stripe CLI `stripe listen --forward-to localhost:3000/api/stripe-webhook` provides the local
webhook secret; `stripe trigger` and the test cards / test IBAN cover each path (see quickstart).
