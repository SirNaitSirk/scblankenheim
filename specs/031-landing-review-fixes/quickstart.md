# Quickstart: Landingpage Review Fixes

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

## Manual steps (dev server, `npm run dev`)

1. **Countdown**: current camp with `registration_opens_at` in the future. Open `/`, scroll to
   „Anmeldung“: date with weekday, „ab HH:MM Uhr“, „Noch N Tage“; nothing changes for a minute.
   Nav button reads „Anmeldung ab T.M.“. At 375 px no horizontal scroll.
2. **Under one day**: set the opening a few hours ahead: „Noch N Stunden“; set it 10 minutes ahead:
   „In weniger als einer Stunde“; wait for the moment: page refreshes once and shows the form.
3. **Screen reader**: VoiceOver on the countdown for a minute, no automatic announcements.
4. **Reassurance**: open registration, fill the form to „Angaben prüfen“: block „So geht es weiter“
   above „Verbindlich anmelden“, mail link opens the mail app; no deadlines or refunds mentioned.
5. **Success**: submit a free registration (or return from Stripe test): reference row with
   „Kopieren“ → „Kopiert“, number in the clipboard, mail hint visible.
6. **Payment block**: „Gut zu wissen · Bezahlen“ mentions paying later via the personal link.
7. **School release**: release switched on, camp without active registrations: no block, no footer
   link, nav without entry. Add one registration in the admin: block and footer link appear, nav
   still without entry, submit button is outline.
8. **Detector**: run the Impeccable detector on the changed components:

```bash
node .claude/skills/impeccable/scripts/detect.mjs --json components/marketing
```
