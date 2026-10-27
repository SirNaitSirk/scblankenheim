# Implementation Plan: Online bezahlen mit Stripe (Kern)

**Branch**: `006-stripe-payment` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-stripe-payment/spec.md`

## Summary

After a successful public registration the register route creates a hosted Stripe Checkout Session for
the stored outstanding amount and returns its URL; the form redirects there. Cancelled or failed
payments leave the registration `unpaid`, payable later via `/bezahlen?ref=…`, which posts to a new
`/api/checkout` route. A signature verified `/api/stripe-webhook` records one row per payment intent in a
new `stripe_payments` table and recomputes `payment_status` and `amount_paid` from those rows with a pure,
unit tested function. Idempotency via a `stripe_events` table. Admin gains two status values
(`processing`, `refunded`) and an overpaid hint. No emails, no cron, no in app refunds.

## Technical Context

**Language/Version**: TypeScript, Next.js 16.3 App Router (Server Components, Route Handlers)

**Primary Dependencies**: existing (Clerk, supabase-js, Zod, Tailwind, Phosphor, motion) plus
**`stripe@23.0.0`** (Node SDK, server only). Stripe is part of the fixed stack, so no justification needed.

**Storage**: Supabase Postgres. Migration `0007_stripe_payments.sql`: new tables `stripe_payments`,
`stripe_events`; new column `submission_attempts.kind`. See [data-model.md](./data-model.md).

**Testing**: Vitest (`npm test`) for `derivePaymentState`, the event to row mapping and checkout
eligibility (pure functions, Stripe objects as fixtures). End to end through Stripe CLI and test mode
per [quickstart.md](./quickstart.md).

**Target Platform**: Vercel (Node runtime for the Stripe routes), desktop and mobile browsers.

**Project Type**: web application (single Next.js project).

**Performance Goals**: redirect to Stripe within about 2 s after submit; webhook answers well under
Stripe's 10 s timeout (a handful of queries).

**Constraints**: amount resolved only on the server; Stripe secret and webhook secret never in the
browser; webhook body read raw; tolerant fallback (never cancel, never block registration on Stripe).

**Scale/Scope**: a few hundred registrations per year, low event volume.

## Existing code inspected

* `lib/register/service.ts`: resolves `amountDue` (base price or valid hidden tier), throttles via
  `submission_attempts` (email OR ip, 5 per 10 min), inserts through RPC `create_public_registration`,
  returns `{ ok, reference }`. Extension point for checkout creation and the 0 € case.
* `app/api/register/route.ts`: thin Zod validated handler, maps service result to status codes.
* `components/marketing/registration-form.tsx`: on `200` sets `reference` and shows a success `Notice`;
  copy in `lib/register/messages.ts` ("Zur Bezahlung melden wir uns …").
* `supabase/migrations/0001_init_schema.sql`: `registrations` already has `payment_status`
  (default `unpaid`), `amount_due`, `amount_paid` (whole euros), `stripe_session_id`; `logs` table;
  RLS on everything.
* `lib/supabase/server.ts`: `getServiceClient()` (service role, `server-only`).
* `lib/admin/data.ts`: `writeLog`, `generateReference` (`REG-` + 8 hex), `setRegistrationPayment`,
  `getFinanceSummary` (sums `amount_paid`, counts `paid`).
* `lib/admin/types.ts` / `lib/admin/messages.ts`: `PaymentStatus = "paid" | "partial" | "unpaid"` and
  `PAYMENT_STATUS_LABELS`; consumed by `registrations-table.tsx` (tone map), `registrations-filters.tsx`,
  `registration-form-dialog.tsx`, `registrations-manager.tsx`, `app/admin/actions.ts` (two Zod enums),
  `lib/admin/dashboard-metrics.ts` (counts `!== "paid"` as open).
* `proxy.ts`: only `/admin(.*)` protected; `/api/*` passes through Clerk without auth, body untouched.
* `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`: Webhooks section,
  raw body via `request.text()`.
* No `app/bezahlen` yet; `components/marketing/payment-faq.tsx` already promises card, Apple Pay,
  Google Pay, PayPal.

## Decisions

All in [research.md](./research.md). Key points: hosted Checkout with Dashboard managed methods (R1);
amount = `amount_due − amount_paid` read server side (R2); checkout created inside `/api/register` plus
`/api/checkout` for later (R3); webhook only writer, four event types (R4); derived status from
`stripe_payments` rows (R5); `stripe_events` idempotency (R6); previous open session expired (R8);
eligibility rules (R9); minimal lookup with `kind = 'payment'` throttle (R10); 0 € → paid (R11); thank you
page polls stored state for 30 s (R12); Stripe event wins over manual edit (R13).

## Constitution Check

*Checked again after Phase 1 design: all pass.*

| Principle | Status | How |
|-----------|--------|-----|
| I. Fixed stack, Clerk owns auth | ✅ | Stripe is in the stack; no other new dependency; no Supabase Auth |
| II. Server is the security boundary | ✅ | Stripe calls only in route handlers and server modules with `server-only`; webhook verifies signature; inputs Zod validated; no secret in `NEXT_PUBLIC_*`; new tables RLS on, no anon grants |
| III. Strict scope | ✅ | Stripe checkout, payment page and webhook are listed in AGENTS.md section 4; emails, cron, admin link and refunds left out |
| IV. Single source of truth | ✅ | One registration form, one migration, types regenerated, no CHECK constraints on status |
| V. Language separation | ✅ | German copy in `lib/payment/messages.ts` and existing message modules; code English |
| VI. Tolerant payment, hidden pricing | ✅ | Unpaid stays valid, no auto cancel; hidden price only appears inside the person's own Stripe session |
| VII. Simplicity and honest gates | ✅ | Pure derivation function instead of counters; thin handlers; lint, test, build run and reported |
| Writing rules | ✅ | Copy and comments without dash punctuation |

## Project Structure

### Documentation (this feature)

```text
specs/006-stripe-payment/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http-routes.md
│   └── payment-pages.md
├── checklists/requirements.md
└── tasks.md              # next: /speckit-tasks
```

### Source Code

```text
supabase/migrations/0007_stripe_payments.sql      new
lib/database.types.ts                             regenerated
lib/stripe/server.ts                              new · Stripe client (server-only)
lib/payment/
├── status.ts                                     new · derivePaymentState, rank guard (pure)
├── checkout.ts                                   new · eligibility + createCheckoutForRegistration
├── webhook.ts                                    new · event → stripe_payments row → recompute
├── lookup.ts                                     new · public lookup by reference + throttle
├── limits.ts                                     new · throttle and polling constants
└── messages.ts                                   new · German copy for pay pages
app/api/checkout/route.ts                         new
app/api/stripe-webhook/route.ts                   new
app/api/register/route.ts                         changed · returns checkoutUrl
app/bezahlen/page.tsx                             new
app/bezahlen/danke/page.tsx                       new
components/payment/
├── pay-card.tsx                                  new · open state with pay button (server)
└── confirm-refresher.tsx                         new · client, router.refresh for 30 s
components/marketing/registration-form.tsx        changed · redirect / new success copy
lib/register/service.ts                           changed · 0 € paid, checkout after insert, throttle kind
lib/register/messages.ts                          changed
lib/admin/types.ts, lib/admin/messages.ts         changed · two new statuses
components/admin/registrations-table.tsx          changed · tones, overpaid hint
components/admin/registrations-filters.tsx        changed (via labels)
components/admin/registration-form-dialog.tsx     changed (via labels)
app/admin/actions.ts                              changed · Zod enums
tests/unit/payment-status.test.ts                 new
tests/unit/payment-webhook.test.ts                new · mapping with fixture events
tests/unit/payment-checkout.test.ts               new · eligibility
```

**Structure Decision**: single Next.js project; payment logic grouped in `lib/payment/` next to the
existing `lib/register/` and `lib/admin/`, route handlers stay thin.

## Security requirements

* `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` server only (Vercel env, `.env.local`), never committed.
* Webhook: raw body, `constructEvent`, `400` on failure; registration resolved only from Stripe signed
  metadata or our own `stripe_payments` rows.
* Public pages show first name, camp, amount only; same notice for every "not found" cause; throttle 40
  lookups (thank you page refreshes included) or checkout posts per IP per 10 minutes.
* `/api/checkout` accepts only `reference`; never an amount, price tier or URL.
* Logs never contain card data (Stripe never sends it); they contain reference, event type, amount.

## Acceptance criteria

Spec FR-001 to FR-019 and SC-001 to SC-006, verified by quickstart scenarios 1 to 13.

## Checks to run

`npm run lint`, `npm test`, `npm run build` (routes and server code change). Output reported verbatim.

## Manual test steps

See [quickstart.md](./quickstart.md).

## Open points for the owner

* Stripe account: test mode keys and enabling PayPal, SEPA and Klarna in the Dashboard must be done by
  you (account settings).
* `APP_URL` for production once the domain is fixed.

## Complexity Tracking

No constitution violations.
