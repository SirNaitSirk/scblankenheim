# Quickstart: Schulbefreiung im Gemeindebriefkopf

## Prerequisites

- Migration `0020_church_release_letter.sql` applied, types regenerated.
- Current camp with start and end date and location "Nieuwpoort/Belgien".
- Stamp image uploaded under Mails, Schulbefreiung (the stamp with signature from the template).

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

## Manual steps

1. Admin, Camp, Mails, Schulbefreiung: the card shows switch, release dates and stamp upload, no
   signer or address fields. Open the preview PDF and lay it next to `template-2026.pdf`.
2. Turn the release on for a camp without end date: the switch names the missing camp period.
3. Participant page of a paid test registration, tab Dokumente: only school name and school
   location. Submit "Gesamtschule Eifel" and "Nettersheim": PDF downloads, mail with attachment arrives.
4. Repeat with a female registration and one without gender: the request wording changes.
5. Admin registration dialog, Schulbefreiung: two fields, change the location, download again.
6. Old entry from before the migration: download works and shows the derived location.
7. Very long school name (max length): PDF stays one page, text does not overlap stamp or footer.
8. Datenschutz page: release section names only school name and location.

## Open point for approval

The template writes office hours, phone and the bank name with dashes. The plan replaces them
("9.00 Uhr bis 13.00 Uhr", "VR Bank Nordeifel eG") because of the no dash writing rule. If the
letter must match the template character for character, say so and the footer keeps the dashes.
