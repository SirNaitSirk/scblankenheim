# Implementation Plan: Finanzen Tab für die Buchhaltung

**Branch**: `009-finance-tab` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-finance-tab/spec.md`

## Summary

Neuer Admin Tab `/admin/finanzen` für die Buchhalterin. Eine Server Component lädt die aktiven
Anmeldungen des aktuellen Camps und reduziert sie serverseitig auf eine schmale Finanzzeile ohne
Formularantworten. Eine Client Komponente zeigt Kopfzeile, Filter, Suche und eine Tabelle, in der
bezahlter Betrag und Status direkt bearbeitet werden. Geschrieben wird über neue Server Actions, die
die Berechtigung `finances` prüfen. Zahlungslink und CSV Export nutzen die bestehenden Bausteine.
Keine Migration, kein neues Datenfeld.

## Technical Context

**Language/Version**: TypeScript, Next.js App Router (Server Components und Server Actions, wie in
den übrigen Admin Tabs)

**Primary Dependencies**: Clerk (Session), Supabase Service Role Client, Zod, Tailwind, shadcn/ui,
Phosphor Icons. Keine neue Abhängigkeit.

**Storage**: bestehende Tabellen `registrations`, `camps`, `price_tiers`, `logs`. Keine Änderung.

**Testing**: Vitest (`npm test`) für die reinen Finanzhelfer.

**Target Platform**: Vercel, Desktop Browser plus Tablet und Handy.

**Performance Goals**: bis 300 Anmeldungen ohne spürbare Verzögerung beim Filtern (rein clientseitig
über die bereits geladene Liste).

**Constraints**: keine sensiblen Formularantworten im Browser des Finanz Tabs (SC-003).

**Scale/Scope**: ein Tab, eine Seite, zwei Server Actions, ein Helfermodul.

## Existing code inspected

- `components/admin/nav-items.ts`, `lib/admin/access.ts`: Tabs werden über Hrefs in `visibleTabs`
  freigegeben, Schreibrechte über `PERMISSION_BY_HREF`. `/admin/preise` hängt bereits an `finances`.
- `lib/admin/guard.ts`: `guardTab(href)` für Seiten, `requirePermission(key)` für Actions.
- `app/admin/actions.ts`: `setRegistrationPaymentAction` und `sendPaymentLinkAction` laufen über
  `runGuarded`, das die Berechtigung `registrations` verlangt. Für die Buchhalterin unbrauchbar,
  wenn sie keine Anmeldungen bearbeiten darf.
- `lib/admin/data.ts`: `getRegistrations()` lädt alle Camps inklusive `formData`;
  `setRegistrationPayment()` setzt nur den Status; `getFinanceSummary()` rechnet Summen nur aus
  `amount_due` und `amount_paid`; `writeLog()` ist best effort.
- `components/admin/payment-link-panel.tsx`: `hasPaymentDue()` und der Linkaufbau
  `${appUrl}/bezahlen?ref=…`.
- `components/admin/registrations-manager.tsx`: CSV mit `;` Trenner und UTF8 BOM über `Blob`.
- `lib/email/reminders.ts`: Mahnlogik behandelt `unpaid` und `partial` als offen.
- `lib/admin/messages.ts`: `PERMISSION_LABELS.finances` heißt aktuell „Preise“.
- `supabase/migrations/0006_rename_finances_tab.sql`: alte `/admin/finanzen` Freigaben wurden auf
  `/admin/preise` umgeschrieben. Der neue Tab startet also ohne automatische Freigaben.

## Decisions

1. **Eigene Server Actions in `app/admin/finanzen/actions.ts`** mit `requirePermission("finances")`.
   Die bestehenden Actions im Anmeldungen Dashboard bleiben unverändert an `registrations`.
2. **Ein Speichervorgang für Betrag und Status**: `updateRegistrationFinanceAction(reference,
   { amountPaid, payment })`. Der neue Datenhelfer `setRegistrationFinance()` liest vorher die alten
   Werte (für den Log), schreibt beide Felder und prüft, dass die Anmeldung zum aktuellen Camp
   gehört und aktiv ist.
3. **Zahlungslink senden** über eine eigene Action `sendFinancePaymentLinkAction`, die intern die
   bestehende `sendPaymentLinkEmail()` aufruft. Gleiche Fehlertexte, gleicher Cooldown.
4. **Datensparsamkeit serverseitig**: die Seite mappt Anmeldungen auf `FinanceRow` (nur Felder aus
   FR-006 plus Mail und Erinnerungsdatum), bevor irgendetwas an die Client Komponente geht.
   `formData` verlässt nie den Server.
5. **Reine Helfer in `lib/admin/finance.ts`**: `toFinanceRow`, `outstandingOf`, `isOverdue`,
   `suggestPaymentStatus`, `summarizeFinance`, `filterFinanceRows`, `financeRowsToCsv`. Getestet
   mit Vitest. Kopfzeile und Liste rechnen beide mit denselben Helfern, Summen bleiben damit
   identisch zu `getFinanceSummary()` (SC-005; gleiche Basis: aktive, nicht gelöschte Anmeldungen).
6. **Aktive Anmeldung** = nicht gelöscht und Status nicht `cancelled`. Hinweis: `getFinanceSummary()`
   filtert heute nur `deleted`. Für SC-005 wird dort zusätzlich `cancelled` ausgeschlossen, sodass
   Dashboard, Preise und Finanzen dieselbe Basis haben.
7. **Statusvorschlag**: Eingabe des Betrags setzt den Status im Zeileneditor auf
   `suggestPaymentStatus(amountDue, amountPaid)`, solange die Buchhalterin den Status in diesem
   Edit nicht selbst gewählt hat. `processing` und `refunded` werden nie automatisch vorgeschlagen.
8. **Berechtigungslabel**: `PERMISSION_LABELS.finances` wird zu „Finanzen und Preise“, weil die
   Berechtigung beide Tabs regelt. Keine Datenänderung nötig.
9. **Navigation**: „Finanzen“ steht direkt hinter „Dashboard“ und vor „Preise“.

## UI design

Gestaltung folgt dem bestehenden Adminbereich (PageHeader, StatCard, Card, Badge, Tokens aus
`app/globals.css`). Vor der Umsetzung werden `impeccable` und `tasteskill` gelesen.

- **Kopfzeile**: PageHeader mit Campname als Badge und Zahlungsziel als Beschreibung
  („Zahlungsziel 15.06.2027“ oder „Kein Zahlungsziel hinterlegt“). Darunter vier StatCards:
  Eingegangen (hero, mit Quote), Offen, Unbezahlt / Teilweise (Anzahl), Überfällig (Anzahl, in
  Warnfarbe wenn größer 0).
- **Werkzeugleiste**: Segmentierte Filter „Alle · Offen · Teilweise · Überfällig“ mit Anzahl je
  Filter, Suchfeld (Name oder Referenz), Button „CSV Export“ rechts.
- **Tabelle (ab md)**: Spalten Name, Referenz (mono), Preisstufe, Fällig, Bezahlt (editierbar),
  Offen, Status (editierbar), Mahnungen, Aktionen. Beträge rechtsbündig in Tabellenziffern.
  Überfällige Zeilen bekommen eine dezente Warnmarkierung am linken Rand plus Badge
  „Überfällig“. Guthaben bei Überzahlung als „+20 € Guthaben“ markiert.
- **Zeileneditor**: Klick auf Bezahlt oder Status macht die Zeile editierbar (Betragsfeld mit „€“,
  Statusauswahl, Speichern und Abbrechen). Enter speichert, Escape bricht ab. Während des
  Speicherns ist die Zeile gedimmt; Erfolg als kurzer Toast, Fehler als Toast und Rückfall.
- **Aktionen**: Icon Buttons „Zahlungslink kopieren“ und „Zahlungslink senden“ (mit
  Bestätigungsdialog) nur bei offenem Betrag; ohne Berechtigung ausgeblendet.
- **Mobil (unter md)**: Karten statt Tabelle: Name und Status oben, darunter Fällig, Bezahlt, Offen
  in drei Spalten, Button „Zahlung eintragen“ öffnet denselben Editor als Sheet.
- **Zustände**: `loading.tsx` mit Skeleton für Karten und Tabelle; leerer Zustand ohne aktuelles
  Camp; leerer Zustand ohne Anmeldungen; leeres Filterergebnis mit „Filter zurücksetzen“;
  Fehler über die bestehende `app/admin/error.tsx`.
- **Nur lesend**: ohne Berechtigung `finances` keine Editoren, keine Linkaktionen, ein kurzer
  Hinweis „Nur Ansicht“ im Header.

## Files likely to change

Neu:

- `app/admin/finanzen/page.tsx` · Server Component, `guardTab("/admin/finanzen")`, lädt Camp,
  Preisstufen, Anmeldungen, mappt auf `FinanceRow`.
- `app/admin/finanzen/actions.ts` · `updateRegistrationFinanceAction`,
  `sendFinancePaymentLinkAction`.
- `app/admin/finanzen/loading.tsx` · Skeleton.
- `components/admin/finance-manager.tsx` · Client: Filter, Suche, Export, Kopfzeilenzahlen.
- `components/admin/finance-table.tsx` · Tabelle plus mobile Karten.
- `components/admin/finance-row-editor.tsx` · Zeileneditor für Betrag und Status.
- `lib/admin/finance.ts` · reine Helfer und Typ `FinanceRow`.
- `tests/unit/finance.test.ts`.

Geändert:

- `components/admin/nav-items.ts` · Eintrag „Finanzen“.
- `components/admin/admin-sidebar.tsx` · Icon für den neuen Eintrag.
- `lib/admin/access.ts` · `"/admin/finanzen": "finances"`.
- `lib/admin/messages.ts` · `de.nav.finances`, Block `de.finances`, Label der Berechtigung.
- `lib/admin/data.ts` · `setRegistrationFinance()`, `getFinanceSummary()` schließt `cancelled` aus.
- `lib/admin/types.ts` · ggf. `FinanceUpdateInput`.
- `AGENTS.md` · Abschnitt 4 und Quick reference: Tab Finanzen (specs/009-finance-tab).

## Security requirements

- Seite: `guardTab("/admin/finanzen")`. Actions: `requirePermission("finances")`, Eingaben mit Zod
  (`reference` 1 bis 32 Zeichen, `amountPaid` ganze Zahl 0 bis 100000, `payment` aus der Enum).
- Datenhelfer schreibt nur, wenn die Anmeldung zum aktuellen Camp gehört und nicht gelöscht ist.
- Kein `formData`, keine Adressen, keine Gesundheitsdaten in den Props der Client Komponente;
  geprüft durch einen Unit Test auf `toFinanceRow` (nur erlaubte Schlüssel).
- Service Role Client nur serverseitig, wie bisher.
- Jede Änderung wird geloggt: `registration.finance` mit Referenz, alt und neu, Actor.

## Constitution Check

| Prinzip | Ergebnis |
| --- | --- |
| I. Fixed Stack, Clerk Owns Auth | erfüllt: keine neue Abhängigkeit, Clerk Session über `requireAdmin` |
| II. Server Is the Security Boundary | erfüllt: Schreiben nur in Server Actions mit Permission Check und Zod, Service Role nur serverseitig, Datensparsamkeit serverseitig |
| III. Strict Scope | erfüllt: „Finance overview“ steht in AGENTS.md Abschnitt 4 |
| IV. Single Source of Truth | erfüllt: keine Schemaänderung, keine CHECK Constraints, aktuelles Camp über den bestehenden Helfer |
| V. Language Separation | erfüllt: Texte deutsch in `lib/admin/messages.ts`, Code englisch |
| VI. Tolerant Payment, Hidden Pricing | erfüllt: keine automatische Stornierung; Preisstufennamen sind nur im geschützten Adminbereich sichtbar |
| VII. Simplicity and Quality Gates | erfüllt: reine Helfer, dünne Actions, lint, test und build werden ausgeführt |
| Writing Rules | erfüllt: keine Striche in Texten und Kommentaren |

## Acceptance criteria

Alle Acceptance Scenarios aus User Story 1 bis 4 und FR-001 bis FR-019 der Spec.

## Checks to run

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

## Manual test steps

Siehe [quickstart.md](./quickstart.md).

## Project Structure

```text
specs/009-finance-tab/
├── spec.md
├── plan.md
├── data-model.md
├── quickstart.md
├── tasks.md
└── checklists/requirements.md
```

## Complexity Tracking

Keine Abweichungen von der Constitution.
