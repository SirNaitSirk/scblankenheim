# Implementation Plan: Bedingte Formularfelder

**Branch**: `037-conditional-form-fields` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/037-conditional-form-fields/spec.md`

## Summary

Jedes eigene Formularfeld kann in `camp_form_fields.config.showWhen` eine Bedingung tragen:
Schlüssel eines Auswahlfelds plus Liste auslösender Antworten. Eine neue reine Regeldatei
`lib/register/conditions.ts` entscheidet die Sichtbarkeit und wird überall benutzt, wo heute
Felder geprüft oder gezeigt werden: öffentliches Formular samt Testansicht, `register` Service,
Anmeldedialog und dessen Server Action, Teilnehmerseite und Übernahme von Änderungsanfragen. Der
Feldeditor bekommt die Einstellung „Nur anzeigen, wenn“, und die Feld Actions lehnen Änderungen ab,
die eine Bedingung kaputt machen würden. Keine Migration, keine neue Tabelle, keine neue Route.
Details: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript, Next.js 16 (App Router)

**Primary Dependencies**: Clerk, Supabase (nur Datenbank), Zod, Tailwind, shadcn/ui, motion

**Storage**: Supabase Postgres, bestehende Spalte `camp_form_fields.config` (jsonb); keine Migration

**Testing**: Vitest (`npm test`), neue Datei `tests/unit/form-conditions.test.ts`, Ergänzungen in
`tests/unit/participant-contact.test.ts`

**Target Platform**: Vercel

**Project Type**: Webanwendung (Next.js, Server Actions und Route Handler)

**Performance Goals**: keine neuen; Sichtbarkeit ist eine reine Funktion über wenige Dutzend Felder

**Constraints**: Sichtbarkeit wird auf dem Server neu bestimmt, Browserangaben sind nie maßgeblich;
eine Ebene; Camps ohne Bedingungen verhalten sich unverändert

**Scale/Scope**: ein Camp pro Jahr, wenige Dutzend Felder, wenige hundert Anmeldungen

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Prinzip | Prüfung | Ergebnis |
|---------|---------|----------|
| I. Fester Stack, Clerk für Auth | Keine neuen Pakete; Berechtigungen über Clerk und `profiles` | erfüllt |
| II. Server als Grenze | `register`, Testabsendung, Anmeldedialog und Änderungsübernahme bestimmen die Sichtbarkeit auf dem Server und verwerfen ausgeblendete Werte; Feldschutz in den Feld Actions mit `requirePermission("camps")`; Zod für die neuen Eingaben | erfüllt |
| III. Strikter Scope | AGENTS.md Abschnitt 4 am 2026-11-02 um bedingte Felder ergänzt | erfüllt |
| IV. Eine Quelle der Wahrheit | Weiter genau ein Formular; Bedingung lebt in `camp_form_fields.config`; eine Regeldatei für alle Stellen; keine CHECK Constraints, keine Migration | erfüllt |
| V. Sprachtrennung | Neue Texte nur in `lib/admin/messages.ts` und `lib/register/messages.ts`; Code englisch | erfüllt |
| VI. Tolerante Zahlung, versteckte Preise | Nicht berührt | erfüllt |
| VII. Einfachheit | Eine reine Regeldatei, zwei neue Werte im Feldeditor, keine neue Route; lint, test und build nach der Umsetzung | erfüllt |
| Schreibregeln | Keine Gedankenstriche, keine Bindestriche in Texten | erfüllt |

Nach Phase 1 erneut geprüft: keine Verletzung, Complexity Tracking entfällt.

## Project Structure

### Documentation (this feature)

```text
specs/037-conditional-form-fields/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── server-actions.md
├── checklists/
│   └── requirements.md
└── tasks.md            (folgt mit /speckit-tasks)
```

### Source Code (repository root)

```text
lib/register/conditions.ts                     neu: reine Regeln (Sichtbarkeit, Verwerfen, Feldschutz)
lib/register/validation.ts                     validateFields prüft nur sichtbare Felder
lib/register/service.ts                        splitValues verwirft ausgeblendete Werte
lib/register/messages.ts                       Ansage „Neues Feld“
lib/admin/types.ts                             FieldConfig.showWhen, FieldFormValues um zwei Werte
lib/admin/messages.ts                          Texte Feldeditor, Feldliste, Schutzmeldungen
app/admin/camps/[campId]/felder/actions.ts     Schema, Prüfung beim Anlegen, Ändern, Löschen
components/admin/field-form-dialog.tsx         Einstellung „Nur anzeigen, wenn“
components/admin/fields-manager.tsx            Felder an den Dialog, Hinweis in der Liste
components/admin/field-preview.tsx             Hinweis „bedingt“ in der kompakten Vorschau
components/marketing/registration-form.tsx     nur sichtbare Felder rendern, prüfen, ansagen
components/marketing/registration-steps.tsx    Prüfliste zeigt nur sichtbare Felder
components/admin/registration-form-dialog.tsx  nur sichtbare Felder zeigen und prüfen
app/admin/actions.ts                           ausgeblendete Werte vor dem Speichern verwerfen
lib/participant/view.ts                        Zeilen und änderbare Felder nur wenn sichtbar
lib/admin/participant-messages.ts              nach Übernahme ausgeblendete Werte verwerfen
tests/unit/form-conditions.test.ts             neu
tests/unit/participant-contact.test.ts         ergänzt
```

**Structure Decision**: bestehende Next.js Struktur, keine neuen Ordner.

## Existing code inspected

- `lib/register/validation.ts` (`CORE_FIELDS`, `GENDER_OPTIONS`, `validateField`, `validateFields`,
  `mergeFields`), `lib/register/steps.ts`, `lib/register/service.ts` (`loadDynamicFields`,
  `splitValues`, `submitRegistration`)
- `app/admin/camps/[campId]/felder/actions.ts` (`fieldSchema`, create, update, delete, reorder,
  `testRegistrationAction`), `components/admin/field-form-dialog.tsx`,
  `components/admin/fields-manager.tsx`, `lib/admin/types.ts` (`FieldConfig`, `FieldFormValues`)
- `components/marketing/registration-form.tsx` (`validateStep`, `submit`, Live Region für Ansagen),
  `components/marketing/registration-steps.tsx` (`ReviewList`)
- `components/admin/registration-form-dialog.tsx` (`validate`, `dynamicFields`),
  `app/admin/actions.ts` (`registrationSchema`, Dynamic Answers nur im Client geprüft),
  `lib/admin/data.ts` (`form_data` wird beim Speichern ganz ersetzt)
- `lib/participant/view.ts` (`fieldRows`, `editableFields`), `lib/participant/contact.ts`
  (`storedFieldValue`, `changePatch`), `lib/admin/participant-messages.ts` (`applyParticipantChange`)
- `lib/bus/rules.ts` (`answersBus`), `lib/school-release/settings.ts` (Adressfelder): lesen
  `form_data` und brauchen keine Änderung
- Das Anmeldeformular braucht schon heute JavaScript; es gibt keinen `noscript` Weg.

## Security

- Der Browser entscheidet nie allein: `register` und `testRegistrationAction` rufen
  `validateFields`, das nur sichtbare Felder prüft, und `splitValues` verwirft Werte
  ausgeblendeter Felder, bevor gespeichert wird.
- `updateRegistrationAction` und `createRegistrationAction` laden die Felder des Camps und verwerfen
  ausgeblendete Werte; ebenso `applyParticipantChange`.
- Feldschutz (FR-008) läuft in den Feld Actions auf dem Server; der Dialog zeigt dieselben Meldungen
  nur früher.
- `showWhen` wird beim Lesen defensiv geparst; kaputte Werte gelten als „keine Bedingung“.

## UI

- **Feldeditor**: unter „Pflichtfeld“ ein Schalter „Nur anzeigen, wenn“. An: Auswahl
  „Auslöserfeld“ (nur geeignete Auswahlfelder, Grundfeld Geschlecht inklusive), darunter die
  Antworten als Kontrollkästchen. Steht das Feld vor seinem Auslöser, ein ruhiger Hinweis in
  `text-muted-foreground`. Fehler wie die bestehenden Feldfehler unter dem Steuerelement. Für
  Schrittmarken ausgeblendet.
- **Feldliste und kompakte Vorschau**: kleines Badge „Nur bei Jugend: Eingeladen“ im Stil der
  vorhandenen Badges.
- **Öffentliches Formular**: das Feld erscheint direkt an seiner Stelle mit derselben sanften
  Einblendung wie Schrittwechsel; bei `prefers-reduced-motion` ohne Bewegung. Die vorhandene Live
  Region sagt „Neues Feld: Eingeladen von“. Der Fokus bleibt beim Auslöser.
- **Anmeldedialog**: ausgeblendete Felder fehlen im Raster; kein Platzhalter.
- Mobil wie bisher, keine neuen Layouts. Keine neuen Lade oder Leerzustände nötig.

## Checks

`npm run lint`, `npm test`, `npm run build`.

## Manual test

Siehe [quickstart.md](./quickstart.md).

## Complexity Tracking

Keine Verletzung.
