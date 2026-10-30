# Quickstart: Impressum und Datenschutzerklärung

## Prerequisites

- `npm install` done, `.env.local` as for every feature.
- Dev server: `npm run dev` (http://localhost:3000).

## Checks

```bash
npm run lint
npm test
npm run build
```

`npm test` includes `tests/unit/legal-content.test.ts` (15 section ids, writing rules, gap list)
and the extended `tests/unit/coming-soon-gate.test.ts`.

## Manual validation

1. Open `/`, scroll to the footer: „Impressum“ and „Datenschutz“ are there; both open the pages.
2. Repeat from `/packzettel`, `/bezahlen` and a participant page `/meine-anmeldung/<token>`:
   same two links in the footer.
3. `/impressum`: all seven sections in the order of [contracts/legal-ui.md](contracts/legal-ui.md);
   every unknown value shows a highlighted „noch einzutragen: …“.
4. `/datenschutz`: „Inhalt“ with 15 links, each jumps to its section; all five services of
   [research.md](research.md) R1 are named with purpose; „7 Tage“ appears for throttling data.
5. Mobile width 375: no horizontal scrolling, mail addresses wrap.
6. Print preview of both pages: no header link, no footer, text readable.
7. Coming soon: set `COMING_SOON=true` in `.env.local`, restart, open `/` in a private window:
   the coming soon page shows the two links; `/impressum` and `/datenschutz` show the real pages.
   Remove the variable again.
8. Retention: insert a `submission_attempts` row with `created_at` eight days ago, call
   `/api/cron/info-mails` with `Authorization: Bearer $CRON_SECRET`; the row is gone, rows from
   today stay.

## Before go live

Fill every `null` in `lib/legal/operator.ts`; the gap list printed by the legal content test must
be empty, and neither page shows „noch einzutragen“. Let the association review both texts.
