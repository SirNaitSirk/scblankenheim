# Tasks: Mails und Zahlungserinnerungen

**Input**: `specs/007-transactional-emails/` (spec.md, plan.md, research.md, data-model.md,
contracts/http-and-actions.md, contracts/email-templates.md, quickstart.md)

**Tests**: plan.md verlangt Vitest Unit Tests für die reine Logik (Erinnerungsregeln, Vorlagen,
Provider Wrapper, Cron Prüfung). Ende zu Ende über quickstart.md mit Resend Testabsender.

Format: `[ID] [P?] [Story] Beschreibung`. `[P]` = parallel möglich (andere Datei, keine offene
Abhängigkeit). Bezeichner, Dateinamen und Kommentare im Code bleiben Englisch (Verfassung V).

## Phase 1: Setup

- [ ] T001 (offen, Projektverantwortlicher) (Aufgabe des Projektverantwortlichen) `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `CRON_SECRET` und `APP_URL` in `.env.local` eintragen wie in `specs/007-transactional-emails/quickstart.md` beschrieben; nie echte Werte committen
- [x] T002 Migration `supabase/migrations/0008_email_deliveries.sql` laut data-model.md anlegen: Tabelle `email_deliveries` mit `id uuid primary key default gen_random_uuid()`, `registration_id uuid not null references public.registrations(id) on delete cascade`, `kind text not null` (Werte `confirmation`, `payment_link`, `reminder_1`, `reminder_2`, `reminder_3`, kein CHECK), `status text not null` (Werte `sending`, `sent`, `failed`, kein CHECK), `trigger text not null` (Werte `registration`, `cron`, `admin`), `actor text`, `provider_message_id text`, `error text` (Codes `not_configured`, `rejected`, `rate_limited`, `network`, `stale`), `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`; Unique Index `email_deliveries_once_idx` auf `(registration_id, kind)` mit `where kind <> 'payment_link' and status in ('sending', 'sent')`; Index `email_deliveries_registration_idx` auf `(registration_id, created_at desc)`; RLS an, keine Grants an `anon` oder `authenticated`; Kopfkommentar ohne Striche
- [x] T003 Migration 0008 anwenden und `lib/database.types.ts` um `email_deliveries` ergänzen (abhängig von T002). Typen von Hand ergänzt; das SQL in der Datenbank ausführen steht noch aus (Projektverantwortlicher). Wie bei früheren Migrationen führt der Projektverantwortliche das SQL in der Datenbank aus
- [x] T004 [P] `vercel.json` anlegen mit `{ "crons": [{ "path": "/api/cron/payment-reminders", "schedule": "0 6 * * *" }] }`

## Phase 2: Grundlagen (blockiert alle Stories)

- [x] T005 [P] `lib/email/limits.ts` anlegen: `REMINDER_RUN_CAP = 80`, `SEND_SPACING_MS = 500`, `REMINDER_FIRST_AFTER_DAYS = 7`, `REMINDER_BEFORE_DUE_DAYS = 7`, `REMINDER_MIN_GAP_DAYS = 3`, `STALE_SENDING_MS = 30 * 60 * 1000`, `PAYMENT_LINK_COOLDOWN_MS = 60 * 1000`, `PROVIDER_TIMEOUT_MS = 10000`
- [x] T006 [P] `lib/time/berlin.ts` anlegen (rein): `berlinDate(date: Date): string` als `YYYY-MM-DD` über `Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" })`, `addDays(isoDate, days)`, `compareDates(a, b)`; nur Kalenderdaten, keine Uhrzeiten
- [x] T007 [P] `lib/email/messages.ts` anlegen mit allen deutschen Texten aus contracts/email-templates.md (Betreffzeilen, Anrede „Hallo {Vorname},“ und Fallback „Hallo,“, Knopf „Jetzt bezahlen“, Hinweis „Hast du schon bezahlt? Dann ist alles erledigt.“, „Für dich ist nichts zu zahlen.“, Fußzeile „FCG Blankenheim Summercamp · Antworten auf diese Mail erreichen unser Team“, Texte der drei Erinnerungen, freundlich und ohne Androhung einer Stornierung); keine Striche
- [x] T008 [P] `lib/email/layout.ts` anlegen (rein): `escapeHtml(value)`, `renderLayout({ preheader, title, bodyHtml })` als tabellenbasierte HTML Hülle mit Inline Styles (Kopf mit Campname, Inhalt, Fußzeile), `renderButton(label, href)`, `renderText(lines)` für die Textfassung; mobil lesbar (max. Breite 600 px, Schrift ab 16 px)
- [x] T009 [P] `lib/email/links.ts` anlegen: `paymentUrl(reference): string | null` aus `APP_URL` (abschließende Schrägstriche entfernen) plus `/bezahlen?ref=` und `encodeURIComponent(reference)`; `null`, wenn `APP_URL` fehlt (research R8)
- [x] T010 `lib/email/templates.ts` anlegen (rein): Typ `EmailContext` exakt wie in contracts/email-templates.md; Funktionen `confirmationEmail(ctx)`, `paymentLinkEmail(ctx)`, `reminderEmail(kind, ctx)` liefern `{ subject, html, text }`; Bestätigung zeigt bei `amountDue > 0` Knopf, lesbaren Link und Zahlungsziel falls gesetzt, bei 0 nur „Für dich ist nichts zu zahlen.“; Zahlungslink und Erinnerungen zeigen `outstanding`; Beträge über `formatCurrency`, Daten über `formatDate` aus `lib/format.ts`; jeder Wert über `escapeHtml`; nie Preisstufenname, Nachname oder Formularangaben (abhängig von T007, T008)
- [x] T011 [P] Unit Tests `tests/unit/email-templates.test.ts`: Referenz und Link in HTML und Text, Bestätigung 0 € ohne Knopf, Teilzahlung zeigt Restbetrag, fehlendes Zahlungsziel ohne Datum, Escaping von `<script>` im Vornamen, keine Wörter „storniert“ oder „Stornierung“ in `reminder_3`, keine Gedankenstriche in Betreff und Text (abhängig von T010)
- [x] T012 `lib/email/provider.ts` anlegen: `import "server-only"`; `sendEmail({ to, subject, html, text }, idempotencyKey): Promise<SendResult>` mit `fetch("https://api.resend.com/emails", …)`, Header `Authorization: Bearer ${RESEND_API_KEY}`, `Idempotency-Key`, `Content-Type: application/json`, Body mit `from` = `EMAIL_FROM`, `to: [to]`, `reply_to` = `EMAIL_REPLY_TO`; Timeout über `AbortSignal.timeout(PROVIDER_TIMEOUT_MS)`; Ergebnis `{ ok: true, id } | { ok: false, error: "not_configured" | "rejected" | "rate_limited" | "network" }` (fehlender Key oder Absender → `not_configured`, Status 429 → `rate_limited`, sonstige 4xx/5xx → `rejected`, Ausnahme → `network`); wirft nie (abhängig von T005)
- [x] T013 [P] Unit Tests `tests/unit/email-provider.test.ts` mit gestubbtem `fetch` und `vi.mock("server-only", () => ({}))`: Erfolg liefert id, Header `Idempotency-Key` gesetzt, 422 → `rejected`, 429 → `rate_limited`, Netzfehler → `network`, fehlender Key → `not_configured` ohne Aufruf (abhängig von T012)
- [x] T014 `lib/email/deliveries.ts` anlegen: `import "server-only"`; `claimDelivery({ registrationId, kind, trigger, actor })` fügt Zeile mit `status = 'sending'` ein und liefert `{ id } | null` bei Unique Verletzung (über `isUniqueViolation` aus `lib/admin/data.ts`); `markSent(id, providerMessageId)`, `markFailed(id, error)` setzen `status` und `updated_at`; `failStaleDeliveries()` setzt `sending` Zeilen älter als `STALE_SENDING_MS` auf `failed` mit `error = 'stale'`; `lastPaymentLinkAt(registrationId)`; `sentKindsByRegistration(registrationIds)` liefert pro Anmeldung gesendete Erinnerungsarten und letztes Versanddatum (Filter in JS, keine gejointe Abfrage) (abhängig von T003, T005)
- [x] T015 `lib/email/send.ts` anlegen: `import "server-only"`; interne Funktion `loadEmailContext(registrationId)` lädt Anmeldung und Camp mit dem Service Client und baut `EmailContext` (`outstanding` über `outstandingAmount` aus `lib/payment/eligibility.ts`, `payUrl` über `paymentUrl`); interne Funktion `deliver({ registrationId, kind, trigger, actor, build })`: Kontext laden, ohne Mailadresse oder ohne `APP_URL` → `writeLog` `email.skipped` und Ende; `claimDelivery` (null → übersprungen); `sendEmail` mit Idempotency Key `${kind}/${registrationId}` (bei `payment_link` `payment_link/${deliveryId}`); `markSent` oder `markFailed`; Log `email.sent` oder `email.failed` (Level `warning`) mit Art und Referenz, nie Adresse oder Inhalt; Ergebnis `"sent" | "failed" | "skipped"`; wirft nie (abhängig von T009, T010, T012, T014)

