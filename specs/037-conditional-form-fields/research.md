# Research: Bedingte Formularfelder

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Alle Entscheidungen beruhen auf dem vorhandenen Code: `lib/register/*`, `lib/admin/types.ts`,
`app/admin/camps/[campId]/felder/actions.ts`, `app/admin/actions.ts`, `lib/admin/data.ts`,
`lib/participant/*`, `lib/admin/participant-messages.ts`, `components/marketing/registration-form.tsx`,
`components/admin/registration-form-dialog.tsx`.

## R1 · Wo die Bedingung gespeichert wird

- **Decision**: in `camp_form_fields.config.showWhen` als `{ fieldKey, values }`.
- **Rationale**: `config` ist ausdrücklich für Feldextras ohne Migration da (`FieldConfig`, schon
  mit `placeholder`, `helpText`, `capacity`). Die Bedingung gehört zum Feld und wandert mit ihm.
- **Alternatives considered**: eigene Spalten (Migration ohne Nutzen); eigene Tabelle (Overkill
  für höchstens eine Bedingung pro Feld).

## R2 · Verweis über Schlüssel statt ID

- **Decision**: die Bedingung verweist auf den Feldschlüssel (`key`), nicht auf die ID.
- **Rationale**: Antworten liegen in `form_data` nach Schlüssel; das Grundfeld Geschlecht hat
  keine Zeile in `camp_form_fields`, nur den Schlüssel `gender`. Die Buszuordnung aus 021 verweist
  ebenso über den Schlüssel.
- **Folge**: Den Schlüssel eines Auslöserfelds zu ändern wird abgelehnt (gehört zu FR-008).

## R3 · Vergleich der Antworten

- **Decision**: verglichen wird der Formwert: bei Auswahlfeldern der Optionstext, beim Geschlecht
  der deutsche Optionstext aus `GENDER_OPTIONS`. Der Anmeldedialog und die Teilnehmerseite wandeln
  `registrations.gender` vorher über `GENDER_OPTIONS` bzw. `storedFieldValue` um.
- **Rationale**: Das öffentliche Formular arbeitet schon mit diesen Werten; eine Darstellung für
  alle Stellen.

## R4 · Eine reine Regeldatei

- **Decision**: `lib/register/conditions.ts` mit `readCondition`, `isFieldVisible`,
  `visibleFields`, `dropHiddenAnswers`, `conditionProblems`. Isomorph, ohne Datenbank.
- **Rationale**: Prinzip IV und VII: Browser und Server rechnen mit denselben Funktionen, wie heute
  schon bei `validateField`. Gut testbar mit Vitest.

## R5 · Pflichtprüfung nur für sichtbare Felder

- **Decision**: `validateFields` filtert intern mit `visibleFields`. Der Client nutzt für Schritt
  und Absenden dieselbe Filterung.
- **Rationale**: Damit greifen `register` und `testRegistrationAction` ohne eigene Änderung.

## R6 · Verwerfen ausgeblendeter Werte

- **Decision**: öffentlich in `splitValues` (nur sichtbare Felder landen in `form_data`); im
  Anmeldedialog in `createRegistrationAction` und `updateRegistrationAction` nach dem Zod Schema
  über `dropHiddenAnswers` mit den Feldern des Camps; bei Änderungsanfragen in
  `applyParticipantChange` auf den gepatchten `form_data`.
- **Rationale**: `lib/admin/data.ts` ersetzt `form_data` beim Speichern ganz, das Verwerfen davor
  reicht also. Busrabatt (035) und Busticket (021) lesen danach den bereinigten Stand.
- **Hinweis**: Die Pflichtprüfung im Anmeldedialog bleibt wie heute im Client (Spec FR-006).
  Server seitig wird dort nur verworfen, nicht verlangt, damit Admins alte Anmeldungen ohne den
  Namen weiter speichern können, wenn sie die Jugend nicht anfassen. Der Client verlangt den Namen
  trotzdem, sobald das Feld sichtbar ist (Spec US3 Szenario 4).

## R7 · Feldschutz

- **Decision**: `conditionProblems(fields)` prüft eine ganze Feldliste: Auslöser fehlt, ist keine
  Auswahl, ist das Feld selbst, ist selbst bedingt, Antwort fehlt in den Optionen, leere Antwortliste,
  Schrittmarke oder Grundfeld mit Bedingung. Die Feld Actions bauen die Liste nach der geplanten
  Änderung (Anlegen, Ändern, Löschen) und lehnen ab, wenn Probleme entstehen, die vorher nicht da
  waren. Die Meldung nennt das abhängige Feld.
- **Rationale**: Eine Prüfung deckt Umbenennen, Löschen von Antworten, Typwechsel, Schlüsselwechsel
  und Löschen des Felds ab, ohne Sonderfälle pro Action. „Neu entstanden“ statt „vorhanden“, damit
  ein alter Fehlerstand das Reparieren nicht blockiert.
- **Alternatives considered**: Bedingung beim Umbenennen automatisch mitziehen (vom
  Projektverantwortlichen abgelehnt, Spec Entscheidung 4).

## R8 · Schritte

- **Decision**: `buildSteps` bleibt unverändert; ein Schritt rendert nur seine sichtbaren Felder.
- **Rationale**: Dynamisch wegfallende Schritte würden Fortschrittsanzeige und Navigation
  verändern, während jemand tippt. Der Fall „Schritt nur mit bedingtem Feld“ ist selten; der
  Feldeditor kann ihn in der Testansicht sichtbar machen (Spec Edge Cases).

## R9 · Ansage für Bildschirmleser

- **Decision**: die vorhandene Live Region (`aria-live="polite"`) sagt beim Erscheinen
  „Neues Feld: <Label>“. Kein Fokuswechsel.
- **Rationale**: Fokus springen zu lassen würde Tastaturnutzer beim Auswählen stören.
