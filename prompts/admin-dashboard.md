# Admin Dashboard — full shell + in-scope pages

## Goal

Build the CampConnect **admin surface** on the existing design system: a reusable
admin shell (collapsible sidebar + top bar) plus real, well-crafted content for
every **in-scope** section — Dashboard, Finanzen, Camps, Logs, Benutzer, Profil.
This is an **Operate**-mode surface (impeccable): the tool disappears into the
task; earned familiarity over expression. Anti-slop discipline from the taste
skill applies to the details (icons from a library, honest data, no fake states).

The v1 screenshot is a layout reference only. We follow the **rebuild scope**
(AGENTS.md), so housing (`Hausplanung`), `Backups`, and the mail-template editor
(`Mails`) are **not** built and **not** in the nav.

## Existing code inspected

- `app/globals.css` — three-layer token system (primitive → semantic →
  component). Monochrome **ink** scale + one **amber** accent. Radii
  (`--radius-sm/input/card/pill`), tinted shadows (`--shadow-card/pop`), motion
  (`--ease-out-expo`, 150/250ms). Light-mode only today.
- `lib/design-tokens.ts` — typed token names. Prefer Tailwind utilities
  (`bg-surface`, `rounded-card`, `text-muted-foreground`, `text-on-inverse`, …).
- `lib/cn.ts` — `cn()` class joiner (no clsx/twMerge dependency).
- `components/ui/*` — `Button` (primary/inverse/outline/ghost · sm/md/lg),
  `Card`/`CardHeader`/`CardTitle`/`CardContent`/`CardDescription`, `Badge`
  (paid/pending/neutral/danger), `Eyebrow`.
- `components/admin/stat-card.tsx` — metric tile; `hero` = near-black variant.
- `components/admin/dashboard-preview.tsx` — the compact Operate preview used on
  `/design-system`; the real dashboard supersedes it (leave the preview intact).
- `media/Skillset …Dashboard.jpeg` — the incumbent Operate reference the design
  system was modeled on (sidebar + logo + nav + upgrade card; topbar with search
  + segmented control + date range; hero stat card + 3 light tiles; content
  panels; bottom data table).
