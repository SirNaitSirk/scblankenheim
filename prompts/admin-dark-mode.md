# Prompt: Dark Mode — Admin Dashboard only

## Goal
Add a dark theme that applies **only** to the admin dashboard (`/admin/*`). The
public landing / marketing / auth pages stay in the current light theme, always.
Admins get a **Light / Dark / System** control in the topbar; the default is
**System** (follows `prefers-color-scheme`). The chosen mode persists across
sessions and renders with **no flash** (FOUC) on first paint.

## Existing code inspected
- `app/globals.css` — token system. Semantic tokens (`--background`, `--surface`,
  `--foreground`, `--muted-foreground`, `--border`, `--accent`, `--on-inverse`,
  `--ring`, `--shadow-*`, `--surface-inverse`) are derived from an ink primitive
  scale (`--ink-950 … --ink-50`, `--paper`, `--canvas`) + an amber accent, all in
  `:root`. Tokens are exposed to Tailwind v4 via `@theme inline`.
- `app/layout.tsx` — root layout, `<html lang="de">` + `<body class="… bg-canvas
  text-foreground">`, wraps children in `ClerkProvider` with a hardcoded light
  `clerkAppearance` (amber primary, white background).
- `app/admin/layout.tsx` — server component, renders `<AdminShell>`.
- `components/admin/admin-shell.tsx` — client component, root `<div class="flex
  min-h-[100dvh] bg-canvas">`. Owns the sidebar + `AdminTopbar` + `<main>`. Uses
  a `useSyncExternalStore` + `localStorage` + custom-event pattern for the
  collapsed-rail state (`cc-admin-sidebar-collapsed`) — the theme store will
  mirror this exact pattern.
- `components/admin/admin-topbar.tsx` — client component with the sidebar toggle
  button (left) and user name + Clerk `UserButton` (right). The theme control
  goes here.
- `lib/admin/messages.ts` — single source of German UI copy (`de.shell.*`). New
  visible strings go here.
- Token usage audit across `components/admin` + `app/admin`: overwhelmingly
  semantic (`text-foreground` ×27, `text-muted-foreground` ×43, `border-border`
  ×17, `bg-surface` ×11). Raw ink-scale usages that need to behave under dark:
  `bg-ink-100` (hover, ×18), `bg-ink-50` (×3), `text-ink-700/500/300`,
  `text-on-inverse` on `bg-surface-inverse`, `bg-ink-950/40` (mobile scrim),
  `text-amber-400`, `text-success`, `bg-accent`. No `bg-white`/`#fff` literals in
  admin except the scrim/inverse cases above.

## Decisions / assumptions
- **Control mode:** Light / Dark / System, default System (per user decision).
- **Mechanism:** override the CSS token values in a dark scope. Because the admin
  UI is token-driven, re-pointing the tokens recolors the whole dashboard with
  almost no per-component edits.
- **Scoping (admin-only):** the dark override selector is
  `html[data-admin-theme="dark"] .admin-theme-scope { … }`. The `.admin-theme-scope`
  class is added to the `AdminShell` root `<div>`. The `data-admin-theme`
  attribute lives on `<html>` so a pre-hydration inline script can set it before
  paint (no FOUC). Public pages never carry `.admin-theme-scope`, so even if the
  `<html>` attribute lingers after a client-side nav out of `/admin`, public
  pages are unaffected. The inline script is rendered **only** in the admin layout.
- **Neutral inversion:** inside the dark scope, invert the neutral ink primitives
  (`--ink-950 … --ink-50`) so raw neutral utilities (`bg-ink-100` hover,
  `bg-ink-50`, `text-ink-700`, and `text-on-inverse` on `--surface-inverse`) stay
  self-consistent. Accent (amber) and status (success/danger) hues are **not**
  inverted — only re-tuned for contrast on a dark surface where needed.
- **`System` resolution:** when mode = System, resolve via
  `window.matchMedia('(prefers-color-scheme: dark)')` and live-update on change.
  Light/Dark are explicit overrides.
- **Persistence key:** `localStorage["cc-admin-theme"]` with values
  `"light" | "dark" | "system"`. Absent → treated as `system`.
- No new dependency (no `next-themes`) — reuse the in-repo external-store pattern
  for consistency with the sidebar state.
- Clerk `UserButton`/components inside admin: acceptable to leave Clerk's own
  popover in its default appearance for this pass (the `UserButton` menu is a
  Clerk-rendered surface). If it looks jarring, note it as a follow-up rather than
  expanding scope. The topbar chrome itself is our markup and themes correctly.

