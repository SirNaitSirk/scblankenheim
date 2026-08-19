# Room-capacity counter — show remaining seats on the registration form

## Goal

Let admins mark **one option of a `select` field** as capacity-limited (with a
numeric limit), then show visitors on the public registration form how many of
those seats are still free — and **hard-block** overselling on the server.

Example: the `accommodation` field has options `zimmer` / `zelt`. An admin marks
`zimmer` as limited to `60`. The public form shows *"Noch 8 Zimmerplätze frei"*
and, once full, disables the `zimmer` option ("ausgebucht"). The `register`
service rejects a `zimmer` submission when the 60 spots are gone.

Decisions locked with the user:

- **Config-driven (option A):** the limited option + its limit are stored per
  field in `camp_form_fields.config`, admin-editable — not hardcoded. Any camp,
  any `select` field, any option can be the limited one.
- **Count = all non-deleted registrations** holding the limited option, paid or
  not (matches the tolerant "registered-but-unpaid still holds a spot" rule).
  `deleted = true` rows do not count.

Out of scope: houses/rooms tables (dropped in AGENTS.md §4), multiple limited
options per field (one per field is enough), live polling/websocket refresh of
the counter (SSR value at page load + server-side enforcement is sufficient).

## Existing code inspected

- Schema: [supabase/migrations/0001_init_schema.sql](../supabase/migrations/0001_init_schema.sql)
  — `camp_form_fields.config jsonb` is the per-field "extras as data" escape
  hatch (already carries `placeholder`, `helpText`). `registrations.form_data
  jsonb` holds dynamic answers keyed by field `key`; `registrations.deleted`
  boolean is the soft-delete flag. `camps.room_capacity` exists but stays a
  loose informational number — **we do not wire it to this feature** (the limit
  lives in the field config so it travels with the field).
- Admin field editor: [components/admin/field-form-dialog.tsx](../components/admin/field-form-dialog.tsx)
  — client dialog; `FieldFormValues` in/out. Config keys read via
  `readConfigString`. Options for `select` are one-per-line in a textarea.
- Field save action + Zod: [app/admin/camps/[campId]/felder/actions.ts](../app/admin/camps/[campId]/felder/actions.ts)
  — `fieldSchema` `.superRefine().transform()` builds `config: { placeholder,
  helpText }`. `parseOptions()` turns the textarea into a deduped string list.
  `revalidateFields()` already revalidates `/` (the public form).
- Public read layer: [lib/marketing/current-camp.ts](../lib/marketing/current-camp.ts)
  — `getLandingCamp()` uses the **anon** client (no `registrations` read).
  `mapFormField` maps the full `config`, so `config.capacity` reaches the client.
- Public section (Server Component): [components/marketing/registration-section.tsx](../components/marketing/registration-section.tsx)
  — renders `<RegistrationForm fields={camp.fields} />`.
- Public form (Client Component): [components/marketing/registration-form.tsx](../components/marketing/registration-form.tsx)
  — renders each field; `select` via the `Select` primitive; posts to
  `/api/register`. Reads `data.fieldErrors` on any non-ok response.
- Register service (server gate): [lib/register/service.ts](../lib/register/service.ts)
  — `submitRegistration()` re-loads camp + fields, validates, splits values into
  core columns vs `form_data`, inserts. `RegistrationResult` is a discriminated
  union; the route maps reasons to status codes.
- Register route: [app/api/register/route.ts](../app/api/register/route.ts).
- Select primitive: [components/ui/select.tsx](../components/ui/select.tsx)
  — native `<select>`; `SelectOption = { value, label }`. **No per-option
  disabled support yet** — must be added.
- German copy: [lib/admin/messages.ts](../lib/admin/messages.ts) (`de.fields.form`,
  `de.fields.errors`).

## Data shape (the contract)

Stored in `camp_form_fields.config.capacity`, only for `select` fields, only
when configured:

```jsonc
{
  "placeholder": "…",
  "helpText": "…",
  "capacity": { "option": "zimmer", "limit": 60 }
}
```

- `option` MUST equal one of the field's `options`.
- `limit` MUST be a positive integer (≥ 1).
- Absent `capacity` (or non-`select` field) → no limit, current behaviour.

## Decisions / assumptions

- One limited option per field. If an admin needs two, that's a future change.
- Counting reads `registrations` for the current camp with the **service-role**
  client and tallies in JS (per-camp rows are bounded ~120) — avoids brittle
  `form_data->>key` PostgREST filters (see AGENTS.md Supabase gotchas). Only
  derived integer counts are ever exposed to the browser, never rows/secrets.
- The public counter is an SSR snapshot at page load; the **register service is
  the source of truth** and re-counts on submit, so a race can't oversell.
- If `limit` is lowered below the current count, `remaining` clamps to `0` and
  the option shows "ausgebucht" (never a negative number).

## Files likely to change

**Admin — mark the limited option**
1. [lib/admin/types.ts](../lib/admin/types.ts) — add `capacityOption: string` and
   `capacityLimit: string` to `FieldFormValues`; add `capacity: { option: string;
   limit: number } | null` to `FieldInput` (or extend its `config` type).
2. [components/admin/field-form-dialog.tsx](../components/admin/field-form-dialog.tsx)
   — extend `EMPTY` and `fromField` (read `field.config.capacity`). When
   `fieldType === 'select'`, render two controls **below the options textarea**:
   a `Select` of the current parsed options (plus a "— keine Begrenzung —" empty
   choice) for `capacityOption`, and a `number` `Input` for `capacityLimit`
   (shown only when an option is chosen). Keep them out of the DOM for
   non-`select` types.
