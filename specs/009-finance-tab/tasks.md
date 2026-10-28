# Tasks: Finanzen Tab für die Buchhaltung

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md)

`[P]` heißt parallel möglich (andere Datei, keine offene Abhängigkeit).

## Phase 1: Setup

- [ ] T001 Skills `impeccable` und `tasteskill` lesen, bestehende Admin Muster (PageHeader, StatCard, Badge, states) als Vorlage festhalten
- [x] T002 [P] Texte in `lib/admin/messages.ts`: `de.nav.finances`, Block `de.finances` (Titel, Kopfzeile, Filter, Spalten, Editor, Fehler, leere Zustände, „Nur Ansicht“), `PERMISSION_LABELS.finances` auf „Finanzen und Preise“

## Phase 2: Foundational (blocks all stories)

- [x] T003 `lib/admin/finance.ts`: Typ `FinanceRow`, `toFinanceRow`, `outstandingOf`, `isOverdue`, `suggestPaymentStatus`, `summarizeFinance`, `filterFinanceRows`, `financeRowsToCsv`
- [x] T004 [P] `tests/unit/finance.test.ts`: überfällig (mit und ohne Zahlungsziel, processing, refunded, Grenze heute), Statusvorschlag, Summen ohne storniert und gelöscht, Filter und Suche, CSV mit Umlauten und BOM, `toFinanceRow` enthält nur erlaubte Schlüssel
- [x] T005 Navigation und Rechte: `components/admin/nav-items.ts` (nach Dashboard), Icon in `components/admin/admin-sidebar.tsx`, `"/admin/finanzen": "finances"` in `lib/admin/access.ts`
- [x] T006 `lib/admin/data.ts`: `getFinanceSummary()` schließt `cancelled` aus (SC-005)

## Phase 3: User Story 1 · Überblick (P1)

- [x] T007 `app/admin/finanzen/page.tsx`: `guardTab`, Camp, Preisstufen, Anmeldungen laden, auf aktuelles Camp und aktiv filtern, auf `FinanceRow` mappen, `canEdit` ermitteln
- [x] T008 `components/admin/finance-manager.tsx`: Kopfzeile mit StatCards und Zahlungsziel, leere Zustände
- [x] T009 `components/admin/finance-table.tsx`: Tabelle ab md, Karten darunter, Markierung überfällig und Guthaben
- [x] T010 [P] `app/admin/finanzen/loading.tsx`: Skeleton

## Phase 4: User Story 2 · Zahlung nachtragen (P1)

- [x] T011 `lib/admin/data.ts`: `setRegistrationFinance(reference, input)` liest alte Werte, prüft aktuelles Camp und aktiv, schreibt `amount_paid` und `payment_status`, gibt alte Werte zurück
- [x] T012 `app/admin/finanzen/actions.ts`: `updateRegistrationFinanceAction` mit `requirePermission("finances")`, Zod, Log `registration.finance`, `revalidatePath` für Finanzen, Preise und Dashboard
- [x] T013 `components/admin/finance-row-editor.tsx`: Betrag und Status, Vorschlag solange Status nicht manuell gewählt, Enter und Escape, Validierungsfehler, optimistische Anzeige mit Rückfall
- [x] T014 Editor in Tabelle und mobile Karten einhängen, nur bei `canEdit`, sonst Hinweis „Nur Ansicht“

## Phase 5: User Story 3 · Filtern und Zahlungslink (P2)

- [x] T015 Filterleiste mit Anzahl je Filter und Suche in `finance-manager.tsx`, Zurücksetzen bei leerem Ergebnis
- [x] T016 `sendFinancePaymentLinkAction` in `app/admin/finanzen/actions.ts` über `sendPaymentLinkEmail`, gleiche Fehlertexte
- [x] T017 Aktionen kopieren und senden (mit Bestätigung) in der Zeile, nur bei offenem Betrag und `canEdit`

## Phase 6: User Story 4 · Export (P3)

- [x] T018 Button „CSV Export“: aktuell gefilterte Zeilen über `financeRowsToCsv`, Dateiname `finanzen-<camp>-<datum>.csv`

## Phase 7: Polish

- [x] T019 `AGENTS.md` Abschnitt 4 und Quick reference um den Tab Finanzen ergänzen (specs/009-finance-tab)
- [ ] T020 Responsive und Fokus prüfen (Tastatur, Tablet, Handy) im Browser
- [x] T021 `npm run lint`, `npm test`, `npm run build` ausführen und Ausgabe berichten
- [ ] T022 Manuelle Schritte aus `quickstart.md` durchgehen

## Dependencies

- T003 vor T007 bis T018. T005 vor T007. T011 vor T012 vor T013.
- US1 vor US2 (Editor sitzt in der Tabelle). US3 und US4 nach US1, unabhängig voneinander.

## Parallel examples

- T002, T004 und T010 parallel zu T003 bzw. T007.
- T016 parallel zu T015.

## Implementation strategy

MVP sind US1 und US2 zusammen: Überblick plus Nachtragen. Danach US3, zum Schluss US4 und Polish.

## Notes from implementation

- T010: no own `loading.tsx`; the shared `app/admin/loading.tsx` already shows cards plus table skeleton for this segment.
- The editor opens as an extra row below the table row (desktop) and inside the card (mobile) instead of a separate sheet.
- Reference is shown under the name instead of its own column to keep the table readable on tablets.
- T001: built on the existing admin patterns (PageHeader, StatCard, Badge, states); the impeccable design hook found no issues, the skills were not read in full.
- Removed the permanent redirect `/admin/finanzen` → `/admin/preise` from `next.config.ts` (specs/005 FR-002, now superseded).
