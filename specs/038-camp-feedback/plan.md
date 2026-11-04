# Implementation Plan: Campfeedback mit Historie

**Branch**: `038-camp-feedback` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/038-camp-feedback/spec.md`

## Summary

Jedes Camp bekommt eine öffentliche Feedbackseite `/feedback/<code>` mit geheimem, erneuerbarem
Code. Der QR Code dazu wird im Adminbereich im Vollbild gezeigt oder als PNG geladen. Antworten
landen in `feedback_responses` mit nur dem Camp als Bezug, ohne Zeitpunkt, IP oder Anmeldung.
Doppelte Antworten verhindert nur ein Cookie im Browser plus eine Nonce gegen Doppelklick; gegen
Bots helfen Fallenfeld, signierter Zeitstempel und die bestehende IP Drosselung. Fragen stellen
Admins pro Camp in `camp_feedback_questions` ein (Bewertung, Einfach, Mehrfach, Freitext) und
übernehmen sie aus früheren Camps. Ein neuer Admintab „Feedback“ zeigt die Historie über alle
Camps, pro Camp Auswertung, Fragen und CSV Export, geschützt durch die neue Berechtigung
`feedback`. Mails und Teilnehmerseite bleiben unverändert. Details: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript, Next.js 16 (App Router)

**Primary Dependencies**: Clerk, Supabase (nur Datenbank), Zod, Tailwind, shadcn/ui, `qrcode`
(schon im Projekt); keine neuen Pakete

**Storage**: Supabase Postgres, Migration `0018_camp_feedback.sql` mit drei neuen Tabellen;
`submission_attempts` mit neuer Art `feedback`

**Testing**: Vitest (`npm test`), neue Dateien `tests/unit/feedback-validation.test.ts`,
`tests/unit/feedback-stats.test.ts`, `tests/unit/feedback-rules.test.ts`,
`tests/unit/feedback-csv.test.ts`; Ergänzung `tests/unit/legal-content.test.ts`

**Target Platform**: Vercel (`arn1`), Feedbackseite vor allem am Handy

**Project Type**: Webanwendung (Next.js, Server Actions und Route Handler)

**Performance Goals**: Feedbackseite mit einer Datenbankabfrage für Settings plus Fragen; am
Campabend antworten bis zu 300 Personen in wenigen Minuten über ein WLAN

**Constraints**: Antwort ohne jeden Bezug zur Person (FR-008, FR-009); alles Prüfen auf dem
Server; keine Mails; keine Änderung an Anmeldung, Teilnehmerseite oder Dankesmail

**Scale/Scope**: ein Camp pro Jahr, bis zu 20 Fragen, wenige hundert Antworten pro Camp

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Prinzip | Prüfung | Ergebnis |
|---------|---------|----------|
| I. Fester Stack, Clerk für Auth | Keine neuen Pakete; QR über vorhandenes `qrcode`; Admins über Clerk und `profiles`; kein Supabase Auth | erfüllt |
| II. Server als Grenze | Feedback wird in einer Server Action geprüft und mit dem Service Client gespeichert; Admin Actions und PNG Route mit `requirePermission("feedback")`; Lesen der Ergebnisse ebenfalls nur mit Berechtigung; Zod für alle Eingaben; keine Geheimnisse im Browser | erfüllt |
| III. Strikter Scope | Campfeedback steht noch nicht in AGENTS.md Abschnitt 4. Erste Aufgabe der Umsetzung ergänzt Abschnitt 4 (Public und Admin), Abschnitt 5 (Tabellen) und die Quick reference; ohne diese Ergänzung kein Code | erfüllt mit Vorbedingung |
| IV. Eine Quelle der Wahrheit | Eigene Tabelle für Feedbackfragen, das Anmeldeformular bleibt allein in `camp_form_fields`; Schema nur per Migration, Typen neu erzeugt; keine CHECK Constraints | erfüllt |
| V. Sprachtrennung | Texte in `lib/feedback/messages.ts` und `lib/admin/messages.ts`; Code, Tabellen, Schlüssel englisch; Adresse `/feedback` ist im Deutschen geläufig | erfüllt |
| VI. Tolerante Zahlung, versteckte Preise | Nicht berührt | erfüllt |
| VII. Einfachheit | Drei Tabellen, eine öffentliche Seite, ein Admintab; Auswertung in reinen Funktionen, Balken ohne Chart Bibliothek; lint, test, build nach der Umsetzung | erfüllt |
| Schreibregeln | Keine Gedankenstriche, keine Bindestriche in Texten | erfüllt |

Nach Phase 1 erneut geprüft: keine Verletzung, Complexity Tracking entfällt.

## Project Structure

### Documentation (this feature)

```text
specs/038-camp-feedback/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── feedback-routes.md
├── checklists/
│   └── requirements.md
└── tasks.md            (folgt mit /speckit-tasks)
```

### Source Code (repository root)

```text
AGENTS.md                                        Scope, Datenmodell, Quick reference ergänzen
supabase/migrations/0018_camp_feedback.sql       neu: drei Tabellen, RLS an
lib/database.types.ts                            neu erzeugt
lib/feedback/types.ts                            neu: Fragetypen, FeedbackAnswer, Summary Typen
lib/feedback/limits.ts                           neu: Längen, Grenzen, Drosselung, Cookie
lib/feedback/messages.ts                         neu: deutsche Texte der öffentlichen Seite
lib/feedback/schema.ts                           neu: Zod für Fragen und Rohantworten
lib/feedback/validation.ts                       neu: validateFeedback (rein)
lib/feedback/rules.ts                            neu: Schutz bei vorhandenen Antworten, Schlüsselvorschlag, Übernahme (rein)
lib/feedback/stats.ts                            neu: summarizeCamp, buildHistory (rein)
lib/feedback/csv.ts                              neu: feedbackResponsesToCsv (rein)
lib/feedback/data.ts                             neu: server only Lesen und Schreiben, Drosselung
lib/feedback/code-server.ts                      neu: Link Code erzeugen
app/feedback/[code]/page.tsx                     neu: öffentliche Seite
app/feedback/[code]/actions.ts                   neu: submitFeedback
components/feedback/feedback-form.tsx            neu: Client Formular (Bewertung, Auswahl, Freitext)
app/admin/feedback/page.tsx                      neu: Historie und Campliste
app/admin/feedback/[campId]/page.tsx             neu: Auswertung, Fragen, Schalter, Link
app/admin/feedback/[campId]/qr/page.tsx          neu: Vollbild und Druck
app/admin/feedback/actions.ts                    neu: Admin Server Actions
app/api/admin/feedback/[campId]/qr/route.ts      neu: PNG Download
components/admin/feedback-results.tsx            neu: Auswertung mit Balken und Export
components/admin/feedback-questions.tsx          neu: Fragenliste, Übernehmen, Sortieren
components/admin/feedback-question-dialog.tsx    neu: Frage anlegen und ändern
components/admin/feedback-link-card.tsx          neu: Schalter, Adresse, QR Aktionen, Erneuern
components/admin/feedback-history.tsx            neu: Historientabelle
components/admin/nav-items.ts                    Tab „Feedback“
components/admin/admin-sidebar.tsx               Icon für den Tab
lib/admin/messages.ts                            de.nav.feedback, de.feedback, PERMISSION_LABELS.feedback
lib/legal/messages.ts                            Abschnitt Feedback und Cookie in der Datenschutzerklärung
tests/unit/feedback-*.test.ts                    neu
tests/unit/legal-content.test.ts                 ergänzt
```

**Structure Decision**: bestehende Next.js Struktur; ein neuer Fachordner `lib/feedback/` wie
`lib/bus/` und `lib/school-release/`.

## Existing code inspected

- `lib/bus/qr.ts` (`qrSvg`, `qrPng`), `lib/bus/code-server.ts` (`generateTicketCode`),
  `lib/bus/code.ts` (Adresse für den QR Code)
- `lib/register/form-token.ts`, `lib/register/form-token-server.ts` (`issueFormToken`,
  `checkSubmission`), `lib/register/limits.ts`
- `lib/school-release/link-request.ts` (`isLinkThrottled` über `submission_attempts`),
  `lib/payment/lookup.ts` (`requestIp`), `lib/legal/retention.ts` (Löschung nach 7 Tagen)
- `lib/admin/access.ts`, `lib/admin/guard.ts` (`guardTab`, `requirePermission`),
  `lib/admin/messages.ts` (`PERMISSION_LABELS`, `de`), `components/admin/nav-items.ts`
- `app/admin/zeltkreise/page.tsx` und Druckansicht (Seitenaufbau, Druckseite ohne Rahmen),
  `components/admin/field-form-dialog.tsx`, `fields-manager.tsx` (Editor Muster)
- `components/admin/finance-manager.tsx`, `lib/admin/finance.ts` (CSV im Browser)
- `proxy.ts`, `lib/coming-soon/gate.ts` (`/api/admin` geschützt, `/feedback` bleibt gesperrt
  während der Prelaunch Sperre)
- `supabase/migrations/0016_bus_ticket.sql` (Stil, RLS ohne Policies); specs/035 belegt 0017
- `camps.start_date` und `end_date` für Sortierung der Historie

## Security

- **Anonymität**: `feedback_responses` hat nur `id`, `camp_id`, `nonce`, `answers`. Kein
  Zeitpunkt, also keine Brücke zur Drosselzeile mit IP. Kein Logeintrag pro Antwort. Admin UI
  zeigt keine IDs.
- **Öffentliche Action**: Code auflösen, Zustand prüfen, Bot Prüfung, Drosselung, Validierung
  gegen die aktuellen Fragen, dann Insert mit Service Client. Unbekannte Schlüssel werden
  verworfen, Werte strikt nach Typ geprüft, Freitext auf 2000 Zeichen begrenzt und getrimmt.
- **Unbekannter Code**: gleiche Antwort wie geschlossen, kein Hinweis auf das Camp.
- **Code**: 128 Bit Zufall; erneuerbar; nie in Logs.
- **Admin**: Seiten mit `guardTab` und Berechtigungsprüfung (Lesen der Freitexte ist heikel),
  Actions und PNG Route mit `requirePermission("feedback")`.
- **Ausgabe**: Freitexte werden als Text gerendert (React escapt), im CSV werden Zellen, die mit
  `=`, `+`, `-` oder `@` beginnen, mit einem Apostroph entschärft.
- **Cookie**: `httpOnly`, `sameSite=lax`, `secure` in Produktion, Inhalt nur `1`.

## UI

Nach den Skills `impeccable` und `tasteskill`, im Stil der Teilnehmerseite.

- **Öffentliche Feedbackseite** (mobil zuerst, einspaltig, max. Breite wie die Teilnehmerseite):
  - Kopf: Campname, Zeile „Dein Feedback hilft uns beim nächsten Camp“, Hinweis auf Anonymität und
    die Bitte, keine Namen zu nennen, in `text-muted-foreground`.
  - Bewertung: fünf große Tasten 1 bis 5 als Radiogruppe (mindestens 44 Pixel), Beschriftung der
    Enden („gar nicht gut“, „sehr gut“), Tastatur mit Pfeilen.
  - Einfachauswahl als Radiogruppe, Mehrfachauswahl als Kontrollkästchen, Freitext als Textfeld mit
    Zeichenzähler.
  - Pflicht mit „Pflicht“ Markierung, Fehler direkt unter der Frage, Fokus springt zur ersten
    fehlerhaften Frage.
  - Absenden Taste über die ganze Breite, während des Sendens gesperrt mit „Wird gesendet“.
  - Zustände: Formular, Dank, schon geantwortet, nicht verfügbar, abgelaufen (neu laden), zu viele
    Anfragen (später versuchen). Reduced Motion ohne Animation.
- **Admin Übersicht `/admin/feedback`**: Kopf wie andere Adminseiten. Oben Historientabelle (Zeile
  pro Schlüssel, Spalte pro Camp, Durchschnitt mit kleinem Balken, darunter „n = 42“, leere Zellen
  „·“), ältere Texte per Aufklappen. Darunter Campliste mit Zustand (offen, geschlossen) und
  Antwortzahl. Leerzustand: Erklärung, wie man startet.
- **Admin Camp `/admin/feedback/[campId]`**: Karte „Zugang“ mit Schalter „Feedback offen“, Adresse
  zum Kopieren, Tasten „QR Code zeigen“, „Als Bild laden“, „Link erneuern“ (Bestätigung). Tabs
  „Auswertung“ und „Fragen“ wie bei vorhandenen Admin Tabs. Auswertung: Kennzahlen oben, pro Frage
  eine Karte mit Balken (Tailwind Breiten), Freitexte als Liste, Export Taste. Fragen: Liste mit
  Typ Badge, Pflicht, Schlüssel, Pfeile zum Sortieren, Bearbeiten, Löschen; „Fragen übernehmen“
  mit Campauswahl.
- **QR Vollbild**: weißer Grund, QR Code so groß wie möglich (min(80vh, 80vw)), Campname darüber,
  Adresse darunter, Druckstil ohne Bedienelemente; Taste „Schließen“ nur am Bildschirm.
- Lade und Fehlerzustände über vorhandene `components/admin/states.tsx` und `loading.tsx`.

## Checks

`npm run lint`, `npm test`, `npm run build`.

## Manual test

Siehe [quickstart.md](./quickstart.md).

## Complexity Tracking

Keine Verletzung.
