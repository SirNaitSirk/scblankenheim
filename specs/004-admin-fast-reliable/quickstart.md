# Quickstart: Adminbereich zuverlässig und schnell

## Prerequisites

- `.env.local` with Supabase and Clerk keys, an admin account, a current camp with registrations.

## Automated checks

```bash
npm run lint
npm test
npm run build
```

Expected: no lint errors, all unit tests pass (including `transient.test.ts` and
`supabase-fetch.test.ts`), build succeeds.

## Manual scenarios (production build, prefetch only works there)

```bash
npm run build && npm start
```

1. **Data always there (SC-001)**: sign in, open every tab once. Wait 15 minutes, open all tabs again.
   Repeat three times. Every tab shows data; Finanzen never shows 0 with existing registrations.
2. **Fast switch (SC-002)**: after the dashboard has loaded, wait 2 seconds, click Finanzen, Camps,
   Benutzer, Logs, Profil. Each appears with data, no skeleton. DevTools network tab shows the
   prefetch requests before the clicks.
3. **Own changes (SC-004)**: on the dashboard set a registration to "bezahlt", immediately open
   Finanzen: "Eingegangen" has grown by its amount. Edit a camp, open the dashboard: new name shown.
4. **External change**: register through the public form in another browser; in the admin the new
   registration shows after at most 30 seconds of tab switching, or immediately after reload.
5. **Database unreachable (SC-005)**: set `NEXT_PUBLIC_SUPABASE_URL` to an unroutable address
   (for example `http://10.255.255.1`), restart, open the dashboard: the German error state appears
   within about 10 seconds. Restore the URL afterwards.
6. **Request count (SC-003)**: in development with the server log, the dashboard issues 11 instead
   of 19 Supabase requests (temporary count via the fetch wrapper, not committed).
