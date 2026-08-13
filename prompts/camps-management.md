# Prompt — Camps management (create · edit · delete · set current)

## Goal

Make the admin **Camps** section fully operational: admins can **create**, **edit**,
**delete** camps and **set the current camp** (the one shown on the landing page and
dashboard). Today reads are real Supabase; every write in `components/admin/camps-board.tsx`
is mocked (a "Diese Aktion folgt mit der Datenanbindung." toast, and `setCurrent` mutates
only local React state). Replace those mocks with real, Clerk-guarded **Server Actions**
that write via the service-role Supabase client and revalidate the affected pages.

**In scope:** camp CRUD + set-current.
**Out of scope (later, separate prompts):** `camp_form_fields` configuration and
`price_tiers`. The "Felder konfigurieren" button stays mocked for now.

## Existing code inspected

- `supabase/migrations/0001_init_schema.sql` — `camps` and `camp_settings` (singleton
  row keyed `id = true`, holds `current_camp_id`). Money is integer whole euros. RLS on;
  service-role bypasses it — authorization is our job.
- `lib/admin/data.ts` — real read layer (service-role client). `mapCamp`, `getCamps`,
  `getCurrentCampId` (reads `camp_settings.current_camp_id`), `getCurrentProfile`
  (Clerk `auth()` → `profiles` + `user_roles`). New write functions go here alongside reads.
- `lib/supabase/server.ts` — `getServiceClient()` (server-only, `SUPABASE_ROLE_KEY`).
- `lib/admin/types.ts` — `Camp` domain type (camelCase; strings for dates).
- `lib/admin/messages.ts` — `de` copy object; `de.camps.*`, `de.common.*` already exist.
  All user-facing German lives here — no hardcoded strings in components.
- `components/admin/camps-board.tsx` — client board; the create/configure/set-current
  handlers to replace.
- `components/ui/` — existing primitives: `input`, `select`, `switch`, `button`, `card`,
  `badge`, `menu`. **No dialog/modal, no textarea, no label** — a modal + textarea must be
  added (see UI section).
- `proxy.ts` — Clerk middleware protects `/admin(.*)` (Next.js 16 uses `proxy.ts`, not
  `middleware.ts`). Server Actions still re-check auth themselves (middleware guards routes,
  not action invocations).
- `app/admin/camps/page.tsx` — Server Component; `getCamps()` → `<CampsBoard>`.
- No `app/api/*`, no Server Actions yet. **Zod is not installed.**

## Decisions / assumptions

- **Server Actions**, not `app/api/*` routes (confirmed with user). Live in
  `app/admin/camps/actions.ts`, marked `"use server"`. They call new write helpers in
  `lib/admin/data.ts`.
- **Every action re-verifies auth** via a new `requireAdmin()` guard
  (`lib/admin/guard.ts`) that wraps `getCurrentProfile()`: throws/returns-error if no Clerk
  session or no `profiles` row. Role: allow `superadmin` and `admin` (no granular
  camp-permission gating yet — that arrives with the users/roles prompt).
- **Zod** for input validation (project convention, AGENTS.md §6). Install `zod` as a
  dependency. One `campInputSchema` shared by create + update.
- **Money is whole euros** (integer) — the form takes euros directly; validate integer ≥ 0.
- **Dates**: `start_date`/`end_date`/`payment_due_date` are `date` (YYYY-MM-DD);
  `registration_opens_at`/`registration_closes_at` are `timestamptz`. Empty inputs → `null`.
  Validate `end_date >= start_date` when both present; otherwise keep validation lenient
  (AGENTS.md: prefer app/Zod validation, avoid rigid constraints).
- **Set current** updates the `camp_settings` singleton via **upsert** on `id = true`
  (the row may not exist yet on a fresh DB) and sets `current_camp_id`.
- **Delete**: `camps` FK cascades remove that camp's `camp_form_fields`, `price_tiers`,
  `registrations`. This is destructive → require a typed/explicit confirmation in the UI
  (see UI states). If the deleted camp was current, `camp_settings.current_camp_id` becomes
  `null` automatically (`on delete set null`) — surface that the site then has no current camp.
- **Return shape**: actions return a discriminated result
  `{ ok: true; ... } | { ok: false; error: string }` (German message) so the client can toast
  precisely instead of throwing. Server-side unexpected failures are logged and returned as a
  generic German error.
- **Revalidation**: after any successful mutation, `revalidatePath("/admin/camps")` and
  `revalidatePath("/admin")` (dashboard reads current camp); after set-current/edit/delete
  also `revalidatePath("/")` (landing page reads the current camp). Use `revalidatePath`
  from `next/cache`.