**Checkpoint**: Vorlagen, Provider und Versandprotokoll existieren und sind getestet.

## Phase 3: User Story 1 · Bestätigung nach der Anmeldung (P1) 🎯 MVP

**Ziel**: nach jeder erfolgreichen Anmeldung genau eine deutsche Bestätigung, ohne die Weiterleitung zu Stripe zu verzögern.

**Unabhängiger Test**: quickstart Szenarien 1, 2, 3.

- [x] T016 [US1] In `lib/email/send.ts` `sendConfirmationEmail(registrationId: string): Promise<void>` ergänzen: ruft `deliver` mit `kind = 'confirmation'`, `trigger = 'registration'` und `confirmationEmail` (abhängig von T015)
- [x] T017 [US1] `app/api/register/route.ts` erweitern: bei `result.ok` und vorhandener `registrationId` `after(() => sendConfirmationEmail(registrationId))` aus `next/server` registrieren; Antwortform und Statuscodes unverändert; ohne `registrationId` `writeLog` Level `warning` `email.skipped` mit Referenz; Kommentar im Kopf ergänzen (abhängig von T016)

**Checkpoint**: Anmeldung verschickt Bestätigung; Ausfall des Anbieters ändert nichts an der Anmeldung.

## Phase 4: User Story 2 · Automatische Zahlungserinnerungen (P1)

