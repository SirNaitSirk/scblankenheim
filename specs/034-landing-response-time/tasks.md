---

description: "Task list for 034-landing-response-time"
---

# Tasks: Schnellere erste Antwort der Startseite

**Input**: Design documents from `/specs/034-landing-response-time/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: keine neuen automatischen Tests (keine Codeänderung); Nachweis über Messung und Handtests in quickstart.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 Supabase Region im Dashboard bestätigen (Project Settings, General, Region); erwartet Stockholm `eu-north-1` laut `lib/legal/operator.ts`. Weicht sie ab, die passende Vercel Region für T003 wählen und research.md R2 anpassen (Aufgabe für den Nutzer, Ergebnis in specs/034-landing-response-time/research.md vermerken)
- [x] T002 Ausgangswerte festhalten: `x-vercel-id` und Median von 10 warmen Aufrufen der Startseite nach quickstart.md Schritt 1 und 2, Ergebnis in specs/034-landing-response-time/quickstart.md unter „Messwerte“ eintragen

## Phase 2: Foundational

- [x] T003 `"regions": ["arn1"]` in vercel.json ergänzen, die beiden Crons unverändert lassen

**Checkpoint**: Konfiguration bereit, wirkt erst nach Deployment.

## Phase 3: User Story 1 · Die Startseite ist sofort da (P1) 🎯 MVP

**Goal**: Median erstes Byte unter 300 ms ohne sichtbare Änderung.

**Independent Test**: quickstart.md Schritte 1 bis 4.

- [x] T004 [US1] Regel in AGENTS.md Abschnitt 2 (Tech stack) ergänzen: Vercel Funktionen laufen in der Region der Supabase Datenbank (`arn1`, gesetzt in vercel.json), Verweis auf specs/034-landing-response-time
- [x] T005 [US1] `npm run lint`, `npm test`, `npm run build` ausführen und Ausgabe wörtlich berichten
- [x] T006 [US1] Nach Freigabe des Nutzers committen und deployen; danach quickstart.md Schritte 1 bis 3 gegen Produktion ausführen und Messwerte in specs/034-landing-response-time/quickstart.md eintragen
- [x] T007 [US1] Liegt der Median über 300 ms: nichts improvisieren, Befund melden und Stufe 2 (gemeinsame Daten kurz zwischenspeichern, research.md R4) als Planergänzung zur Freigabe vorlegen (nicht nötig: Median warm 0,26 bis 0,29 s)

## Phase 4: User Story 2 · Der Anmeldestatus bleibt aktuell (P1)

**Goal**: Status, Zeitpunkte und Kapazität ohne Verzögerung korrekt.

**Independent Test**: spec.md User Story 2, Szenarien 1 bis 4.

- [x] T008 [US2] Bestätigen, dass `export const dynamic = "force-dynamic"` in app/page.tsx und die Live Abfragen in lib/marketing/landing-state.ts unverändert sind (kein Cache eingeführt), Startseite mit dem Stand vor dem Deployment vergleichen (quickstart.md Schritt 4)

## Phase 5: User Story 3 · Persönliche Einladungslinks bleiben persönlich (P1)

**Goal**: Sonderpreis nur mit Link.

**Independent Test**: spec.md User Story 3.

- [ ] T009 [US3] Mit gültigem `?einladung=` Link Sonderpreis prüfen, danach in anderem Browser ohne Link nur öffentlichen Preis; `cache-control` der Startseite bleibt `private, no-store` (quickstart.md Schritt 4) (offen: ungültiger Code geprüft, gültiger Link braucht einen echten Einladungscode)

## Phase 6: Polish

- [ ] T010 Admin, Teilnehmerseite und `/bezahlen` öffnen; am nächsten Morgen Cron Läufe und den nächsten Stripe Webhook in den Vercel Logs auf 2xx prüfen (quickstart.md Schritt 5) (offen: Seiten und Cron 401 geprüft, Cron Läufe und Webhook stehen aus)

## Dependencies & Execution Order

- T001 vor T003 (Region muss stimmen). T002 vor dem Deployment.
- T003 → T004 → T005 → T006 → T007.
- T008, T009, T010 nach T006, untereinander unabhängig.

## Parallel Opportunities

- T001 und T002 parallel.
- T008, T009, T010 parallel nach dem Deployment.

## Implementation Strategy

US1 ist das MVP und trägt die einzige Änderung (T003). US2 und US3 sind Nachweise, dass sich nichts verschlechtert hat.