- Stack: Next.js 16 (App Router) + React 19 + Tailwind v4.
- **Clerk is installed and wired** (`@clerk/nextjs` 7.7.4): real `pk_test`/
  `sk_test` keys in `.env.local` (gitignored), `ClerkProvider` in
  `app/layout.tsx`, catch-all `app/sign-in/[[...sign-in]]` and
  `app/sign-up/[[...sign-up]]` routes (Clerk's default, unstyled English), env
  sign-in/up URLs set to `/sign-in`·`/sign-up` with fallback redirect `/`, and a
  first test user created. **Missing:** `middleware.ts` — so nothing is
  protected yet.
- **Not** installed: Supabase, TanStack Query, icon library.

## Decisions & assumptions

1. **Auth is real (Clerk); data is still mock.** `/admin/*` is gated by Clerk in
   this slice — the dashboard is only reachable after logging in. Supabase is not
   installed, so the *content* runs against typed mock data in
   `lib/admin/mock-data.ts`; real reads (Supabase service-role in route handlers)
   are a **separate later prompt**. Every page is built so swapping mock → real
   data is a data-source change, not a redesign. A short comment marks each mock
   boundary.
2. **In-scope nav only:** Dashboard, Finanzen, Camps, Logs, Benutzer, Profil.
3. **Icons:** install **`@phosphor-icons/react`** (React 19 compatible) — the
   taste skill bans hand-rolled SVG icons and requires one family, one
   `weight`/size standard. Used in the sidebar, topbar, and empty states.
4. **Theme toggle deferred.** The token set is light-only. Rather than ship a
   non-functional sun toggle (fake state = slop) or expand theming across the
   public site in this slice, we **omit** the toggle and note a follow-up:
   a `useTheme` hook + `.dark` token layer (AGENTS lists `useTheme`). The topbar
   carries the real Clerk user + logout instead (see decision 7).
5. **German UI copy is centralized** in `lib/admin/messages.ts` (per AGENTS
   language rule); code identifiers stay English.
6. **Drop out-of-scope metrics** from the v1 stat row (`Hausplätze`,
   `Busplätze` = housing/bus). Dashboard tiles are in-scope: Anmeldungen,
   Bezahlt, Offen, Einnahmen.
7. **Clerk gating (in this prompt).** Add `middleware.ts` with `clerkMiddleware`
   + `createRouteMatcher(['/admin(.*)'])` calling `auth.protect()`, so logged-out
   visitors to any `/admin/*` route are redirected to `/sign-in`; public routes
   (`/`, `/bezahlen`, `/packzettel`, `/design-system`, `/sign-in`, `/sign-up`)
   stay open. The admin topbar reads the signed-in admin via Clerk's `useUser()`
   and renders `<UserButton>` for account + sign-out (no custom logout). The
   existing sign-in/up pages are restyled to the design system and localized to
   German (`@clerk/localizations` `deDE` on `ClerkProvider` + `appearance` mapped
   to the ink/amber tokens), and the admin sign-in redirect target is `/admin`.
   Mapping each Clerk user to a `profiles`/`user_roles` row (role + permissions)
   is **out of scope here** (needs Supabase) — the Benutzer/Profil pages render
   role/permission UI on mock data for now.

## Files likely to change / add

**Data + helpers**
- `lib/format.ts` — German formatters: `formatCurrency` (de-DE, EUR),
  `formatNumber`, `formatDate`. Small, typed, centralized.
- `lib/admin/types.ts` — `Registration`, `Camp`, `PriceTier`, `AdminUser`,
  `UserRole`, `LogEntry`, `FinanceSummary`, `RegistrationStatus`,
  `PaymentStatus`.
- `lib/admin/mock-data.ts` — realistic placeholder data (locale-appropriate
  German names, messy/organic numbers — no `50%`/`1234567`; no "Jane Doe").
- `lib/admin/messages.ts` — German label dictionary for the admin surface.

**Auth (Clerk)**
- `middleware.ts` (repo root) — `clerkMiddleware` + `createRouteMatcher`
  protecting `/admin(.*)`; standard Next matcher (skip static, include api).
- `app/layout.tsx` — add `localization={deDE}` and an `appearance` mapped to the
  design tokens on the existing `ClerkProvider` (installs `@clerk/localizations`).
- `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx` —
  restyle to the design system (centered card on `bg-canvas`, brand block), set
  the admin redirect to `/admin`.

**Shell**
- `app/admin/layout.tsx` — server component; renders `AdminShell` around
  `children`.
- `components/admin/admin-shell.tsx` — `"use client"`; holds sidebar-collapsed
  state (persisted to `localStorage`), renders sidebar + topbar + content slot.
- `components/admin/admin-sidebar.tsx` — brand block, nav (active state via
  `usePathname`), collapsed/rail mode.
- `components/admin/admin-topbar.tsx` — page title + current-camp badge +
  subtitle (from page context), sidebar collapse toggle, and the real signed-in
  admin via Clerk `useUser()` + `<UserButton>` (account + sign-out).
- `components/admin/nav-items.ts` — nav config: `{ label, href, icon }`.
- `components/admin/page-header.tsx` — reusable in-content header
  (title + badge + description + optional actions), for consistency across pages.

**Dashboard (`app/admin/page.tsx`)**
- `components/admin/payment-overview.tsx` — Zahlungsübersicht (Standardpreis ·
  Erwartet · Eingenommen X/Y · Ausstehend).
- `components/admin/registrations-filters.tsx` — search + status/camp/payment
  selects + "Gelöschte anzeigen" toggle + "Filter hinzufügen".
- `components/admin/registrations-table.tsx` — columns, row actions, CSV export
  button, sorted; loading/empty states.
- `components/ui/input.tsx`, `components/ui/select.tsx`,
  `components/ui/switch.tsx` — minimal form primitives styled to the tokens
  (label-above pattern; focus ring `ring-ring`), since none exist yet.

**Other in-scope pages** (each: `PageHeader` + real content on mock data,
with empty/loading/error affordances)
- `app/admin/finanzen/page.tsx` — revenue overview: finance stat tiles, paid vs
  outstanding, breakdown by price tier.
- `app/admin/camps/page.tsx` — camps list, current-camp marker, "Camp erstellen"
  action, entry point to form-field config (UI stub, labeled).
- `app/admin/logs/page.tsx` — activity/error log table (level badge, actor,
  message, timestamp).
- `app/admin/benutzer/page.tsx` — admin users table (role, permissions summary),
  "Benutzer einladen" action.
- `app/admin/profil/page.tsx` — current admin profile + role + granular
  permissions view.

## Implementation requirements

- TypeScript throughout; small typed components; no `any`. Reuse existing UI
  primitives; do not fork `Button`/`Card`/`Badge`.
- Server Components by default; `"use client"` only where interactivity needs it
  (shell state, filters, sortable table, collapse toggle).
- Data flows from mock helpers via props; keep a single clearly-commented mock
  boundary per page so real data can be dropped in later.
- One icon family (`@phosphor-icons/react`), standardized `size` and `weight`.
- All user-facing strings German, pulled from `lib/admin/messages.ts`.
- Overlays (dropdowns/menus in the table row actions / filters) must escape
  clipping — use the popover API / `position: fixed` / a portal, not an
  absolutely-positioned child inside an `overflow` ancestor.
- Verify `@phosphor-icons/react` is added to `package.json` before importing it.

## Design requirements (Operate)

- **Layout.** Fixed left sidebar (≈248px; rail ≈72px when collapsed) on a second
  neutral surface (sidebar `bg-surface`/`bg-ink-50`, content on `bg-canvas`).
  Content max-width container, generous but product-appropriate density
  (`py-16`→`py-6` scale, not landing-page air). Sticky top bar.
- **Typography.** `font-sans` (Geist) carries the UI; `font-display` (Archivo)
  reserved for page titles and big metric numbers; `font-mono` for IDs and
  tabular figures. Fixed rem scale, tighter ratio; no fluid clamp headings.
- **Color.** Restrained. Amber accent only for the primary action, current
  selection, and active nav item — never decoration. Status via `Badge` tones.
  Full state vocabulary standardized (hover/focus/active/disabled/selected).
- **Spacing/shape.** One radius system (cards `rounded-card`, controls
  `rounded-input`, pills `rounded-pill`). Tinted shadows only (`shadow-card`),
  never pure black.
- **Responsiveness (structural, not fluid type).** Sidebar collapses to rail,
  then to an off-canvas drawer under `md`. Tables: hide secondary columns under
  `sm`, keep name + status + amount. Stat rows `grid-cols-2 lg:grid-cols-4`.
- **States.** Every interactive component: default/hover/focus/active/disabled.
  Tables/panels get **skeleton** loading (not center spinners), a composed
  **empty** state that teaches the next action, and an inline **error** state.
- **Motion.** 150–250ms on state transitions only; honor
  `prefers-reduced-motion`. No page-load choreography on Operate surfaces.
- **Anti-slop preflight (taste):** zero em-dashes in UI copy; one accent locked
  across pages; no decorative status dots; icons from the library only; honest
  organic mock numbers; no fake precision; single copy register.

## Security requirements

- `/admin/*` is enforced server-side by `clerkMiddleware` in `middleware.ts` —
  the gate, not client-side checks. Verify a logged-out request to `/admin`
  redirects to `/sign-in`.
- `CLERK_SECRET_KEY` stays server-only; never import it or the Clerk backend SDK
  into client components. Only `NEXT_PUBLIC_*` Clerk vars reach the browser.
- `.env.local` stays gitignored (already covered by `.env*`); do not commit keys.
- Leave a `TODO(data)` note where mock data is read: privileged reads must move to
  server route handlers / server components using the Supabase service-role
  client before real data lands, and each Clerk user must be mapped to a
  `profiles`/`user_roles` row for real role/permission checks.
- No real personal data committed — mock only.

## Acceptance criteria

- Logged **out**, visiting `/admin` (or any `/admin/*`) redirects to `/sign-in`;
  after signing in with the test user, the admin surface loads.
- The topbar shows the real signed-in admin and `<UserButton>` signs out.
- Sign-in/up pages are on-brand and German.
- `/admin` renders the shell + full Dashboard (stat tiles, Zahlungsübersicht,
  filters bar, registrations table) on mock data.
- `/admin/finanzen`, `/admin/camps`, `/admin/logs`, `/admin/benutzer`,
  `/admin/profil` all render with `PageHeader` + real content and proper
  empty/loading/error affordances.
- Sidebar shows only in-scope items; active item reflects the current route;
  collapse toggle works and persists; drawer works under `md`.
- All visible copy is German and sourced from `messages.ts`.
- Layout holds from 360px to wide desktop; no horizontal overflow; tables degrade
  gracefully.
- `npm run lint` clean; `npm run build` succeeds.

## Checks to run

- `npm run lint`
- `npm run build`
- After build, run the impeccable detector over the changed admin targets:
  `node .agents/skills/impeccable/scripts/detect.mjs --json app/admin components/admin`
  and address material findings.

## Manual test steps

1. `npm run dev`. In a private window (logged out), open
   http://localhost:3000/admin → confirm redirect to `/sign-in`.
2. Sign in with the test user → redirected into `/admin`; topbar shows the real
   user; `<UserButton>` → sign-out returns to the public site.
3. Confirm sidebar (in-scope items only), active state on Dashboard, collapse
   toggle persists across reload.
4. Dashboard: stat tiles, Zahlungsübersicht figures, filter controls (search,
   selects, "Gelöschte anzeigen", "Filter hinzufügen"), registrations table with
   row actions + CSV export button.
5. Visit each nav page; confirm content + empty/loading/error affordances.
6. Resize to 360px: sidebar → drawer, tables drop secondary columns, no overflow.
7. Tab through: visible focus rings; keyboard-operate the collapse toggle and a
   row-action menu.
8. Toggle reduced motion (OS): transitions collapse to instant.
