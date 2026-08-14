# Registration form — always render the hard identity fields

## Goal

The public registration form ([components/marketing/registration-form.tsx](../components/marketing/registration-form.tsx))
currently renders **only** the dynamic `camp_form_fields`. But the
`registrations` table has fixed columns `first_name`, `last_name`, `email`
(and `city`) — the "hard" fields — that live outside `form_data`. They must
**always** appear on the form, regardless of a camp's configured fields.

## Existing code inspected

- `supabase/migrations/0001_init_schema.sql` — `registrations` has dedicated
  columns `first_name`, `last_name`, `email`, `city`; everything else is
  `form_data jsonb`.
- `lib/admin/types.ts` — `Registration` domain type mirrors this
  (`firstName`, `lastName`, `email`, `city` + `formData`).
- `registration-form.tsx` — renders `fields` (dynamic only); has an
  empty-state branch when `fields.length === 0`.

## Decisions / assumptions

- **Core fields (always shown, in this order, all required):**
  `first_name` → "Vorname" (text), `last_name` → "Nachname" (text),
  `email` → "E-Mail" (email). These map to the DB columns later at submit time.
- **`city` is NOT added** as a hard field on the form — the user named only the
  three above, and `city` is nullable. If a camp wants to collect a city, an
  admin can add it via `camp_form_fields`. (Flag: easy to add later if wanted.)
- Core fields render **above** the dynamic fields.
- **De-duplicate:** if an admin created a `camp_form_fields` entry whose `key`
  collides with a core key (`first_name` / `last_name` / `email`), the dynamic
  duplicate is skipped so the field appears once (core wins).
- The core fields reuse the existing synthetic `CampFormField` shape (synthetic
  `id`, empty `campId`, `options: null`, `config: {}`) so the existing renderer
  and dynamic Zod validation apply unchanged.
- The empty-state branch changes meaning: the form is never truly empty now
  (core fields always present), so it renders the form even when a camp has zero
  dynamic fields. Remove the `fields.length === 0` early return.

## Files likely to change

- `components/marketing/registration-form.tsx` only:
  - add a `CORE_FIELDS: CampFormField[]` constant (German labels),
  - merge `CORE_FIELDS` + deduped dynamic `fields` into the rendered list and
    the initial-values / validation loops,
  - drop the now-unreachable empty-state early return (keep the `Notice`
    component; it's still used for the deferred-submit success state).

## Security requirements

- No change to data flow; still client-side render + validation only, submit
  still deferred. No secrets, no network call.

## Acceptance criteria

- Vorname, Nachname, E-Mail always render (required, validated) on an open
  camp's form, before any dynamic fields.
- A camp with zero `camp_form_fields` still shows the three core fields as a
  working form.
- A dynamic field whose key equals a core key renders once (no duplicate).
- E-Mail validates as an email; empty required core fields show "Pflichtfeld".

## Checks to run

- `npm run lint`
- `npm run build`

## Manual test steps

1. `npm run dev`, current camp `registration_open = true`.
2. Open `/` → the form shows Vorname / Nachname / E-Mail first, then the
   configured fields.
3. Submit empty → German required errors on all three; bad email → email error.
4. Temporarily remove all `camp_form_fields` for the camp → the three core
   fields still render as a usable form.
