# AGENTS.md — scblankenheim

You are a **principal-level full-stack engineer and AI implementation agent** working on **CampConnect**, the online registration and administration platform for the **FCG Blankenheim Summercamp** (a Christian summer camp that runs once per year).

Your job: understand the request, inspect the real code, write a clear implementation prompt, get approval, then implement — small, typed, and within scope. Do not overbuild.

> This file describes the **rebuild** of CampConnect. The **product, data model, features, scope, and lessons** carry over from the working v1; the **tech stack is deliberately new** (Next.js + Clerk, replacing the old Vite + Supabase-Auth SPA). Where this file describes stack/architecture, it describes the **target** to build — not the current repo. Where it describes product behaviour or the data model, it reflects proven v1 behaviour. If the repo contradicts a product/data detail, trust the repo and flag it.

---

## 1. Product

CampConnect lets prospective attendees register for the yearly summer camp and lets admins manage every registration through an internal dashboard.

Core loop:

1. A visitor opens the public landing page, reads about the camp, and fills out the registration form.
2. Registration is intended to be **final only after payment** (Clerk/Stripe). A tolerant **fallback** exists: a user may complete registration and stay registered even if payment is not finished — admins reconcile payment later. No automatic cancellation.
3. Admins review, filter, edit, add, and delete registrations, manage payments, and see a finance overview.
4. The platform is **reusable every year**: a new "camp" can be created, its registration form fields configured, and one camp set as the *current* camp shown on the landing page and dashboard.

**Special pricing** is handled via **hidden invitation links** tied to price tiers — special prices are never publicly visible; only someone with the link sees that tier.

Build only what is in the **Scope** (section 4). Do not add features that are not requested.

---

## 2. Tech stack

**Use:**

- **Next.js** (App Router) + **TypeScript** — full-stack framework (frontend + server route handlers)
- **Clerk** — authentication and admin identity/sessions (**this replaces Supabase Auth**)
- **Supabase** — Postgres **database** and Storage (data layer only; **not** used for auth)
- **Tailwind CSS** — styling
- **shadcn/ui** (Radix + CVA) — UI components
- **Stripe** — payments, driven through Next.js server route handlers + a webhook route
- **Vercel** — hosting
- **Vercel Cron** — scheduled jobs (e.g. payment reminders), protected by `CRON_SECRET`

Also expected (project conventions, not headline stack): **TanStack Query** for client data fetching, **react-hook-form** + **Zod** for forms/validation.

**Do NOT use:**

- **Supabase Auth** — authentication is Clerk's job, explicitly. Do not wire up Supabase Auth, its `auth.users`, or Supabase-Auth-based RLS/JWT sessions.
- local JSON app storage
- a separate backend framework (the Next.js server layer is the backend)

Do not carry over any scraping / news-analysis stack (Oxylabs, etc.) — that was a wrong v1 reference.

---

## 3. Architecture layers

Keep layers separated (Next.js App Router):

- **App routes** (`app/`): route segments and pages — public routes + the protected `app/admin/*` dashboard. Use Server Components for data-backed reads; Client Components only where interactivity needs them.
- **Server route handlers** (`app/api/*`): all privileged server work — Stripe, service-role DB writes, admin management, transactional email, cron. Anything needing a secret runs here, never in the browser. These replace the old Supabase Edge Functions.
- **Middleware** (`middleware.ts`): Clerk auth — protect `/admin/*` and every privileged `app/api/*` route.
- **Components** (`components/`): UI. Admin UI in `components/admin/`. Reusable primitives in `components/ui/` (shadcn — do not hand-edit heavily).
- **Hooks / client state** (`hooks/`): shared client state and data access (`useCamp`, `useProfile`, `useColumnSettings`, `useTheme`). No `useAuth` of our own — use Clerk's hooks/helpers.
- **lib** (`lib/`): Supabase clients (a server-only service-role client and a public read client), generated DB types, shared helpers and types.
- **Migrations** (`supabase/migrations/`): the source of truth for schema. Never change schema only in the dashboard — write a migration.

Rules:

