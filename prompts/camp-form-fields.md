# Prompt — Configure camp registration fields (`camp_form_fields`)

## Goal

Make the **"Felder konfigurieren"** action on each camp card fully operational. Today
`components/admin/camps-board.tsx:181` only fires a placeholder toast
(`de.camps.pendingFields`). Replace it with a real, Clerk-guarded editor for a camp's
`camp_form_fields` — the dynamic definition that (later) drives the public registration
form and the admin table columns.

Admins can, per camp: **add · edit · delete · reorder** fields, and set each field's
**type**, **required** flag, **key**, **label**, **options** (for select), and
**placeholder + help text** (stored in `config`). A **live preview** renders the
resulting form as an attendee would see it.

**In scope:** the field-config editor on a new dedicated page + its Server Actions and
write helpers.
**Out of scope (later, separate prompts):** wiring these fields into the actual public
registration form/submission, `price_tiers`, conditional visibility logic.

## Decisions (confirmed with user)

- **Surface: a dedicated page** at `app/admin/camps/[campId]/felder/page.tsx` (German
  route segment `felder`, consistent with `/bezahlen`, `/packzettel`). The card button
  navigates there instead of opening a modal — a field list with reorder, per-field
  option editing, and a live preview outgrows a dialog.
- **Scope: full editor** — types `text, textarea, email, tel, number, date, select,
  checkbox`; required flag; select options; placeholder + help text via `config`.

## Existing code inspected

- `supabase/migrations/0001_init_schema.sql` — `camp_form_fields (id, camp_id, key,
  label, field_type default 'text', required, options jsonb, sort_order, config jsonb,
  unique(camp_id, key))`. RLS on; anon has SELECT (public form reads it). Privileged
  writes go through the service-role client (bypasses RLS). No CHECK on `field_type` —
  validate allowed types in Zod (AGENTS.md: prefer app-layer validation).
- `lib/admin/data.ts` — read layer (service-role). Already has `getCampFormFields(campId)`
  → `CampFormField[]` and `mapFormField`. New write helpers go here. `writeLog`,
  `getCurrentProfile` patterns to reuse.
- `lib/admin/types.ts` — `CampFormField` domain type exists (id, campId, key, label,
  fieldType, required, options: unknown, sortOrder, config). Add editor payload types.
- `lib/admin/guard.ts` — `requireAdmin()` (throws `AuthError`). Reuse verbatim.
- `app/admin/camps/actions.ts` — existing camp actions: the `runGuarded`, `actorLabel`,
  `fieldErrorResult` helpers and the discriminated `ActionResult` pattern to mirror.
- `components/admin/camps-board.tsx` — the "Felder konfigurieren" `<Button>` (line ~178)
  currently `onClick={() => showToast(de.camps.pendingFields)}`. Change to a Next.js
  `<Link>`/`router.push` to the new page.
- `components/ui/` — `dialog`, `input` (+ `Field`), `textarea`, `select` (native, takes
  `options: {value,label}[]`), `switch`, `button`, `card`, `badge`, `menu`. Reuse; no new
  primitive needed unless a small one clearly helps.
- `components/admin/camp-form-dialog.tsx` — reference for the controlled-form + per-field
  error pattern.
- `lib/admin/messages.ts` — `de` copy object; extend with a `de.fields.*` section. All
  visible strings German; remove/repurpose `de.camps.pendingFields` once the button no
  longer needs it (keep it only if still referenced elsewhere — it is not).
- `lib/format.ts`, `lib/cn.ts`, `lib/design-tokens.ts` — tokens/util. Tailwind token
  utilities (`bg-surface`, `border-border`, `rounded-input`, `rounded-card`, `bg-accent`,
  `text-muted-foreground`, `shadow-pop`, `bg-ink-100`) are the design authority.
- `app/admin/layout.tsx` + `AdminShell` — admin pages render inside the shell; the new
  page is a Server Component like the other `app/admin/*` pages.

## Field model & types

Define a shared constant (single source of truth, English keys):

```ts
// lib/admin/field-types.ts (or colocate in types.ts)
export const FIELD_TYPES = [
  "text", "textarea", "email", "tel", "number", "date", "select", "checkbox",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];
```

German labels for each type live in `de.fields.types` in messages.ts. Only `select`
uses `options` (a `string[]`); for all other types `options` is `null`. `config` holds
`{ placeholder?: string; helpText?: string }` — extendable later without a migration.

Editor payload types in `lib/admin/types.ts`:

```ts
export type FieldConfig = { placeholder: string | null; helpText: string | null };
export type FieldFormValues = {           // raw client values (all strings/bool)
  key: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  options: string;      // newline- or comma-separated in the UI
  placeholder: string;
  helpText: string;
};
export type FieldInput = {                // validated, row-ready
  key: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  options: string[] | null;
  config: FieldConfig;
};
```

## Files to add / change

