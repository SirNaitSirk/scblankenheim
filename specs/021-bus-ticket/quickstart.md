# Quickstart: Busticket

## Prerequisites

- Migration `0016_bus_ticket.sql` applied, DB types regenerated.
- Dependencies installed (`qrcode`, `jsqr`, `@types/qrcode`).
- Current camp with a registration question of type Auswahl, for example "Anreise" with options
  "Mit dem Bus" and "Selbst".
- At least four test registrations: two with "Mit dem Bus" (one fully paid, one unpaid), one with
  "Selbst", one cancelled with "Mit dem Bus".
- Camera tests need HTTPS: use a Vercel preview deployment on the phone, or `localhost` in a
  desktop browser with a webcam.

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

## Scenarios

1. **Settings (US1)**: `/admin/camps/<campId>/felder` → card "Busticket". Switching on without a
   question is refused. Choose "Anreise" and "Mit dem Bus", save: count shows 2 bus persons (the
   cancelled one does not count).
2. **Participant page (US4)**: open the participant link of a bus person: section "Busticket"
   with QR code. The "Selbst" registration shows no section.
3. **Mail (US4)**: in the registration dialog of a bus person choose "Busticket senden"; the mail
   shows the QR image and appears in the mail history. `/admin/mail` lists the template; the
   arrival mail preview shows the ticket block.
4. **Permission (US2.9)**: an admin without permission and tab "Bus" opening `/admin/bus` is sent
   to the dashboard; a helper with only "Bus" can scan but not open registrations.
5. **Scan (US2)**: on `/admin/bus` choose "Hinfahrt", scan:
   - paid bus person → green with name;
   - unpaid bus person → green with "Zahlung offen";
   - same code again → red "Schon eingestiegen" with time;
   - change the paid bus person's answer to "Selbst" in the dialog, scan their code again on
     "Rückfahrt" → red "Kein Busticket"; change it back afterwards;
   - cancel the unpaid bus person in the dialog, scan their code on "Rückfahrt" → red
     "Storniert"; reactivate afterwards;
   - random QR (any website) → red "Unbekannter Code".
6. **Phone camera (US2.10)**: scan a ticket with the normal camera app while logged in: the scan
   page opens and checks the code.
7. **Reissue and block (US5)**: in the dialog choose "Neues Ticket ausstellen": the old code
   scans as "Ticket ungültig", the new one works. "Ticket sperren": the participant page shows the
   hint instead of the QR.
8. **List (US3)**: "Liste" shows "1 von 2" after one scan; mark the second manually: "von Hand"
   badge, count 2 von 2. Undo it: back to missing. Open the list on a second device: it updates
   within a few seconds. "Rückfahrt" shows 0 von 2.
9. **No connection (FR-020)**: switch the phone to flight mode and scan: "Keine Verbindung", no
   result.
10. **Broken mapping (US1.6)**: rename the option "Mit dem Bus" in the form fields: settings card
    and scan page show the warning; scans answer "Busticket ist für dieses Camp ausgeschaltet".