- **Activity log**: best-effort insert into `logs` (action e.g. `camp.create`, actor =
  profile id/name) inside each mutation; a logging failure must not fail the mutation.

## Files likely to change / add

- `package.json` — add `zod`.
- `lib/admin/guard.ts` — **new**. `requireAdmin()` → `{ profile }` or throws a typed
  `AuthError`; small helper `isAdminRole`.
- `lib/admin/data.ts` — **add** `createCamp`, `updateCamp`, `deleteCamp`, `setCurrentCamp`
  write helpers (service-role). Add a `mapCampInputToRow` (domain→snake_case) helper.
- `app/admin/camps/actions.ts` — **new**. `"use server"` actions: `createCampAction`,
  `updateCampAction`, `deleteCampAction`, `setCurrentCampAction`. Each: `requireAdmin()` →
  Zod-parse → write helper → revalidate → return result. Catch + map errors to German.
- `components/admin/camp-form-dialog.tsx` — **new**. Modal form (create + edit) for all
  editable `camps` fields.
- `components/ui/dialog.tsx` — **new** modal primitive (Radix-free, matching existing token
  style: `bg-surface`, `border-border`, `rounded-*`, `shadow-pop`; focus trap + Esc + backdrop
  click to close; `role="dialog"` `aria-modal`). Keep consistent with `components/ui/menu.tsx`
  conventions.
- `components/ui/textarea.tsx` — **new**, styled to match `input.tsx` (for `description`).
- `components/admin/camps-board.tsx` — wire real actions: open create/edit dialog, call
  `setCurrentCampAction`, add a delete confirm flow, replace local-only state with
  action-driven updates (use `useTransition` + `router.refresh()` after success, or rely on
  revalidatePath). Keep the toast component; drive it from action results.
- `lib/admin/messages.ts` — **extend** `de.camps` with: dialog title (create/edit), all field
  labels + placeholders, save/cancel, delete confirmation copy, success/error toasts, and the
  "no current camp" note. No English in UI.
- `lib/admin/types.ts` — add a `CampInput` type (form payload) if helpful; reuse `Camp`.

## Implementation requirements

- Editable camp fields: `name` (required), `location`, `start_date`, `end_date`, `capacity`,
  `base_price` (euros), `room_capacity`, `registration_open` (Switch),
  `registration_opens_at`, `registration_closes_at`, `payment_due_date`, `tagline`,
  `description`. `config` is not edited in this UI.
- Server Actions are the only write path from the client. No service-role client, no secrets,
  no Supabase write ever reaches browser code.
- Keep helpers small and typed; no `any`. Domain↔row mapping stays in `lib/admin/data.ts`.
- Follow the Supabase gotcha: no `.eq('foreignTable.col', …)`; simple single-table writes here.
- Reuse `formatCurrency`/`formatDateLong`/`formatNumber` from `lib/format.ts` for display.

## Security requirements

- Each action calls `requireAdmin()` **first**; unauthenticated/no-profile → return
  `{ ok: false, error: <German> }` (never perform the write). Do not leak internal errors.
- Zod-validate and coerce all inputs server-side before any DB call; reject with field-level
  German messages surfaced in the dialog.
- Service-role client stays server-only (`import "server-only"` already in `data.ts`).
- No secret or service-role usage in `components/*`.

## Acceptance criteria

- Creating a camp inserts a `camps` row and it appears on `/admin/camps` after the action
  (no manual refresh needed).
- Editing updates the row; changes reflected on reload/refresh.
- Setting a camp current updates `camp_settings.current_camp_id` (upsert singleton), the
  "Aktuell" badge moves, and `/` + `/admin` reflect the new current camp.
- Deleting removes the camp (and cascades) after explicit confirmation; if it was current,
  the UI notes there is no current camp.
- Unauthorized invocation (no session) performs no write and returns a German error.
- All new UI copy is German; all identifiers/comments English. `npm run lint` clean;
  `npm run build` succeeds.

## Checks to run

- `npm run lint`
- `npm run build` (Server Actions + new components affect the build)

## Manual test steps

1. `npm run dev`, sign in, open `/admin/camps`.
2. Click **Camp erstellen** → fill the form → save. New card appears; verify the row in
   Supabase (`select * from camps`).
3. **Als aktuell festlegen** on a non-current camp → badge moves; check
   `select current_camp_id from camp_settings;` and that `/` shows the new camp.
4. Edit a camp (dates, base price, registration toggle) → save → reload → values persist.
5. Delete a camp → confirm → card disappears; verify cascade removed its rows and, if it was
   current, `current_camp_id` is now null and the UI notes "kein aktuelles Camp".
6. Confirm no service-role/secret usage in the client bundle (search `components/` for
   `getServiceClient`/`SUPABASE_ROLE_KEY` → none).
