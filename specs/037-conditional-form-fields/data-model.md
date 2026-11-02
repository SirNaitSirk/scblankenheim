# Data Model: Bedingte Formularfelder

Keine Migration, keine neue Tabelle, keine neuen Typen aus `supabase gen types`.

## camp_form_fields.config (bestehend, jsonb)

Neuer optionaler Schlüssel:

```json
{
  "placeholder": null,
  "helpText": null,
  "capacity": null,
  "showWhen": { "fieldKey": "jugend", "values": ["Eingeladen"] }
}
```

| Feld | Typ | Regel |
|------|-----|-------|
| `showWhen` | Objekt oder `null` oder fehlt | fehlt oder `null`: Feld immer sichtbar |
| `showWhen.fieldKey` | Text | Schlüssel eines Auswahlfelds desselben Camps oder `gender`; nicht der eigene Schlüssel; Auslöser hat selbst kein `showWhen` |
| `showWhen.values` | Liste von Texten | mindestens ein Eintrag; jeder Eintrag ist eine Option des Auslösers; ohne Doppelte |

Nicht erlaubt bei Schrittmarken (`field_type = 'step'`). Grundfelder haben keine Zeile und damit
nie eine Bedingung.

TypeScript (`lib/admin/types.ts`):

```ts
type FieldCondition = { fieldKey: string; values: string[] };
type FieldConfig = { placeholder; helpText; capacity?; showWhen?: FieldCondition | null };
type FieldFormValues = { ...; showWhenField: string; showWhenValues: string[] }; // "" = aus
```

## registrations.form_data (bestehend, jsonb)

Unverändert im Aufbau. Neu ist nur die Regel: Der Schlüssel eines ausgeblendeten Feldes wird beim
Speichern weggelassen bzw. entfernt. Bestehende Werte bleiben, bis die Anmeldung das nächste Mal
gespeichert wird.

## Sichtbarkeit

```text
sichtbar(feld, werte) =
  feld hat keine Bedingung
  oder werte[bedingung.fieldKey] ist ein Text, der in bedingung.values steht
```

`werte` sind Formwerte: Optionstexte, beim Geschlecht der deutsche Text.
