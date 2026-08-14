# Prompt: Registrations — view details, edit, add, delete (config-driven)

## Goal

Let admins fully manage registrations from the dashboard:

- **Click a registration row → open an editable overlay immediately** (all fields editable at once), replacing today's three-dot-menu-only interaction. The row gets a clear hover affordance (cursor + background) so it reads as clickable.
- **Edit** every registration value: core fields (Vorname, Nachname, E-Mail, Ort), price tier, status, payment status, amount due/paid, **and the current camp's dynamic `camp_form_fields` answers** (stored in `form_data`).
- **Add** a new registration through the same overlay, built from core fields + the current camp's `camp_form_fields`.
- **Delete** (soft-delete) and **restore** — now persisted to the database, not local-only.

All writes go to Supabase via server actions using the service-role client, guarded by the `registrations` permission, mirroring the camp-fields actions pattern.

## Existing code inspected

- `components/admin/registrations-manager.tsx` — client container; `onDelete`/`onRestore`/`onCopyEmail` currently mutate **local state only** (no persistence). Owns filters, sort, CSV export, toast.
- `components/admin/registrations-table.tsx` — table; row actions live in a `Menu` (`components/ui/menu.tsx`) in the last cell. Row `key`/id is `row.id` which maps to `registrations.reference` (see below).
- `app/admin/page.tsx` — dashboard Server Component. Loads `getRegistrations()`, `getPriceTiers()`, `getCurrentCamp()`, `getCurrentProfile()`. Computes `canWriteRegistrations = canUseSection(profile, "registrations")`. **Does not currently load the camp's form fields.**
- `lib/admin/data.ts` — real Supabase data layer. `mapRegistration` maps `row.reference → Registration.id`; has `getCampFormFields(campId)`, `getPriceTiers()`. Write helpers for camps/fields/users exist; **none for registrations yet**. `isUniqueViolation` helper exists.
- `lib/admin/types.ts` — `Registration` (id = reference, plus `formData: Record<string, unknown>`), `PriceTier`, `CampFormField`, `ActionResult`, `RegistrationStatus`, `PaymentStatus`.
- `app/admin/camps/[campId]/felder/actions.ts` — the server-action pattern to mirror: `"use server"`, Zod schema → domain input, `runGuarded` wrapper around `requirePermission`, `writeLog`, `revalidatePath`, `fieldErrorResult`, unique-violation mapping.
- `components/marketing/registration-form.tsx` — config-driven field renderer + per-field Zod (`CORE_FIELDS` = first_name/last_name/email as synthetic `CampFormField`s; `inputTypeFor`, `readOptions`, checkbox/select/textarea handling). Reuse this **rendering logic** for the overlay's dynamic fields.
- `components/admin/user-form-dialog.tsx` + `components/admin/fields-manager.tsx` — dialog + `useTransition` + `router.refresh()` + toast wiring to mirror.
- `components/ui/dialog.tsx` — modal (portal, focus trap, footer slot).
- `lib/admin/messages.ts` — `de.registrations`, `de.common`, `REGISTRATION_STATUS_LABELS`, `PAYMENT_STATUS_LABELS`, `PERMISSION_LABELS`.
- `supabase/migrations/0001_init_schema.sql` — `registrations`: `id uuid pk`, `reference text not null unique`, `camp_id`, `price_tier_id`, core cols, `form_data jsonb`, `status`/`payment_status` text (no CHECK constraint — validate in Zod), `amount_due`/`amount_paid int`, `deleted bool`, `registered_at`. `lib/database.types.ts` matches.

## Decisions / assumptions

