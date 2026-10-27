# Contracts: HTTP routes

All routes are public in `proxy.ts` (only `/admin` is protected). None accepts an amount.

## POST /api/register (changed response)

Request: unchanged (`{ values, priceTierToken? }`).

Response `200`:

```json
{ "reference": "REG-1A2B3C4D", "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..." }
```

* `checkoutUrl` is `null` when `amount_due = 0` (registration already `paid`) or when creating the
  session failed (registration stays `unpaid`, logged as warning).
* Error responses: unchanged.

Client behaviour: `checkoutUrl` → `window.location.assign(checkoutUrl)` while showing "Weiter zur
Bezahlung …". `null` → success notice with a link to `/bezahlen?ref=…` (or "Kostenlos, du bist dabei"
when free).

## POST /api/checkout

Request: `application/x-www-form-urlencoded` (plain HTML form) or JSON, field `reference` (string,
trimmed, 1 to 32 chars). Validated with Zod.

| Outcome | Response |
|---------|----------|
| session created | `303` `Location: <stripe checkout url>` |
| throttled | `303` `Location: /bezahlen?ref=…&fehler=limit` |
| not payable (unknown, deleted, cancelled, paid, processing, refunded, nothing due) | `303` `Location: /bezahlen?ref=…` (page renders the matching notice) |
| Stripe error | `303` `Location: /bezahlen?ref=…&fehler=stripe` |

Always a redirect, so the button works without JavaScript and never leaks state in a JSON body.

## POST /api/stripe-webhook

* Not Clerk authenticated. Requires header `stripe-signature`; body read raw with `request.text()`.
* Invalid or missing signature → `400`, warning in `logs`.
* Already processed `event.id` → `200`.
* Handled types: see [research.md R4](../research.md). Others → `200`.
* Processing error → `500` (event row removed so Stripe retries).

Session fields we rely on, set when creating the session:

| Field | Value |
|-------|-------|
| `client_reference_id` | `registration.id` |
| `metadata.registration_id` | `registration.id` |
| `metadata.reference` | `registration.reference` |
| `payment_intent_data.metadata.registration_id` | `registration.id` |
| `customer_email` | `registration.email` when present |
| `locale` | `de` |
| `success_url` | `{origin}/bezahlen/danke?ref={reference}` |
| `cancel_url` | `{origin}/bezahlen?ref={reference}&abgebrochen=1` |

Stripe call idempotency key: `checkout:{registration.id}:{registration.stripe_session_id ?? "first"}`.
