# Quickstart: Mails und Zahlungserinnerungen

Validation guide. Details: [contracts](./contracts/), [data model](./data-model.md).

## Prerequisites

- Feature 006 working locally (Stripe test keys, `stripe listen` forwarding to `/api/stripe-webhook`).
- Resend account; API key in `.env.local` as `RESEND_API_KEY`. Until the domain is verified, use
  `EMAIL_FROM="Summercamp <onboarding@resend.dev>"`, which only delivers to the Resend account's own
  address, so register with that address.
- `.env.local`: `EMAIL_REPLY_TO`, `CRON_SECRET` (any long random string locally), `APP_URL=http://localhost:3000`.
- Migration `0008_email_deliveries.sql` applied, DB types regenerated.
- `npm run dev`.

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

## Scenarios

1. **Confirmation, paid camp**: register on `/`, close the Stripe page. Within a minute a German mail
   arrives with reference, amount and "Jetzt bezahlen"; the link opens `/bezahlen?ref=…` and payment
   works. `email_deliveries` has one `confirmation` row `sent`; log shows `email.sent`.
2. **Confirmation, free**: register through a 0 € price tier link. Mail says nothing is to pay, no
   button, no tier name.
3. **Provider down**: set `RESEND_API_KEY` to an invalid value, register. Redirect to Stripe works as
   before; log shows `email.failed`; row `failed`.
4. **Cron auth**: call the route without header, expect `401`:
   ```bash
   curl -i http://localhost:3000/api/cron/payment-reminders
   ```
5. **First reminder**: in Supabase set `registered_at` of an unpaid registration to 8 days ago, then:
   ```bash
   curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/payment-reminders
   ```
   Expect `"sent": 1`, reminder mail with outstanding amount. Run again: `"sent": 0`.
6. **Due date windows**: set the camp's `payment_due_date` to 5 days ahead, set `registered_at` and
   the earlier reminder row back by 4 days, run: `reminder_2` is sent. Set the due date to yesterday,
   shift dates again, run: `reminder_3`, friendly tone, no cancellation wording.
7. **Stop conditions**: mark the registration paid (Stripe test payment or manual), shift dates, run:
   nothing sent. Repeat for `processing`, `refunded`, cancelled, deleted, 0 € and a registration of a
   non current camp. Set camp `start_date` to today: nothing sent.
8. **Partial**: set `amount_paid` below `amount_due`, `payment_status = partial`: reminder shows the
   remaining amount.
9. **Admin send**: as admin with registrations permission open an unpaid registration, click
   "Zahlungslink senden": toast "Zahlungslink gesendet.", mail arrives, log names the admin. Click
   again at once: wait message. Paid registration: button absent. No email: only "Link kopieren".
10. **Admin copy**: click "Link kopieren", paste in a private window: payment page of that
    registration.
11. **Admin without permission**: admin without `registrations` permission triggers the action:
    forbidden message, nothing sent.
12. **Reminder info**: registration from scenario 5 shows "1 Erinnerung, zuletzt am …" in the admin.
13. **Deployed cron**: after deploy, Vercel project settings list the cron; the next morning the log
    shows a `reminders.run` entry.
14. **Mail tab**: as superadmin open `/admin/mail`. Six entries; each shows subject, sending trigger,
    HTML preview with "Lena", `REG-BEISPIEL`, current camp name and base price; "Textfassung" shows
    the text version. No input fields, no save or send button. Clicking the pay button in the preview
    does nothing.
15. **Mail tab without due date**: clear `payment_due_date` on the current camp: hint appears, previews
    show no date. Restore afterwards.
16. **Mail tab access**: admin without the tab grant opens `/admin/mail` directly: redirected to
    `/admin`; the sidebar does not list "Mail". Grant the tab in user management: it appears.
