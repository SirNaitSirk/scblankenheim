# Quickstart: Schulbefreiung prüfen

## Voraussetzungen

- Migration `0015_school_release.sql` angewendet, Typen neu erzeugt, `npm install` (pdf-lib).
- `.env.local` mit `APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM` und Supabase Schlüsseln.
- `npm run dev`, als Admin mit Rechten für Camps und Anmeldungen angemeldet.
- Im aktuellen Camp mindestens eine aktive Anmeldung mit eigener Mailadresse.

## 1 · Einrichten (Story 3)

1. `/admin/camps/<campId>/infomails` öffnen, Bereich „Schulbefreiung“.
2. Schalter ist gesperrt, Hinweis nennt fehlendes Bild, Datum und Namen.
3. Datum innerhalb des Campzeitraums, Name und Funktion eintragen, Adressfelder wählen, PNG unter
   512 KB hochladen. Ein PDF über 512 KB oder ein umbenanntes PDF wird abgelehnt.
4. „Vorschau“ öffnet die PDF mit Beispieldaten und Unterschrift.
5. Schalter einschalten und speichern. Bild entfernen: Schalter geht aus.

## 2 · Teilnehmerseite (Story 1)

1. Teilnehmerlink aus dem Anmeldedialog öffnen, `#schulbefreiung` anhängen: Seite springt zum
   Abschnitt; Name fest, Adresse vorausgefüllt.
2. Ohne Schulname senden: Feldhinweis, nichts gespeichert.
3. Vollständig senden: „Gespeichert“, Button „PDF herunterladen“ liefert A4 mit Umlauten und ß
   korrekt; Mail mit Anhang kommt an.
4. Sofort erneut senden ohne Änderung: keine zweite Mail.
5. Anmeldung stornieren: Abschnitt verschwindet, `/meine-anmeldung/<token>/befreiung` antwortet 404.
6. Unbezahlte Anmeldung (nichts gezahlt): Abschnitt zeigt Tage, „Nach der Zahlung verfügbar“ und
   „Jetzt bezahlen“, kein Formular; der PDF Link antwortet 404, auch wenn Angaben gespeichert sind.
   Im Anmeldedialog steht „Noch unbezahlt“, Admins können trotzdem eintragen und senden.
7. Teilweise bezahlte Anmeldung: Formular und Download wie in Schritt 3.

## 3 · Landingpage (Story 2)

1. `/` zeigt den Abschnitt „Schulbefreiung“ mit Datum.
2. Bekannte Adresse senden: neutrale Antwort, Mail mit Link landet am Abschnitt.
3. Unbekannte Adresse: gleiche Antwort, keine Mail, kein Eintrag in `email_deliveries`.
4. Zwei Anmeldungen mit gleicher Adresse: zwei einzelne Mails.
5. Sechs Anfragen in zehn Minuten: Hinweis „später erneut versuchen“.
6. Befreiung ausschalten: Abschnitt verschwindet.

## 4 · Anmeldedialog (Story 4)

1. Anmeldung ohne Daten öffnen, Bereich „Schulbefreiung“ ausfüllen, speichern.
2. „PDF herunterladen“ und „Per Mail senden“; Mailhistorie zeigt „Schulbefreiung“, Auslöser Admin.
3. Als Admin ohne Bearbeitungsrecht: nur Ansicht.

## 5 · Mails (Story 5)

`/admin/mail`: Bestätigung und Teaser zeigen den Hinweis bei eingeschalteter Befreiung; neue
Vorlagen „Schulbefreiung“ und „Link zur Anmeldung“ sind sichtbar.

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
