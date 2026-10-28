# UI Contract: `/packzettel`

## Route

- `GET /packzettel`, öffentlich, keine Anmeldung (Proxy schützt nur `/admin`).
- Keine Query Parameter. Keine API Route, keine Server Action, kein Schreibzugriff.
- Metadaten: Titel „Packliste · FCG Blankenheim Summercamp“, deutsche Beschreibung (FR-011).

## Aufbau der Seite (Bildschirm)

1. Kopf: Link „FCG Blankenheim Summercamp“ zu `/`.
2. Überschrift „Packliste“, darunter Campname und Zeitraum, falls vorhanden (FR-003).
3. Einleitung: „Schau vor der Abfahrt nochmal rein, damit du nichts vergisst.“
4. Werkzeugleiste: Fortschritt „x von n eingepackt“ (`aria-live`), Knopf „Zurücksetzen“
   (deaktiviert bei 0 Haken), Knopf „Drucken“.
5. Bereiche als `fieldset` mit `legend`, Einträge als beschriftete Kästchen, Hinweis klein
   neben dem Text.
6. Abschluss: Aufruf „Jetzt anmelden“ zu `/#anmelden` und Link „Zur Startseite“ (FR-008).
7. Footer (`SiteFooter`).

## Zustände

| Zustand | Anzeige |
|---------|---------|
| Aktuelles Camp mit Start und Ende | „Sommercamp 2027 · 12.07.2027 bis 18.07.2027“ |
| Nur Startdatum | „Sommercamp 2027 · ab 12.07.2027“ |
| Kein Datum | nur Campname |
| Kein aktuelles Camp oder Lesefehler | Zeile entfällt, Liste vollständig sichtbar |
| Speicher gesperrt | Abhaken funktioniert, keine Meldung |
| Keine Haken | Fortschritt „0 von n eingepackt“, „Zurücksetzen“ deaktiviert |
| Alle abgehakt | Fortschritt „Alles eingepackt“ |

Kein Ladezustand nötig: Liste und Campdaten kommen im ersten Server Render; nur die Haken folgen
nach dem Mount.

## Druck

- Nur Element `.print-sheet`: Überschrift, Campzeile, Bereiche mit leerem Kästchen pro Eintrag.
- Keine Kopfzeile, Werkzeugleiste, Abschlussaufrufe oder Footer; Schwarz auf Weiß; A4.

## Teaser auf der Startseite

- `PackingTeaser` zeigt `featuredPackingItems()` statt einer eigenen Liste; Text und Link bleiben.

## Footer

- Links „Camp“ und „Anmelden“ zeigen auf `/#camp` und `/#anmelden`.