**Ziel**: täglicher Lauf verschickt fällige Erinnerungen genau einmal, stoppt bei Zahlung, storniert nie.

**Unabhängiger Test**: quickstart Szenarien 4 bis 8 und 13.

- [x] T018 [P] [US2] `lib/email/reminders.ts` anlegen (rein, ohne Serverimporte): Typen `ReminderKind = "reminder_1" | "reminder_2" | "reminder_3"` und `ReminderInput` (`paymentStatus`, `outstanding`, `deleted`, `status`, `hasEmail`, `registeredDate`, `campStartDate`, `paymentDueDate`, `sentKinds`, `lastReminderDate`); `isReminderEligible(input)` laut data-model.md (nicht gelöscht, nicht `cancelled`, Mailadresse, `payment_status` in `unpaid` oder `partial`, `outstanding > 0`); `nextReminder(input, today)` exakt nach research R5 Schritte 1 bis 4 mit Konstanten aus `lib/email/limits.ts` und Helfern aus `lib/time/berlin.ts` (abhängig von T005, T006)
- [x] T019 [P] [US2] Unit Tests `tests/unit/email-reminders.test.ts` als Regeltabelle: Tag 6 nichts, Tag 7 `reminder_1`, erneut am selben Tag nichts, Fenster vor dem Zahlungsziel `reminder_2`, Tag nach dem Zahlungsziel `reminder_3`, späte Anmeldung im Fenster 2 überspringt `reminder_1`, Anmeldung nach dem Zahlungsziel frühestens nach 3 Tagen, Abstand unter 3 Tagen nichts, ohne Zahlungsziel nur `reminder_1`, ab Campbeginn nichts, `paid`, `processing`, `refunded`, `cancelled`, gelöscht, 0 € und ohne Mail jeweils nichts, `partial` mit Rest erinnert (abhängig von T018)
- [x] T020 [P] [US2] `lib/email/cron-auth.ts` anlegen: `isAuthorizedCronRequest(request: Request): boolean` prüft `Authorization: Bearer ${CRON_SECRET}` mit `timingSafeEqual` aus `node:crypto` auf gleich lange Buffer; fehlendes `CRON_SECRET` → `false`; dazu Fälle in `tests/unit/email-reminders.test.ts` oder eigener Datei `tests/unit/cron-auth.test.ts`
- [x] T021 [US2] In `lib/email/send.ts` `runPaymentReminders(today = berlinDate(new Date())): Promise<{ sent: number; failed: number; skipped: number; capped: boolean }>` ergänzen: `failStaleDeliveries()`; aktuelles Camp über `camp_settings.current_camp_id` laden (`name`, `start_date`, `end_date`, `payment_due_date`); Anmeldungen dieses Camps mit `deleted = false` laden, älteste `registered_at` zuerst; `sentKindsByRegistration`; pro Anmeldung `nextReminder`; fällige über `deliver` mit `trigger = 'cron'` und `reminderEmail(kind, ctx)` senden, `SEND_SPACING_MS` Pause zwischen Sendungen, Abbruch bei `REMINDER_RUN_CAP` mit `capped = true`; am Ende ein Log `reminders.run` mit den Zählern; ändert nie Felder einer Anmeldung (FR-017) (abhängig von T015, T018)
- [x] T022 [US2] `app/api/cron/payment-reminders/route.ts` anlegen: `export const runtime = "nodejs"`, `export const maxDuration = 60`, `GET` prüft `isAuthorizedCronRequest` → sonst `401 { error: "unauthorized" }`; ruft `runPaymentReminders()` und antwortet `200` mit den Zählern, ohne personenbezogene Daten; unerwarteter Fehler → `writeLog` Level `error` `reminders.failed` und `500 { error: "internal" }` (abhängig von T020, T021)

