# Contract: Step Break in the Field Editor

Page: `/admin/camps/[campId]/felder` (`components/admin/fields-manager.tsx`).

## Adding

A second header button `Schrittwechsel` (icon `Rows`) next to `Feld hinzufügen` opens
`FieldFormDialog` preset to type `step`. The type select of a question does not offer `step`, so a question is never converted into a step break.

For type `step` the dialog shows only:
- `Titel` (required, max 60)
- `Untertitel` (optional, max 140)

Hidden for `step`: key, required switch, placeholder, help text, options, capacity.

## Server action (existing create and update actions)

`fieldSchema` accepts `fieldType: "step"`. For `step` it:
- requires `label`, skips the key checks and generates `schritt_<slugify(label)>` with a numeric
  suffix when the key exists in the camp (`isUniqueViolation` retry, max 5 attempts);
- on update keeps the stored key;
- forces `required = false`, `options = null`, `config = { placeholder: null, helpText, capacity: null }`.

Permissions and logging are unchanged (same `requirePermission` and `writeLog` as fields).

## List rendering

A step break row is visually distinct: full width divider style card with a `Schritt` badge, the
title in semibold and the subtitle muted; no key line, no required badge. Drag, up, down, edit and
delete behave like questions.

## Preview

`FieldPreview` groups the questions with `buildSteps` and renders each step with its title as a
small heading. A step with more than `LONG_STEP_HINT` (6) questions shows the muted hint
`Langer Schritt: Überleg, ihn zu teilen.`
