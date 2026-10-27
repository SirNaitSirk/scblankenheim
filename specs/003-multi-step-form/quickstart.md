# Quickstart: Multi Step Registration Form

## Prerequisites

- `.env.local` as for spec 001 (Supabase, Clerk); a current camp with open registration.
- Admin account with permission to edit camp fields.

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

Expected: no lint errors; `tests/unit/steps.test.ts` and existing suites pass; build succeeds.

## Manual scenarios

1. **Automatic split**: camp with 9 questions and no step break. Open `/`. Expect steps
   `Deine Daten`, `Weitere Angaben` (4), `Weitere Angaben` (4), `Weitere Angaben` (1), `Angaben prüfen`.
2. **Validation per step**: on step 1 leave Mail empty, press Weiter. Stay on step 1, error under
   Mail, Mail focused. Press Enter inside Vorname after fixing: moves to step 2.
3. **Back keeps data**: fill step 2, go to step 3, press Zurück. Values of step 2 are still there.
4. **Admin step breaks**: in `/admin/camps/<id>/felder` add `Gesundheit` before the first health
   question and `Einverständnis` before the first checkbox. Reload `/`. Steps follow these titles.
   Add two breaks in a row and one at the end: no empty step appears.
5. **Review and edit**: reach `Angaben prüfen`, press Ändern at `Gesundheit`, change a value,
   press `Zurück zur Übersicht`. Review shows the new value; submit; success message with reference.
   In `/admin` the registration has the value; no column or CSV entry for the step breaks.
6. **Server field error**: set a select option limit to the current count, then submit a
   registration choosing it. Form jumps to that step with the seat message.
7. **Register another**: press `Noch jemanden anmelden` after success via an invitation link.
   Form is empty, on step 1, invitation hint visible.
8. **Reduced motion**: enable "Bewegung reduzieren" (macOS: Bedienungshilfen, Anzeige). Step
   changes only fade, no slide, no height animation.
9. **Mobile**: 375px wide viewport. Step 1 including buttons fits without scrolling; progress shows
   `Schritt 1 von n` with bar; buttons are full width.
10. **Keyboard and screen reader**: complete the flow with Tab, Enter and Space only; VoiceOver
    announces `Schritt 2 von 4: Gesundheit` on each change.
