# Tasks: Anmeldeformular testen

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

## Phase 1: Vorbereitung

- [x] T001 AGENTS.md Abschnitt 4 (Admin dashboard) um die Testansicht ergänzen
- [x] T002 Typ `TestSubmitResult` in lib/register/validation.ts
- [x] T003 Texte in lib/register/messages.ts (Testmeldung) und lib/admin/messages.ts (Button, Hinweis, Zurück)

## Phase 2: Server (US3)

- [x] T004 Server Action `testRegistrationAction` in app/admin/camps/[campId]/felder/actions.ts: Admin plus Tab Camps, Zod, nur `validateFields(mergeFields(questionFields(fields)))`, keine Schreibzugriffe

## Phase 3: Formular (US2, US3)

- [x] T005 components/marketing/registration-form.tsx: optionale Prop `testSubmit`, Testmeldung ohne Referenz und Zahlung, „Noch einmal testen“

## Phase 4: Testseite (US1)

- [x] T006 `.marketing-scope` in app/globals.css an den `:root` Block hängen
- [x] T007 Seite app/admin/camps/[campId]/felder/test/page.tsx mit Testhinweis, Zurücklink, Landingpage Rahmen, Verfügbarkeit
- [x] T008 Button „Formular testen“ in der Vorschaukarte von components/admin/fields-manager.tsx

## Phase 5: Prüfung

- [x] T009 `npm run lint`, `npm test`, `npm run build`
- [ ] T010 Manueller Test laut plan.md
