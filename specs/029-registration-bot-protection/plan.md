# Implementation Plan: Botschutz für das Anmeldeformular

**Branch**: `026-hero-video` (kein eigener Branch angelegt) | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/029-registration-bot-protection/spec.md`

## Summary

Drei Schutzschichten vor dem öffentlichen Anmeldeweg, ohne Drittanbieter und ohne Migration:
ein verstecktes Fallenfeld, ein vom Server signierter Formularzeitpunkt mit Mindestausfüllzeit
(3 Sekunden) und Gültigkeit (24 Stunden), sowie eine gleitende Obergrenze von 60 Anmeldeversuchen
pro Stunde und Camp. Fallenfeld und ungültiges Token werden in der Route still mit einer scheinbaren
Erfolgsantwort abgewiesen; ein zu altes Formular und die Obergrenze bekommen deutsche Hinweise. Die
Obergrenze schreibt höchstens einen Warneintrag pro Stunde ins Admin Protokoll.

## Technical Context

**Language/Version**: TypeScript, Next.js App Router (Version laut `package.json`)

**Primary Dependencies**: `node:crypto` (HMAC, `timingSafeEqual`), Zod, supabase-js Service Client

**Storage**: Supabase Postgres, nur bestehende Tabellen `submission_attempts` und `logs`

**Testing**: Vitest (`tests/unit`)

**Target Platform**: Vercel, Node Runtime der Route `app/api/register`

**Project Type**: Web Anwendung (Next.js, ein Projekt)

**Performance Goals**: höchstens zwei zusätzliche kleine Abfragen pro echter Anmeldung (Zählung,
selten Logprüfung); Bots werden ohne Lesezugriff auf Anmeldedaten abgewiesen

**Constraints**: kein Drittanbieter, keine Änderung der Datenschutzerklärung, keine Änderung an der
bestehenden Drosselung, Admin Anlagen unberührt

**Scale/Scope**: ein Camp pro Jahr, wenige hundert Anmeldungen

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Prinzip | Bewertung |
|---|---|
| I. Fixed Stack, Clerk Owns Auth | erfüllt: nur bestehender Stack, kein neuer Dienst, kein Supabase Auth |
| II. Server Is the Security Boundary | erfüllt: Signatur, Prüfung und Zählung nur auf dem Server; Schlüssel nur serverseitig abgeleitet; Eingaben per Zod; das Token verrät den Schlüssel nicht |
| III. Strict Scope | erfüllt: Missbrauchsschutz der Anmeldung über `submission_attempts` steht in AGENTS.md Abschnitt 4; weiterhin genau ein Formular |
| IV. Single Source of Truth | erfüllt: Grenzwerte in `lib/register/limits.ts`, Texte in `lib/register/messages.ts` |
| V. Language Separation | erfüllt: neue Texte deutsch in den Messages, Code und Bezeichner englisch |
| VI. Tolerant Payment, Hidden Pricing | erfüllt: Zahlungsweg unverändert; Einladungslinks laufen durch dieselben Prüfungen, Preise bleiben verborgen; Fehler bei der Zählung blockieren nicht |
| VII. Simplicity and Honest Quality Gates | erfüllt: keine Migration, eine kleine reine Prüffunktion mit Tests, Route bleibt schlank; Lint, Test und Build laufen nach der Umsetzung |
| Writing Rules | erfüllt: neue Texte ohne Striche |

Nach Phase 1 erneut geprüft: keine Verstöße, keine Complexity Tracking Einträge.

## Bestehender Code (geprüft)

- `app/api/register/route.ts`: Zod Schema, ruft `submitRegistration`, danach Stripe und Mail.
- `lib/register/service.ts`: Camp laden, Zustand, Feldprüfung, `isThrottled` (zählt und schreibt
  `submission_attempts` mit `kind = 'registration'`), Speichern per RPC.
- `components/marketing/registration-section.tsx`: Server Component, rendert `RegistrationForm`
  nur im Zustand `open`; `app/page.tsx` ist `force-dynamic`.
- `components/marketing/registration-form.tsx`: Client, `fetch("/api/register")`, zeigt `data.error`
  als Serverfehler und behält die Eingaben.
- `app/admin/actions.ts` `createRegistrationAction`: eigener Weg über `createRegistration`, schreibt
  keine `submission_attempts` und ist damit automatisch ausgenommen.
- `lib/legal/messages.ts`: Datenschutzerklärung nennt bereits IP und Zeitpunkt zum Missbrauchsschutz
  mit 7 Tagen Löschung.

## Entscheidungen

Siehe [research.md](./research.md) R1 bis R8, Datenstrukturen in [data-model.md](./data-model.md),
Schnittstelle in [contracts/register-api.md](./contracts/register-api.md).

## Dateien, die sich ändern

| Datei | Änderung |
|---|---|
| `lib/register/limits.ts` (neu) | Mindestzeit, Gültigkeit, Obergrenze, Fenster |
| `lib/register/form-token.ts` (neu) | reine Funktionen: Token erzeugen und prüfen, Fallenfeld und Token zu einem Ergebnis zusammenführen |
| `lib/register/form-token-server.ts` (neu, `server-only`) | Schlüssel ableiten, Token ausstellen, Bot Versuch in `submission_attempts` schreiben |
| `lib/register/service.ts` | Obergrenze vor `isThrottled`, neues Ergebnis `busy`, Warneintrag einmal pro Stunde |
| `lib/register/messages.ts` | `api.formExpired`, `api.busy` |
| `app/api/register/route.ts` | Schema um `formToken` und `trap` erweitern, Botprüfung vor `submitRegistration`, Antworten laut Contract |
| `components/marketing/registration-section.tsx` | Token ausstellen und übergeben |
| `components/marketing/registration-form.tsx` | Prop `formToken`, verstecktes Fallenfeld, beides im Payload |
| `tests/unit/registration-bot-guard.test.ts` (neu) | Token gültig, fehlend, gefälscht, zu schnell, Zukunft, abgelaufen; Fallenfeld |

## Sicherheit

- Schlüssel nur auf dem Server, abgeleitet aus `SUPABASE_ROLE_KEY` mit festem Label; Vergleich in
  konstanter Zeit.
- Stille Abweisungen sind von echten kostenlosen Anmeldungen nicht unterscheidbar; die Anmeldenummer
  ist zufällig und existiert nicht.
- Bot Zeilen enthalten keine Mailadresse und keine Formulardaten.
- Restrisiko: Ein Bot, der die Seite wirklich lädt, 3 Sekunden wartet und das Fallenfeld leer lässt,
  kommt bis zur Obergrenze durch. Das ist der bewusste Kompromiss ohne Captcha.
- Restrisiko: Füllt ein Browser das Fallenfeld trotz allem automatisch, sähe der Mensch eine falsche
  Erfolgsmeldung. Gegenmittel: neutraler Feldname, `autoComplete="off"`, außerhalb des Bildschirms.

## UI

Keine sichtbare Änderung. Das Fallenfeld liegt unsichtbar außerhalb des Bildschirms. Die beiden neuen
Hinweise erscheinen an der Stelle, an der das Formular heute schon Serverfehler zeigt, in derselben
Gestaltung. Lade, Leer und Fehlerzustände bleiben wie sie sind.

## Akzeptanzkriterien

Wie in spec.md, User Stories 1 bis 4 und SC-001 bis SC-005.

## Checks

`npm test`, `npm run lint`, `npm run build` (Route und Server Code ändern sich).

## Manuelle Testschritte

Siehe [quickstart.md](./quickstart.md).

## Project Structure

### Documentation (this feature)

```text
specs/029-registration-bot-protection/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/register-api.md
├── checklists/requirements.md
└── tasks.md   (kommt mit /speckit-tasks)
```

### Source Code (repository root)

```text
app/api/register/route.ts
components/marketing/registration-section.tsx
components/marketing/registration-form.tsx
lib/register/{limits,form-token,form-token-server,service,messages}.ts
tests/unit/registration-bot-guard.test.ts
```

**Structure Decision**: Einzelnes Next.js Projekt; neue Logik neben dem bestehenden Anmeldecode in
`lib/register/`.

## Complexity Tracking

Keine Einträge.
