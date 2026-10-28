# Tasks: Online bezahlen mit Stripe (Kern)

**Input**: `specs/006-stripe-payment/` (spec.md, plan.md, research.md, data-model.md,
contracts/http-routes.md, contracts/payment-pages.md, quickstart.md)

**Tests**: plan.md asks for Vitest unit tests of the pure payment logic (status derivation, event
mapping, checkout eligibility). End to end runs through Stripe test mode per quickstart.md.

Format: `[ID] [P?] [Story] Description`. `[P]` = can run in parallel (different files, no open dependency).

## Phase 1: Setup

- [x] T001 Add dependency `stripe@23.0.0` (exact version) to `package.json` and install; do not override `apiVersion`
- [x] T002 [P] (owner action pending) Ask the owner to put `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (test mode) into `.env.local` as documented in `specs/006-stripe-payment/quickstart.md`; never commit real values
- [x] T003 Create migration `supabase/migrations/0007_stripe_payments.sql` per data-model.md: table `stripe_payments` (`id uuid pk default gen_random_uuid()`, `registration_id uuid not null references registrations(id) on delete cascade`, `payment_intent_id text not null unique`, `checkout_session_id text`, `status text not null` (values `processing`, `succeeded`, `failed`, no CHECK), `amount_cents int not null`, `refunded_cents int not null default 0`, `created_at`/`updated_at timestamptz not null default now()`, index on `registration_id`); table `stripe_events` (`id text pk`, `type text not null`, `received_at timestamptz not null default now()`); column `submission_attempts.kind text not null default 'registration'` plus index `(kind, ip, created_at)`; RLS enabled on both new tables, no grants to `anon`
- [x] T004 Apply migration 0007 and regenerate `lib/database.types.ts` (depends on T003). Types updated by hand; applying the SQL to the database is done by the owner, as for earlier migrations

## Phase 2: Foundational (blocks all stories)

- [x] T005 [P] Create `lib/stripe/server.ts`: `import "server-only"`, lazy singleton `getStripe()` reading `STRIPE_SECRET_KEY`, throws a clear English error when missing (mirror `lib/supabase/server.ts`)
- [x] T006 [P] Extend `PaymentStatus` in `lib/admin/types.ts` to `"unpaid" | "processing" | "partial" | "paid" | "refunded"`; add labels in `lib/admin/messages.ts` `PAYMENT_STATUS_LABELS`: `processing` "In Bearbeitung", `refunded` "Erstattet"; add `de.registrations.overpaid` "Überzahlt"
- [x] T007 [P] Create `lib/payment/limits.ts`: `PAYMENT_THROTTLE_WINDOW_MS = 10 * 60 * 1000`, `PAYMENT_THROTTLE_MAX = 40`, `CONFIRM_POLL_INTERVAL_MS = 3000`, `CONFIRM_POLL_MAX_MS = 30000`, `REFERENCE_MAX_LENGTH = 32`
- [x] T008 [P] Create `lib/payment/messages.ts` with every German string from contracts/payment-pages.md (pay page states, thank you states, errors, button "Jetzt bezahlen", form label "Referenznummer", "Weiter zur Bezahlung …", Stripe product name builder `Teilnahme ${camp}`); no dash punctuation
- [x] T009 Create `lib/payment/status.ts` (pure, no imports from server modules): types `StripePaymentStatus = "processing" | "succeeded" | "failed"` and `StripePaymentRow`; `nextRowStatus(current, incoming)` rank guard (`processing` 1 < `succeeded` 2 = `failed` 2, never move to a lower rank); `derivePaymentState(amountDueEuros, rows)` implementing research.md R5 steps 1 to 6, `amountPaid = Math.floor(netCents / 100)` (depends on T006)
- [x] T010 [P] Unit tests `tests/unit/payment-status.test.ts`: paid, processing, SEPA failed → unpaid, partial refund → partial, full refund → refunded, double payment → paid with amount above due, late processing after succeeded ignored, amount due 0 (depends on T009)
- [x] T011 Create `lib/payment/checkout.ts` (pure eligibility lives in `lib/payment/eligibility.ts` so tests avoid `server-only`): pure `checkoutEligibility(registration)` returning `"ok" | "not_found" | "cancelled" | "paid" | "processing" | "refunded" | "nothing_due"` per research.md R9 (outstanding = `amount_due − amount_paid`); server function `createCheckoutForRegistration(registrationId, origin)` that loads the registration and camp name with the service client, checks eligibility, expires the previous session when Stripe reports it `open` (errors ignored, R8), creates the session with the fields from contracts/http-routes.md (`mode: "payment"`, `price_data` eur, `unit_amount` = outstanding × 100, `locale: "de"`, `client_reference_id`, `metadata.registration_id`, `metadata.reference`, `payment_intent_data.metadata.registration_id`, `customer_email`, success and cancel URLs, idempotency key), stores `stripe_session_id`, returns `{ ok: true, url } | { ok: false, reason }`; logs Stripe errors as `warning` via `writeLog` (depends on T004, T005, T009)
- [x] T012 [P] Unit tests `tests/unit/payment-checkout.test.ts` for `checkoutEligibility` (deleted, cancelled, each payment status, partial with remainder, nothing due) (depends on T011)
- [x] T013 Create helper `resolveOrigin(request)` in `lib/payment/checkout.ts`: `APP_URL` when set, else `new URL(request.url).origin` (research.md R12)

**Checkpoint**: Stripe client, status derivation and checkout creation exist and are tested.

## Phase 3: User Story 1 · Direkt nach der Anmeldung bezahlen (P1) 🎯 MVP

**Goal**: submit → Stripe → webhook marks paid → thank you page shows it.

**Independent Test**: quickstart scenarios 1, 2, 5, 9, 11, 13.

- [x] T014 [US1] Create `lib/payment/webhook.ts`: `handleStripeEvent(event)` that inserts `event.id` into `stripe_events` (unique violation → return `"duplicate"`), maps the four event types from research.md R4 to a `stripe_payments` upsert keyed by `payment_intent_id` (use `nextRowStatus`; for `charge.refunded` set `refunded_cents = charge.amount_refunded` and find the row by payment intent), resolves the registration from `metadata.registration_id` or the existing row, recomputes with `derivePaymentState` and updates `registrations.payment_status`, `amount_paid`, `updated_at`; writes an `info` log `payment.<status>` with reference and amount (FR-017); on any error deletes the event row and rethrows; unknown registration → `warning` log, no throw. Keep the event → row mapping in a pure exported function `mapEventToPaymentUpdate(event)` (in `lib/payment/events.ts`) (depends on T009, T011)
- [x] T015 [P] [US1] Unit tests `tests/unit/payment-webhook.test.ts` for `mapEventToPaymentUpdate` with fixture objects: completed paid, completed unpaid (SEPA), async succeeded, async failed, charge refunded partial and full, ignored event type (depends on T014)
- [x] T016 [US1] Create `app/api/stripe-webhook/route.ts`: `export const runtime = "nodejs"`, `POST` reads `await request.text()`, missing header or failed `getStripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)` → `400` plus `warning` log `payment.webhook_rejected`; calls `handleStripeEvent`; `200` on success or duplicate, `500` on error (depends on T014)
- [x] T017 [US1] Update `lib/register/service.ts`: registration throttle query filters `kind = 'registration'` and inserts with that kind; after a successful insert, if `amountDue === 0` set `payment_status = 'paid'`; extend `RegistrationResult` ok variant with `registrationId` so the route can start checkout (depends on T004)
- [x] T018 [US1] Update `app/api/register/route.ts`: on success call `createCheckoutForRegistration(registrationId, resolveOrigin(request))` unless amount was 0; respond `{ reference, checkoutUrl }` with `checkoutUrl` null on 0 € or Stripe failure (contract http-routes.md); registration never fails because of Stripe (depends on T011, T013, T017)
- [x] T019 [US1] Update `components/marketing/registration-form.tsx`: read `checkoutUrl`; when present show "Weiter zur Bezahlung …" and `window.location.assign(checkoutUrl)`; when null show the success notice with a link to `/bezahlen?ref=…`, or the free text when the response says free (add `free: boolean` to the response if needed); update copy in `lib/register/messages.ts` (`successBody` without "Zur Bezahlung melden wir uns", new `successFree`, `redirecting`, `payLaterLink`) (depends on T018)
- [x] T020 [P] [US1] Create `components/payment/confirm-refresher.tsx` (`"use client"`): calls `router.refresh()` every `CONFIRM_POLL_INTERVAL_MS` until `CONFIRM_POLL_MAX_MS`, then renders its `fallback` child; respects reduced motion for the spinner (depends on T007)
- [x] T021 [US1] Create `lib/payment/lookup.ts`: `findRegistrationByReference(reference)` plus `normalizeReference` (trim, uppercase, length ≤ `REFERENCE_MAX_LENGTH`, select only `id, reference, first_name, amount_due, amount_paid, payment_status, status, deleted, camp name`), returns `null` for unknown or deleted; `isPaymentThrottled(ip)` counting `submission_attempts` with `kind = 'payment'` in the window and recording the attempt (depends on T004, T007)
- [x] T022 [US1] Create `app/bezahlen/danke/page.tsx` (Server Component, `searchParams` awaited per Next 16 docs): states from contracts/payment-pages.md (paid, processing, unpaid with `ConfirmRefresher` then "noch offen" + pay button, refunded, not found); shows only first name, amount, reference; design pass with `impeccable` and `tasteskill`, same look as the registration notice (depends on T008, T020, T021)

**Checkpoint**: a full card payment from the landing page ends as "Bezahlt" in the admin table.

## Phase 4: User Story 2 · Später bezahlen (P1)

**Goal**: cancelled or unpaid registrations can be paid later via `/bezahlen?ref=…`.

**Independent Test**: quickstart scenarios 3, 4, 10, 12.

- [x] T023 [US2] Create `app/api/checkout/route.ts`: `POST`, accept form data or JSON field `reference` (Zod, trimmed, 1 to `REFERENCE_MAX_LENGTH`); `isPaymentThrottled(ip)` → `303` to `/bezahlen?ref=…&fehler=limit`; `findPayableRegistration` → if null or not eligible `303` to `/bezahlen?ref=…`; `createCheckoutForRegistration` → `303` to Stripe URL, on failure `303` to `/bezahlen?ref=…&fehler=stripe` (contract http-routes.md) (depends on T011, T013, T021)
- [x] T024 [P] [US2] Create `components/payment/pay-card.tsx` (Server Component): greeting with first name, camp name, outstanding amount via the existing currency formatter, reference, `<form method="post" action="/api/checkout">` with hidden `reference` and button "Jetzt bezahlen"; optional muted hint slot. Also: the thank you page is throttled like `/bezahlen` (depends on T008)
- [x] T025 [US2] Create `app/bezahlen/page.tsx`: all states from contracts/payment-pages.md (no ref → reference form with GET; not found; throttled; open with `PayCard` and `abgebrochen=1` hint; `fehler=stripe` notice; processing; paid; refunded or cancelled); counts the lookup with `isPaymentThrottled`; never renders last name, email, form answers or tier name; design pass with `impeccable` and `tasteskill` (depends on T021, T024)
- [x] T026 [US2] Use `PayCard` for the "noch offen" state in `app/bezahlen/danke/page.tsx` (depends on T022, T024)

**Checkpoint**: abort on Stripe, return via `/bezahlen`, pay, see "Bereits bezahlt".

## Phase 5: User Story 3 · Admins sehen den echten Zahlungsstand (P2)

**Goal**: all five statuses visible, filterable and editable; overpaid hint.

**Independent Test**: quickstart scenarios 5, 6, 7, 8.

- [x] T027 [P] [US3] Update `app/admin/actions.ts`: both Zod enums become `z.enum(["unpaid", "processing", "partial", "paid", "refunded"])` (depends on T006)
- [x] T028 [P] [US3] Update `components/admin/registrations-table.tsx`: `paymentTone` adds `processing: "pending"`, `refunded: "neutral"`; show an "Überzahlt" badge when `amountPaid > amountDue` (depends on T006)
- [x] T029 [P] [US3] Check `components/admin/registrations-filters.tsx`, `components/admin/registration-form-dialog.tsx` and `components/admin/registrations-manager.tsx` pick up the new labels through `PAYMENT_STATUS_LABELS` and compile; adjust only if a hardcoded list exists (depends on T006). Checked: all derive from `PAYMENT_STATUS_LABELS`, no change needed
- [x] T030 [US3] Verify `getFinanceSummary` in `lib/admin/data.ts` and `lib/admin/dashboard-metrics.ts` stay correct: collected sums `amount_paid` (processing contributes 0), "Offen" counts everything not `paid`; change nothing unless a check fails (depends on T006). Checked: correct as is, no change

**Checkpoint**: SEPA shows "In Bearbeitung", refunds show "Teilweise" or "Erstattet", resent events change nothing.

## Phase 6: Polish

- [x] T031 [P] Update `components/marketing/payment-faq.tsx` method list to Karte, Apple Pay, Google Pay, PayPal, SEPA Lastschrift, Klarna
- [x] T032 [P] Update AGENTS.md section 6 route names to the real ones (`/api/checkout`, `/api/stripe-webhook`) if they differ from the wording there
- [x] T033 Run `npm run lint`, `npm test`, `npm run build` and report the output verbatim
- [x] T034 Walk through quickstart.md scenarios 1 to 13 in Stripe test mode with `stripe listen`; note any scenario that could not be run (needs owner's test keys)
  * 2026-10-27: scenarios 9 (unsigned webhook → 400), 10 (unknown reference → neutral notice) and the checkout half of 13 (no Stripe key → `/bezahlen?ref=…&fehler=stripe`) passed. Scenarios 1 to 8, 11, 12 and the registration half of 13 are open: migration 0007 is not applied, no Stripe test keys in `.env.local`, Stripe CLI not installed.
  * 2026-10-27, Stripe sandbox with `stripe listen`: scenarios 1 (card, paid 195 €), 2 (hidden tier, Stripe asks 120 €, price not on landing page), 3 (cancel shows open state with hint), 4 (paid shows notice, checkout post redirects back), 5 (SEPA processing, then paid), 6 (failing SEPA back to unpaid), 7 (partial refund → partial 100 €, full refund → refunded 0 €), 8 (resent event changes nothing), 11 (0 € tier → paid, no redirect) and 12 (new checkout expires the previous session) passed; every webhook answered 200. Scenario 13 registration half not run with a broken key; an earlier registration without key (REG-07FD6CBA) was saved and logged `payment.checkout_failed`, which covers it. PayPal does not appear in Checkout yet: it still has to be enabled in the Stripe Dashboard.

## Dependencies

* Setup T001 to T004 → Foundational T005 to T013 → stories.
* US1 (Phase 3) is the MVP and provides the webhook, lookup and thank you page.
* US2 depends on T021 from US1 (lookup) and T022 (thank you page) for T026; otherwise independent.
* US3 depends only on Foundational (T006) and can run in parallel with US1 and US2.
* Polish after all stories.

## Parallel examples

* Foundational: T005, T006, T007, T008 together; then T009; then T010 and T011 side by side.
* US1: T015 and T020 alongside T016 to T019.
* US2: T024 while T023 is in progress.
* US3: T027, T028, T029 together.

## Implementation strategy

1. MVP: Phases 1 to 3 → immediate payment with webhook confirmation works end to end.
2. Add Phase 4 → tolerant "pay later" path complete (both P1 stories done).
3. Add Phase 5 → admin reflects every Stripe state.
4. Phase 6 checks and quickstart before asking for approval to go live.
