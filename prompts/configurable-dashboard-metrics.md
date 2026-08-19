# Configurable dashboard metric cards (per-admin)

## Goal

Let **every admin choose which metric cards** appear in the top row of the
dashboard, in which order — a per-user preference. The catalog covers both
**built-in** figures (registrations, paid, open, revenue, outstanding, capacity)
and **dynamic form-field** figures derived from the current camp's
`camp_form_fields` answers (e.g. "how many chose Anreise = Bus", or how many
checked a boolean field). The row is **flexible: 1–6 cards**. An **"Anpassen"**
button on the dashboard opens a dialog to pick and reorder the cards.

## Decisions / assumptions

- **Storage:** per-admin, on the caller's own `profiles` row. Add a
  `dashboard_metrics jsonb not null default '[]'` column. Array order = display
  order. Empty array ⇒ fall back to the current 4 built-in defaults
  (`registrations` hero, `paid`, `open`, `revenue`) so nothing breaks for
  existing users.
- **Metric descriptor** (stored + passed around), a discriminated union — use
  objects, not delimited strings, so arbitrary German option text is safe:
  - `{ "kind": "builtin", "key": "registrations" | "paid" | "open" | "revenue" | "outstanding" | "capacity" }`
  - `{ "kind": "fieldOption", "field": "<camp_form_fields.key>", "value": "<option>" }`
  - `{ "kind": "fieldChecked", "field": "<camp_form_fields.key>" }`
- **Catalog is built server-side** from the current camp's form fields: one
  `fieldOption` entry per option of each `select` field, one `fieldChecked`
  entry per `checkbox` field, plus the six built-ins. The catalog is the source
  of truth for labels and for validating a saved selection (unknown/stale
  references are silently dropped on read and rejected on write).
- **Authorization:** any signed-in admin may edit **their own** preference —
  guard with `requireAdmin()` (self-service), not `requirePermission()`. No new
  permission key; the dashboard itself is already ungated.
- **Field metrics count active (non-deleted) registrations** of the current
  camp only, matching `getFinanceSummary`'s scoping. Checkbox true = strict
  `=== true`; select option match = `String(formData[field]) === value`.
- Max 6 cards, min 0 (0 ⇒ defaults). Cap/validation enforced on the server.

## Existing code inspected

- `app/admin/page.tsx` — renders four hardcoded `StatCard`s from `finance` /
  `camp` / `registrations`. This is what becomes data-driven.
- `components/admin/stat-card.tsx` — presentational tile: `label`, `value`
  (pre-formatted string), optional `delta`, `tone`, `hero`. Reused as-is.
- `lib/admin/data.ts` — `getRegistrations()` (returns `formData`),
  `getFinanceSummary()`, `getCurrentProfile()` (maps a `profiles` row via
  `mapAdminUser`), `getCurrentCamp()`, `getCampFormFields()`. Service-role,
  wrapped in `retryTransient`.
- `lib/admin/types.ts` — `AdminUser`, `FinanceSummary`, `CampFormField`,
  `Registration.formData`, `ActionResult`.
- `lib/admin/field-types.ts` — `isChoiceType` (`select`), field type keys.
- `lib/admin/guard.ts` — `requireAdmin`, `AuthError`.
- `app/admin/actions.ts` — Server Action patterns: `"use server"`, Zod parse,
  guard, `revalidatePath`, `ActionResult` return, `AuthError → German toast`.
- `components/admin/field-form-dialog.tsx` — client `Dialog` + `Switch` +
  action-calling pattern to mirror for the new dialog.
- `lib/admin/messages.ts` — `de.dashboard.stats.*` (built-in labels live here).
- `supabase/migrations/0001_init_schema.sql` — `profiles` table shape.
- `lib/database.types.ts` — generated `profiles` Row/Insert/Update.

## Files likely to change / add

**New**
- `supabase/migrations/0004_add_profiles_dashboard_metrics.sql` — add the column.
- `lib/admin/dashboard-metrics.ts` — descriptor types, the `DashboardMetric`
  Zod schema, `buildMetricCatalog(fields)` (catalog entries with stable ids +
  German labels + value formatter kind), `resolveMetric(descriptor, ctx)` →
  `{ label, value, delta?, tone?, hero? }`, `DEFAULT_METRICS`, and a
  `sanitizeSelection(descriptors, catalog)` helper (drop unknown, cap at 6).
- `components/admin/dashboard-metrics-dialog.tsx` — client dialog: "Anpassen"
  trigger, checkbox list grouped (built-in / per form field) to toggle metrics,
  up/down reorder controls (or reuse the fields drag pattern — up/down is
  sufficient), live "max 6" guard, Save calling the action.
- `app/admin/dashboard-actions.ts` (or extend `app/admin/actions.ts`) —
  `updateDashboardMetrics(descriptors)` Server Action.

**Edit**
- `lib/admin/types.ts` — add `DashboardMetric` union + `DashboardMetricCatalogEntry`;
  add `dashboardMetrics: DashboardMetric[]` to `AdminUser`.
- `lib/admin/data.ts` — `mapAdminUser` reads `dashboard_metrics`; add
  `updateProfileDashboardMetrics(userId, descriptors)` writer.
- `lib/database.types.ts` — add `dashboard_metrics` to `profiles` Row/Insert/Update.
- `app/admin/page.tsx` — build catalog + resolve the profile's selection (or
  defaults) into a rendered, reflowing grid; render the "Anpassen" dialog with
  catalog + current selection.
- `lib/admin/messages.ts` — dialog copy (`de.dashboard.customize.*`): title,
  description, "Anpassen", group headings, save/cancel, "max. 6 Kacheln",
  empty-hint, plus built-in metric labels (`outstanding`, `capacity`).