**Checkpoint**: Erinnerungslauf per curl mit Secret auslösbar, wiederholte Läufe senden nichts doppelt.

## Phase 5: User Story 3 · Zahlungslink aus dem Adminbereich (P2)

**Ziel**: Admins senden oder kopieren den Zahlungslink und sehen die Erinnerungen pro Anmeldung.

**Unabhängiger Test**: quickstart Szenarien 9 bis 12.

- [x] T023 [P] [US3] `lib/admin/types.ts`: `Registration` um `reminderCount: number` und `lastReminderAt: string | null` erweitern; `lib/admin/messages.ts` um deutsche Texte ergänzen: „Zahlung“, „Zahlungslink senden“, „Link kopieren“, „Link kopiert“, „Zahlungslink gesendet.“, „Für diese Anmeldung ist keine Zahlung offen.“, „Keine Mailadresse hinterlegt.“, „Der Zahlungslink wurde gerade erst gesendet. Bitte kurz warten.“, „Die Mail konnte nicht gesendet werden. Bitte später erneut versuchen.“, „Noch keine Erinnerung“, Vorlage „{n} Erinnerung(en), zuletzt am {Datum}“ als Funktion mit Singular und Plural
- [x] T024 [US3] `lib/admin/data.ts` `getRegistrations()` erweitern: nach dem Laden der Anmeldungen `email_deliveries` mit `status = 'sent'` und Erinnerungsart für diese Ids laden (Filter in JS), `reminderCount` und `lastReminderAt` setzen; Fehler beim Laden der Zustellungen ergeben `0` und `null`, nie einen Seitenfehler (abhängig von T003, T023)
- [x] T025 [US3] (umgesetzt mit Referenznummer statt UUID, weil `Registration.id` im Admin die Referenz ist) In `lib/email/send.ts` `sendPaymentLinkEmail(registrationId, actor): Promise<"sent" | "failed" | "not_eligible" | "no_email" | "cooldown">` ergänzen: Eignung über `checkoutEligibility` (`ok` nötig), fehlende Mail → `no_email`, `lastPaymentLinkAt` jünger als `PAYMENT_LINK_COOLDOWN_MS` → `cooldown`, sonst `deliver` mit `kind = 'payment_link'`, `trigger = 'admin'`, `actor` (abhängig von T015)
- [x] T026 [US3] `app/admin/actions.ts`: Server Action `sendPaymentLinkAction(registrationId: string): Promise<ActionResult>` mit `requirePermission("registrations")`, Zod `z.string().uuid()`, Zuordnung der Ergebnisse auf die Texte aus T023 laut contracts/http-and-actions.md; `AuthError` wie bei den bestehenden Actions behandeln; `revalidatePath("/admin")` nur bei Erfolg (abhängig von T023, T025)
- [x] T027 [US3] `app/admin/page.tsx` und `components/admin/registrations-manager.tsx`: `APP_URL` serverseitig lesen (abschließende Schrägstriche entfernen) und als Prop `appUrl: string | null` bis zum Dialog durchreichen; Action `sendPaymentLinkAction` anbinden und bestehende Toasts für Erfolg und Fehler nutzen (abhängig von T026)
- [x] T028 [US3] `components/admin/registration-form-dialog.tsx`: Bereich „Zahlung“ unter den Zahlungsfeldern nur im Bearbeitenmodus und nur wenn eine Zahlung offen ist (`unpaid` oder `partial`, Rest größer 0, nicht storniert): Zeile mit Erinnerungsinfo, darunter zwei sekundäre Knöpfe nebeneinander, auf schmalen Bildschirmen untereinander: „Zahlungslink senden“ (Phosphor `PaperPlaneTilt`, mit Ladezustand, deaktiviert mit Hinweis „Keine Mailadresse hinterlegt.“ ohne Mail) und „Link kopieren“ (Phosphor `Copy`, `navigator.clipboard.writeText(`${appUrl}/bezahlen?ref=${encodeURIComponent(reference)}`)`, Bestätigung „Link kopiert“; ausgeblendet ohne `appUrl`); bestehende Tokens, Abstände und Knopfstile verwenden; Designdurchgang mit `impeccable` (abhängig von T023, T027)

