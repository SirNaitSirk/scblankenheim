# Prompt: Camp-field columns (visibility, sort, filter) in the registrations table

## Goal

Extend the registrations table so the **current camp's form fields** (the dynamic
`camp_form_fields`, stored per registration in `formData`) become first-class
columns — on equal footing with the built-in columns for the three existing
features:

1. **Visibility + order** — each camp field appears in the "Spalten" dialog and can
   be shown/hidden and reordered, persisted per user (localStorage) exactly like
   the core columns.
2. **Sort** — camp-field columns are sortable, **type-aware**: `number` sorts
   numerically, `checkbox` by false→true, everything else alphabetically (`de`
   locale). Core columns keep their current sortability (name, Angemeldet, Betrag).
3. **Filter** — the custom-filter dropdown gains every camp field alongside
   Name/Kontakt/ID; matching is a case-insensitive substring on the displayed value.

Decided with the user:
- **Camp-field columns are hidden by default** — the table looks unchanged after
  this ships; admins opt each field in via "Spalten". Newly added camp fields also
  arrive hidden.
- **Type-aware** sort/filter (see above).

## Existing code inspected

- `components/admin/registration-columns.ts` — currently a **static** column
  registry (`REGISTRATION_COLUMNS`, `DEFAULT_COLUMN_ORDER`, `COLUMN_BY_KEY`,
  `ALWAYS_VISIBLE_KEYS`) and `ColumnKey` union.
- `hooks/use-column-settings.ts` — persistence keyed by Clerk user id; `VALID_KEYS`,
  default order and always-visible set are imported statically from the registry.
- `components/admin/column-settings-dialog.tsx` — reads `COLUMN_BY_KEY` to render
  labels; switches + up/down reorder.
- `components/admin/registrations-table.tsx` — renders headers/cells from
  `columns: ColumnKey[]` via a `Cell` switch on the core keys; `SortKey` union;
  inline payment `<Select>`.
- `components/admin/registrations-manager.tsx` — owns sort state (`sortKey`/`sortDir`),
  the `filtered` memo (filter + sort comparator), `toCsv`/`csvValue`, `matchesCustom`,
  custom-filter state; already receives `formFields: CampFormField[]`.
- `components/admin/registrations-filters.tsx` — `customFieldOptions` is a **static**
  const (name/email/id); `CustomField = "name" | "email" | "id"`.
- `components/admin/registration-form-dialog.tsx` — `CORE_KEYS = new Set(["first_name","last_name","email"])` + `dynamicFields()` (the exclusion of core-identity fields we must mirror).
- `lib/admin/field-types.ts` — `FieldType` union (`text|textarea|email|tel|number|date|select|checkbox`).
- `lib/admin/types.ts` — `Registration.formData: Record<string, unknown>`, `CampFormField`.

## Design / decisions

### Column model becomes dynamic

Rework `registration-columns.ts` from a static list into a builder:

- `type ColumnKind = "core" | "field"`.
- `type ColumnDef = { key: string; label: string; sortable: boolean; kind: ColumnKind; field?: CampFormField }`.
- **Core columns** keep their existing keys (`name`, `contact`, `id`, `registeredAt`,
  `amount`, `payment`, `status`) and today's sortability (`name`, `registeredAt`,
  `amount` = sortable; the rest = not). `name` stays `alwaysVisible`.
- **Field columns**: one per dynamic camp field, key = `` `field:${field.key}` ``
  (the `field:` prefix guarantees no collision with a core key or another field —
  field keys are unique per camp). `label = field.label`, `sortable = true`,
  `kind = "field"`, `field` carried on the def.
- Export `CORE_FIELD_KEYS = new Set(["first_name","last_name","email"])` and use it to
  exclude core-identity fields (mirroring `dynamicFields` in the form dialog). Update
  `registration-form-dialog.tsx` to import this set from here instead of its private
  copy (single source of truth — no behavior change).
- `export function buildColumns(formFields: CampFormField[]): ColumnDef[]` → core
  columns in their fixed order, then field columns in `sortOrder` order.
- Helper `formatFieldValue(field: CampFormField, value: unknown): string` — the
  **single** formatter used by the cell, the CSV, sort-as-text and the filter so they
  never drift: `checkbox → value === true ? de.common.yes : de.common.no`; otherwise
  `String(value ?? "")` (empty string when absent).
- Keep a small `alwaysVisible?: boolean` on the core `name` def.

### Persistence hook takes the available columns

`useColumnSettings(userId, availableColumns)` where
`availableColumns: { key: string; alwaysVisible: boolean; defaultHidden: boolean }[]`
(the manager derives this from `buildColumns`, with `defaultHidden = kind === "field"`).

- Default order = `availableColumns` keys in order; valid keys / always-visible set /
  default-hidden set are derived from `availableColumns` (no longer static imports).
- `normalize(raw, availableColumns)`:
  - order = stored order ∩ valid, then append valid keys missing from stored order
    (in `availableColumns` order).
  - hidden = (stored hidden ∩ valid, minus always-visible) **plus** any valid key that
    was **not** present in the stored order and is `defaultHidden` (so a newly added
    camp field arrives hidden; previously-known columns keep their stored visibility).
  - Fresh user (no stored payload) → order = all keys, hidden = all `defaultHidden` keys.
- Memoize `availableColumns` in the manager (`useMemo` on `formFields`) so the hook's
  effects have a stable dependency; inside the hook derive a `signature` (keys +
  flags joined) if needed to key the hydrate effect. Preserve the SSR-safe hydrate
  pattern and the write-through-in-mutators approach (no persist effect).

### Sort

