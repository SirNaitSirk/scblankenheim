# Implementation Plan: Anmeldeformular testen

**Branch**: `036-form-test-preview` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

## Summary

Eine neue Adminseite `/admin/camps/[campId]/felder/test` rendert die echte Komponente
`RegistrationForm` (components/marketing/registration-form.tsx) mit den Feldern des gewählten
Camps, in der Optik des Abschnitts „Anmelden“ der Landingpage. Absenden ruft im Testmodus eine
Server Action auf, die nur `mergeFields` plus `validateFields` ausführt und nichts schreibt.

## Technical Context

Next.js App Router, TypeScript, Clerk, Supabase (nur lesen), Tailwind v4. Keine neuen Pakete,
keine Migration, keine neuen Tabellen.

## Existing code inspected

- `components/admin/field-preview.tsx`, `components/admin/fields-manager.tsx` (Vorschaukarte)
- `components/marketing/registration-section.tsx`, `components/marketing/registration-form.tsx`
  (Props `fields`, `availability`, `invitationToken`, `formToken`; `submit()` postet fest an
  `/api/register`)
- `lib/register/service.ts` (`submitRegistration`: Zustand, `mergeFields`, `validateFields`,
  Drosselung, RPC), `lib/register/validation.ts`, `lib/register/steps.ts`
- `lib/marketing/availability.ts` (`getCampAvailability(campId, fields)`)
- `lib/admin/guard.ts` (`guardTab`, `requireAdmin`), `app/admin/camps/[campId]/felder/actions.ts`
- `app/globals.css`: Dunkelmodus des Admins überschreibt Tokens unter `.admin-theme-scope`

## Decisions

1. **Eine Komponente (Prinzip IV)**: `RegistrationForm` bekommt eine optionale Prop
   `testSubmit?: (values) => Promise<TestSubmitResult>`. Ist sie gesetzt, ruft `submit()` sie statt
   `fetch("/api/register")` auf; bei Erfolg zeigt das Formular eine Testmeldung (ohne Referenz,
   ohne Zahlungsbutton) mit „Noch einmal testen“. Sonst bleibt das Verhalten unverändert.
2. **Server Action statt Route**: `testRegistrationAction(campId, values)` in
   `app/admin/camps/[campId]/felder/actions.ts`, geschützt mit `requireAdmin` plus Sichtbarkeit des
   Tabs Camps (Lesezugriff reicht, da nichts geschrieben wird). Zod prüft `values`. Danach
   `validateFields(mergeFields(questionFields(fields)), values)`; Rückgabe `{ ok }` oder
   `{ fieldErrors }`. Kein Zugriff auf `submission_attempts`, RPC, Mail, Stripe, Logs.
3. **Landingpage Optik im dunklen Admin**: neue Klasse `.marketing-scope` wird an den
   bestehenden `:root` Block angehängt (`:root, .marketing-scope { ... }`), damit der Testbereich
   immer die hellen Landingpage Tokens nutzt. Der Testbereich übernimmt Hintergrund `bg-sand-50`,
   Abstände und Breite (`max-w-2xl`) aus `registration-section.tsx`.
4. **Verfügbarkeit**: `getCampAvailability(campId, fields)` liefert echte Belegung, damit volle
   Optionen gleich aussehen. `formToken` bleibt leer, `invitationToken` entfällt.
5. **Texte**: Testhinweis, Button „Formular testen“, Testmeldung in `lib/admin/messages.ts`
   (Admin Teil) bzw. `lib/register/messages.ts` (Formularmeldung), alles deutsch.

## Files likely to change

- `app/admin/camps/[campId]/felder/test/page.tsx` (neu)
- `app/admin/camps/[campId]/felder/actions.ts` (neue Action)
- `components/marketing/registration-form.tsx` (Prop `testSubmit`, Testmeldung)
- `components/admin/fields-manager.tsx` (Button in Vorschaukarte)
- `app/globals.css` (`.marketing-scope`)
- `lib/admin/messages.ts`, `lib/register/messages.ts`
- `AGENTS.md` Abschnitt 4 (ein Satz zur Testansicht)

## Constitution Check

- I Stack: keine neuen Pakete. ✔
- II Sicherheit: Seite per `guardTab("/admin/camps")`, Action per `requireAdmin` plus Tabprüfung,
  Zod Eingabe, keine Schreibzugriffe. ✔
- III Scope: AGENTS.md wird vorher ergänzt. ✔
- IV Ein Formular: dieselbe Komponente, keine Nachbildung. ✔
- V Sprache: Texte zentral und deutsch. ✔
- VII Einfachheit: eine Prop, eine Action, eine Seite. ✔

## Checks

`npm run lint`, `npm test`, `npm run build`.

## Manual test

1. `npm run dev`, als Admin anmelden, `Camps › <Camp> › Felder` öffnen.
2. „Formular testen“ klicken: Testhinweis, Landingpage Optik, auch im dunklen Admin hell.
3. Pflichtfeld leer lassen, „Weiter“: Meldung am Feld.
4. Alles ausfüllen, absenden: Testmeldung erscheint; Anmeldungen, Mailhistorie und
   `submission_attempts` bleiben unverändert.
5. Camp mit geschlossener Anmeldung: Formular trotzdem ausfüllbar.
