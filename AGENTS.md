# AGENTS.md — scblankenheim

You are a **principal-level full-stack engineer and AI implementation agent** working on **CampConnect**, the online registration and administration platform for the **FCG Blankenheim Summercamp** (a Christian summer camp that runs once per year).

Your job: understand the request, inspect the real code, drive it through the Spec Kit workflow (spec, plan, tasks), get approval, then implement. Keep it small, typed and within scope. Do not overbuild.

> **Governance:** the binding principles live in `.specify/memory/constitution.md`. Where this file and the constitution conflict, the constitution wins. This file stays the reference for product context, data model, routes and skills.

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
- **Proxy** (`proxy.ts`, the Next.js 16 successor of `middleware.ts`): Clerk auth, protects `/admin/*` and every privileged `app/api/*` route.
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

- One clean landing page (`/`) with camp info + registration entry. Order: hero, facts, program, youth groups, campfire band, registration, then „Gut zu wissen“ with open blocks for Anreise, Bezahlen, Packliste and Schulbefreiung; registration buttons follow the registration state; content is visible without JavaScript; a generated share image shows camp name and dates (specs/024-landing-structure).
- One **config-driven** registration form: fields come from `camp_form_fields` for the current camp (single source of truth — no parallel form components).
- Payment page (`/bezahlen`, `/bezahlen/danke`) — Stripe checkout + result.
- Packing list page (`/packzettel`).
- Participant page (`/meine-anmeldung/<token>`): private, read only page per registration with status, amounts, pay button, own answers, camp facts and packing list link; reachable only through an unguessable link that every mail to the registration contains; admins copy and renew it in the registration dialog (specs/017-participant-page). The page is split into the tabs Übersicht, Meine Angaben and Dokumente; the active tab lives in the URL fragment, and `#busticket` and `#schulbefreiung` open Dokumente (specs/022-participant-tabs).
- Calendar file (`/kalender/<campId>`): public iCalendar file with one all day event per camp plus a Google Calendar link, linked in the confirmation mail, the teaser info mail and on the participant page (specs/019-calendar-file).
- Participant messages: from the participant page a person sends a message to the team or requests a change of one own field; items are stored, forwarded to the camp's team address by mail and handled in the registration dialog (mark done, apply, dismiss); no chat, no replies in the app (specs/018-participant-messages).
- School release letter (Schulbefreiung): per camp switch; an active registration that is fully or partly paid (or owes nothing) enters teacher, school and address on the participant page and immediately gets a code defined PDF letter with signature image (download plus mail attachment, only to the registration's own address, never to schools); unpaid registrations see a hint with the pay button instead; admins enter, correct, download and resend it in the registration dialog; hinted in the confirmation and teaser info mail (specs/020-school-release).
- Participant link request: on the landing page (section shown only while the release letter is on for the current camp) a person enters an email and gets one mail per matching active registration with the link to its participant page; the page always answers the same and requests are throttled (specs/020-school-release).
- Prelaunch gate: while the server env `COMING_SOON` is `true` (set only for Vercel Production), every path except admin, sign in and sign up, the Stripe webhook, cron and the legal pages shows the coming soon page `/demnaechst` to visitors without an admin profile, and non GET requests get 503; removing the variable and redeploying goes live (specs/023-coming-soon).
- Impressum (`/impressum`) and Datenschutz (`/datenschutz`): static pages linked in the footer of every public page and on the coming soon page; operator data live only in `lib/legal/operator.ts`, missing values show as marked gaps; open during the prelaunch gate; the privacy text must match the services and data flows the code really uses (specs/025-legal-pages).

**Registration & payment**

- Registration via a `register` route handler → row in `registrations` (+ `submission_attempts` for abuse/rate tracking).
- Stripe payment: Checkout Sessions are created in `register` (right after signup) and in `checkout` (`/api/checkout`, pay later by reference on `/bezahlen`), plus a `stripe-webhook` route to reconcile payment status (specs/006-stripe-payment). Admins can send or copy the payment link from the registration dialog (specs/007-transactional-emails).
- Price tiers with hidden invitation links (`price_tiers`).
- Automatic payment reminders via a **Vercel Cron** route `app/api/cron/payment-reminders` (protected by `CRON_SECRET`, schedule in `vercel.json`, specs/007-transactional-emails). Reminders can be switched off per camp and paused per registration (specs/016-mail-settings).
- Tolerant fallback: registered-but-unpaid is allowed; no auto-cancellation.

**Admin dashboard** (`app/admin/*`, protected by Clerk)

- Registrations: table with filters, custom filters, column selector, CSV export, inline edit, add, delete. The registration dialog shows a read only mail history per registration from `email_deliveries` (specs/013-registration-mail-history).
- Finance overview: aggregated payment/revenue view.
- Finance tab (`/admin/finanzen`) for the accountant: sums, filters (open, partial, overdue, paused), search, inline edit of paid amount and payment status, payment link copy/send, pause or resume automatic reminders per registration, CSV export. Only finance fields reach the browser; writes need the `finances` permission (specs/009-finance-tab). Price tiers stay in `/admin/preise`.
- Camps management: create camps, configure `camp_form_fields`, set the current camp (`camp_settings`), pricing.
- Users & roles: `superadmin` / `admin` with granular permissions.
- Invitation system: invite admins by email, accept-invitation flow.
- Logs: lightweight activity/error log view.
- Room planning (`/admin/zimmerplanung`): houses and rooms with bed counts (shared by all camps), per camp room gender, and drag and drop or click assignment of active registrations to rooms with a print view (specs/008-room-planning).
- Tent circles (`/admin/zeltkreise`): per camp circles with name, kind (mixed, female, male) and exactly one leader from the camp's registrations; drag and drop or click assignment of active registrations as participants, no capacity; a leader is never a participant; print view (specs/011-tent-circles).
- Bus ticket (`/admin/bus`): per camp switch plus the one form question (with fixed options) and the answer options that mean "takes the bus"; no separate bus flag. Every active bus registration gets its own QR code with a random ticket code (not the participant link) on the participant page, in the arrival info mail and via "send bus ticket" in the registration dialog. Team members with the new `bus` permission scan with the phone camera per trip (outbound, return): green with name (plus a "payment open" hint, never blocking) or red (no bus ticket, cancelled, already boarded, invalid, other camp, unknown); one boarding per registration and trip, manual boarding and undo, live list of who is missing. Admins block a ticket or issue a new one, which invalidates older codes. No Apple or Google Wallet (specs/021-bus-ticket).
- Transactional email (see below).

**Auth & roles**

- **Clerk** for admin authentication and sessions (no Supabase Auth). Map each Clerk user to a `profiles` row that holds role + granular permissions + visible tabs; keep the role in `user_roles` (`superadmin` / `admin`).
- Invitation flow: `create-invitation` route → email → `/admin/accept-invitation` → the invitee signs up via Clerk → an `accept-invitation` route links the Clerk user to their `profiles`/role row.
- Admin account management via server route handlers using Clerk's backend API (create/update/delete admins) — never from the browser. Deleting an admin removes the Clerk user and its `profiles`/`user_roles` rows.

**Transactional email**

- Code-defined templates only (confirmation, payment link, reminder). Sent from server route handlers via the email provider. (Password reset is handled by Clerk.)
- **No** in-app email template editor and **no** `email_templates` table.
- A read only admin tab "Mail" (`/admin/mail`) previews every template with sample data, rendered by the same template functions; no editing (specs/007-transactional-emails). Admins with the `camps` permission may send a test of any template to their own address (specs/016-mail-settings).
- Info mails to active registrations (by default teaser 56 days before start, packing list 21 days before, arrival 5 days before, thank you 5 days after the end), code defined, per camp content and switches in `camp_mail_info`, sent by the cron route `app/api/cron/info-mails` within the remaining daily quota (specs/012-info-mails). No marketing mails to people without registration.
- Mail settings per camp on `/admin/camps/[campId]/infomails` ("Mails", specs/016-mail-settings): payment reminder switch, send days of the info mails and reminder cadence (empty means the default from `lib/email/limits.ts`), sender display name and reply address (the sender address stays `EMAIL_FROM`), and four short text blocks (greeting line, closing, contact name and phone) at fixed positions in confirmation, payment link and reminders. Still no template editor.

### Out of scope (explicitly dropped from v1 — do not build)

- **Housing waitlist** and any housekeeping beyond room planning (keys, cleaning, equipment).
- **Mail template editor** + `email_templates` — removed; emails are code-defined.
- **Custom DB backups** (`backup-database`) — rely on Supabase's built-in backups.
- **A/B landing pages** — one landing page only; no `/v2` variant.
- Duplicate/competing registration form components — exactly one form.

---

## 5. Data model (Supabase database, source of truth)

Keep schema in `supabase/migrations/` and regenerate the DB types in `lib/` after changes. Keep **RLS** on every table as defense-in-depth, but remember authorization is enforced in the server layer via Clerk (section 3) — not via Supabase-Auth JWTs.

Core tables:

- `camps` — one row per yearly camp. Registration window (specs/001-registration-form, research R1): registration opens automatically at `registration_opens_at`, closes at `registration_closes_at`, and shows "ausgebucht" once active registrations reach `capacity`. Once the opening time lies in the past, switching `registration_open` off no longer closes registration; to close early, set `registration_closes_at` to now or clear the opening time.
- `camp_settings` — global/per-camp settings incl. which camp is *current* and base price.
- `camp_form_fields` — dynamic registration form definition per camp (drives the public form).
- `registrations` — attendee registrations (main entity). Avoid rigid value CHECK constraints on free-form fields (v1 hit repeated migration pain from over-strict constraints — prefer app/Zod validation).
  `registrations.access_token` holds the secret of the participant page link (specs/017-participant-page); only the server reads it.
- `submission_attempts` — throttling/abuse tracking for the public form. Rows older than 7 days are deleted by the daily info mail cron (specs/025-legal-pages).
- `price_tiers` — pricing tiers, including hidden ones reachable only via invitation link.
- `profiles` — admin profile + granular permissions + visible tabs.
- `user_roles` — `superadmin` / `admin`.
- `admin_invitations` — pending admin invites.
- `logs` — activity/error log.
- `houses`, `rooms`: buildings and their rooms with bed counts, shared by all camps (specs/008-room-planning).
- `camp_rooms`: per camp room gender (`female` / `male`, missing row = not set).
- `room_assignments`: one room per registration and camp; capacity and gender match enforced on the server.
- `tent_circles`: per camp tent circles with name, kind (`mixed` / `female` / `male`) and one leader registration.
- `tent_circle_members`: one circle per registration and camp; leader exclusivity and kind match enforced on the server (specs/011-tent-circles).
- `camp_mail_info`: per camp content and on/off switches for the four info mails (specs/012-info-mails), plus the mail settings of specs/016-mail-settings (reminder switch, nullable timing values, sender name, reply address, text blocks).
- `participant_messages`: messages and change requests from the participant page with status and resolution (specs/018-participant-messages).
- `school_releases`: one row per registration with teacher, school, school address, participant address and optional class; deleted with the registration; the PDF is never stored. Per camp release settings (switch, affected days, signer name and role, private signature image in Storage) live with the camp's mail settings (specs/020-school-release).
- `camp_bus_settings`: per camp bus switch, the chosen form field key and the answer options that mean bus (specs/021-bus-ticket).
- `bus_tickets`: one row per issued ticket code; at most one active per registration, revoked rows stay so old codes answer "invalid"; deleted with the registration.
- `bus_boardings`: one row per registration and trip (`outbound` / `return`) with time, scanning admin and kind (scan, manual); deleted with the registration.
- `registrations.reminders_paused`: no automatic payment reminders for this registration (specs/016-mail-settings).
- `email_deliveries`: one row per send attempt; rows without `registration_id` and kind `test` are admin test sends that count against the daily quota.

The registration gender (`female` / `male`) is a fixed core field of the one registration form, stored in `registrations.gender`; older registrations may lack it.

A registration status is `active` or `cancelled` (specs/014-simplify-registration-status); only `cancelled` changes behaviour, payment progress lives in `payment_status`.

When any field changes: write a migration, run it, and regenerate the DB types before testing.

### Supabase gotchas (learned the hard way)

- Do **not** use `.eq('foreignTable.column', value)` to filter a joined table in supabase-js — it generates broken PostgREST SQL. Fetch the join unfiltered and filter in JS.
- Privileged writes (create/update/delete registrations, admin management) use the **service-role** Supabase client inside a server route handler — never the browser. Deleting an admin means deleting the **Clerk** user (Clerk backend API), then its `profiles`/`user_roles` rows.
- There is no `auth.users` table to join against (Supabase Auth is unused) — the admin identity lives in Clerk; `profiles` is keyed by the Clerk user id.

---

## 6. Server route handlers (Next.js `app/api/*`)

All privileged server work lives in Next.js route handlers (these replace v1's Supabase Edge Functions). Group by concern:

- **Registration/payment**: `register`, `checkout`, `stripe-webhook`, and the cron routes `cron/payment-reminders` and `cron/info-mails` (specs/012-info-mails). Mail logic lives in `lib/email/` (Resend over `fetch`; env `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `CRON_SECRET`, `APP_URL`). The prelaunch gate reads `COMING_SOON` in `proxy.ts` (specs/023-coming-soon).
- **Admin/auth**: create-admin, update-admin, delete-admin, `create-invitation`, `accept-invitation`, `send-confirmation-email`. (Password reset and email verification are handled by Clerk, so no custom routes for those.)

Rules:

- Every privileged route validates the Clerk session first (and role/permissions in `profiles` where relevant); reject unauthorized callers with `401`/`403`.
- The Stripe webhook route verifies the Stripe signature; the cron route verifies `CRON_SECRET`. These two are not Clerk-authenticated.
- Validate input with Zod.
- Secrets (Stripe, Supabase service role, Clerk secret, email provider) come from environment, never hardcoded, never shipped to the browser.
- Do not build the dropped v1 functions (`backup-database`, `send-test-email`) unless explicitly requested.

---

## 7. Workflow: Spec Driven Development with Spec Kit

Every feature runs through Spec Kit (skills in `.claude/skills/speckit-*`, templates and scripts in `.specify/`):

1. Read `.specify/memory/constitution.md` and this file.
2. `/speckit-specify`: describe **what** and **why** (user stories, acceptance criteria), no technology. Creates `specs/<number>-<feature>/spec.md`.
3. `/speckit-clarify` (optional, recommended): resolve open questions before planning.
4. `/speckit-plan`: technical plan, data model and contracts, including a Constitution Check. Read the skills needed for the feature (section 8) and inspect the real code here.
5. `/speckit-tasks`: dependency ordered `tasks.md`.
6. `/speckit-analyze` (optional): consistency check across spec, plan and tasks.
7. Ask the user to approve spec and plan. Implement only after approval.
8. `/speckit-implement`: execute the tasks strictly. `/speckit-converge` picks up unbuilt work.
9. Run the checks from section 10 and report the output verbatim.
10. Share exact steps to test or run the completed feature.

Small fixes that change no behaviour (typos, copy, a single obvious bug) may skip the spec, but still follow the constitution. Do not code a feature before its spec and plan exist unless the user explicitly says to skip them.

---

## 8. Skills

Use only these skills (plus the Spec Kit workflow skills `.claude/skills/speckit-*` from section 7):

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


## 9. Specs

Live in `specs/<number>-<feature>/` (e.g. `specs/001-registration-form/`), created by Spec Kit: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `tasks.md`.

The plan covers: existing code inspected · decisions and assumptions · files likely to change · security requirements · acceptance criteria · checks to run · exact manual test steps.

For UI features the spec and plan also cover: layout, typography, spacing, colors, responsiveness, and states (loading/empty/error).

The former `prompts/` folder is historical reference only. Do not add new prompt files there.

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

- Public routes: `app/page.tsx` (landing), `app/bezahlen/*`, `app/packzettel/page.tsx`, `app/meine-anmeldung/[token]/page.tsx`, `app/kalender/[campId]/route.ts`, `app/impressum/page.tsx`, `app/datenschutz/page.tsx`
- Admin: `app/admin/*` (protected by Clerk in `proxy.ts`) + `components/admin/*`
- Room planning and tent circles: `app/admin/zimmerplanung`, `app/admin/zeltkreise`, server data in `lib/admin/rooms-data.ts` and `lib/admin/tent-circles-data.ts`
- Auth: Clerk (`proxy.ts`, Clerk components/hooks) + `app/admin/accept-invitation`
- Governance and specs: `.specify/memory/constitution.md`, `specs/*`
- Current camp: a `useCamp` hook / server helper backed by `camp_settings`
- Supabase clients + DB types: `lib/`
- Server logic: `app/api/*` route handlers; schema in `supabase/migrations/`

> To port v1 behaviour, the old logic lives in the previous Vite tree: `src/pages/*`, `src/components/admin/*`, `src/hooks/*`, and `supabase/functions/*`. Reuse the *logic and data flow*, not the Vite/Supabase-Auth wiring.
