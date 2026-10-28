# Quickstart: Mail Einstellungen pro Camp

## Prerequisites

- Local Supabase with migration `0012_mail_settings.sql` applied and `lib/database.types.ts`
  regenerated.
- `.env.local` with `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `CRON_SECRET`, `APP_URL`.
- An admin with the permissions `camps`, `finances` and `registrations`, and one without them.

## Automated checks

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

1. **Defaults unchanged**: Without saving any new setting open `/admin/mail`. Triggers read 7 days,
   7 days before due, 56, 21, 5 and 5 days; previews look as before.
2. **Camp switch**: In `/admin/camps/<id>/infomails` switch off "Zahlungserinnerungen" and save.
   Trigger the reminder cron with a registration whose first reminder is due:
   `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/payment-reminders`.
   Nothing is sent; the Mail tab marks reminders as off. Switch on, rerun: one reminder goes out.
3. **Pause**: In `/admin/finanzen` pause an open registration, filter "Pausiert" shows it, rerun
   the cron: no reminder for it. Resume in the registration dialog, rerun: reminder goes out.
4. **Timing**: Set Packzettel to 28 and move the camp start to 28 days from today; run
   `/api/cron/info-mails`. The packing mail goes out. Try Packzettel 70 or Anreise above Packzettel:
   save is refused with a German hint.
5. **Sender**: Set sender name and reply address, send a test mail. Inbox shows the new name, the
   same sender address, and replying targets the new address.
6. **Text blocks**: Fill greeting, closing, contact name and phone. The confirmation preview shows
   them at the fixed positions; emptying them restores the previous text.
7. **Test send**: Send a test of "Erinnerung 2". Subject starts with "Test:". A second click within
   one minute is refused. The test does not appear in any registration's mail history and the log
   shows `email.test_sent`.
8. **Permissions**: As an admin without `camps` the settings form is read only and the test button
   is missing; without `finances` and `registrations` the pause switch is missing.
