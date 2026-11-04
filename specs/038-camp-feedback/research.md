# Research: Campfeedback mit Historie

Stand 2026-11-04. Alle offenen Punkte aus dem Technical Context sind hier entschieden.

## R1 · Öffentliche Adresse und geheimer Code

- **Decision**: Pro Camp ein zufälliger Code (128 Bit, base64url, wie `generateTicketCode` in
  `lib/bus/code-server.ts`), gespeichert in `camp_feedback_settings.link_code`. Die Feedbackseite
  liegt unter `/feedback/<code>`. Der QR Code enthält genau diese absolute Adresse auf `APP_URL`.
  „Link erneuern“ schreibt einen neuen Code, der alte findet danach kein Camp mehr.
- **Rationale**: Gleiches Muster wie Teilnehmerseite und Busticket. Die Camp ID wäre ratbar
  genug, um Feedback außerhalb des Camps zu sammeln, und ließe sich nicht erneuern.
- **Alternatives considered**: Camp ID in der Adresse (nicht erneuerbar); ein Code pro Person
  (widerspricht der Entscheidung, nichts mit Anmeldungen zu verbinden).

## R2 · Anonymität ohne Bezug zu Anmeldungen

- **Decision**: `feedback_responses` hat nur `id` (zufällige UUID), `camp_id`, `nonce` und
  `answers`. Keine Spalte für Zeitpunkt, IP, Anmeldung oder Browser. Es wird kein Logeintrag pro
  Antwort geschrieben.
- **Rationale**: Ohne Zeitpunkt lässt sich eine Antwort auch nicht über die Drosselung (R4), über
  Serverlogs oder über die Reihenfolge einer Person zuordnen. Zufällige UUIDs verraten keine
  Reihenfolge. Die Auswertung braucht keinen Zeitpunkt.
- **Alternatives considered**: Datum ohne Uhrzeit (bringt für die Auswertung nichts);
  fortlaufende IDs (verraten die Reihenfolge).

## R3 · Doppelte Antworten leicht erschweren

- **Decision**: Zwei Stufen, beide ohne Bezug zur Person.
  1. Beim Rendern der Seite erzeugt der Server eine zufällige `nonce` (UUID), die als verstecktes
     Feld mitgeht. `feedback_responses.nonce` ist eindeutig. Doppelklick oder erneutes Absenden
     desselben Formulars trifft den Unique Index und gilt still als Erfolg.
  2. Nach dem Speichern setzt die Server Action ein Cookie `feedback_<campId>` mit Wert `1`, Pfad
     `/feedback`, `httpOnly`, `sameSite=lax`, Laufzeit 365 Tage. Ist es gesetzt, rendert die Seite
     sofort den Dank mit Hinweis „schon geantwortet“.
- **Rationale**: Die Spec verlangt bewusst nur eine leichte Hürde. Ein Cookie wird schon auf dem
  Server gelesen, damit klappt der Dank auch ohne JavaScript im Browser. Das Cookie ist technisch
  nötig und enthält nichts Persönliches; die Datenschutzseite nennt es (FR-024).
- **Alternatives considered**: `localStorage` (nur im Client lesbar, Fragen blitzen kurz auf);
  Browser Fingerprint (unnötig streng und datenschutzrechtlich heikel).

## R4 · Schutz vor massenhaftem Absenden

- **Decision**: Gleiche Bausteine wie bei der Anmeldung (specs/029) und der Linkanfrage
  (specs/020):
  - Fallenfeld und signierter Zeitstempel über `issueFormToken` und `checkSubmission` aus
    `lib/register/form-token-server.ts`. Bot Verdacht antwortet still mit Erfolg, speichert nichts.
  - Drosselung pro IP über `submission_attempts` mit `kind = 'feedback'` und `camp_id`:
    höchstens `FEEDBACK_IP_MAX = 20` Antworten pro IP und Camp in `FEEDBACK_IP_WINDOW_MS = 1
    Stunde`. Die Grenze ist hoch, weil im Camp viele über dasselbe WLAN antworten.
  - Obergrenze pro Camp: `FEEDBACK_CAMP_DAILY_MAX = 1000` Antworten pro 24 Stunden.
- **Rationale**: Bewährt und schon in der Datenschutzerklärung (7 Tage Aufbewahrung, Löschung durch
  `purgeOldSubmissionAttempts`). Die Drosselzeile enthält IP und Zeit, die Antwort enthält keine
  Zeit (R2), also gibt es keine Brücke.
- **Alternatives considered**: CAPTCHA (verboten für Bots, nervig für Teilnehmende, externer
  Dienst); gar kein Schutz (eine offene Seite ohne Grenze lädt zu Spam ein).

## R5 · Speicherform der Antworten

- **Decision**: `answers` ist ein jsonb Array von Einträgen `{ key, label, type, value }`.
  `value` ist bei Bewertung eine Zahl 1 bis 5, bei Einfachauswahl ein Text, bei Mehrfachauswahl ein
  Textarray, bei Freitext ein Text. Unbeantwortete freiwillige Fragen fehlen im Array.
