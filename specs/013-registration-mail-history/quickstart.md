# Quickstart: Mailübersicht pro Anmeldung

## Prerequisites

- Local Supabase with seed data, `npm run dev`, signed in as an admin with the permission
  „Anmeldungen“.
- Resend test key in `.env.local` so confirmations and payment links are sent.

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

Expected: `tests/unit/email-history.test.ts` (labels incl. unknown kind, stale as failed, sent uses
`updated_at`, actor names and fallback, ordering, limit) passes; existing tests stay green.

## Manual scenarios

1. **History (US1)**: register a person on `/`, then open the registration in `/admin`. The section
   „Mails“ shows „Anmeldebestätigung · Verschickt · bei Anmeldung“ with Berlin time.
2. **Admin trigger and refresh**: click „Zahlungslink senden“ in the same dialog. Without reopening,
   a new top row „Zahlungslink · Verschickt · von {dein Name}“ appears.
3. **Failure**: stop the mail provider (wrong `RESEND_API_KEY`), send the payment link again: a row
   „Fehlgeschlagen“ with icon and text appears.
4. **Empty**: open a seed registration without deliveries: „Noch keine Mails verschickt“.
5. **Create mode**: open „Anmeldung anlegen“: no section „Mails“.
6. **Security (US2)**: as an admin without „Anmeldungen“, call the action (for example from a test
   page or by removing the permission while the dialog is open and pressing „Erneut versuchen“): it is
   rejected. In the browser network panel the response contains no address or mail text.
