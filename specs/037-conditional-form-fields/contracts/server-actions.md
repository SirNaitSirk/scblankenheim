# Contracts: Bedingte Formularfelder

Keine neue Route unter `app/api/*`. Bestehende Server Actions ändern ihr Verhalten; jede prüft wie
bisher zuerst die Clerk Sitzung und die Berechtigung in `profiles`.

## Reine Regeln · `lib/register/conditions.ts`

```ts
type FieldCondition = { fieldKey: string; values: string[] };

/** Liest config.showWhen defensiv; alles Unbrauchbare ergibt null. */
function readCondition(field: CampFormField): FieldCondition | null;

/** Ohne Bedingung immer true; sonst ist der Wert des Auslösers einer der Antworten. */
function isFieldVisible(field: CampFormField, values: Record<string, FieldValue | undefined>): boolean;

/** Die sichtbaren Felder in unveränderter Reihenfolge. */
function visibleFields(fields: CampFormField[], values: Record<string, FieldValue | undefined>): CampFormField[];

/** formData ohne die Schlüssel ausgeblendeter Felder; triggerValues liefert die Formwerte inkl. Geschlecht. */
function dropHiddenAnswers(
  fields: CampFormField[],
  formData: Record<string, FieldValue>,
  triggerValues: Record<string, FieldValue | undefined>,
): Record<string, FieldValue>;

type ConditionProblem = {
  fieldKey: string;      // das abhängige Feld
  fieldLabel: string;
  reason: "trigger_missing" | "trigger_not_select" | "trigger_self" | "trigger_conditional"
        | "value_missing" | "no_values" | "not_allowed";
};

/** Alle Probleme einer ganzen Feldliste (Grundfelder werden ergänzt). */
function conditionProblems(fields: CampFormField[]): ConditionProblem[];

/** Probleme in next, die es in current nicht gab (Vergleich über fieldKey und reason). */
function newConditionProblems(current: CampFormField[], next: CampFormField[]): ConditionProblem[];
```

## Feld Actions · `app/admin/camps/[campId]/felder/actions.ts`

`createFieldAction`, `updateFieldAction`:

- Eingabe zusätzlich `showWhenField: string` (`""` = keine Bedingung) und
  `showWhenValues: string[]`.
- Schema: bei gesetztem Auslöser mindestens eine Antwort, sonst `fieldErrors.showWhenValues`.
- Danach `newConditionProblems(current, next)`. Probleme am Feld selbst landen in
  `fieldErrors.showWhenField` bzw. `fieldErrors.showWhenValues`; Probleme an anderen Feldern
  ergeben `{ ok: false, error: "„Eingeladen von“ hängt an dieser Antwort. Passe zuerst dessen
  Bedingung an." }` (Text in `lib/admin/messages.ts`).

`deleteFieldAction`: lehnt mit derselben Meldung ab, wenn ein anderes Feld das gelöschte als
Auslöser nutzt.

`reorderFieldsAction`: unverändert.

`testRegistrationAction`: unverändert im Code; prüft über `validateFields` nur sichtbare Felder.

## Anmeldung · `submitRegistration` (`/api/register`)

- `validateFields` prüft nur sichtbare Felder; Pflicht nur bei Sichtbarkeit.
- `splitValues` übernimmt Werte ausgeblendeter Felder nicht in `form_data`.
- Antwortformat unverändert.

## Anmeldedialog · `createRegistrationAction`, `updateRegistrationAction` (`app/admin/actions.ts`)

- Nach erfolgreichem Schema: Felder des Camps laden, `dropHiddenAnswers(fields, formData,
  { ...formData, gender: GENDER_OPTIONS[gender] })`, dann speichern. Antwortformat unverändert.

## Änderungsanfrage übernehmen · `applyParticipantChange`

- Nach dem Patch `dropHiddenAnswers` auf den neuen `form_data`.
- Ist das angefragte Feld nach dem Patch ausgeblendet, Ergebnis `{ ok: false, reason: "field_gone" }`
  (bestehender Grund, bestehende Meldung).

## Teilnehmerseite · `buildParticipantView`

- `rows` und `editable` enthalten bedingte Felder nur, wenn sie für die gespeicherten Antworten
  sichtbar sind.