- `components/admin/stat-card.tsx` — only if needed to accept a value already
  formatted (it already does); no change expected.

## Implementation requirements

1. **Migration**: `alter table public.profiles add column dashboard_metrics
   jsonb not null default '[]'::jsonb;` Keep it additive; no backfill needed
   (empty ⇒ defaults in app). Regenerate/patch `lib/database.types.ts` to match.
2. **Catalog** (`buildMetricCatalog`): stable string `id` per entry for the
   dialog's list/reorder keys (e.g. `builtin:paid`, `field:<key>:opt:<value>`,
   `field:<key>:checked`), a German `label`, and the descriptor. Built-in labels
   come from `de.dashboard.stats` (+ new `outstanding`, `capacity`). Field labels:
   `"<field.label>: <option>"` for options, `"<field.label>"` for checkbox.
3. **Resolve** (`resolveMetric`): given a descriptor and a context
   (`{ registrations (active), finance, camp }`), return the `StatCard` props.
   - `registrations` → count active, hero, delta `"<n> von <capacity> Plätze"`.
   - `paid` → `finance.paidCount`, delta paid ratio.
   - `open` → active where `payment !== "paid"`, delta outstanding currency.
   - `revenue` → `finance.collected` currency, delta expected ratio.
   - `outstanding` → `finance.outstanding` currency.
   - `capacity` → `"<total> / <capacity>"` (or percent), delta capacity ratio.
   - `fieldOption` / `fieldChecked` → count over `active` registrations'
     `formData`; delta = share of total (`formatPercent`). Use existing
     `formatNumber` / `formatCurrency` / `formatPercent`.
   - The **first** rendered card keeps `hero`; others don't. Decide hero by
     position (index 0), not by metric kind, so any metric can lead.
4. **Server Action** `updateDashboardMetrics`:
   - `"use server"`, `requireAdmin()` (self-service), Zod-validate the array
     against the `DashboardMetric` union, `sanitizeSelection` against the
     current camp's catalog (drop unknown field refs), cap at 6.
   - `await updateProfileDashboardMetrics(userId, sanitized)`;
     `revalidatePath("/admin")`; return `ActionResult`.
   - Map `AuthError` to the standard German error toast copy.
5. **Dashboard page**: fetch profile (already does), build catalog from
   `formFields` (already fetched), resolve `profile.dashboardMetrics.length
   ? profile.dashboardMetrics : DEFAULT_METRICS`. Grid reflows by count
   (`grid-cols-2 lg:grid-cols-3` or a count-aware class) so 1–6 look right.
6. **Dialog UX** (German, see section below).

## Security requirements

- Preference write goes through a Server Action guarded by `requireAdmin()`;
  the browser never writes `profiles`. Service-role write scoped strictly to the
  **caller's own** `userId` (from `auth()`), never an id from the client payload.
- Zod-validate/sanitize before persisting; ignore unknown metric kinds and stale
  field references. No secrets client-side. No new RLS assumptions — server is
  the gate.

## UI / design (German, dialog)

- **Trigger**: a small secondary/ghost `Button` labelled **"Anpassen"** aligned
  to the right, above or beside the cards row (reuse existing header/toolbar
  spacing; don't disturb the `PageHeader`).
- **Dialog**: title **"Kacheln anpassen"**, short description
  (**"Wähle bis zu 6 Kennzahlen und ihre Reihenfolge."**). Body: selected list
  on top (with ↑/↓ reorder + remove), available metrics below grouped by
  **"Kennzahlen"** (built-in) and one group per form field
  (e.g. **"Anreise"**). Disable adding when 6 are selected; show
  **"max. 6 Kacheln"** hint. Footer: **"Abbrechen"** / **"Speichern"**.
- Loading state on Save (disabled button), error → toast with German copy,
  success → close + toast **"Kacheln aktualisiert"**.
- Match existing dialog spacing/typography (`components/ui/dialog`, `Switch`,
  `Button`); no new primitives. Cards keep current `StatCard` styling.
- Empty selection is impossible to save as broken — saving zero reverts to
  defaults (documented in the hint).

## Acceptance criteria

- A fresh admin sees the unchanged default 4 cards.
- Selecting e.g. *Anreise: Bus*, *Bezahlt*, *Anmeldungen* and saving shows
  exactly those three, in that order, after reload — and only for that admin
  (a second admin still sees their own set).
- Reordering moves the hero (bold) treatment to whichever card is first.
- Field metrics count only active registrations of the current camp; a checkbox
  metric counts strictly-true answers.
- Unknown/stale field references (field later deleted) silently disappear from
  the row without error.
- All new UI copy is German; all identifiers/columns English.

## Checks to run

- `npm run lint`
- `npm run build` (routes + server action + generated types touched)
- (`npm test` if/when configured)

## Manual test steps

1. `npm run dev`, open `/admin`. Confirm the default 4 cards render.
2. Ensure the current camp has a `select` field (e.g. *Anreise* with *Bus* /
   *Selbst*) and at least one `checkbox` field; add a couple registrations with
   varied answers via the registrations dialog.
3. Click **Anpassen** → add *Anreise: Bus*, the checkbox metric, *Bezahlt*;
   remove *Einnahmen*; reorder; **Speichern**. Verify the row updates and the
   Bus count matches the registrations you entered.
4. Reload — selection persists. Sign in as a second admin — they see defaults,
   not the first admin's set.
5. Delete the *Anreise* field, reload `/admin` — the Bus card vanishes cleanly,
   no error.
