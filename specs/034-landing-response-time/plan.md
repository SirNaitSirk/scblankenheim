# Implementation Plan: Schnellere erste Antwort der Startseite

**Branch**: `034-landing-response-time` | **Date**: 2026-11-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/034-landing-response-time/spec.md`

## Summary

Die Startseite wartet auf bis zu sechs nacheinander laufende Datenbankabfragen, und jede geht von
der Vercel Funktion in Washington (iad1, Standard) zur Datenbank in Stockholm und zurück. Der Plan
legt die Funktionsregion in `vercel.json` auf Stockholm (`arn1`). Seiteninhalt, Code und Verhalten
bleiben gleich; jede Anfrage liest weiter live. Danach wird auf Produktion gemessen. Nur falls das
Ziel von 300 ms verfehlt wird, folgt eine separat freizugebende Stufe 2 (siehe research.md R4).

## Technical Context

**Language/Version**: TypeScript, Next.js 16.4.3 (App Router), React 19.2.8

**Primary Dependencies**: unverändert; keine neue Abhängigkeit

**Storage**: Supabase Postgres in Stockholm, unverändert

**Testing**: `npm run lint`, `npm test`, `npm run build`; Messung mit `curl` und Lighthouse gegen Produktion

**Target Platform**: Vercel (Funktionen), neue Region `arn1`

**Project Type**: Web application (Next.js full stack)

**Performance Goals**: Median erstes Byte der Startseite unter 300 ms über 10 warme Aufrufe; Lighthouse mobil ≥ 95, Desktop ≥ 97

**Constraints**: keine sichtbare Änderung; Zeitpunkte pünktlich; Einladungen nie geteilt; Prelaunch Sperre unverändert

**Scale/Scope**: eine Konfigurationszeile, Doku in AGENTS.md

## Constitution Check

| Prinzip | Bewertung |
|---|---|
| I. Fixed Stack | ✅ Nur Vercel Konfiguration, keine neue Abhängigkeit. |
| II. Server Is the Security Boundary | ✅ Keine Änderung an Secrets, Routen oder Prüfungen. Cron (`CRON_SECRET`) und Stripe Webhook (Signatur) laufen unverändert, nur an anderem Ort. |
| III. Strict Scope | ✅ Betrifft die bestehende Startseite, keine neue Funktion. |
| IV. Single Source of Truth | ✅ Kein Schema, keine Migration, Daten werden weiter live gelesen. |
| V. Language Separation | ✅ Keine neuen Texte. |
| VI. Tolerant Payment, Hidden Pricing | ✅ Einladungspreise bleiben pro Anfrage, kein gemeinsamer Zwischenspeicher. |
| VII. Simplicity and Honest Quality Gates | ✅ Kleinste wirksame Änderung; Caching bewusst zurückgestellt; Checks und Messung werden wörtlich berichtet. |
| Writing Rules | ✅ Doku ohne Gedankenstriche und Bindestriche in Wörtern. |

Ergebnis nach Design: keine Verstöße, Complexity Tracking leer.

## Decisions and Assumptions

- Region `arn1` statt Caching, Begründung und Alternativen in [research.md](research.md) (R2).
- `force-dynamic` in `app/page.tsx` bleibt; die Startseite wird weiter pro Anfrage gerendert.
- Die Supabase Region Stockholm stammt aus `lib/legal/operator.ts`. Vor dem Deployment wird sie im
  Supabase Dashboard (Project Settings, General, Region) bestätigt. Weicht sie ab, wird die
  passende Vercel Region gewählt.
- Die Vercel Region gilt für alle Funktionen des Projekts, also auch Admin, API und Cron. Das ist
  gewollt (FR008).
- Die Regionsangabe in `vercel.json` wirkt erst mit dem nächsten Deployment.

## Files Likely to Change

- `vercel.json`: `"regions": ["arn1"]` ergänzen, Crons bleiben.
- `AGENTS.md`: im Stack (Abschnitt 2) die Funktionsregion neben der Datenbank als Regel festhalten,
  damit sie nicht zurückfällt.

## Security Requirements

- Keine Änderung an Authentifizierung, Autorisierung, Secrets oder Headern.
- Die Startseite bleibt `private, no-store`; persönliche Einladungen werden nicht geteilt.
- Nach dem Deployment: Stripe Webhook und ein Cron Lauf liefern weiter 2xx (Vercel Logs).

## Acceptance Criteria

- `x-vercel-id` der Startseite endet auf `::arn1::…` statt `::iad1::…`.
- Median erstes Byte über 10 warme Aufrufe unter 300 ms (SC001).
- Lighthouse mobil ≥ 95, Desktop ≥ 97 (SC002).
- Startseite inhaltlich identisch: gleicher Status, Buttons, Titel, Abschnitte; ohne JavaScript sichtbar.
- Einladungslink zeigt Sonderpreis, Aufruf ohne Link nicht (SC005).
- Admin, Teilnehmerseite, Bezahlseite funktionieren und sind nicht langsamer.

## Checks to Run

- `npm run lint`
- `npm test`
- `npm run build`
- Messung nach [quickstart.md](quickstart.md)

## Manual Test Steps

Siehe [quickstart.md](quickstart.md).

## Project Structure

### Documentation (this feature)

```text
specs/034-landing-response-time/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── checklists/requirements.md
```

Keine `contracts/`: keine neue oder geänderte Schnittstelle.

### Source Code (repository root)

```text
vercel.json        # Funktionsregion
AGENTS.md          # Regel zur Region
```

**Structure Decision**: Bestehende Next.js Struktur, kein Code unter `app/`, `lib/` oder
`components/` ändert sich.

## Complexity Tracking

Keine Einträge.
