# Tasks: Packliste für das aktuelle Camp

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/packing-list-page.md](./contracts/packing-list-page.md)

`[P]` heißt parallel möglich (andere Datei, keine offene Abhängigkeit). Tests sind im Plan
vorgesehen (Vitest für das Listenmodul).

## Phase 1: Setup

- [x] T001 Skills `impeccable` und `tasteskill` lesen; Muster aus `components/payment/payment-shell.tsx`, `components/marketing/packing-teaser.tsx` und den Tokens in `app/globals.css` als Vorlage festhalten

## Phase 2: Foundational (blocks all stories)

- [x] T002 `lib/marketing/packing-list.ts` anlegen: Typen `PackingSection` (`id`, `title`, `items`, mindestens ein Eintrag) und `PackingItem` (`id` englisch und über alle Bereiche eindeutig, `label`, optional `note`, optional `featured`); Konstante `packingSections` mit den 6 Bereichen und 24 Einträgen aus `data-model.md` (Reihenfolge wie dort, Hinweise „für alle, die im Haus schlafen“, „für alle, die im Zelt schlafen“, „empfohlen“); elf `featured` Einträge laut `data-model.md`; Helfer `featuredPackingItems()`, `packingItemIds()`, `packingItemCount()`; Block `packingListMessages` mit allen Texten aus dem Contract (Metadaten, Überschrift, Einleitung, Fortschritt, „Alles eingepackt“, Zurücksetzen, Drucken, Jetzt anmelden, Zur Startseite, Campzeile mit „bis“ und „ab“); keine Striche in Texten
- [x] T003 [P] `tests/unit/packing-list.test.ts`: IDs eindeutig über alle Bereiche, kein Bereich leer, 24 Einträge, jede Teaser Auswahl ist in der Liste enthalten und nicht leer (SC-004), kein Text enthält Gedankenstrich oder Bindestrich zwischen Buchstaben
- [x] T004 [P] `lib/marketing/current-camp.ts`: `LandingCamp` um `endDate: string | null` erweitern und `end_date` in den Select aufnehmen

## Phase 3: User Story 1 · Vollständige Packliste lesen (P1) 🎯 MVP

**Goal**: `/packzettel` ist öffentlich und zeigt alle Bereiche, Campname und Zeitraum.
**Independent Test**: Seite abgemeldet öffnen, 6 Bereiche mit 24 Einträgen und Campzeile sichtbar, auf 375 px ohne seitliches Scrollen.

- [x] T005 [US1] Funktion `formatCampDates(startDate, endDate)` in `lib/marketing/packing-list.ts` über `formatGermanDate()` aus `lib/time/berlin.ts`: beide Daten „12.07.2027 bis 18.07.2027“, nur Start „ab 12.07.2027“, sonst `null`; Fall im Test aus T003 ergänzen
- [x] T006 [US1] `app/packzettel/page.tsx`: Server Component, `export const dynamic = "force-dynamic"`, `metadata` aus `packingListMessages` (Titel „Packliste · FCG Blankenheim Summercamp“), `getLandingCamp()` lesen; Kopf mit Link „FCG Blankenheim Summercamp“ zu `/`, Überschrift, Campzeile nur wenn vorhanden, Einleitung, Bereiche als `fieldset` mit `legend`, Abschluss mit „Jetzt anmelden“ (`/#anmelden`) und „Zur Startseite“, `SiteFooter`; keine Preise ausgeben (FR-012); Layout laut Abschnitt UI design im Plan
- [x] T007 [P] [US1] `components/marketing/packing-teaser.tsx`: eigene Liste entfernen, Chips aus `featuredPackingItems()` rendern, Text und Link unverändert
- [x] T008 [P] [US1] `components/marketing/site-footer.tsx`: Links „Camp“ auf `/#camp` und „Anmelden“ auf `/#anmelden`

## Phase 4: User Story 2 · Packliste ausdrucken (P2)

