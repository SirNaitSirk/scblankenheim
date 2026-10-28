# Quickstart: Online bezahlen mit Stripe (Kern)

## Prerequisites

1. Stripe account in **test mode**. In Dashboard → Settings → Payment methods enable Card (incl. Apple
   Pay, Google Pay), PayPal, SEPA Direct Debit and Klarna.
2. `.env.local` (never committed):
   ```text
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...   # printed by stripe listen
   ```
3. Migration applied and types regenerated (see tasks).
4. Stripe CLI installed and logged in.

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,charge.refunded
```

```bash
npm run dev
```

## Scenarios

| # | Steps | Expected |
|---|-------|----------|
| 1 | Register on `/`, pay with card `4242 4242 4242 4242` | lands on `/bezahlen/danke`, shows "Bezahlt" within a few seconds; admin table: Bezahlt, full amount |
| 2 | Register via an invitation link of a hidden tier | Stripe shows the tier price; landing page never shows it |
| 3 | Register, click "Zurück" on Stripe | `/bezahlen?ref=…&abgebrochen=1` with "Jetzt bezahlen"; admin: Offen |
| 4 | Open `/bezahlen?ref=<that ref>`, pay | becomes Bezahlt; opening the page again shows "Bereits bezahlt" |
| 5 | Pay with SEPA test IBAN `DE89370400440532013000` | danke page: "In Bearbeitung"; admin: In Bearbeitung; after Stripe settles (minutes in test mode): Bezahlt |
| 6 | Pay with SEPA failing IBAN `DE62370400440532013001` | after settlement: back to Offen, eingegangen 0 |
| 7 | In Stripe Dashboard refund half, then the rest | admin: Teilweise with remaining amount, then Erstattet with 0 |
| 8 | Run `stripe events resend <event id>` for a completed event | nothing changes, no double amount |
| 9 | `curl -X POST localhost:3000/api/stripe-webhook -d '{}'` | `400`, warning in admin logs |
| 10 | Open `/bezahlen?ref=REG-00000000` | neutral "keine offene Anmeldung" notice |
| 11 | Create a 0 € tier, register via its link | no Stripe redirect, "Für dich fällt kein Beitrag an", admin: Bezahlt |
| 12 | Start checkout twice for the same ref, then pay in the first tab | first session is expired, Stripe shows it as no longer valid |
| 13 | Temporarily set an invalid `STRIPE_SECRET_KEY`, register | registration saved, success notice with pay later link, warning in logs |

## Checks

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

## Going live

Only after explicit approval: live keys in Vercel env, add the production endpoint
`https://<domain>/api/stripe-webhook` in Stripe with the four event types from
[contracts/http-routes.md](./contracts/http-routes.md), set `APP_URL`, repeat scenario 1 with a real small payment and refund it.
