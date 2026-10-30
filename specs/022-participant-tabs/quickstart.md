# Quickstart: Tabs auf der Teilnehmerseite

## Prerequisites

- `.env.local` as for specs/017-participant-page, `APP_URL=http://localhost:3000`
- No migration
- `npm run dev`
- One registration of the current camp with an open amount, bus ticket active
  (specs/021-bus-ticket) and school release switched on (specs/020-school-release), plus one
  without bus and release. Copy each participant link from the registration dialog in `/admin`.

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

`npm test` includes `tests/unit/participant-tabs.test.ts` with every row of the fragment table in
[data-model.md](data-model.md).

## Manual scenarios

Run on a 375 px wide viewport unless stated otherwise.

1. **Default**: open the link without fragment. Übersicht is active, status, amounts and the pay
   button are visible without scrolling, camp and packing list below. No answers, no contact form,
   no bus ticket. Strip above the tabs shows „Noch … offen“ with „Jetzt bezahlen“.
2. **Switch and keep input**: tap „Meine Angaben“, type into the message field, tap „Übersicht“,
   tap „Meine Angaben“ again. The text is still there, the page did not reload, the address ends
   in `#angaben`.
3. **Submit stays**: send the message. Confirmation appears, „Meine Angaben“ stays active.
4. **Reload and history**: reload, the same tab opens. Switch tabs three times, press back once:
   the browser leaves the page (or returns to where it came from), it does not step through tabs.
5. **Old mail links**: open the link with `#busticket`: Dokumente active, bus ticket fully in view
   below the sticky tab bar. Same with `#schulbefreiung` for the release form. In `/admin/mail`
   open the arrival info preview and follow its bus ticket link.
6. **New fragments**: `#dokumente`, `#angaben`, `#uebersicht` open their tab; `#quatsch` opens
   Übersicht.
7. **No documents**: with the registration without bus and release only two tabs show;
   `#busticket` opens Übersicht.
8. **Paid and cancelled**: set paid to the full amount in the admin dialog, reload: no strip. Set
   status to cancelled: strip „Deine Anmeldung ist storniert.“, no pay button, Dokumente gone
   (bus ticket and release are hidden for cancelled registrations).
9. **Keyboard and screen reader**: Tab to the tab bar, Arrow Right and Left switch, Home and End
   jump, Tab moves into the panel. VoiceOver announces „Tab, ausgewählt, 1 von 3“.
10. **Without JavaScript**: disable JavaScript in the browser, reload. No tab bar, all sections in
    order, pay button and links work.
11. **Narrow**: at 320 px width all tab labels fit on one line, no horizontal page scroll.
12. **Accessibility audit**: Lighthouse accessibility on the page shows no new issues compared to
    the current main branch.