3. [app/admin/camps/[campId]/felder/actions.ts](../app/admin/camps/[campId]/felder/actions.ts)
   — extend `fieldSchema`: accept `capacityOption`, `capacityLimit`; in
   `superRefine` validate that, when `capacityOption` is set, the field is
   `select`, the option is one of `parseOptions(options)`, and `capacityLimit`
   parses to an integer ≥ 1 (else issue on `capacityLimit`); in `transform`
   write `config.capacity = { option, limit }` when set, omit otherwise.
4. [lib/admin/messages.ts](../lib/admin/messages.ts) — German labels/hints/errors
   (`capacityOption`, `capacityLimit`, "Begrenzte Option", "Max. Plätze", and
   error copy for invalid limit / option not in list).

**Public — show remaining seats**
5. [lib/marketing/current-camp.ts](../lib/marketing/current-camp.ts) OR a new
   `lib/marketing/availability.ts` (server-only) — add
   `getCampAvailability(campId, fields): Promise<Record<string, { remaining:
   number; limit: number; option: string }>>` keyed by field `key`, using the
   **service-role** client: load non-deleted `form_data` for the camp, and for
   each field whose `config.capacity` is set, count rows where
   `form_data[key] === capacity.option`, then `remaining = max(0, limit - count)`.
   (Put it in its own `server-only` module so the anon `getLandingCamp` stays
   anon.)
6. [components/marketing/registration-section.tsx](../components/marketing/registration-section.tsx)
   — after `getLandingCamp()`, when state is `open`, call `getCampAvailability`
   and pass `availability` into `<RegistrationForm>`.
7. [components/marketing/registration-form.tsx](../components/marketing/registration-form.tsx)
   — accept optional `availability` prop. In the `select` branch of `FormField`,
   when the field has `config.capacity`:
   - build the limited option's label as `"{opt} — ausgebucht"` and mark it
     `disabled` when `remaining <= 0`;
   - show a hint under the field: `remaining > 0` → *"Noch {remaining} von
     {limit} {label}n frei"* style copy (keep it natural German, e.g. "Noch 8
     Zimmerplätze frei"); `remaining <= 0` → *"{opt}: ausgebucht"*.
   - If the visitor already selected the now-full option (stale SSR), the server
     rejects on submit — the inline field error covers it.
8. [components/ui/select.tsx](../components/ui/select.tsx) — add optional
   `disabled?: boolean` to `SelectOption` and pass it to `<option disabled>`.

**Server — enforce the limit**
9. [lib/register/service.ts](../lib/register/service.ts) — add a capacity check
   after validation, before insert: for each dynamic field with `config.capacity`
   whose submitted value equals `capacity.option`, count existing non-deleted
   registrations for the camp holding that option; if `count >= limit`, return a
   new result `{ ok: false, reason: "full", fieldErrors: { [key]: message } }`
   with German copy ("Leider sind alle Plätze für diese Option belegt.").
10. [app/api/register/route.ts](../app/api/register/route.ts) — map `reason:
    "full"` to HTTP `409` with `{ error, fieldErrors }` (the client already reads
    `fieldErrors` on non-ok responses).

## Implementation requirements

- TypeScript throughout, explicit types, no `any`. Read `config.capacity`
  defensively (it's `Record<string, unknown>`), mirroring `asRecord`/`readString`.
- Reuse the existing count style already in the service (`select('id', { count:
  'exact', head: true })`) where a single-option count suffices; use the
  fetch-and-tally-in-JS approach for the public availability of many fields.
- Keep the limited-option-full copy consistent between the inline form hint and
  the server error.
- No schema migration required — `config` is already `jsonb`. Do **not** add a
  CHECK constraint (AGENTS.md: validate in the app/Zod layer).

## Security requirements

- Counting uses the **service-role** client only inside server-only modules /
  the service layer; the browser receives only integer counts. Never expose
  `registrations` rows or any secret. The anon `getLandingCamp` path is unchanged.
- The register service remains the authoritative gate — the client hint is
  advisory and never trusted.

## Language conventions

- All new user-facing strings are **German**, centralised in `messages.ts` (admin
  editor) / the form's `copy` object (public). Code identifiers stay **English**
  (`capacityOption`, `getCampAvailability`, `remaining`). No mixing.

## Acceptance criteria

- An admin editing a `select` field can pick a limited option + limit; saving
  writes `config.capacity`; reopening shows the saved values. Non-`select` fields
  never show the controls.
- Invalid input (limit `0`/blank/non-number while an option is chosen, or option
  not in the list) shows an inline German error and does not save.
- The public form shows the remaining count for the limited option; when the
  count reaches the limit the option is disabled and labelled "ausgebucht".
- Submitting the limited option when full is rejected with a German field error;
  submitting the unlimited option (`zelt`) always works.
- A field with no `capacity` config behaves exactly as today.

## Checks to run

- `npm run lint`
- `npm run build` (route handler + server component + types touched)

## Manual test steps

1. `npm run dev`. Ensure seed data is loaded (current camp = Sommercamp 2026,
   `accommodation` field present).
2. Admin → Camps → Sommercamp 2026 → Felder → edit **Unterkunft**. Set limited
   option `zimmer`, limit `2`. Save; reopen to confirm it persisted.
3. Landing page `#anmelden`: the Unterkunft field shows *"Noch N Zimmerplätze
   frei"* (seed already has several `zimmer` rows — expect it near/at the limit).
4. Lower the limit to below the current `zimmer` count → the option shows
   "ausgebucht" and is disabled; submitting `zimmer` (via a stale form) returns a
   German field error; submitting `zelt` succeeds.
5. Register with `zimmer` while a spot remains → succeeds and the counter drops
   by one on reload.
6. Remove the limited option in the editor → the counter/disabled state
   disappears; both options submit freely.