**Checkpoint**: Admin sendet und kopiert Links; Erinnerungsinfo sichtbar.

## Phase 6: User Story 4 · Mailvorlagen im Adminbereich ansehen (P3)

**Ziel**: Tab „Mail“ zeigt alle Vorlagen mit Beispieldaten, nur zum Ansehen.

**Unabhängiger Test**: quickstart Szenarien 14 bis 16.

- [x] T029 [P] [US4] `lib/admin/messages.ts`: `de.nav.mail` „Mail“ und Block `de.mail` mit Titel „Mail“, Beschreibung „So sehen die Mails aus, die Teilnehmende bekommen. Ändern lassen sich die Vorlagen nur im Code.“, Umschalter „Ansicht“ und „Textfassung“, Bezeichnungen der sechs Vorschauen (Anmeldebestätigung, Anmeldebestätigung kostenlos, Zahlungslink, Erinnerung 1, Erinnerung 2, Erinnerung 3), Versandanlässe als Funktionen aus den Konstanten in `lib/email/limits.ts` (zum Beispiel „7 Tage nach der Anmeldung“, „7 Tage vor dem Zahlungsziel“, „Am Tag nach dem Zahlungsziel“, „Direkt nach der Anmeldung“, „Wenn ein Admin den Zahlungslink sendet“), Hinweis ohne Zahlungsziel „Für das aktuelle Camp ist kein Zahlungsziel gesetzt. Deshalb wird nur die 1. Erinnerung verschickt.“, Leerzustand „Kein aktuelles Camp ausgewählt“; keine Striche
- [x] T030 [US4] `lib/email/preview.ts` anlegen: `import "server-only"`; `buildMailPreviews(camp)` mit fester Beispielperson laut research R12 (Vorname „Lena“, Referenz `REG-BEISPIEL`, Betrag und Rest = `base_price` des aktuellen Camps, `payUrl` über `paymentUrl` mit Fallback `/bezahlen?ref=REG-BEISPIEL` ohne `APP_URL`); liefert sechs Einträge `{ id, subject, html, text }` mit `id` in `confirmation`, `confirmation_free`, `payment_link`, `reminder_1`, `reminder_2`, `reminder_3`, erzeugt ausschließlich über `confirmationEmail`, `paymentLinkEmail`, `reminderEmail`; nie echte Anmeldungen, nie Preisstufen (abhängig von T010)
- [x] T031 [P] [US4] Unit Tests `tests/unit/email-preview.test.ts` (mit `vi.mock("server-only", () => ({}))`): sechs Einträge, Vorschau gleich dem direkten Vorlagenaufruf, kostenlose Variante ohne Knopf, ohne Zahlungsziel kein Datum (abhängig von T030)
- [x] T032 [US4] `components/admin/nav-items.ts` um `{ label: de.nav.mail, href: "/admin/mail" }` nach Logs ergänzen; `components/admin/admin-sidebar.tsx` Icon `EnvelopeSimple` aus Phosphor zuordnen; prüfen, dass die Tabauswahl in der Benutzerverwaltung den Eintrag automatisch über `NAV_ITEMS` zeigt (abhängig von T029)
- [x] T033 [US4] `components/admin/mail-preview.tsx` anlegen (`"use client"`): Props `previews` mit Titel, Anlass, Betreff, `html`, `text`; links Liste der sechs Mails (ab `lg` Spalte, darunter horizontal scrollbare Chips), rechts Karte mit Betreff, Umschalter „Ansicht | Textfassung“ und Vorschau; HTML in `iframe` mit `srcDoc`, `sandbox="allow-same-origin"`, Höhe beim Laden aus `contentDocument.documentElement.scrollHeight`, `pointer-events: none`, Breite bis 600 px zentriert auf gedämpftem Hintergrund; Textfassung als `pre` mit Umbruch; keine Eingabefelder, keine Knöpfe außer Auswahl und Umschalter; bestehende Tokens und Karten; Designdurchgang mit `impeccable` (abhängig von T029)
- [x] T034 [US4] `app/admin/mail/page.tsx` anlegen: `await guardTab("/admin/mail")`, aktuelles Camp über `getCurrentCamp()` laden (ohne aktuelles Camp Leerzustand mit `EmptyState`), `buildMailPreviews` aufrufen, Titel und Anlass aus `de.mail` ergänzen, Hinweis ohne Zahlungsziel anzeigen, `PageBody` und `PageHeader` wie in `app/admin/logs/page.tsx`, dann `MailPreview` rendern (abhängig von T030, T032, T033)

