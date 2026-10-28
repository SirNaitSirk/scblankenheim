# Quickstart: Anmeldestatus vereinfachen

## Prerequisites

- Local Supabase running with the seed, dev server via `npm run dev`, signed in as an admin with the
  `registrations` permission.
- Note the dashboard tiles, the finance sums, the room occupancy and the tent circle counts of the
  current camp before applying the migration.

## Apply

Local database with existing data (keeps the rows, so the numbers can be compared):

```bash
npx supabase migration up
```

Fresh local database (applies all migrations and the updated seed):

```bash
npx supabase db reset
```

## Validate

1. **Migration**: in the SQL editor run
   `select status, count(*) from registrations group by status;`
   Expected: only `active` and `cancelled`.
2. **Table**: open `/admin`. Every status badge shows „Aktiv“ (grey) or „Storniert“ (red).
3. **Numbers unchanged**: dashboard tiles, `/admin/finanzen` sums, `/admin/zimmerplanung` and
   `/admin/zeltkreise` match the values noted before.
4. **Filter**: the status filter lists „Alle“, „Aktiv“, „Storniert“; „Storniert“ shows only cancelled
   rows.
5. **Admin add**: „Anmeldung hinzufügen“ preselects „Aktiv“ and offers only two values.
6. **Public signup**: register on `/`. The new row appears as „Aktiv“.
7. **Cancel and restore**: set a row to „Storniert“; capacity on the dashboard drops by one and the
   row disappears from room planning. Set it back to „Aktiv“; it counts again.
8. **CSV**: export with the status column visible; the column contains only „Aktiv“ or „Storniert“.

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
