# Data Model: Multi Step Registration Form

No migration. No new table. No change to generated DB types.

## `camp_form_fields` (existing) · new value for `field_type`

| Column | Question row (unchanged) | Step break row (new) |
|--------|--------------------------|----------------------|
| `field_type` | `text`, `textarea`, `email`, `tel`, `number`, `date`, `select`, `checkbox` | `step` |
| `label` | question label | step title, required, max 60 characters |
| `key` | admin defined slug | generated `schritt_<slug>`, unique per camp, never shown |
| `required` | admin choice | always `false` |
| `options` | list for `select`, else `null` | always `null` |
| `config.helpText` | help text | optional step subtitle, max 140 characters |
| `config.placeholder`, `config.capacity` | as today | always `null` |
| `sort_order` | position | position; defines where the step starts |

Validation lives in the field editor server action (Zod), not in the database.

## Derived (not stored)

```ts
// lib/register/steps.ts
type FormStep = {
  id: string;          // "core" or the step break row id or "auto-<n>"
  title: string;       // German, from row label or messages
  subtitle: string | null;
  fields: CampFormField[]; // questions only, never a step break
};
```

Rules of `buildSteps(dynamicFields)`:
1. `steps[0]` is `core` with `CORE_FIELDS`.
2. With at least one step break: questions before the first break go to a step titled
   `Weitere Angaben`; each break starts a new step; steps with zero questions are dropped.
3. Without step breaks: questions are chunked by `AUTO_STEP_SIZE` (4).

## Client state of the public form

| State | Type | Meaning |
|-------|------|---------|
| `values` | `Record<string, FieldValue>` | all answers, kept across steps (unchanged) |
| `errors` | `Record<string, string>` | per field messages (unchanged) |
| `stepIndex` | `number` | `0..steps.length`; `steps.length` is the review |
| `direction` | `1 \| -1` | animation direction of the last move |
| `returnToReview` | `boolean` | editing from the review |
| `submitting`, `serverError`, `reference` | as today | unchanged |

Transitions: `next` (validate current step, then `stepIndex + 1` or review when `returnToReview`),
`back` (`stepIndex - 1`, clears `returnToReview`), `edit(i)` (from review, sets `returnToReview`),
`submit` (validate all; on failure go to first invalid step), `serverFieldErrors` (go to lowest step
holding an error key), `reset` (after success, back to step 0, empty values, invitation kept).