**Checkpoint**: Tab „Mail“ zeigt alle Vorlagen, nur lesend, Zugriff über Tabfreigabe.

## Phase 7: Feinschliff

- [x] T035 [P] `AGENTS.md` Abschnitt 6 sowie `specs/007-transactional-emails/quickstart.md` prüfen: Cron Route `app/api/cron/payment-reminders` als gebaut eintragen, neue Umgebungsvariablen nennen; keine Striche in neuen Texten
- [x] T036 [P] Alle neuen und geänderten Dateien auf Gedankenstriche und Bindestriche in Texten, Mailcopy und Kommentaren prüfen (Verfassung, Schreibregeln) und auf `any` prüfen
- [x] T037 `npm run lint`, `npm test` und `npm run build` ausführen und die Ausgabe wörtlich berichten (Verfassung VII)
- [ ] T038 (offen: Szenario 4 per curl geprüft, `401` ohne und mit falschem Secret; übrige Szenarien brauchen Migration, Resend Schlüssel und Admin Login) quickstart.md Szenarien 1 bis 12 und 14 bis 16 lokal durchspielen (Resend Testabsender, Stripe Testmodus); Szenario 13 nach dem Deploy durch den Projektverantwortlichen

## Dependencies

- Phase 1 → Phase 2 → Stories. T002 → T003 → T014.
- US1 (T016, T017) braucht nur Phase 2.
- US2 braucht Phase 2; T018 bis T020 sind unabhängig von US1.
- US3 braucht Phase 2 und T003; unabhängig von US1 und US2, teilt aber `lib/email/send.ts` (Aufgaben in dieser Datei nacheinander, nicht parallel).
- US4 braucht nur T010 aus Phase 2 (Vorlagen); unabhängig von US1 bis US3.
- Phase 7 nach allen gewünschten Stories.

## Parallel examples

- Phase 2: T005, T006, T007, T008, T009 gleichzeitig; danach T010 und T012 parallel; T011 und T013 parallel nach ihren Vorgängern.
- US2: T018, T019, T020 parallel; danach T021, dann T022.
- US3: T023 parallel zu US2 Arbeit; T024 und T025 danach in beliebiger Reihenfolge, aber T025 nicht gleichzeitig mit T021 (gleiche Datei).

- US4: T029, T031 (nach T030) und T033 parallel; T032 nach T029; T034 zuletzt.

## Implementation strategy

1. MVP: Phase 1, Phase 2, US1. Ergebnis: jede Anmeldung bekommt eine Bestätigung mit Bezahllink. Lint, Test, Build ausführen.
2. US2: Erinnerungen und Cron. Mit verschobenen Daten per curl prüfen, dann deployen.
3. US3: Adminknöpfe und Erinnerungsinfo.
4. US4: Tab „Mail“ zum Ansehen der Vorlagen.
5. Feinschliff und vollständige quickstart Runde.