**Goal**: Druck zeigt nur Überschrift, Campzeile und die Liste mit leeren Kästchen auf einer A4 Seite.
**Independent Test**: Druckvorschau öffnen, nur die Liste, Schwarz auf Weiß, eine Seite.

- [x] T009 [US2] `components/admin/print-button.tsx` nach `components/ui/print-button.tsx` verschieben und den Import in `app/admin/zimmerplanung/druck/page.tsx` anpassen
- [x] T010 [US2] `app/packzettel/page.tsx`: Überschrift, Campzeile und Bereiche in ein Element mit Klasse `print-sheet` legen, Bereiche mit Klasse `packing-section`; Knopf „Drucken“ über `PrintButton`, außerhalb von `.print-sheet`
- [x] T011 [P] [US2] `app/globals.css`: im Druckblock `.print-sheet .packing-section { break-inside: avoid }`, zweispaltige Bereiche im Druck, Kästchen im Druck immer leer und Durchstreichung aufheben (FR-006)

## Phase 5: User Story 3 · Am Handy abhaken (P3)

**Goal**: Einträge lassen sich abhaken, Haken überleben einen Reload, Zurücksetzen leert sie.
**Independent Test**: Drei Einträge abhaken, neu laden, drei bleiben; Zurücksetzen entfernt alle.

- [x] T012 [US3] `lib/marketing/packing-list.ts`: Konstante `PACKING_STORAGE_KEY = "packing-list:v1"` und Funktion `parseCheckedItems(raw: string | null): Set<string>`, die nur Strings übernimmt, die einer bekannten ID entsprechen, und bei `null` oder ungültigem JSON eine leere Menge liefert; Fälle im Test aus T003 ergänzen
- [x] T013 [US3] `components/marketing/packing-checklist.tsx`: Client Komponente mit `sections` als Prop; Kästchen als `<input type="checkbox">` mit `<label>`, mindestens 44 px hoch, sichtbarer Fokus; Zustand als Set, nach dem Mount aus `localStorage` lesen, bei jeder Änderung schreiben, beides in `try/catch` ohne Meldung; Fortschritt „x von n eingepackt“ beziehungsweise „Alles eingepackt“ in `aria-live="polite"`; Knopf „Zurücksetzen“, deaktiviert bei 0 Haken; abgehakt mit Akzentfarbe und Durchstreichung, Übergang nur `motion-safe`
- [x] T014 [US3] `app/packzettel/page.tsx`: statische Bereiche durch `PackingChecklist` ersetzen; Werkzeugleiste (Fortschritt, Zurücksetzen, Drucken) unter der Einleitung, Klassen `print-sheet` und `packing-section` aus T010 erhalten

## Phase 6: Polish

- [x] T015 Design Pass mit `impeccable` und `tasteskill` auf `/packzettel` (Handy und Desktop, hell), Abstände und Typografie an die Startseite angleichen
- [x] T016 `npm run lint`, `npm test`, `npm run build` ausführen und Ausgabe wörtlich berichten
- [x] T017 Manuelle Schritte aus `specs/010-packing-list/quickstart.md` im Browser durchgehen, inklusive Druckvorschau und 375 px Breite

## Dependencies

- T002 blockiert alle Stories. T003 und T004 laufen parallel nach T002.
- US1 (T005 bis T008) braucht T002 und T004. T007 und T008 sind unabhängig von T006.
- US2 (T009 bis T011) braucht T006. T011 parallel zu T009.
- US3 (T012 bis T014) braucht T006; T014 braucht T010, damit die Druckklassen erhalten bleiben.
- Polish nach allen Stories.

## Parallel Examples

- Nach T002: T003, T004 gleichzeitig.
- In US1: T007 und T008 gleichzeitig mit T006.
- In US2: T011 gleichzeitig mit T009.

## Implementation Strategy

1. MVP: Phase 1, 2 und US1. Damit funktionieren beide toten Links, Teaser und Seite teilen eine Quelle.
2. US2 Druck ergänzen.
3. US3 Abhaken ergänzen.
4. Polish und Checks.