- `lib/admin/field-types.ts` — **new**. `FIELD_TYPES` + `FieldType`.
- `lib/admin/types.ts` — **add** `FieldConfig`, `FieldFormValues`, `FieldInput`.
- `lib/admin/data.ts` — **add** write helpers (service-role):
  - `createFormField(campId, input): Promise<string>`
  - `updateFormField(id, input): Promise<void>`
  - `deleteFormField(id): Promise<void>`
  - `reorderFormFields(campId, orderedIds: string[]): Promise<void>` — persists
    `sort_order` = array index for each id (guard all ids belong to `campId`).
  - a `mapFieldInputToRow(input)` domain→snake_case helper. `getCampById(campId)` if a
    lightweight single-camp fetch is needed for the page header (else reuse `getCamps()`
    and `.find`).
- `app/admin/camps/[campId]/felder/actions.ts` — **new**. `"use server"` actions mirroring
  the camps actions structure (`runGuarded`, Zod parse, write, `writeLog`, revalidate,
  German `ActionResult`): `createFieldAction`, `updateFieldAction`, `deleteFieldAction`,
  `reorderFieldsAction`. Revalidate `/admin/camps/[campId]/felder` and `/admin/camps`
  (the card shows the field count). A `camp_form_fields` change also affects the public
  form later — `revalidatePath("/")` is cheap and future-proofs it.
- `app/admin/camps/[campId]/felder/page.tsx` — **new** Server Component. Loads the camp
  (404 via `notFound()` if missing) + `getCampFormFields(campId)`, renders `<PageBody>` +
  a new `<FieldsManager>` client component. `params` is a Promise in this Next version —
  `await params`.
- `components/admin/fields-manager.tsx` — **new** client component. Left: ordered field
  list with reorder (↑/↓ buttons; `sort_order` persisted on drop/click), edit + delete
  per row, "Feld hinzufügen". Editing/adding uses a field dialog. Right (lg+): live
  preview. Uses `useTransition` + `router.refresh()` on success; toast pattern copied from
  `camps-board.tsx`.
- `components/admin/field-form-dialog.tsx` — **new**. Modal to create/edit one field:
  label, key (auto-suggested from label, editable, validated), type `<Select>`, required
  `<Switch>`, options `<Textarea>` (shown only when type = `select`), placeholder + help
  text. Per-field German error surfacing like `camp-form-dialog.tsx`.
- `components/admin/field-preview.tsx` — **new** (or a section inside fields-manager).
  Renders each field as it would appear on the public form (label, required asterisk,
  the right control per type, placeholder, help text). Read-only/disabled inputs.
- `components/admin/camps-board.tsx` — change the "Felder konfigurieren" button to link
  to `/admin/camps/${camp.id}/felder` (Next `<Link>` styled as the ghost button, or
  `router.push`). Remove the placeholder toast usage.
- `lib/admin/messages.ts` — **add** `de.fields` (title, description, add/edit/delete,
  reorder labels, type labels, key/label/options/placeholder/help labels + placeholders,
  required, empty state, preview heading, toasts, validation errors, back-to-camps). Drop
  `de.camps.pendingFields` if now unused.

## Implementation requirements

- **Key rules:** `key` is the stable identifier used in `registrations.form_data` and is
  `unique(camp_id, key)`. Validate: non-empty, `^[a-z][a-z0-9_]*$` (lowercase snake),
  and unique within the camp (check server-side; map the Postgres unique-violation to a
  friendly German field error too). Auto-suggest from label (slugify → snake_case) on
  create, but let the admin override; **do not** silently change `key` on edit unless the
  admin edits it (changing a key orphans existing `form_data` — surface a warning in the
  edit dialog copy).
- **Type validation (Zod):** `fieldType` must be one of `FIELD_TYPES`. `options` required
  (≥1 non-empty entry) only when `fieldType === "select"`, else forced to `null`. Trim and
  drop empty option lines; dedupe. `placeholder`/`helpText` → `null` when blank.
- **Reorder:** persist `sort_order` as the array index. Do it in one action call with the
  full ordered id list; validate every id belongs to `campId` before writing. Optimistic
  UI is fine but reconcile with `router.refresh()`.
- **Server Actions are the only write path.** No service-role client, Stripe, or secret in
  any `components/*` file. Each action calls `requireAdmin()` first; unauthorized → German
  `ActionResult` error, no write.
- Keep helpers small and typed — **no `any`**. Domain↔row mapping stays in `lib/admin/data.ts`.
- Follow the Supabase gotcha: no `.eq('foreignTable.col', …)`; these are single-table
  writes/reads on `camp_form_fields`.
- Code English-only (identifiers, comments); **all visible copy German**, sourced from
  `de.fields.*`.

## UI / UX (impeccable — Operate mode; tasteskill for polish)

Incumbent tokens are the design authority — match `camps-board.tsx` exactly; do not
introduce new colors, radii, or shadows.

