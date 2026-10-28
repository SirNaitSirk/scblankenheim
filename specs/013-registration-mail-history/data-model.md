# Data Model: Mailübersicht pro Anmeldung

No schema change. No migration.

## Read source `email_deliveries` (specs/007, migration 0008)

Columns used: `registration_id`, `kind`, `status` (`sending`, `sent`, `failed`), `trigger`
(`registration`, `cron`, `admin`), `actor` (admin id or null), `error` (only to treat `stale` as
failed, never sent to the browser), `created_at`, `updated_at`. Index
`email_deliveries_registration_idx (registration_id, created_at desc)` serves the query.

Known kinds and German labels:

| kind | Label |
|---|---|
| `confirmation` | Anmeldebestätigung |
| `payment_link` | Zahlungslink |
| `reminder_1`, `reminder_2`, `reminder_3` | Erinnerung 1, 2, 3 |
| `info_teaser`, `info_packing`, `info_arrival`, `info_thanks` | Vorfreude, Packliste, Anreise, Danke |
| anything else | Mail |

## Read source `profiles`

`id`, `name`, `email`: display name for `actor`; name first, then email, else null.

## Domain type `MailHistoryEntry` (`lib/email/history.ts`)

```ts
type MailHistoryEntry = {
  id: string;
  kind: string;
  status: "sent" | "failed" | "sending";
  trigger: "registration" | "cron" | "admin";
  actorName: string | null;
  at: string; // ISO, updated_at when sent, else created_at
};
```

Ordering: newest `created_at` first, at most 50 entries.
