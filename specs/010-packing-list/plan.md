# Implementation Plan: Packliste für das aktuelle Camp

**Branch**: `010-packing-list` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-packing-list/spec.md`

## Summary

Neue öffentliche Seite `/packzettel`. Die Packliste (6 Bereiche, 24 Einträge, vom alten
Packzettel) steht als typisierte Konstante in `lib/marketing/packing-list.ts`, zusammen mit allen
Texten der Seite. Eine Server Component liest Name und Zeitraum des aktuellen Camps über den
bestehenden Helfer `getLandingCamp()` und rendert die Liste. Eine kleine Client Komponente
übernimmt Abhaken, Fortschritt und Zurücksetzen und merkt die Haken in `localStorage`. Gedruckt
wird über die vorhandene `.print-sheet` Regel. Der Teaser der Startseite liest seine Auswahl aus
derselben Konstante. Keine Migration, keine API Route, keine neue Abhängigkeit.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 App Router (Server Component plus eine Client
Komponente)

**Primary Dependencies**: Tailwind, vorhandene UI Bausteine (`Button`, `ButtonLink`), Phosphor
Icons. Keine neue Abhängigkeit.

**Storage**: keine Änderung. Lesen von `camp_settings` und `camps` über den anon Client;
Haken nur in `localStorage` des Geräts.

**Testing**: Vitest (`npm test`) für das Listenmodul und das Einlesen gespeicherter Haken.

**Target Platform**: Vercel; Handy zuerst, dazu Desktop und Druck auf A4.

**Performance Goals**: lesbar in unter 2 Sekunden auf einem durchschnittlichen Handy (SC-002);
eine gecachte Abfrage pro Request.

**Constraints**: keine Preise oder personenbezogenen Daten auf der Seite (FR-012); Druck auf eine
A4 Seite bis 35 Einträge (SC-003).

**Scale/Scope**: eine Seite, ein Datenmodul, eine Client Komponente, drei kleine Anpassungen an
bestehenden Dateien.

## Existing code inspected

- `components/marketing/packing-teaser.tsx`: eigene feste Liste mit elf Einträgen, Link auf
  `/packzettel`, Anker `#packliste`.
- `components/marketing/site-footer.tsx`: Link „Packliste“ auf `/packzettel`; „Camp“ und
  „Anmelden“ sind reine Anker (`#camp`, `#anmelden`) und funktionieren auf Unterseiten nicht.
- `components/marketing/site-nav.tsx`: nur Anker der Startseite, daher nicht für Unterseiten.
- `components/payment/payment-shell.tsx`: schlanker Rahmen mit Link zur Startseite und Footer;
  Vorbild für den Kopf der neuen Seite.
- `lib/marketing/current-camp.ts`: `getLandingCamp()` mit anon Client, React `cache`, `null` bei
  Fehlern; liest `start_date`, aber noch nicht `end_date`.
- `lib/time/berlin.ts`: `formatGermanDate()` für reine Datumswerte.
- `app/globals.css`: Druckregel `body:has(.print-sheet)` aus der Zimmerplanung, A4 mit 14 mm Rand.
- `components/admin/print-button.tsx`: Knopf, der `window.print()` aufruft.
- `hooks/use-column-settings.ts`, `hooks/use-admin-theme.ts`: Muster für `localStorage`.
- `proxy.ts`: nur `/admin(.*)` ist geschützt; `/packzettel` ist bereits als öffentlich vorgesehen.
- `app/page.tsx`: `dynamic = "force-dynamic"`, deutsche Metadaten.

## Decisions

Details und Alternativen in [research.md](./research.md).

1. **Liste im Code** (R1): `lib/marketing/packing-list.ts` mit `packingSections`,
   `featuredPackingItems()`, `packingItemIds()`, `parseCheckedItems()` und `packingListMessages`.
2. **Teaser aus derselben Quelle** (R2) über das Flag `featured`.
3. **Campzeile über `getLandingCamp()`** (R3), erweitert um `endDate`.
4. **Dynamisch gerendert** (R4) wie die Startseite.
5. **Haken in `localStorage`** unter `packing-list:v1`, robust gegen Fehler und alte IDs (R5, R6).
6. **Druck über `.print-sheet`** (R7); `PrintButton` wandert nach `components/ui/print-button.tsx`.
7. **Kopf wie `PaymentShell`, Footer Anker absolut** (R8).

## Files likely to change

| Datei | Änderung |
|-------|----------|
| `lib/marketing/packing-list.ts` | neu: Liste, Helfer, Texte |
| `app/packzettel/page.tsx` | neu: Seite, Metadaten, Campzeile |
| `components/marketing/packing-checklist.tsx` | neu: Client Komponente zum Abhaken |
| `components/marketing/packing-teaser.tsx` | eigene Liste entfernen, `featuredPackingItems()` |
| `components/marketing/site-footer.tsx` | Anker auf `/#camp`, `/#anmelden` |
| `lib/marketing/current-camp.ts` | `endDate` in Typ und Select |
| `components/ui/print-button.tsx` | verschoben aus `components/admin/` |
| `app/admin/zimmerplanung/druck/page.tsx` | Import des verschobenen `PrintButton` |
| `app/globals.css` | Druckspalten für die Packliste (`.print-sheet .packing-section`) |
| `tests/unit/packing-list.test.ts` | neu |

