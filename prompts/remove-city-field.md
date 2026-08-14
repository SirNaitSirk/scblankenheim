# Prompt: Remove the `city` (Ort) core field entirely

## Goal

The `city` column was deleted from the `registrations` table in the database.
Saving a new registration now fails with:
`Could not find the 'city' column of 'registrations' in the schema cache`.

Remove `city` (UI label "Ort") as a hardcoded **core field** across the entire
app so registrations save again. City is no longer part of the product — it is
not moved into `form_data`. If a camp wants an "Ort" question in future, it can
be added as a dynamic `camp_form_fields` field.

## Existing code inspected

- `lib/admin/data.ts` — `mapRegistration` (row → domain, line 79) and
  `mapRegistrationInputToRow` (domain → row, line 198) both reference `city`.
- `lib/admin/types.ts` — `city` on `Registration` (19), `RegistrationFormValues`
  (41), `RegistrationInput` (55).
- `app/admin/actions.ts` — Zod schema field `city: z.string()` (49) and
  transform `city: nullify(values.city)` (82).
- `components/admin/registration-form-dialog.tsx` — `CORE_KEYS` set (29),
  initial value (98), and the "Ort" `<Field>`/`<Input>` (323–329).
- `components/admin/registrations-manager.tsx` — custom filter match (52–53),
  CSV header "Ort" + row value (68, 82), and global search haystack (142).
- `components/admin/registrations-table.tsx` — column header (131) and cell (224).
- `components/admin/registrations-filters.tsx` — `CustomField` union (15) and
  the `city` custom-field option (44).
- `lib/admin/messages.ts` — `columns.city` (89) and `form.city` (116).
- `lib/database.types.ts` — `registrations` Row (139) and Insert (159) `city`.
- `supabase/migrations/0001_init_schema.sql` — `city text` column (87).
- Marketing/public form (`components/marketing/registration-form.tsx`) is fully
  config-driven and does **not** reference a core `city` field — no change needed.

## Decisions / assumptions

- City removed entirely (confirmed by user), not moved to `form_data`.
- `CORE_KEYS` keeps `first_name`, `last_name`, `email` (drop `city`) so a camp
  admin could re-introduce an "ort" question as a dynamic field without collision.
- Add a migration to keep `supabase/migrations/` in sync with the manual DB drop,
  and update the generated `lib/database.types.ts` by hand (no live regen needed).
- Existing rows' data loss is accepted (column already dropped by the user).

## Files to change

1. `supabase/migrations/0002_drop_registrations_city.sql` (new) —
   `ALTER TABLE registrations DROP COLUMN IF EXISTS city;`
2. `lib/database.types.ts` — remove `city` from registrations Row + Insert.
3. `lib/admin/types.ts` — remove `city` from the three types.
4. `lib/admin/data.ts` — drop `city` from `mapRegistration` and
   `mapRegistrationInputToRow`.
5. `app/admin/actions.ts` — remove `city` from the Zod object and the transform.
   (`nullify` stays; still used by `priceTierId`.)
6. `components/admin/registration-form-dialog.tsx` — drop `city` from `CORE_KEYS`,
   from `initialValues`, and remove the "Ort" `<Field>` block.
7. `components/admin/registrations-manager.tsx` — remove the `city` branch in
   `matchesCustom`, the "Ort" CSV column (header + row), and `r.city` from search.
8. `components/admin/registrations-table.tsx` — remove the city `<th>` and `<td>`.
9. `components/admin/registrations-filters.tsx` — remove `"city"` from
   `CustomField` and the `city` option from `customFieldOptions`.
10. `lib/admin/messages.ts` — remove `columns.city` and `form.city` (leave other
    keys intact).

## Implementation requirements

- TypeScript stays strict; no `any`. No unrelated refactors.
- Keep column layout of the registrations table coherent after removing the
  city column (no dangling responsive `xl:table-cell` header/cell mismatch).
- Keep German UI copy consistent; just remove the now-unused "Ort" strings.
- Do not touch the public marketing form or Stripe/registration route work.

## Security requirements

- No change to auth or the service-role boundary; server actions still run behind
  `requirePermission("registrations")`.

## Acceptance criteria

- Creating and editing a registration in the admin dialog succeeds (no schema
  cache error).
- The registrations table, filters, custom filters, search, and CSV export work
  with no reference to city.
- `npm run lint` and `npm run build` pass with no unused-variable or type errors.

## Checks to run

- `npm run lint`
- `npm run build`

## Manual test steps

1. `npm run dev`.
2. Open `/admin`, click "Anmeldung hinzufügen", fill first/last name + email,
   save → succeeds, appears in the table.
3. Edit that registration, change a value, save → succeeds.
4. Add a custom filter → the "Ort" option is gone; name/email/ID still work.
5. Export CSV → no "Ort" column, file opens cleanly.
