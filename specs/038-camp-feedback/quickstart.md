# Quickstart: Campfeedback prüfen

## Voraussetzungen

- Migration `supabase/migrations/0018_camp_feedback.sql` ist eingespielt, `lib/database.types.ts`
  neu erzeugt.
- `npm run dev` läuft, Anmeldung als Superadmin.
- Mindestens zwei Camps mit Start und Enddatum, eines davon aktuell.

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

Erwartet: alles grün, neue Tests in `tests/unit/feedback-*.test.ts` laufen mit.

## Szenario 1 · Fragen anlegen und übernehmen (US2)

1. `/admin/feedback` öffnen, älteres Camp wählen, im Tab „Fragen“ anlegen:
   „Wie war das Camp insgesamt?“ (Bewertung, Pflicht, Schlüssel `overall`), „Was hat dir
   gefallen?“ (Mehrfachauswahl: Lobpreis, Workshops, Essen), „Was sollen wir besser machen?“
   (Freitext).
2. Aktuelles Camp öffnen, „Fragen übernehmen“ aus dem älteren Camp. Erwartet: drei Fragen mit
   gleichen Schlüsseln. Erneut übernehmen: Meldung „0 Fragen übernommen“.
3. Reihenfolge ändern, neu laden: Reihenfolge bleibt.

## Szenario 2 · QR Code und Antworten (US1)

1. Im aktuellen Camp „Feedback offen“ anschalten. Ohne Fragen in einem dritten Camp: Schalter wird
   abgelehnt.
2. „QR Code zeigen“: Vollbild mit Campname und Adresse. Mit dem Handy scannen (gleiches WLAN, dev
   Server mit Netzwerkadresse) oder die Adresse im Browser öffnen.
3. Ohne Pflichtfrage absenden: Meldung an der Frage. Vollständig absenden: Dank.
4. Seite neu laden: Dank mit „schon geantwortet“. In einem privaten Fenster erneut antworten: klappt
   (bewusst erlaubt).
5. Schalter aus, Seite im privaten Fenster neu laden: Hinweis „gerade kein Feedback“ ohne
   Campname.
6. „Link erneuern“: alte Adresse zeigt den Hinweis, neue Adresse funktioniert.

## Szenario 3 · Auswertung, Export, Schutz der Historie (US3)

1. Tab „Auswertung“: Zahl der Antworten, aktive Anmeldungen, Durchschnitt mit einer Nachkommastelle,
   Verteilung, Anteile, Freitexte. Von Hand nachrechnen.
2. CSV exportieren: eine Zeile pro Antwort, keine Personen, keine Zeit.
3. Bei `overall` den Typ ändern: abgelehnt. Bei der Mehrfachauswahl eine Antwort umbenennen:
   abgelehnt. Eine Antwort ergänzen: klappt.
4. Freitextfrage löschen (Bestätigung nennt die Zahl): In der Auswertung steht sie mit „gelöscht“.

## Szenario 4 · Historie (US4)

1. Im älteren Camp kurz öffnen, zwei Antworten geben, wieder schließen.
2. `/admin/feedback`: Zeile „Wie war das Camp insgesamt?“ zeigt beide Camps, älteres links.
   Eine Frage nur im aktuellen Camp lässt das ältere Feld leer.

## Szenario 5 · Berechtigung (US5)

1. Als Superadmin einer Admin den Tab „Feedback“ ohne Berechtigung „Feedback“ geben: Aufruf von
   `/admin/feedback` leitet zum Dashboard; `/api/admin/feedback/<campId>/qr` antwortet 403.
2. Berechtigung vergeben: alles erreichbar.

## Szenario 6 · Anonymität (SC-003)

In Supabase `feedback_responses` ansehen: nur `id`, `camp_id`, `nonce`, `answers`. In `logs` kein
Eintrag pro Antwort. In `submission_attempts` Zeilen mit `kind = 'feedback'` ohne Bezug zur Antwort.
