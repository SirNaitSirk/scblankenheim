# Data Model: Campfeedback mit Historie

Migration: `supabase/migrations/0018_camp_feedback.sql` (0017 ist für specs/035 vorgesehen), danach
`lib/database.types.ts` neu erzeugen. RLS an jeder Tabelle, keine Policies: nur der Service Role
Client im Server liest und schreibt. Keine CHECK Constraints auf Werten (Verfassung IV), die
Prüfung liegt in Zod und `lib/feedback/`.

## camp_feedback_settings

Eine Zeile pro Camp, fehlende Zeile bedeutet „geschlossen, noch kein Code“.

| Spalte | Typ | Regel |
|--------|-----|-------|
| `camp_id` | uuid, PK, FK `camps(id)` on delete cascade | |
| `open` | boolean not null default false | FR-015 |
| `link_code` | text not null unique | 128 Bit base64url, R1; wird beim ersten Öffnen der Adminseite eines Camps angelegt |
| `updated_by` | text not null | Clerk User ID |
| `updated_at` | timestamptz not null default now() | |

Zustände: geschlossen ↔ offen per Schalter. Öffnen nur mit mindestens einer Frage (Server prüft).
Link erneuern ersetzt `link_code`, unabhängig vom Zustand.

## camp_feedback_questions

| Spalte | Typ | Regel |
|--------|-----|-------|
| `id` | uuid PK default gen_random_uuid() | |
| `camp_id` | uuid not null FK `camps(id)` on delete cascade | |
| `key` | text not null | `^[a-z][a-z0-9_]{0,39}$`, unique (`camp_id`, `key`) |
| `label` | text not null | 1 bis 200 Zeichen |
| `type` | text not null | `rating`, `single`, `multi`, `text` (Zod) |
| `required` | boolean not null default false | |
| `options` | text[] not null default '{}' | bei `single` und `multi` 2 bis 20 Einträge, je 1 bis 100 Zeichen, eindeutig; sonst leer |
| `sort_order` | int not null | |
| `created_at` | timestamptz not null default now() | |
| `updated_at` | timestamptz not null default now() | |

Index: unique (`camp_id`, `key`), (`camp_id`, `sort_order`).

Regeln mit Antworten (R7, FR-013): Ist `key` in mindestens einer Antwort des Camps enthalten, sind
`key` und `type` unveränderlich, und `options` darf nur wachsen (alte Einträge bleiben in gleicher
Schreibweise).

## feedback_responses

| Spalte | Typ | Regel |
|--------|-----|-------|
| `id` | uuid PK default gen_random_uuid() | zufällig, verrät keine Reihenfolge |
| `camp_id` | uuid not null FK `camps(id)` on delete cascade | einziger Bezug (FR-008) |
| `nonce` | uuid not null unique | pro gerendertem Formular, gegen Doppelklick (R3) |
| `answers` | jsonb not null | Array von `FeedbackAnswer`, mindestens ein Eintrag |

Bewusst ohne `created_at`, IP, Anmeldung oder Browserangaben (R2). Index: (`camp_id`).

### FeedbackAnswer (jsonb Eintrag, TypeScript Typ in `lib/feedback/types.ts`)

```ts
type FeedbackAnswer =
  | { key: string; label: string; type: "rating"; value: 1 | 2 | 3 | 4 | 5 }
  | { key: string; label: string; type: "single"; value: string }
  | { key: string; label: string; type: "multi"; value: string[] }   // mindestens ein Eintrag
  | { key: string; label: string; type: "text"; value: string };     // 1 bis 2000 Zeichen, getrimmt
```

`label` ist der Fragetext zum Zeitpunkt des Absendens (FR-010). Freiwillige Fragen ohne Antwort
fehlen im Array.

## submission_attempts (bestehend)

Neue Art `kind = 'feedback'` mit `ip` und `camp_id`, für die Drosselung (R4). Wird wie bisher nach
7 Tagen vom täglichen Info Mail Cron gelöscht. Enthält nie eine Antwort oder deren ID.

## Abgeleitete Typen (nur TypeScript)

- `CampFeedbackSummary`: `responseCount`, `activeRegistrations`, `open`, pro Frage (aktuelle und
  gelöschte mit Antworten) eine `QuestionSummary`:
  - `rating`: `answered`, `average` (eine Nachkommastelle), `distribution[1..5]`
  - `single` und `multi`: `answered`, pro Option `count` und `share`; Optionen, die nur noch in
    alten Antworten vorkommen, werden angehängt
  - `text`: `answered`, `texts` (nicht leer, sortiert nach Antwort `id`)
  - `deleted: boolean`, `label` (aktuell oder zuletzt gespeichert)
- `FeedbackHistoryRow`: `key`, `type`, `label` (neuester), `previousLabels[]`, pro Camp (sortiert
  nach `start_date` aufsteigend, Camps ohne Antworten ausgelassen) entweder leer oder
  `{ answered, average }` bzw. `{ answered, shares }`.
