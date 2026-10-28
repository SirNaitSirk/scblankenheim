# Quickstart: Persönliche Teilnehmerseite

## Prerequisites

- `.env.local` with Supabase, Clerk, Stripe test keys and `APP_URL=http://localhost:3000`
- Migration `0013_participant_access.sql` applied, `lib/database.types.ts` regenerated
- `npm run dev`

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

## Manual scenarios

1. **Backfill**: in Supabase, every existing row of `registrations` has a 64 character
   `access_token`, all different.
2. **Link in mails**: open `/admin/mail`. Confirmation, payment link, the three reminders and the
   four info mails each show the button "Meine Anmeldung ansehen".
3. **Page with open amount**: register on `/` with an email, open the link from the confirmation
   mail (or copy it in the dialog, step 6). Expect status "aktiv", total, paid 0 €, outstanding,
   button "Jetzt bezahlen", your answers, camp dates and location, packing list link.
4. **Pay**: tap "Jetzt bezahlen", pay with test card `4242 4242 4242 4242`. After the webhook,
   reload the page: "Alles bezahlt", no pay button.
5. **Partial and cancelled**: in the admin dialog set paid amount to part of the total, reload:
   paid and outstanding are correct. Set the status to cancelled, reload: "storniert", no pay
   button, refund hint.
6. **Admin copy**: open the registration in `/admin`, section "Teilnehmerseite", tap "Link
   kopieren", paste into a new tab: the same page opens.
7. **Renew**: tap "Link erneuern" and confirm. The old link shows "Link nicht gefunden", the new one
   works. `/admin/logs` lists the renewal.
8. **Neutral notice**: open `/meine-anmeldung/abc`, a random 64 hex string and the old link from
   step 7. All three show the same notice and no data.
9. **Throttle**: open 21 random valid looking links within 10 minutes from one browser. The 21st
   shows the throttle notice; your real link still works after the window.
10. **Privacy**: for a registration with a hidden price tier, a room and a tent circle, view the
    page source: no tier name, room or circle name appears. Response headers or meta show
    `noindex` and `no-referrer`.
11. **Phone**: open the page at 360px width: no horizontal scroll, everything readable.
