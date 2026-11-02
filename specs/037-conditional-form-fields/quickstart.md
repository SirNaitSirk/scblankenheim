# Quickstart: Bedingte Formularfelder

## Voraussetzungen

- `npm run dev`, als Admin mit Berechtigung Camps anmelden.
- Ein Camp mit einem Auswahlfeld „Jugend“, das die Antwort „Eingeladen“ enthält.

## Automatische Checks

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

Erwartet: alle grün; `tests/unit/form-conditions.test.ts` deckt Sichtbarkeit, Verwerfen und
Feldschutz ab.

## Szenarien

1. **Bedingung anlegen**: `Camps › <Camp> › Felder`, neues Textfeld „Eingeladen von“, Pflichtfeld
   an, „Nur anzeigen, wenn“ an, Auslöser „Jugend“, Antwort „Eingeladen“, speichern. Feldliste zeigt
   „Nur bei Jugend: Eingeladen“.
2. **Testansicht**: „Formular testen“. Jugend leer: kein Feld. „Eingeladen“: Feld erscheint,
   Weiter ohne Namen ergibt die Pflichtmeldung. Andere Jugend: Feld weg, Absenden klappt.
3. **Echte Anmeldung** (Anmeldung offen, lokale Datenbank): mit „Eingeladen“ und Namen anmelden.
   In der Anmeldetabelle Spalte „Eingeladen von“ einblenden: Name steht da, Filter und CSV
   enthalten ihn.
4. **Server verwirft**: in den Entwicklertools die Anfrage an `/api/register` aus einer echten
   Absendung kopieren (mit gültigem `formToken`), eine andere Jugend und trotzdem `eingeladen_von`
   setzen und erneut schicken. Erwartet: Anmeldung gespeichert, `form_data` ohne
   `eingeladen_von`. Mit „Eingeladen“ ohne Namen: Antwort 400 mit Feldfehler.
5. **Anmeldedialog**: Anmeldung aus 3 öffnen, Feld sichtbar. Jugend ändern, speichern, erneut
   öffnen: Feld weg, Name entfernt.
6. **Teilnehmerseite**: Link der Anmeldung aus 3 öffnen, „Meine Angaben“ zeigt den Namen; Änderung
   anfragen geht. Bei einer Anmeldung ohne „Eingeladen“ fehlt die Zeile.
7. **Feldschutz**: bei „Jugend“ die Antwort „Eingeladen“ umbenennen, entfernen, den Typ ändern, den
   Schlüssel ändern, das Feld löschen. Jedes Mal Ablehnung mit Nennung von „Eingeladen von“.
   Andere Antwort ergänzen: klappt.
8. **Unverändert**: ein Camp ohne Bedingung durchklicken; Verhalten wie vorher.
9. **Bildschirmleser** (VoiceOver): „Eingeladen“ wählen, Ansage „Neues Feld: Eingeladen von“.