- **Rationale**: Erfüllt FR-010 (Text, Typ und Schlüssel werden mitgespeichert), Auswertung und
  Historie arbeiten nur über `key`. Bei wenigen hundert Antworten pro Camp rechnet die Auswertung
  in TypeScript, keine SQL Aggregation nötig.
- **Alternatives considered**: Eine Zeile pro Frage und Antwort (mehr Tabellen, keine
  Vorteile bei dieser Größe; und Zeilen einer Antwort wären über eine gemeinsame ID verbunden,
  was hier ohnehin der Fall ist).

## R6 · Fragen verwalten

- **Decision**: Eigene Tabelle `camp_feedback_questions`, getrennt von `camp_form_fields`. Eigener,
  kleiner Editor im Adminbereich nach dem Muster von `components/admin/field-form-dialog.tsx` und
  `fields-manager.tsx` (Dialog, Liste, Sortieren mit Pfeilen). Typen: `rating`, `single`,
  `multi`, `text`. Schlüssel: Kleinbuchstaben, Ziffern und Unterstrich, vorgeschlagen aus dem Text,
  im Camp eindeutig (Unique Index `camp_id, key`).
- **Rationale**: Verfassung IV verlangt genau ein Anmeldeformular aus `camp_form_fields`. Feedback
  ist kein Anmeldeformular; eine Vermischung würde das Formular und seine Regeln (Bedingungen,
  Grundfelder) belasten. Die Feldtypen des Anmeldeformulars passen auch nicht (keine Bewertung).
- **Alternatives considered**: `camp_form_fields` mit einer Art „feedback“ (vermischt zwei
  Formulare, widerspricht IV).

## R7 · Schutz der Historie bei Änderungen

- **Decision**: Die Server Actions laden vor Änderungen die Antworten des Camps und prüfen in
  `lib/feedback/rules.ts` (rein, getestet), ob der Schlüssel schon beantwortet wurde. Dann sind
  Typ und Schlüssel gesperrt, Auswahlantworten nur ergänzbar (FR-013). Löschen ist erlaubt; die
  Bestätigung nennt die Zahl der Antworten (FR-014).
- **Rationale**: Klein genug, um die Antworten pro Aktion zu lesen. Keine Trigger, keine Zähler.

## R8 · QR Code zeigen und herunterladen

- **Decision**: `qrSvg` und `qrPng` aus `lib/bus/qr.ts` werden wiederverwendet. Die Vollbildansicht
  `/admin/feedback/[campId]/qr` ist eine schlichte Seite ohne Adminrahmen (wie die Druckansicht der
  Zeltkreise) mit großem SVG, Campname, Adresse in Klarschrift und Druckstil. Das PNG kommt aus dem
  Route Handler `app/api/admin/feedback/[campId]/qr/route.ts` (1024 Pixel, `Content-Disposition:
  attachment`). Beide prüfen die Berechtigung `feedback`.
- **Rationale**: Paket `qrcode` ist schon da (Verfassung I, keine neuen Pakete). `/api/admin` ist
  schon durch Clerk im Proxy geschützt.

## R9 · Auswertung, Historie und Export

- **Decision**: Reine Funktionen in `lib/feedback/stats.ts`: `summarizeCamp(questions, responses)`
  und `buildHistory(camps)`. Balken als einfache Tailwind Breiten, keine Chart Bibliothek. CSV im
  Browser wie bei den Finanzen (`financeRowsToCsv`, Blob Download) über
  `feedbackResponsesToCsv` mit Semikolon und BOM wie dort; Zeilen in zufälliger Reihenfolge
  gemischt, Mehrfachauswahl mit „, “ verbunden.
- **Rationale**: Bewährtes Muster, keine neue Abhängigkeit. Durchschnitt und Anteile lassen sich in
  Unit Tests exakt prüfen (SC-004).
- **Freitext Reihenfolge**: Die Datenbank liefert in zufälliger UUID Reihenfolge; die Auswertung
  sortiert nach `id`, so bleibt die Reihenfolge stabil und verrät keinen Zeitpunkt.

## R10 · Zugriff

- **Decision**: Neue Berechtigung `feedback` in `PERMISSION_LABELS` und neuer Tab
  `/admin/feedback` in `NAV_ITEMS`. Seiten nutzen `guardTab("/admin/feedback")`, Schreib Actions
  und der PNG Route Handler `requirePermission("feedback")`. Lesen der Ergebnisse braucht ebenfalls
  die Berechtigung (Freitexte), darum prüft auch die Seite `canUseSection(profile, "feedback")`
  und leitet ohne sie zum Dashboard.
- **Rationale**: Spec US5. Das Sehen eines Tabs allein reicht hier nicht, weil schon Lesen heikel ist.

## R11 · Prelaunch Sperre und Indexierung

- **Decision**: `/feedback` bleibt nicht auf der offenen Liste von `lib/coming-soon/gate.ts`. Die
  Seite setzt `robots: { index: false }`.
- **Rationale**: Spec Edge Case. Das erste Feedback kommt am Campende, lange nach dem Start.