## UI design

- **Layout**: schmale Lesespalte (`max-w-[46rem]`), mittig; Bereiche ab `md` zweispaltig, auf dem
  Handy einspaltig. Werkzeugleiste unter der Einleitung, auf dem Handy umbrechend.
- **Typografie**: Überschrift `font-display` fett wie die Sektionen der Startseite; Bereichstitel
  als kleine Großbuchstaben mit Laufweite wie die Footerlinks; Einträge in Grundschrift, Hinweise
  kleiner in `text-muted-foreground`.
- **Farben**: vorhandene Tokens (`bg-canvas`, `bg-surface`, `border-border`, Akzent amber für
  Haken und Fokus). Abgehakte Einträge: Text gedämpft mit Durchstreichung, Kästchen in Akzent.
- **Abstände**: großzügig wie die Startseite (`py-16` bis `py-24`), Einträge mindestens 44 px hoch.
- **Zustände**: siehe [contracts/packing-list-page.md](./contracts/packing-list-page.md); kein
  Lade oder Fehlerzustand nötig, weil die Liste immer da ist.
- **Bewegung**: nur kurze Farbübergänge beim Abhaken, `motion-safe` und ohne Layoutsprünge.
- Bei der Umsetzung werden die Skills `impeccable` und `tasteskill` angewendet.

## Security requirements

- Nur der anon Client, nur Lesen; keine Secrets, kein Service Role Client.
- Es werden nur Campname und Daten ausgegeben, keine Preise, keine Preisstufen, keine
  Anmeldedaten (FR-012, Konstitution VI).
- `localStorage` enthält nur Gegenstand IDs; nichts wird übertragen.

## Acceptance criteria

Aus der Spec: FR-001 bis FR-012 und SC-001 bis SC-005. Kurz:

- `/packzettel` ist öffentlich und zeigt 6 Bereiche mit 24 Einträgen und die Campzeile.
- Teaser und Seite stammen aus einer Quelle; Test sichert, dass jede Teaser Auswahl in der Liste ist.
- Druck zeigt nur die Liste mit leeren Kästchen auf einer A4 Seite.
- Haken überleben einen Reload auf demselben Gerät, „Zurücksetzen“ leert sie.
- Footer und Abschlussaufrufe führen zurück zur Startseite und zur Anmeldung.

## Checks to run

`npm run lint`, `npm test`, `npm run build` (neue Route). Ausgabe wird wörtlich berichtet.

## Manual test steps

Siehe [quickstart.md](./quickstart.md).

## Constitution Check

*Vor Phase 0 und nach Phase 1 geprüft, beide Male bestanden.*

| Prinzip | Ergebnis |
|---------|----------|
| I. Fester Stack, Clerk für Auth | Erfüllt. Nur Next.js, Tailwind, vorhandene Bausteine; keine neue Abhängigkeit, keine Auth nötig. |
| II. Server als Sicherheitsgrenze | Erfüllt. Nur öffentliches Lesen über den anon Client; keine Secrets, keine privilegierte Arbeit. |
| III. Strikter Scope | Erfüllt. „Packing list page (`/packzettel`)“ steht in AGENTS.md Abschnitt 4. |
| IV. Eine Quelle der Wahrheit | Erfüllt. Aktuelles Camp über den gemeinsamen Helfer; Packliste nur an einer Stelle; keine Schemaänderung. |
| V. Sprachtrennung | Erfüllt. Texte deutsch und zentral in `lib/marketing/packing-list.ts`; Code und IDs englisch. |
| VI. Tolerante Zahlung, verborgene Preise | Erfüllt. Keine Preise auf der Seite. |
| VII. Einfachheit, ehrliche Checks | Erfüllt. Kleine Module, keine Abstraktion auf Vorrat; lint, test, build werden ausgeführt. |
| Schreibregeln | Erfüllt. Inhalte ohne Striche („Isomatte“, „Kamm oder Bürste“). |

## Project Structure

### Documentation (this feature)

```text
specs/010-packing-list/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── packing-list-page.md
├── checklists/
│   └── requirements.md
└── tasks.md              # folgt mit /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── packzettel/
│   └── page.tsx                  # neu
└── admin/zimmerplanung/druck/
    └── page.tsx                  # Import angepasst
components/
├── marketing/
│   ├── packing-checklist.tsx     # neu (Client)
│   ├── packing-teaser.tsx        # liest aus lib
│   └── site-footer.tsx           # absolute Anker
└── ui/
    └── print-button.tsx          # verschoben
lib/marketing/
├── packing-list.ts               # neu
└── current-camp.ts               # endDate
tests/unit/
└── packing-list.test.ts          # neu
```

**Structure Decision**: Bestehende Next.js Struktur. Öffentliche Seiten unter `app/`, Marketing
Bausteine unter `components/marketing/`, Domänenlogik und Texte unter `lib/marketing/`.

## Complexity Tracking

Keine Verstöße, nichts zu begründen.
