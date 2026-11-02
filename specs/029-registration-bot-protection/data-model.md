# Data Model: Botschutz für das Anmeldeformular

Keine Migration. Alle Daten passen in bestehende Tabellen.

## Formularzeitpunkt (nicht gespeichert)

| Teil | Typ | Regel |
|---|---|---|
| `issuedAtMs` | Zahl (ms seit Epoch) | vom Server beim Rendern gesetzt |
| `signature` | base64url | HMAC SHA256 über `issuedAtMs` mit abgeleitetem Schlüssel (research R2) |

Prüfergebnis (reine Funktion, testbar):

| Ergebnis | Bedingung | Folge |
|---|---|---|
| `ok` | Signatur gültig, Alter zwischen `FORM_MIN_FILL_MS` und `FORM_TOKEN_MAX_AGE_MS` | weiter |
| `missing` | kein oder leeres Token, falsches Format | still abweisen |
| `forged` | Signatur passt nicht | still abweisen |
| `too_fast` | Alter unter `FORM_MIN_FILL_MS` oder in der Zukunft | still abweisen |
| `expired` | Alter über `FORM_TOKEN_MAX_AGE_MS` | Hinweis zum Neuladen (409) |

## `submission_attempts` (bestehend)

Neue Werte für `kind`, sonst unverändert:

| kind | email | ip | camp_id | Bedeutung |
|---|---|---|---|---|
| `registration` | ja | ja | ja | bestehend, zählt für Drosselung und Obergrenze |
| `registration_bot_trap` | nein | ja | nein | Fallenfeld ausgefüllt |
| `registration_bot_fast` | nein | ja | nein | zu schnell abgeschickt |
| `registration_bot_token` | nein | ja | nein | Token fehlt oder gefälscht |

Löschung nach 7 Tagen über die bestehende Retention (specs/025-legal-pages).

## `logs` (bestehend)

| action | level | message | Häufigkeit |
|---|---|---|---|
| `registration.ceiling` | `warning` | „Obergrenze von 60 Anmeldungen pro Stunde erreicht“ mit Camp Namen | höchstens einmal pro Stunde |
| `registration.ceiling_check_failed` | `error` | technischer Fehler der Zählung | bei Fehler |
