# Quickstart: Kalendereintrag für das Camp

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

## Manual scenarios

1. Open `/kalender/<current camp id>`: a file `summercamp-2027.ics` downloads. Import it on macOS or
   iPhone: an all day event from the first to the last camp day, with location and website link.
2. Open the Google link from the participant page: Google Calendar shows the same event prefilled.
3. Open `/kalender/abc` and a random uuid: "Nicht gefunden".
4. `/admin/mail`: confirmation (paid and free) and teaser show the calendar block.
5. Change the camp end date, open the file again: the new end date appears, the UID is unchanged.
6. A camp without end date: no calendar block in mails or on the page.