- **Row click opens the editable form directly** (confirmed with user) — no read-only step. All fields editable in one overlay; footer has **Löschen** (edit mode) and **Speichern**.
- **Writes are persisted to the DB** (confirmed). Delete = soft-delete (`deleted = true`); restore = `deleted = false`.
- **Row identity for writes = `reference`** (it's `not null unique`). Server actions filter with `.eq("reference", ref)`. No schema/type change needed. New registrations get a generated unique reference.
- **New-registration reference**: generate server-side, e.g. `REG-` + 8 uppercase base36 chars from `crypto.randomUUID()`; retry-safe via the unique constraint (map `isUniqueViolation` to a friendly retry error). `camp_id` = current camp.
- **Editable value set**: `first_name`, `last_name`, `email`, `city`, `price_tier_id`, `status`, `payment_status`, `amount_due`, `amount_paid`, and every current-camp `camp_form_fields` answer (→ `form_data`). `registered_at` stays server-controlled (`now()` on create); not user-editable.
- **`amount_due` default on Add**: prefill from the selected price tier's `price` (editable). If no tier selected, default 0.
- **Core fields** (first_name/last_name/email/city) come from dedicated columns; the dynamic `camp_form_fields` are stored in `form_data` keyed by field `key`. City stays a core column (it already is) — camp fields whose key collides with a core key are skipped in the dynamic section (reuse the `CORE_KEYS` dedupe idea).
- The existing three-dot `Menu` is **kept** for quick actions but its trigger must `stopPropagation` so it doesn't also open the overlay. Keep "E-Mail kopieren"; move destructive delete/restore into the menu too (still available) — the overlay is the primary path.
- Reuse `de` messages; add new German copy under `de.registrations.form` / `de.registrations.detail` and any missing `de.common` keys. No hardcoded German in components.

## Files likely to change / add

**New**
- `app/admin/actions.ts` — `"use server"` registrations actions: `createRegistrationAction(values)`, `updateRegistrationAction(reference, values)`, `setRegistrationDeletedAction(reference, deleted)`. Same `runGuarded` + `requirePermission("registrations")` + Zod + `writeLog` + `revalidatePath("/admin")` (and `/admin/finanzen`) pattern as the fields actions.
- `components/admin/registration-form-dialog.tsx` — the editable overlay. Props: `open`, `mode` ("create" | "edit"), `registration | null`, `formFields: CampFormField[]`, `priceTiers`, `onClose`, `onSubmit(values) → Promise<ActionResult>`, `onSuccess`, `onDelete?`. Renders core fields + status/payment/tier/amount selects + dynamic camp fields (reuse the marketing renderer logic). Client-side Zod validation surfacing `fieldErrors`.
- `lib/admin/registration-form.ts` (optional) — shared `RegistrationFormValues`/`RegistrationInput` types + the value↔row mapping + reference generator, to keep the action thin. If small, fold into `types.ts` + `data.ts` instead of a new file.

**Changed**
- `lib/admin/types.ts` — add `RegistrationFormValues` (raw strings/bools from the dialog) and `RegistrationInput` (validated, row-ready) types.
- `lib/admin/data.ts` — add `createRegistration(campId, input)`, `updateRegistration(reference, input)`, `setRegistrationDeleted(reference, deleted)`; `mapRegistrationInputToRow` helper; reference generator. Service-role client only.
- `lib/admin/messages.ts` — add `de.registrations.form` (title/add/edit/save/saving/cancel/delete/close, field labels for status/payment/tier/amountDue/amountPaid, validation copy) and `de.registrations.detail` if needed; any missing `de.common` keys.
- `app/admin/page.tsx` — also load `getCampFormFields(camp.id)`; pass `formFields` + `campId` to `RegistrationsManager`.
- `components/admin/registrations-manager.tsx` — accept `formFields`, `campId`; add dialog state (`{ mode, registration } | null`); wire `onSubmit`/`onDelete`/`onRestore` to the new server actions via `useTransition` + `router.refresh()` (drop the local-only state mutation, or keep an optimistic layer that reconciles on refresh); add an "Anmeldung hinzufügen" button in the toolbar next to Export.
- `components/admin/registrations-table.tsx` — make the whole row clickable (`onRowClick(registration)`), add `cursor-pointer` + stronger hover; keep keyboard access (row `tabIndex`/Enter, or a visually-covering button) with an accessible label; ensure the `Menu` cell and its trigger `stopPropagation`.

## Implementation requirements

- **Server actions** (`app/admin/actions.ts`): `"use server"`; every action runs inside a `runGuarded` that calls `requirePermission("registrations")` and maps `AuthError` → German "not allowed" and other errors → generic German error (mirror felder/actions.ts). Validate with Zod → `RegistrationInput`. On success `writeLog({ actor, action: "registration.create|update|delete|restore", message })` and `revalidatePath("/admin")` + `revalidatePath("/admin/finanzen")`.
- **Validation (Zod)**: required core rules mirror the public form (first/last name required, email required + format). Dynamic fields validated by their `camp_form_fields` required flag/type (reuse the marketing per-field schema approach). `status ∈ RegistrationStatus`, `payment_status ∈ PaymentStatus`. `amount_due`/`amount_paid`: coerce from string, non-negative integers (whole euros). Per-field errors returned via `fieldErrors`.
- **form_data**: build from dynamic field values keyed by field `key`; checkboxes → boolean, others → trimmed string; drop empty optionals. Never write core keys into `form_data`.
- **No new CHECK constraints / no migration** (schema already supports this; AGENTS §12 — validate in app layer).
- **Security**: service-role writes only in server actions; browser never holds secrets; the real gate is `requirePermission`, hidden UI is cosmetic. When `canWrite` is false, the toolbar Add button and the overlay's editing controls are not shown (read-only detail still allowed to open? — since click opens the edit form, when `!canWrite` the row click should be disabled/no-op, matching current menu gating).
- **Types**: no `any`; explicit types; small functions. English identifiers, German UI only.

## UI / UX (impeccable + tasteskill)

All UI work here is done under **impeccable (Operate mode)** and **tasteskill (anti-slop)** discipline: the incumbent admin components and design tokens are the design authority — reuse the existing component vocabulary (`Dialog`, `Field`, `Input`, `Select`, `Textarea`, `Switch`, `Badge`, `Button`) rather than inventing controls; keep motion to state-change only (150–250ms, the tokens already define it); no decorative gradients/glass/hard-offset shadows; every interactive element ships default/hover/focus/disabled/loading/error states; German UX copy names the action and, on errors, the problem + recovery. After implementation, run the impeccable detector over the changed UI files (`node .agents/skills/impeccable/scripts/detect.mjs --json <targets>`) and fix what it flags.

- **Row**: `cursor-pointer`, hover background (`hover:bg-ink-50` already present — strengthen slightly), full-row click. The three-dot menu cell stops propagation. Deleted rows keep the dimmed style.
- **Overlay**: reuse `Dialog`. Header shows name (edit) or "Neue Anmeldung" (create). Body sections: **Kontakt** (core fields), **Anmeldung** (Preistufe / Status / Zahlung / Betrag fällig / Betrag bezahlt), **Camp-Felder** (dynamic). Use existing `Field`, `Input`, `Select`, `Textarea`, `Switch`. Footer: `Löschen` (ghost/danger, edit mode only, left) + `Abbrechen` + `Speichern`/`Speichern…`. Selecting a price tier in create mode prefills Betrag fällig.
- **States**: inline field errors (danger border + message), a top-of-form error banner for the action-level error (mirror user-form-dialog), disabled controls while saving, success toast via the manager. Empty camp-fields section: hide the "Camp-Felder" heading if the camp has none.
- Fully responsive; dialog already scrolls. All copy German.

## Acceptance criteria

- Clicking any registration row (when `canWrite`) opens the editable overlay for that registration; the row visibly reads as clickable.
- Editing any core field, tier, status, payment, amount, or camp field and saving **persists to Supabase** and the table reflects it after refresh.
- "Anmeldung hinzufügen" opens a blank overlay built from core + current-camp `camp_form_fields`; saving inserts a row with a unique `reference`, `camp_id` = current camp, and correct `form_data`.
- Delete soft-deletes (persisted); with "Gelöschte anzeigen" on, restore un-deletes (persisted).
- Validation errors surface per field in German; the three-dot menu still works and does not double-trigger the overlay.
- Non-permitted admins cannot add/edit/delete (server rejects even if UI is bypassed).
- CSV export, filters, and sort continue to work unchanged.

## Checks to run

- `npm run lint`
- `npm run build` (routes + server actions changed)

## Manual test steps

1. `npm run dev`, sign in as a superadmin (or an admin with the `registrations` permission).
2. Dashboard → click a registration row → overlay opens in edit mode. Change Vorname + a camp field + set Status = Bestätigt, Zahlung = Bezahlt, adjust amounts → **Speichern**. Confirm the toast, and that values persist after a full page reload.
3. Click **Anmeldung hinzufügen** → fill core + camp fields, pick a price tier (Betrag prefills) → **Speichern**. Confirm the new row appears with a reference and survives reload.
4. Open a row → **Löschen** → row shows as deleted; enable "Gelöschte anzeigen" → open it → **Wiederherstellen** → confirm persisted.
5. Try to submit with an empty required field / bad email → per-field German errors; nothing is written.
6. Open the three-dot menu on a row → "E-Mail kopieren" works and does **not** open the overlay.
7. Sign in as an admin **without** the `registrations` permission → no Add button, row click does not open an editor; confirm a direct action call is rejected (server guard).
