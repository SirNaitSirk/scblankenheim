# Prompt: Supabase database + data-access layer

## Goal

Stand up the **Supabase Postgres schema** (source-of-truth migration) and the **typed
server-side data-access layer** for CampConnect, then replace the mock getters the admin
dashboard already reads through with real Supabase queries — same function signatures, so
the swap is a data-source change, not a shape change.

Auth stays **Clerk** (this task adds no Supabase Auth). Supabase is the **data layer only**.

Scope of this task = **schema + read layer + clients + types + seed**. Write/mutation route
handlers (register, edit/add/delete registrations, admin management, Stripe) are **out of
scope** here and belong to their own prompts.

## Existing code inspected

- `lib/admin/mock-data.ts` — async getters every admin page awaits (the explicit "MOCK
  BOUNDARY"): `getCurrentCamp`, `getCamps`, `getRegistrations`, `getPriceTiers`,
  `getFinanceSummary`, `getAdminUsers`, `getLogs`.
- `lib/admin/types.ts` — UI domain types (`Registration`, `Camp`, `PriceTier`, `AdminUser`,
  `LogEntry`, `FinanceSummary`, and the status/role unions). These are the target shapes the
  data layer must return.
- Consumers (all Server Components, `await` server-side, props down to client components):
  `app/admin/page.tsx`, `app/admin/finanzen/page.tsx`, `app/admin/camps/page.tsx`,
  `app/admin/profil/page.tsx`, `app/admin/benutzer/page.tsx`, `app/admin/logs/page.tsx`.
- `proxy.ts` — Clerk `clerkMiddleware`, protects `/admin(.*)`. (Note: file is `proxy.ts`, not
  `middleware.ts`; leave as-is.)
- `.env.local` — has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_ROLE_KEY` (service role — note the non-standard name, use it verbatim), `DBPW`.
- No `@supabase/*` dependency, no `supabase/` dir, no Supabase CLI/MCP/psql available locally.

## Decisions / assumptions (confirmed with user)

1. **Full §5 data model** in one migration (all core tables + RLS + indexes).
2. **Deliver files; user applies.** I do not touch the live DB. The migration is the
   source of truth; the user runs it (dashboard SQL editor or `supabase db push`).
3. **Replace mock getters with real queries + seed** so the dashboard renders real rows.
4. **Dynamic form fields are wireable without a future migration.** Field definitions live
   in `camp_form_fields` (per camp); registration answers live in `registrations.form_data`
   (`jsonb`). Switching the current camp changes which fields the landing form and the admin
   table show — pure data, no schema change. To make that reachable from the data layer this
   task also adds a `getCampFormFields(campId)` getter and passes `form_data` through
   `getRegistrations` (see below). The dynamic-column *rendering* itself stays a later UI task.
5. **Admin sections per user are flexible, no future migration.** `profiles.permissions` and
   `profiles.visible_tabs` are `text[]` of keys/hrefs; adding a section later is a code + data
   change (new nav item + granting the key), never a schema change. (Deliberately not a
   boolean-column-per-section design.)
6. **Deviations from a literal §5 reading (flagged):**
   - `base_price` lives on **`camps`** (per-camp, because the UI shows a different base price
     per camp), while `camp_settings` holds the **current camp pointer** + global config.
     §5 phrases base price as a `camp_settings` field; per the repo the UI needs it per-camp.
   - `registrations` gets a human `reference` (e.g. `A-3471`) column; the data layer maps it
     to the UI `Registration.id` to preserve the current display. Real PK stays a `uuid`.
   - **No CHECK constraints** on free-form/status values (v1 lesson) — validate in Zod/app.

## Files to create

- `supabase/migrations/0001_init_schema.sql` — full schema, RLS, grants, indexes.
- `supabase/seed.sql` — the current mock data as real rows (idempotent-ish, safe to re-run
  after a truncate; not run automatically).
- `lib/supabase/server.ts` — **service-role** client (`import "server-only"`, uses
  `SUPABASE_ROLE_KEY`; never imported by client components).
- `lib/supabase/public.ts` — anon read client (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), safe on
  client or server, for public reads only.
- `lib/database.types.ts` — hand-written `Database` type matching the schema (no CLI to gen).
- `lib/admin/data.ts` — real typed getters, identical signatures to the mock ones, plus the
  new `getCampFormFields(campId: string): Promise<CampFormField[]>`,
  `getCurrentProfile(): Promise<AdminUser | null>` (the Clerk→profile bridge), and
  `getAppSettings(): Promise<AppSettings>` (reads `camp_settings.settings`).

## Files to change

- `lib/admin/types.ts` — add a `CampFormField` type (`id`, `campId`, `key`, `label`,
  `fieldType`, `required`, `options`, `sortOrder`, `config: Record<string, unknown>`); add an
  optional `formData: Record<string, unknown>` to `Registration` so dynamic answers travel
  with each row; extend `Camp` with the new nullable settings
  (`registrationOpensAt`, `registrationClosesAt`, `paymentDueDate`, `roomCapacity`,
  `tagline`, `description`, `config: Record<string, unknown>`); extend `PriceTier` with
  `validFrom` / `validUntil`; and add an `AppSettings = Record<string, unknown>` type for the
  global `camp_settings.settings` bag. Existing fixed fields stay (core columns for
  search/emails).
- `app/admin/page.tsx`, `app/admin/finanzen/page.tsx`, `app/admin/camps/page.tsx`,
  `app/admin/profil/page.tsx`, `app/admin/benutzer/page.tsx`, `app/admin/logs/page.tsx` —
  update the import from `@/lib/admin/mock-data` to `@/lib/admin/data`. In addition,
  `app/admin/profil/page.tsx` switches from the placeholder `getAdminUsers()[0]` to
  `getCurrentProfile()` (the actual signed-in admin); if it returns `null`, render a
  minimal "kein Profil verknüpft" state rather than crashing.
- `app/admin/layout.tsx` — add `export const dynamic = "force-dynamic";` so admin reads hit
  the live DB per request (no static prerender of privileged data at build time).
- `package.json` / `package-lock.json` — add `@supabase/supabase-js` (pinned exact version,
  lockfile committed — per skill's dependency-security rule).
- **Delete** `lib/admin/mock-data.ts` after imports are moved.

## Schema (0001_init_schema.sql)

All tables in `public`, `id uuid primary key default gen_random_uuid()` unless noted,
`created_at timestamptz not null default now()`. Money as **integer whole euros**.

- **camps**: `name text not null`, `location text`, `start_date date`, `end_date date`,
  `capacity int`, `base_price int not null default 0`, `registration_open boolean not null
  default true`,
  `room_capacity int` (nullable; number of limited **room** spots — tent is unlimited and
  uncounted. Drives a future landing-page "rooms available" counter, derived as
  `room_capacity − count(non-deleted registrations where the accommodation field = 'zimmer')`.
  This task only stores/seeds it; the counter + the accommodation form field are future work,
  by convention a `camp_form_fields` row with `key = 'accommodation'`, options `zimmer`/`zelt`),
  `registration_opens_at timestamptz` (nullable; drives the landing-page **countdown** to
  registration opening — a future UI task, this task only stores it),
  `registration_closes_at timestamptz` (nullable; window end),
  `payment_due_date date` (nullable; anchor for the payment-reminder cron),
  `tagline text` (nullable; short landing-page headline copy),
  `description text` (nullable; longer landing-page copy),
  `config jsonb not null default '{}'::jsonb` (escape hatch for unforeseen per-camp settings,
  so new settings don't each need a migration; typed columns remain preferred for known ones).
- **camp_settings**: single global row — `id boolean primary key default true` with
  `check (id)` (singleton), `current_camp_id uuid references camps(id) on delete set null`,
  `settings jsonb not null default '{}'::jsonb` (app-wide settings admins edit without a
  deploy: org name, contact/support email, email sender, social links, feature toggles),
  `updated_at timestamptz not null default now()`.
- **camp_form_fields**: `camp_id uuid not null references camps(id) on delete cascade`,
  `key text not null`, `label text not null`, `field_type text not null default 'text'`,
  `required boolean not null default false`, `options jsonb`, `sort_order int not null
  default 0`, `config jsonb not null default '{}'::jsonb` (field-level extras added as data,
  not migrations: placeholder, help text, min/max, validation, conditional visibility),
  `unique (camp_id, key)`.
- **price_tiers**: `camp_id uuid not null references camps(id) on delete cascade`,
  `name text not null`, `price int not null`, `hidden boolean not null default false`,
  `invitation_token text unique` (nullable; the hidden-link token),
  `valid_from timestamptz` (nullable), `valid_until timestamptz` (nullable) — admin-set
  validity window for e.g. early-bird auto-expiry; null = no bound.
- **registrations**: `reference text not null unique`,
  `camp_id uuid not null references camps(id) on delete cascade`,
  `price_tier_id uuid references price_tiers(id) on delete set null`,
  `first_name text`, `last_name text`, `email text`, `city text`,
  `form_data jsonb not null default '{}'::jsonb`,
  `status text not null default 'pending'`, `payment_status text not null default 'unpaid'`,
  `amount_due int not null default 0`, `amount_paid int not null default 0`,
  `stripe_session_id text`, `deleted boolean not null default false`,
  `registered_at timestamptz not null default now()`,
  `updated_at timestamptz not null default now()`. **No CHECK on status/payment_status.**
- **submission_attempts**: `email text`, `ip text`, `camp_id uuid references camps(id) on
  delete set null` (abuse/rate tracking for the public form).
- **profiles**: `id text primary key` (**Clerk user id**, not uuid), `name text`,
  `email text`, `permissions text[] not null default '{}'`, `visible_tabs text[] not null
  default '{}'`, `status text not null default 'active'`, `last_active_at timestamptz`.
- **user_roles**: `user_id text not null references profiles(id) on delete cascade`,
  `role text not null`, `unique (user_id)`.
- **admin_invitations**: `email text not null`, `role text not null default 'admin'`,
  `permissions text[] not null default '{}'`, `visible_tabs text[] not null default '{}'`,
  `token text not null unique`, `status text not null default 'pending'`,
  `invited_by text`, `accepted_at timestamptz`.
- **logs**: `level text not null default 'info'`, `actor text`, `action text`,
  `message text`.

**Indexes**: `registrations(camp_id)`, `registrations(price_tier_id)`,
`registrations(deleted)`, `camp_form_fields(camp_id)`, `price_tiers(camp_id)`,
`submission_attempts(email)`, `logs(created_at desc)`.

### RLS + grants (security model)

Because authorization is enforced in the server layer via Clerk and privileged work uses the
**service-role** client (which bypasses RLS), the policy surface is intentionally minimal:

- `alter table ... enable row level security` on **every** table.
- **Public (anon) SELECT** only where the public site legitimately reads, with matching
  table-level `grant select ... to anon` (skill note #4 — RLS ≠ Data API exposure):
  - `camps` — `for select to anon using (true)`.
  - `camp_settings` — `for select to anon using (true)` (landing needs the current camp).
  - `camp_form_fields` — `for select to anon using (true)`.
  - `price_tiers` — `for select to anon using (hidden = false)` — **hidden tiers never leak
    publicly**; the invitation flow reads hidden tiers server-side via service role.
- **All other tables**: RLS enabled, **no anon/authenticated policies** (default-deny). No
  grants to `anon`/`authenticated`. Only the service-role client (server route handlers /
  server components) touches them.
- No `SECURITY DEFINER` functions, no views in this task (keeps the skill's view/definer
  traps out of scope).

## Data-access layer (lib/admin/data.ts)

Every function keeps the **exact signature** of its mock twin and returns the `lib/admin/
types.ts` shapes. Reads use the **service-role** client from `lib/supabase/server.ts`
(privileged, RLS-bypassing) since these run only inside protected admin Server Components.

Mapping rules:

- **getCamps** → select camps with embedded counts
  (`select('*, registrations(count), camp_form_fields(count)')`); `isCurrent` = camp id ===
  `camp_settings.current_camp_id`; `registrations` = embedded count of non-deleted rows
  (filter deleted in JS if the embedded count can't exclude them — per skill, don't filter an
  embedded table with `.eq('foreignTable.col', …)`); `formFieldCount` = embedded count.
- **getCurrentCamp** → read `camp_settings.current_camp_id`, return that camp mapped as above;
  fall back to the first camp if unset.
- **getRegistrations** → select all registrations (incl. `deleted`, the UI filters itself),
  order by `registered_at desc`; map `reference → id`, snake→camel fields, and pass
  `form_data → formData` through so the table can later render dynamic columns.
- **getCampFormFields(campId)** → select `camp_form_fields` for the camp, ordered by
  `sort_order`; map to the `CampFormField` shape. This is what the admin table + landing form
  read to know which columns/inputs to show for the (current) camp.
- **getPriceTiers** → tiers for the current camp with per-tier registration `count`
  (embedded `registrations(count)` or a grouped count), mapped to the `PriceTier` shape
  (incl. `validFrom` / `validUntil`).
- **getAppSettings** → read the singleton `camp_settings.settings` jsonb, return it as
  `AppSettings` (default `{}` if unset). Read helper only; nothing consumes it yet.
- **getFinanceSummary** → compute from non-deleted registrations of the current camp:
  `expected = Σ amount_due`, `collected = Σ amount_paid`, `outstanding = expected −
  collected`, `paidCount`, `totalCount`, `basePrice` from the current camp.
- **getAdminUsers** → join `profiles` + `user_roles` (fetch both, stitch in JS — avoid the
  cross-table `.eq` gotcha); map `role`, `permissions`, `visible_tabs → visibleTabs`,
  `status`, `last_active_at → lastActiveAt`.
- **getCurrentProfile** → the Clerk→DB bridge. `const { userId } = await auth()` (Clerk,
  `@clerk/nextjs/server`); if no `userId`, return `null`. Otherwise fetch the `profiles` row
  where `id = userId` plus its `user_roles` row (service-role client; stitch in JS), and map
  to the `AdminUser` shape (`role`, `permissions`, `visibleTabs`, `status`, `lastActiveAt`).
  Return `null` if no profile is linked yet (invited-but-not-accepted Clerk users). This is a
  **read helper only** — per-section gating/redirects and nav filtering come in the
  enforcement prompt, not here.
- **getLogs** → select logs, order `created_at desc`, map to `LogEntry`.

Keep the functions small and typed; no `any`. Centralize the row→domain mapping helpers in
the same file. UI-facing copy is unaffected (data only) — no German strings added here.

## Seed (supabase/seed.sql)

Insert the exact current mock content as real rows (whole-euro ints): the 2 camps
(2026 current, 2025 past), `camp_settings` pointing current → 2026, the 4 price tiers
(2 hidden), a small `camp_settings.settings` bag (e.g. org name, contact email) so
`getAppSettings` returns real content, a representative set of `camp_form_fields` for 2026
(enough that
`formFieldCount` reads sensibly, e.g. birthdate, phone, dietary, emergency contact,
t-shirt size), the ~14 registrations with their `reference`/status/payment/amounts **and a
matching `form_data` object keyed by those field keys** (so the dynamic passthrough has real
content), the 3 `profiles` + `user_roles`, and the 6 `logs`. Give the 2026 camp real
`registration_opens_at` / `registration_closes_at` / `payment_due_date` / `room_capacity`
values plus a `tagline` + `description`, so the countdown, room counter, and landing copy
have data to read later. Include one `camp_form_fields` row with `key = 'accommodation'`
(options `zimmer`/`zelt`) and set that key in each registration's `form_data`, so the room
count has real data. Use fixed UUIDs (or
deterministic inserts with `on conflict do nothing`) so re-running is safe. This file is
**not** auto-applied.

## Security requirements

- Service-role key (`SUPABASE_ROLE_KEY`) and any secret **never** reach the browser;
  `lib/supabase/server.ts` starts with `import "server-only";`.
- Only `NEXT_PUBLIC_*` env vars are used in `lib/supabase/public.ts`.
- Hidden price tiers are never selectable by `anon` (RLS `hidden = false`).
- RLS enabled on all tables; default-deny except the four public-read tables above.
- Pin `@supabase/supabase-js` to an exact version and commit the lockfile.

## Acceptance criteria

- `supabase/migrations/0001_init_schema.sql` creates all 10 tables with RLS + the grants/
  policies + indexes above, and applies cleanly on a fresh Postgres (verified by review; user
  runs it).
- `lib/supabase/server.ts` (service role, server-only) and `lib/supabase/public.ts` (anon)
  exist; `lib/database.types.ts` types every table's Row/Insert/Update.
- `lib/admin/data.ts` exposes the 7 original getters with unchanged signatures plus
  `getCampFormFields`, `getCurrentProfile`, and `getAppSettings`; `getRegistrations` carries
  `formData`; `lib/admin/types.ts` gains `CampFormField` (+ `config`), `Registration.formData`,
  the new `Camp` settings fields (+ `config`), `PriceTier.validFrom/validUntil`, and
  `AppSettings`; all six admin pages import from `data.ts`; `app/admin/profil/page.tsx`
  uses `getCurrentProfile()`; `lib/admin/mock-data.ts` is deleted.
- `app/admin/layout.tsx` is `force-dynamic`.
- `npm run lint` clean; `npm run build` succeeds.

## Checks to run

- `npm run lint`
- `npm run build`
- (Report exact output of both.)

## Manual test steps (for the user, after applying SQL)

1. In the Supabase project: run `supabase/migrations/0001_init_schema.sql`, then
   `supabase/seed.sql` (SQL editor or `supabase db push` + seed).
2. Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_ROLE_KEY`.
3. `npm run dev`, sign in, open `/admin` — dashboard stats, registrations table, finance,
   `/admin/camps`, `/admin/benutzer`, `/admin/logs` all render the seeded rows (not mock).
4. Confirm hidden tiers (`Geschwister`, `Mitarbeitende`) still appear in the admin finance
   view (service-role read) but a raw anon query (`anon` key) returns only the 2 public tiers.