- **Layout:** `PageBody` → `PageHeader` (title `de.fields.title`, description, a "Zurück
  zu Camps" link/`ghost` button + "Feld hinzufügen" primary action). Below: a two-column
  grid on `lg+` (`lg:grid-cols-[1fr_360px]`, `gap-6`); single column stacked below `lg`.
  Left = field list (`Card`s or list rows), right = sticky live preview panel.
- **Field row:** compact `Card`/row — drag handle-less reorder via ↑/↓ icon buttons
  (`@phosphor-icons/react`: `ArrowUp`/`ArrowDown`, disabled at ends), label (bold), a
  `Badge` for the type (`de.fields.types[…]`), a required dot/`Badge` when required, key in
  `font-mono text-xs text-muted-foreground`, and a `Menu` (Bearbeiten/Löschen) or inline
  `PencilSimple`/`Trash` ghost buttons. Follow the exact icon + spacing idiom already in
  `camps-board.tsx`.
- **Preview panel:** heading `de.fields.previewTitle`; renders the form read-only
  (disabled inputs) using the real `components/ui` primitives so it looks identical to the
  eventual public form. Required fields show a `text-accent`/`text-danger` asterisk.
- **Empty state:** reuse `<EmptyState>` (icon e.g. `TextT`/`ListPlus`) with title +
  description + "Feld hinzufügen" — when the camp has zero fields.
- **Field dialog:** reuse `<Dialog>`; the options `<Textarea>` and its help appear only
  when `fieldType === "select"` (conditional render). Autofocus label. Show the key-change
  warning copy in the edit variant.
- **States:** loading via existing `app/admin/loading.tsx` route convention; per-action
  toast (success/error) copied from `camps-board.tsx`; disable buttons during
  `useTransition` pending. Dark mode: rely solely on tokens (they already invert) — verify
  in both themes.
- **Responsive:** preview drops below the list on small screens; list rows wrap
  gracefully; dialog is the existing responsive modal.
- After the UI is built, run the impeccable mechanical detector once over the changed
  targets (see Checks) and fix findings in one batch.

## Security requirements

- Every action `requireAdmin()` first; no session/profile → return German error, perform
  no write. Do not leak internal errors (log server-side, return generic German message),
  matching `runGuarded` in the camps actions.
- Zod-validate + coerce all input server-side before any DB call; reject with field-level
  German messages surfaced in the dialog.
- Service-role client stays server-only (`import "server-only"` already in `data.ts`); no
  service-role/secret usage in `components/*`.
- Confirm destructive delete in the UI (a small confirm dialog or a menu-item confirm),
  since deleting a field will orphan its answers in existing `registrations.form_data`.

## Acceptance criteria

- The camp card's "Felder konfigurieren" navigates to `/admin/camps/{id}/felder`.
- Adding a field inserts a `camp_form_fields` row (correct `field_type`, `required`,
  `options`, `config`, `sort_order` appended last) and it appears without manual reload.
- Editing updates the row; the preview and list reflect changes after the action.
- Reordering persists `sort_order` and survives a reload in the new order.
- Deleting removes the row after confirmation.
- Duplicate/invalid `key` is rejected with a German field error (both the app check and a
  DB unique violation map to friendly copy). Non-select fields never store options.
- The field count on the `/admin/camps` card updates after add/delete.
- Unauthorized invocation performs no write and returns a German error.
- All visible copy German; identifiers/comments English. Dark + light modes both correct.
- `npm run lint` clean; `npm run build` succeeds.

## Checks to run

- `npm run lint`
- `npm run build`
- `node .agents/skills/impeccable/scripts/detect.mjs --json components/admin/fields-manager.tsx components/admin/field-form-dialog.tsx components/admin/field-preview.tsx app/admin/camps/[campId]/felder/page.tsx`
  (run once, after the UI is finished; fix findings in one batch)

## Manual test steps

1. `npm run dev`, sign in, open `/admin/camps`, click **Felder konfigurieren** on a camp
   → lands on `/admin/camps/{id}/felder`.
2. **Feld hinzufügen** → label "Vorname", key auto-suggests `vorname`, type `text`,
   required on → save. Row appears; preview shows a required "Vorname" text input.
3. Add a `select` field "T-Shirt-Größe" with options `S, M, L, XL` (one per line) → save
   → preview renders a disabled select with those options.
4. Try a duplicate key and an invalid key (`Vorname`, `1abc`) → German field errors, no
   insert.
5. Reorder fields with ↑/↓ → reload the page → order persists.
6. Edit a field's label/required → save → list + preview update; verify the key-change
   warning shows when editing the key.
7. Delete a field → confirm → row disappears; check `/admin/camps` card field count
   dropped.
8. Verify in Supabase: `select key, field_type, required, options, config, sort_order
   from camp_form_fields where camp_id = '{id}' order by sort_order;`.
9. Toggle dark mode (admin theme) → the page, list, dialog, and preview all render
   correctly on tokens.
10. Confirm no service-role/secret usage in client code: search `components/` for
    `getServiceClient`/`SUPABASE_ROLE_KEY` → none.