## Files changed
- `app/globals.css`
  - New block: `html[data-admin-theme="dark"] .admin-theme-scope { … }` re-defining
    the ink scale (inverted neutrals) + semantic tokens for dark:
    `--background` (deep ink, e.g. `--ink-950`-ish `#0f0f11`), `--surface`
    (slightly lifted, e.g. `#18181b`), `--surface-inverse` (light), `--foreground`
    (near-white), `--muted-foreground` (mid), `--border` (low-contrast dark),
    `--on-inverse` (dark), `--ring`/`--accent` retuned amber, `--shadow-card`
    /`--shadow-pop` deepened for dark. `::selection` stays amber (already global).
    Exact hex values chosen for WCAG-AA body-text contrast.
- `hooks/use-admin-theme.ts` **(new)**
  - `type ThemeChoice = "light" | "dark" | "system"`.
  - `useSyncExternalStore` reading `cc-admin-theme` + a custom `cc-theme-change`
    event + a `storage` listener (mirrors `admin-shell.tsx`).
  - `setThemeChoice(choice)` writes localStorage, applies the resolved attribute
    to `document.documentElement` (`data-admin-theme`), dispatches the event.
  - Resolves `system` against `matchMedia` and subscribes to its `change` so a
    live OS switch updates the DOM while mounted.
  - Server snapshot returns `"system"` (safe default; the inline script has
    already set the real attribute pre-paint).
- `hooks/theme-init-script.ts` **(new, tiny)** or inline string in the admin layout
  - A stringified IIFE: read `localStorage["cc-admin-theme"]`, resolve `system`
    via `matchMedia`, set `document.documentElement.setAttribute
    ("data-admin-theme", resolved)`. Wrapped in try/catch. Injected via
    `<script dangerouslySetInnerHTML>` at the top of the admin layout so it runs
    before first paint.
- `app/admin/layout.tsx`
  - Render the pre-hydration inline theme script (blocking, before `<AdminShell>`).
- `components/admin/admin-shell.tsx`
  - Add `admin-theme-scope` to the root `<div>` class. Also add a matching
    `min-h-[100dvh]`-safe dark background is handled by the token, so keep
    `bg-canvas` (it re-points under dark).
- `components/admin/admin-topbar.tsx`
  - Add a theme control between the title/left area and the user cluster. A small
    icon button that cycles or a 3-state segmented control (Sun / Moon / Monitor
    from `@phosphor-icons/react`, already a dependency). Accessible: `aria-label`
    / `aria-pressed`, keyboard-focusable, `focus-visible` ring consistent with the
    existing sidebar button styling.
- `lib/admin/messages.ts`
  - Add `de.shell.theme`: `{ label: "Design", light: "Hell", dark: "Dunkel",
    system: "System", toggle: "Design wechseln" }` (German UI copy).

## Implementation requirements
- Only the admin subtree changes color. Verify a public route (`/`) is byte-for-byte
  the same light theme with the toggle set to Dark.
- No FOUC: on a hard reload of an admin page with Dark (or System=dark) selected,
  the first paint is already dark.
- Prefer token re-pointing over editing component color classes. Touch component
  markup only where a raw color would otherwise break (audit list above is
  handled by the neutral inversion; confirm each visually).
- Respect the existing `prefers-reduced-motion` block; the theme switch itself
  should not animate large layout — token color transitions may use a short,
  reduced-motion-safe transition or none.
- TypeScript throughout, explicit types, small functions. No `any`. English
  identifiers; German only in `messages.ts` values.
- Contrast: body text and muted text on dark surfaces meet WCAG AA. Amber accent
  and focus ring remain visibly distinct on dark.

## Security requirements
- Purely client-side presentation. No secrets, no server data, no new env vars,
  no privileged routes. The inline script only reads `localStorage` + `matchMedia`
  and sets a DOM attribute (try/catch guarded).

## Acceptance criteria
- Topbar shows a Light / Dark / System control; selection persists across reloads.
- Default (no prior choice) follows OS: dark OS → admin loads dark; light OS →
  light.
- With System selected, toggling the OS appearance live-updates the admin theme
  while the page is open.
- Public/marketing/auth pages remain light regardless of admin choice.
- No visible flash of the wrong theme on admin page reload.
- All admin surfaces (dashboard, finances, camps, logs, users, profile, sidebar,
  topbar, mobile drawer, empty/loading/error states) are legible and coherent in
  dark — no white cards on dark, no dark text on dark.

## Checks
- `npm run lint` — clean.
- `npm run build` — passes.
- Manual visual pass of each `/admin/*` route in both themes.

## Manual test steps
1. `npm run dev`, open `http://localhost:3000/admin`.
2. Set OS appearance to Dark, control on System → admin renders dark; `/` stays
   light.
3. Switch control to Light → admin turns light immediately; reload → still light
   (persisted), no flash.
4. Switch to Dark, hard-reload → dark on first paint (no flash).
5. Set control to System, flip OS appearance back and forth → admin follows live.
6. Walk every admin route + open the mobile drawer (narrow viewport) and the
   loading/error states → all legible in dark.
7. Confirm public pages (`/`, `/sign-in`) ignore the admin theme entirely.
