# Data Model: Packliste für das aktuelle Camp

Keine Datenbankänderung, keine Migration. Die Packliste ist ein typisiertes Modul im Code.

## PackingSection

| Feld | Typ | Regel |
|------|-----|-------|
| `id` | string | englisch, eindeutig, fest (zum Beispiel `toiletries`) |
| `title` | string | deutsche Überschrift |
| `items` | PackingItem[] | mindestens ein Eintrag, Reihenfolge wie angezeigt |

## PackingItem

| Feld | Typ | Regel |
|------|-----|-------|
| `id` | string | englisch, über alle Bereiche eindeutig, fest; Schlüssel für die Haken |
| `label` | string | deutscher Text |
| `note` | string, optional | kurzer Hinweis, etwa „für alle, die im Zelt schlafen“ |
| `featured` | boolean, optional | erscheint im Teaser der Startseite |

## Inhalt (aus der Spec, Assumptions)

| Bereich (`id`) | Einträge |
|----------------|----------|
| Waschzeug (`toiletries`) | Handtuch · Zahnbürste · Zahnpasta · Kamm oder Bürste · Duschzeug |
| Das Wichtigste (`essentials`) | Die Bibel · Notizblock und Stift |
| Schlafsachen (`sleeping`) | Schlafsack · Kissen · Laken (Hinweis Haus) · Isomatte (Hinweis Zelt) |
| Geschirr und Besteck (`dishes`) | Suppenteller und flacher Teller · Suppenlöffel, Teelöffel und Gabel · Tasse und Glas |
| Klamotten (`clothing`) | Etwas Sportliches (Hinweis empfohlen) · Warme Sachen · Schwimmsachen · Regenfeste Schuhe · Lockere Kleidung |
| Sonstiges (`other`) | Sonnenmilch · Kopfbedeckung · Sonnenbrille · Gesellschaftsspiele · Taschengeld |

Teaser Auswahl (`featured`), wie heute auf der Startseite: Schlafsack, Isomatte, Kissen,
Handtuch, Zahnbürste, Zahnpasta, Warme Sachen, Lockere Kleidung, Regenfeste Schuhe, Etwas
Sportliches, Die Bibel. „Waschzeug“ ist jetzt ein Bereich statt eines Eintrags und entfällt im
Teaser.

## Abgeleitete Werte

- `featuredPackingItems()`: alle Einträge mit `featured`, in Listenreihenfolge.
- `packingItemCount()`: Anzahl aller Einträge, für den Fortschritt „x von n eingepackt“.

## Erweiterung LandingCamp (bestehend)

`lib/marketing/current-camp.ts`: `LandingCamp` bekommt `endDate: string | null`, gelesen aus
`camps.end_date` (Spalte existiert bereits).

## Zustand im Browser (nur Client)

- Schlüssel `packing-list:v1` in `localStorage`, Wert: JSON Array von Item IDs.
- Beim Laden: nur Strings übernehmen, die einer bekannten ID entsprechen; alles andere verwerfen.
- Kein Wert, ungültiges JSON oder gesperrter Speicher: leere Auswahl, keine Fehlermeldung.