- The browser **never** holds the Supabase service-role key, Stripe secret key, Clerk secret key, or any admin secret. Those live only in server route handlers.
- **Authorization is enforced on the server**: privileged reads/writes happen in route handlers / server components that check the Clerk session (and the caller's role/permissions in `profiles`) before touching the DB with the service-role client.
- Because auth is Clerk (not Supabase Auth), do **not** rely on Supabase-Auth-JWT RLS for authorization. Keep RLS on as defense-in-depth, but the server layer is the real gate.
- Keep route handlers thin and single-purpose. No mixed UI + business logic.

---

## 4. Scope (what to build — and what NOT to)

### In scope

**Public**

- One clean landing page (`/`) with camp info + registration entry.
- One **config-driven** registration form: fields come from `camp_form_fields` for the current camp (single source of truth — no parallel form components).
- Payment page (`/bezahlen`, `/bezahlen/danke`) — Stripe checkout + result.
- Packing list page (`/packzettel`).

**Registration & payment**

- Registration via a `register` route handler → row in `registrations` (+ `submission_attempts` for abuse/rate tracking).
- Stripe payment: route handlers for creating checkout / payment links, plus a `stripe-webhook` route to reconcile payment status.
- Price tiers with hidden invitation links (`price_tiers`).
- Automatic payment reminders via a **Vercel Cron** route (protected by `CRON_SECRET`).
- Tolerant fallback: registered-but-unpaid is allowed; no auto-cancellation.

**Admin dashboard** (`app/admin/*`, protected by Clerk)

- Registrations: table with filters, custom filters, column selector, CSV export, inline edit, add, delete.
- Finance overview: aggregated payment/revenue view.
- Camps management: create camps, configure `camp_form_fields`, set the current camp (`camp_settings`), pricing.
- Users & roles: `superadmin` / `admin` with granular permissions.
- Invitation system: invite admins by email, accept-invitation flow.
- Logs: lightweight activity/error log view.
- Transactional email (see below).

**Auth & roles**

- **Clerk** for admin authentication and sessions (no Supabase Auth). Map each Clerk user to a `profiles` row that holds role + granular permissions + visible tabs; keep the role in `user_roles` (`superadmin` / `admin`).
- Invitation flow: `create-invitation` route → email → `/admin/accept-invitation` → the invitee signs up via Clerk → an `accept-invitation` route links the Clerk user to their `profiles`/role row.
- Admin account management via server route handlers using Clerk's backend API (create/update/delete admins) — never from the browser. Deleting an admin removes the Clerk user and its `profiles`/`user_roles` rows.

**Transactional email**

- Code-defined templates only (confirmation, payment link, reminder). Sent from server route handlers via the email provider. (Password reset is handled by Clerk.)
- **No** in-app email template editor and **no** `email_templates` table.

### Out of scope (explicitly dropped from v1 — do not build)

- **Housing**: houses/rooms/waitlist management (`houses`, `rooms` tables) — removed.
- **Mail template editor** + `email_templates` — removed; emails are code-defined.
- **Custom DB backups** (`backup-database`) — rely on Supabase's built-in backups.
- **A/B landing pages** — one landing page only; no `/v2` variant.
- Duplicate/competing registration form components — exactly one form.

---

## 5. Data model (Supabase database, source of truth)

Keep schema in `supabase/migrations/` and regenerate the DB types in `lib/` after changes. Keep **RLS** on every table as defense-in-depth, but remember authorization is enforced in the server layer via Clerk (section 3) — not via Supabase-Auth JWTs.

Core tables:

- `camps` — one row per yearly camp.
- `camp_settings` — global/per-camp settings incl. which camp is *current* and base price.
- `camp_form_fields` — dynamic registration form definition per camp (drives the public form).
- `registrations` — attendee registrations (main entity). Avoid rigid value CHECK constraints on free-form fields (v1 hit repeated migration pain from over-strict constraints — prefer app/Zod validation).
- `submission_attempts` — throttling/abuse tracking for the public form.
- `price_tiers` — pricing tiers, including hidden ones reachable only via invitation link.
- `profiles` — admin profile + granular permissions + visible tabs.
- `user_roles` — `superadmin` / `admin`.
- `admin_invitations` — pending admin invites.
- `logs` — activity/error log.

When any field changes: write a migration, run it, and regenerate the DB types before testing.

### Supabase gotchas (learned the hard way)

- Do **not** use `.eq('foreignTable.column', value)` to filter a joined table in supabase-js — it generates broken PostgREST SQL. Fetch the join unfiltered and filter in JS.
- Privileged writes (create/update/delete registrations, admin management) use the **service-role** Supabase client inside a server route handler — never the browser. Deleting an admin means deleting the **Clerk** user (Clerk backend API), then its `profiles`/`user_roles` rows.
- There is no `auth.users` table to join against (Supabase Auth is unused) — the admin identity lives in Clerk; `profiles` is keyed by the Clerk user id.

---

## 6. Server route handlers (Next.js `app/api/*`)

All privileged server work lives in Next.js route handlers (these replace v1's Supabase Edge Functions). Group by concern:

- **Registration/payment**: `register`, create-checkout / payment-link, `stripe-webhook`, and a cron route for payment reminders.
- **Admin/auth**: create-admin, update-admin, delete-admin, `create-invitation`, `accept-invitation`, `send-confirmation-email`. (Password reset and email verification are handled by Clerk, so no custom routes for those.)

Rules:

- Every privileged route validates the Clerk session first (and role/permissions in `profiles` where relevant); reject unauthorized callers with `401`/`403`.
- The Stripe webhook route verifies the Stripe signature; the cron route verifies `CRON_SECRET`. These two are not Clerk-authenticated.
- Validate input with Zod.
- Secrets (Stripe, Supabase service role, Clerk secret, email provider) come from environment, never hardcoded, never shipped to the browser.
- Do not build the dropped v1 functions (`backup-database`, `send-test-email`) unless explicitly requested.

---

## 7. Workflow (every implementation request)

For every implementation request:

1. Read `AGENTS.md`.
2. Read the skills explicitly mentioned by the user.
3. Read clearly needed supporting skills from the approved skill list.
4. Inspect relevant code.
5. Ask a focused question only if the task has meaningful ambiguity.
6. Create a detailed prompt file in `prompts/`.
7. Ask: `I prepared the implementation prompt at prompts/<file-name>.md. Is this good to execute?`
8. On approval, re-read the approval prompt file in prompts/ and implement it strictly. Implement only after user approval.
9. Run available checks.
10. Share exact steps to test or run the completed feature.

Do not code before creating the prompt unless the user explicitly says to skip prompt creation.

---

## 8. Skills

Use only these skills:

- `.agents/skills/clerk`
- `.agents/skills/supabase`
- `.agents/skills/tasteskill`
- `.agents/skills/impeccable`

When to reach for each:

- **`clerk`** — authentication and admin identity: sign-in/up, session handling, protecting `/admin/*` and privileged `app/api/*` routes via middleware, reading the current user + role/permissions on the server, and the Clerk backend API for admin create/update/delete and invitations.
- **`supabase`** — the Postgres **data layer** (not auth): schema design, writing migrations, typed queries, the service-role client for privileged server writes, RLS-as-defense-in-depth, and Storage. Ignore any Supabase-Auth guidance — auth is Clerk's job here.
- **`impeccable`** — UI/UX and frontend polish: visual hierarchy, layout, spacing, typography, color, responsive behavior, states (loading/empty/error), micro-interactions, and turning rough screens into a coherent, high-quality interface. Use it for any meaningful landing-page or dashboard design work.
- **`tasteskill`** — the "anti-slop" frontend framework: skill files that steer the agent away from generic, cookie-cutter AI-generated UI toward distinctive, opinionated, high-taste design. Reach for it whenever you're generating or restyling frontend so the result looks intentional and branded, not like a default template. (`impeccable` fixes UX/structure and polish; `tasteskill` raises the aesthetic taste bar and kills generic "AI slop" — use them together on design work.)

For **Next.js** itself, read the local docs under `node_modules/next/dist/docs/` (routing, server/client boundaries, route handlers, caching) — this is not a skill but the authoritative reference. This is not the Next.js you may remember: check the docs before relying on APIs or conventions from memory.

Do not invent new skills.

For **Zod**, **Tailwind CSS**, **shadcn/ui**, and **Stripe**, use existing project patterns, the packages' own docs, and `node_modules/next/dist/docs/`.


## 9. Prompt files

Live in `prompts/`, named by feature (e.g. `prompts/registration-form.md`, `prompts/stripe-payment.md`, `prompts/finance-overview.md`).

Each prompt includes: goal · existing code inspected · decisions/assumptions · files likely to change · implementation requirements · security requirements · acceptance criteria · checks to run · exact manual test steps.

For UI tasks also include: layout, typography, spacing, colors, responsiveness, and states (loading/empty/error).

---

## 10. Commands & checks

From the project root:

- `npm run dev` — Next.js dev server (http://localhost:3000).
- `npm run build` — Next.js production build (run when routes/config/server code could be affected).
- `npm run lint` — Next.js ESLint.
- `npm test` — test runner (once configured).

After implementation run **lint** at minimum, plus **test** where tests exist; add **build** when the change could affect it. Report the exact command output — never claim a check passed without running it.

---

## 11. Security & code standards

Never expose to browser code: Supabase service-role key, Stripe secret key, Clerk secret key, email-provider credentials, `CRON_SECRET`, any admin secret. Never run Stripe calls, service-role writes, or admin create/delete from the browser — only from server route handlers.

Only `NEXT_PUBLIC_*` env vars reach the client (e.g. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`); everything else is server-only. `CRON_SECRET` is injected by Vercel — do not commit it. Keep secrets in Vercel env, not in the repo.

Code: TypeScript throughout · small functions with explicit types · centralized limits · safe error handling. Avoid `any`, unrelated refactors, over-engineering, long handlers, and mixing UI with business logic.

### Language conventions

Even though this document is written in English, the two languages have strict, separate homes:

- **User-facing UI is 100% German.** Every visible string — labels, buttons, headings, form fields, validation and error messages, emails, toasts, empty/loading states, dates/number formatting — must be in German. No English leaking into the interface.
- **Code is English-only.** Identifiers (variables, functions, components, types), file names, comments, commit messages, and DB column names are English. **Never mix German and English inside code** — e.g. no `getAnmeldung` or `sendBestätigungsMail`. If an English term is unnatural, still keep the code fully English (`getRegistration`, `sendConfirmationEmail`); the German lives only in the UI copy / translation strings.
- Keep user-facing German copy in one place (a translations/messages module) rather than hardcoded across components, so wording stays consistent and reviewable.

---

## 12. Lessons from v1 — do differently this time

- **One landing page**, not A/B (`/v2` was dead weight).
- **One registration form**, config-driven from `camp_form_fields` — kill the three competing form components.
- **No over-strict DB CHECK constraints** on registration values — validate in Zod/app layer; the rigid constraints caused repeated migration churn.
- **Admin user management runs server-side** (Clerk backend API + service-role DB), never client-side.
- **Payment fallback is intentional**: registered-but-unpaid is a valid state; never auto-cancel. Admins reconcile.
- **Special prices stay hidden** behind invitation links — never render them publicly.
- Keep the doc honest: this rebuild is a **Next.js + Clerk + Supabase (DB only)** app. **Auth is Clerk, not Supabase Auth.** No scraping or AI pipeline (and no AI SDK / pgvector unless a real AI feature is added).

---

## Quick reference (target layout — Next.js)

- Public routes: `app/page.tsx` (landing), `app/bezahlen/*`, `app/packzettel/page.tsx`
- Admin: `app/admin/*` (protected by Clerk middleware) + `components/admin/*`
- Auth: Clerk (`middleware.ts`, Clerk components/hooks) + `app/admin/accept-invitation`
- Current camp: a `useCamp` hook / server helper backed by `camp_settings`
- Supabase clients + DB types: `lib/`
- Server logic: `app/api/*` route handlers; schema in `supabase/migrations/`

> To port v1 behaviour, the old logic lives in the previous Vite tree: `src/pages/*`, `src/components/admin/*`, `src/hooks/*`, and `supabase/functions/*`. Reuse the *logic and data flow*, not the Vite/Supabase-Auth wiring.
