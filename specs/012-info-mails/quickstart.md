# Quickstart: Infomails an Angemeldete

## Prerequisites

- Local Supabase with migrations applied (`0011_camp_mail_info.sql`) and seed data.
- `.env.local` with `RESEND_API_KEY` (test key), `EMAIL_FROM`, `APP_URL=http://localhost:3000`,
  `CRON_SECRET`.
- `npm run dev`, signed in as an admin with the permission „Camps“ and access to the tab „Mail“.

## Automated checks

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run build
```

Expected: `tests/unit/email-info-mails.test.ts` (stage windows, skip rules, reminder day, registration
day, missing dates), `email-info-templates.test.ts` (optional sections, payment block, no hidden
prices) and the extended `email-preview.test.ts` pass; existing mail tests stay green.

## Manual scenarios

Run the cron route by hand:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/info-mails
```

1. **Packing (US1)**: set the current camp start to today + 21 days. Open Camps, menu „Infomails“,
   switch on „Packliste“, save. Call the route: response `sent` equals the active registrations with
   address. Call it again: `sent` is 0. `/admin/mail` shows the counts as erhalten.
2. **Arrival gate (US2)**: try to switch on „Anreise“ without address: German field errors, nothing
   saved. Fill address, arrival time and emergency phone, save, set start to today + 5, call the
   route. An unpaid registration's mail contains the payment block, a paid one does not.
3. **Late registration (US2)**: register a new person today with start in 3 days. Call the route:
   nothing for that person (registration day). Change the system date or the registration date to
   yesterday in the seed and call again: the arrival mail goes out, no packing mail.
4. **Teaser (US3)**: start in 56 days, fill highlights and greeting, enable teaser. The mail shows motto,
   highlights and greeting and no invite friends section; clear the greeting: only that section is gone.
5. **Thanks (US4)**: end date today − 5, switch the current camp to another camp, enable thanks for
   the ended camp, call the route: its registrations get the thank you mail.
6. **Quota**: insert 90 `sent` deliveries for today in the local DB, call the route: `budget` is 0 and
   nothing is sent; on the next day the run continues.
7. **Security**: call the route without the header: `401`. Call the save action as an admin without
   „Camps“ permission: rejected.
8. **Preview (US5)**: `/admin/mail` lists the four info mails with subject, trigger sentence, enabled
   state, missing field hints and counts; clicking inside the preview sends nothing.
