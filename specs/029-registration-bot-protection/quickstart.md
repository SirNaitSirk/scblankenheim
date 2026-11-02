# Quickstart: Botschutz für das Anmeldeformular

## Voraussetzungen

- `.env.local` mit Supabase, Stripe Testschlüsseln und Mailversand wie bisher.
- Ein aktuelles Camp mit offener Anmeldung.
- `npm run dev` läuft auf http://localhost:3000.

## Automatische Checks

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run build
```

Erwartet: neue Tests für Tokenprüfung und Fallenfeld grün, Lint und Build ohne Fehler.

## Manuelle Prüfung

1. **Mensch**: Landingpage öffnen, Formular normal ausfüllen, absenden. Anmeldung erscheint im
   Dashboard, Bestätigungsmail kommt an, Stripe öffnet sich (User Story 1).
2. **Fallenfeld**: In den Entwicklertools das versteckte Feld füllen, absenden. Erfolgsmeldung
   erscheint, im Dashboard und im Mailverlauf steht nichts; in `submission_attempts` gibt es eine
   Zeile `registration_bot_trap` ohne Mail (User Story 2).
3. **Direkter Aufruf ohne Token**:
   ```bash
   curl -s -X POST http://localhost:3000/api/register -H "Content-Type: application/json" -d '{"values":{}}'
   ```
   Antwort 200 mit einer Anmeldenummer, aber keine Anmeldung gespeichert, Zeile
   `registration_bot_token`.
4. **Zu schnell**: Seite laden und innerhalb von 3 Sekunden per Konsole an `/api/register` mit dem
   Token aus der Seite senden. Still abgewiesen, Zeile `registration_bot_fast`.
5. **Veraltet**: `FORM_TOKEN_MAX_AGE_MS` lokal kurz auf 10 Sekunden setzen, Formular laden, warten,
   absenden. Hinweis zum Neuladen erscheint, Eingaben bleiben stehen; nach dem Neuladen geht es durch
   (User Story 3). Wert danach zurücksetzen.
6. **Obergrenze**: `REGISTRATION_HOURLY_CEILING` lokal auf 2 setzen, drei Anmeldungen mit
   verschiedenen Mails absenden. Die dritte zeigt den Hinweis, im Adminprotokoll steht genau ein
   Eintrag `registration.ceiling`; eine vierte erzeugt keinen zweiten (User Story 4). Im Dashboard
   eine Anmeldung von Hand anlegen: klappt. Wert danach zurücksetzen.