- Replace the `SortKey` union with a **column key string** for the sort state
  (`sortColumn: string`, default `"registeredAt"`; `sortDir` unchanged).
- Only `sortable` columns render a `SortHeader` and can be set as the sort column.
- Comparator in the manager, resolved via `colByKey[sortColumn]`:
  - core `name` → `${lastName} ${firstName}` `localeCompare("de")`;
    `registeredAt` → ISO string compare; `amount` → `amountDue` numeric.
  - field column → read `formData[field.key]` for both rows and compare by
    `field.fieldType`: `number` → numeric (non-numeric/empty sorts last); `checkbox`
    → boolean (false < true); `date` → ISO/string compare; else → `formatFieldValue`
    `localeCompare("de")`.
- Guard: if `sortColumn` is missing from `colByKey` or not sortable (e.g. after
  switching camps), fall back to the default sort column.

### Table

- Pass **resolved visible `ColumnDef[]`** (in order) to the table instead of
  `ColumnKey[]`. Header uses `def.sortable`/`def.label`; `onSort(def.key)`.
- `Cell` switches on `def.kind`: core keys as today; `field` → `formatFieldValue`
  in a `td` (muted text; long values truncate/wrap sensibly, consistent with the
  existing `contact` cell styling).
- Sort props become `sortColumn: string` + `onSort: (key: string) => void`.

### Filters

- `registrations-filters.tsx`: accept a `fieldOptions: SelectOption[]` prop (built by
  the manager = Name/Kontakt/ID + one option per camp field, value = the field key,
  label = field label). Broaden `CustomField`/`CustomFilter.field` to `string`.
- Manager `matchesCustom`: core `name`/`email`/`id` as today; otherwise treat the
  filter field as a camp-field key and match the needle against
  `formatFieldValue(field, formData[key])` (case-insensitive substring). Resolve the
  `CampFormField` from a `Map<string, CampFormField>` built from `formFields`.

### CSV

- `csvValue` handles field columns via `formatFieldValue`; header stays `column.label`.
  Unchanged: only **visible** columns, in current order, for the filtered/sorted rows.

### Column-settings dialog

- Receive the resolved ordered `ColumnDef[]` (or `{key,label,alwaysVisible}[]`) as a
  prop instead of importing `COLUMN_BY_KEY`. Optional polish: a subheading separating
  core columns from "Camp-Felder" (using `de.registrations.form.sectionCampFields`);
  keep as one list if it complicates reorder.

### New German copy (messages.ts)

- `de.common.yes = "Ja"`, `de.common.no = "Nein"` (checkbox display / filter matching).

## Files likely to change

- `components/admin/registration-columns.ts` — dynamic `buildColumns`, `ColumnDef`,
  `formatFieldValue`, `CORE_FIELD_KEYS`, core defs (remove the static registry exports).
- `hooks/use-column-settings.ts` — accept `availableColumns`; dynamic valid/default/
  always-visible/default-hidden.
- `components/admin/column-settings-dialog.tsx` — resolved columns via prop.
- `components/admin/registrations-table.tsx` — `ColumnDef[]`-driven; field cells;
  `sortColumn` string.
- `components/admin/registrations-manager.tsx` — build columns, wire hook, type-aware
  comparator, CSV field values, filter field options + `matchesCustom`, sort-state rename.
- `components/admin/registrations-filters.tsx` — `fieldOptions` prop; `CustomField` → string.
- `components/admin/registration-form-dialog.tsx` — import `CORE_FIELD_KEYS` from the registry.
- `lib/admin/messages.ts` — `de.common.yes` / `de.common.no`.

## Non-goals / constraints

- No DB or server changes: this is all client-side rendering over data already loaded
  (`formData` + `formFields`). No new server action, no migration.
- Keep all user-facing strings German (`messages.ts`); field labels come from the
  camp's own `camp_form_fields.label`. Code identifiers stay English.
- No `any`; keep the single-formatter rule so cell / CSV / filter / text-sort agree.
- Preserve everything already working: inline payment editing, delete-confirm,
  restore-in-dialog, row-open, empty state, toasts, per-user persistence.

## Acceptance criteria

- After shipping, the table looks identical to now (all camp-field columns hidden).
- "Spalten" lists every current-camp field; toggling one shows/hides its column and
  reordering moves it; the choice survives reload and logout→login (same browser/user).
- Adding a new camp field later makes it appear in "Spalten", hidden by default,
  without disturbing existing saved column settings.
- A shown camp-field column is sortable; a `number` field sorts numerically (2 before 10),
  a `checkbox` groups by Ja/Nein.
- The filter dropdown includes camp fields; filtering by one narrows rows by substring.
- CSV exports exactly the visible columns (incl. shown camp fields), in order.
- Switching the current camp (different field set) doesn't crash: stale field columns
  drop out, the sort falls back to default when its column no longer exists.

## Checks to run

- `npm run lint`
- `npm run build`

## Manual test steps

1. `npm run dev`, open `/admin`. Confirm the table is unchanged (no camp-field columns).
2. "Spalten" → enable a text field and a number field, reorder one above "Betrag". Reload
   → still shown/ordered. Log out/in → still shown.
3. Sort by the number field → numeric order (2 before 10, not lexicographic). Sort by a
   checkbox field → Ja/Nein grouped; toggling direction reverses.
4. Add a custom filter on a camp field, type part of a value → rows narrow.
5. Export CSV → visible camp-field columns present with correct header labels and values
   (checkbox as Ja/Nein).
6. In the camp with different fields (set another camp current), reopen the dashboard →
   no crash; the previous camp's field columns are gone from "Spalten".
