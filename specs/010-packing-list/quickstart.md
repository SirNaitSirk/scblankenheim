# Quickstart: Packliste prüfen

## Voraussetzungen

- `.env.local` mit `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Ein aktuelles Camp mit Start und Enddatum (Admin, Tab Camps), für Schritt 3.

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

Erwartet: alles grün, neuer Test `tests/unit/packing-list.test.ts` läuft mit.

## Manuelle Schritte

1. `npm run dev`, dann `http://localhost:3000` öffnen. Im Abschnitt „Alles, was du mitbringen
   musst“ erscheinen elf Gegenstände. Auf „Zur vollständigen Packliste“ klicken: `/packzettel`
   öffnet sich (SC-001).
2. Footer „Packliste“ führt ebenfalls dorthin; „Camp“ und „Anmelden“ im Footer führen von
   `/packzettel` zurück auf die passenden Abschnitte der Startseite.
3. Auf `/packzettel` stehen sechs Bereiche mit 24 Einträgen sowie Campname und Zeitraum.
4. In einem abgemeldeten privaten Fenster öffnen: Seite erscheint ohne Anmeldung (FR-001).
5. Drei Einträge anklicken: Fortschritt zeigt „3 von 24 eingepackt“. Neu laden: Haken bleiben.
   „Zurücksetzen“: alle Haken weg.
6. Mit der Tastatur: Tab erreicht jedes Kästchen, Leertaste hakt ab, Fokus ist sichtbar.
7. „Drucken“: Vorschau zeigt nur Überschrift, Campzeile und Liste mit leeren Kästchen auf einer
   A4 Seite, auch wenn am Bildschirm abgehakt (SC-003).
8. Fensterbreite 375 px: kein seitliches Scrollen, Einträge brechen sauber um.
9. Im Admin das aktuelle Camp entfernen oder das Enddatum leeren, Seite neu laden: Liste bleibt,
   Campzeile entfällt beziehungsweise zeigt „ab“.
