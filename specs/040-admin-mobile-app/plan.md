# Implementation Plan: Admin am Handy und als Homescreen App

**Branch**: `040-admin-mobile-app` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

## Summary

Pure frontend change inside the admin surface. Form controls get 16px text below `md`, dialogs go
full screen below `sm`, touch targets grow to 44px below `md`, the registrations list renders as
cards below `md`, and the mobile drawer gets scroll lock, focus handling and correct labels. For
the home screen app the admin layout links its own static manifest and its own Apple icon, sets a
viewport with `viewport-fit=cover` and theme colors, and a Tailwind `standalone` variant shows a
reload button and a bottom bar (Übersicht, Finanzen, Bus, Menü) only in standalone mode on phones.
No schema change, no new runtime dependency, no server route.

## Technical Context

- Next.js 16.4.3 App Router, React 19, Tailwind CSS v4 (`@import "tailwindcss"` in `app/globals.css`),
  phosphor icons, own UI primitives in `components/ui/`.
- Breakpoints: `md` (768px) is where the sidebar becomes fixed (`DESKTOP` in
  `components/admin/admin-shell.tsx:17`); "Handybreite" in the spec means below `md`.
- Icons are built once by a script with `sharp` (already in `node_modules` through Next) and
  committed as PNG; no runtime use.
- Tests: vitest in `tests/unit/`; only pure helpers are unit tested.

## Existing code inspected

- `components/ui/input.tsx:5`, `components/ui/select.tsx:17`, `components/ui/textarea.tsx:5`: all
  controls use `text-sm` (14px), the cause of the iOS focus zoom.
- `components/ui/dialog.tsx:81`: centered panel with `p-4`, `max-h-[calc(100dvh-2rem)]`; close
  button `h-8 w-8` (line 113); footer `flex items-center justify-end gap-3` without wrap (line 122).
  Body scroll lock and focus trap already exist (lines 38 to 71).
- `components/ui/button.tsx:26`: `sm` is `h-9`, `md` is `h-11`.
- `components/ui/menu.tsx:87`: menu trigger `h-8 w-8`.
- `components/admin/admin-topbar.tsx`: one toggle button labelled `de.shell.collapse` on every
  width; theme control buttons `h-7 w-7`.
- `components/admin/admin-shell.tsx:90`: mobile drawer without scroll lock and focus handling.
- `components/admin/admin-sidebar.tsx`: nav items `py-2`; items filtered by `canSeeTab`.
- `components/admin/registrations-table.tsx:222`: table `min-w-[640px]` with draggable headers;
  empty state inside the table component.
- `components/admin/finance-table.tsx:265`: existing `md:hidden` card list, the pattern to reuse.
- `lib/admin/types.ts:22`: `Registration` has `firstName`, `lastName`, `status`, `payment`,
  `amountDue`, `amountPaid`.
- `hooks/use-admin-theme.ts`: resolves the admin theme and sets `data-admin-theme` on `<html>`.
- `app/layout.tsx`: no `viewport` export; `app/apple-icon.png` and `app/icon.png` are the public
  icons and apply to every route.
- `proxy.ts` matcher skips paths ending in `.png` and `.webmanifest`, so static files in `public/`
  and `app/admin/apple-icon.png` load without a Clerk session and outside the prelaunch gate.
- `lib/admin/messages.ts:181`: `de.shell` already has `openMenu` and `closeMenu`.
- Next docs read: `03-file-conventions/01-metadata/manifest.md`, `app-icons.md`,
  `04-functions/generate-metadata.md` (`manifest`, `appleWebApp`),
  `04-functions/generate-viewport.md` (`themeColor`, `viewportFit`).

## Decisions

See [research.md](research.md) for rationale and alternatives.

- **D1 Input size**: an unlayered rule in `app/globals.css` sets 16px for `input`, `select` and
  `textarea` inside `.admin-theme-scope` below `md`. The primitives stay untouched because public
  pages use them too (FR-014, SC-006). No `maximum-scale`, pinch zoom stays (FR-001, FR-002).
- **D2 Dialog**: below `sm` the wrapper has no padding and aligns to the top; the panel is
  `h-[100dvh] w-full rounded-none`, from `sm` it keeps today's classes. Header gets top safe area
  padding, footer gets `flex-wrap` and bottom safe area padding. Close button `h-11 w-11 sm:h-8 sm:w-8`
  (FR-003, FR-004).
- **D3 Touch targets**: below `md`: `Button` and `ButtonLink` carry `data-size`, and an admin scoped
  rule gives `[data-size="sm"]` a 44px minimum height (public pages unchanged); menu trigger
  `h-11 w-11 md:h-8 md:w-8`, nav items `py-3 md:py-2`, theme buttons `h-11 w-11` inside the drawer
  (FR-005).
- **D4 Theme control**: hidden in the topbar below `md` (`hidden md:flex`), rendered in the drawer
  footer below `md` (FR-006).
- **D5 Registration cards**: new `components/admin/registration-card-list.tsx`, rendered `md:hidden`
  with the same `rows` array the table gets, so search, filters and sort are identical by
  construction. The table wrapper becomes `hidden md:block`. The empty state moves up into
  `registrations-manager.tsx` so both views share it. Card: full name, reference, status badge,
  payment badge, due and outstanding amount; the whole card is a button that calls `onEdit`
  (FR-007, FR-008, FR-009).
- **D6 Drawer**: scroll lock and focus trap like `Dialog`; focus returns to the toggle on close.
  The topbar renders two toggle buttons: `md:hidden` with `aria-label` „Menü öffnen“ or „Menü
  schließen“ plus `aria-expanded`, and `hidden md:flex` with collapse or expand. No viewport check
  in JS, so no hydration mismatch (FR-010, FR-011).
- **D7 Manifest**: static `public/admin.webmanifest` (name „Summercamp Admin“, short name
  „SC Admin“, `start_url: /admin`, `scope: /`, `display: standalone`, background and theme color
  from the light tokens, icons 192, 512 and a maskable 512). Linked only through `metadata.manifest`
  in `app/admin/layout.tsx`, so public pages never reference it (FR-013, FR-014). `scope` is `/`
  because sign in lives at `/sign-in`; see research R2.
- **D8 Icons**: `scripts/build-admin-icons.mjs` renders an SVG of the admin monogram „SC“ (inverse
  surface, amber accent) with `sharp` into `public/admin-icons/icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png` and `app/admin/apple-icon.png` (180px). The nested `apple-icon.png`
  overrides the root one for `/admin` (FR-015); verified in the build output, research R3.
- **D9 Apple and viewport**: `app/admin/layout.tsx` exports `metadata.appleWebApp`
  (`capable: true`, title „Summercamp Admin“, `statusBarStyle: "default"`) and
  `viewport` (`viewportFit: "cover"`, `themeColor` light and dark by media query). The theme hook
  also writes the resolved admin theme color into `meta[name=theme-color]`, so a manual light or
  dark choice wins over the system setting (FR-016, research R4).
- **D10 Standalone variant**: `@custom-variant standalone (@media (display-mode: standalone));` in
  `app/globals.css`. Every standalone only element is hidden by CSS by default and shown with
  `standalone:`, so server and client render the same markup.
- **D11 Safe areas**: topbar `pt-[env(safe-area-inset-top)]` with its 64px row below; left and right
  padding `max(1rem, env(safe-area-inset-left/right))`; drawer, dialog footer and bottom bar pad
  `env(safe-area-inset-bottom)` (FR-017).
- **D12 Reload**: `components/admin/reload-button.tsx`, icon button `hidden standalone:flex`, calls
  `window.location.reload()`; offline that shows the normal error page and retries on the next tap
  (FR-018).
- **D13 Bottom bar**: `components/admin/admin-bottom-bar.tsx`, `nav` fixed to the bottom,
  `hidden standalone:flex md:standalone:hidden` (exact variant order checked in implementation),
  entries Übersicht, Finanzen, Bus filtered with `canSeeTab` like the sidebar, plus „Menü“ which
  calls the shell's open handler. Active entry uses the sidebar's `isActive` (moved to
  `nav-items.ts` as a shared helper and unit tested). `main` gets matching bottom padding in
  standalone below `md`. Bar `z-30`, dialogs stay `z-50` above it (FR-019a).
- **D14 App feel**: in `globals.css` `html[data-admin-theme]` gets `overscroll-behavior: none` inside
  the standalone media query, and `.admin-theme-scope` gets `-webkit-tap-highlight-color:
  transparent` (FR-019).
- **D15 Links out**: the two admin links with `target="_blank"` stay as they are; Stripe and mail
  links already leave the app. No extra code (FR-020).
- **D16 Copy**: new strings in `lib/admin/messages.ts` under `de.shell` (`reload`, `bottomNav`,
  `menu`) and `de.registrations.card` (FR-024). Home screen guide lives in
  [quickstart.md](quickstart.md) (FR-023).

## Files likely to change

- `components/ui/input.tsx`, `components/ui/select.tsx`, `components/ui/textarea.tsx`
- `components/ui/dialog.tsx`, `components/ui/button.tsx`, `components/ui/menu.tsx`
- `components/admin/admin-shell.tsx`, `components/admin/admin-topbar.tsx`,
  `components/admin/admin-sidebar.tsx`, `components/admin/nav-items.ts`
- `components/admin/registrations-manager.tsx`, `components/admin/registrations-table.tsx`
- new `components/admin/registration-card-list.tsx`, `components/admin/admin-bottom-bar.tsx`,
  `components/admin/reload-button.tsx`
- `hooks/use-admin-theme.ts`
- `app/admin/layout.tsx`, `app/globals.css`
- new `public/admin.webmanifest`, `public/admin-icons/*.png`, `app/admin/apple-icon.png`,
  `scripts/build-admin-icons.mjs`
- `lib/admin/messages.ts`
- new `tests/unit/admin-nav.test.ts`
- `AGENTS.md` section 4 (one sentence, specs/040)

## UI design

- **Layout**: below `md` one column; topbar 64px plus top safe area; content padding stays `px-4`;
  in standalone a 64px bottom bar plus bottom safe area. From `md` unchanged.
- **Typography**: form controls 16px below `md`; card name `font-medium` 16px, reference
  `font-mono text-xs` as in the finance cards; bottom bar labels 11px under 22px icons.
- **Spacing**: cards `px-4 py-4`, `divide-y`, 44px minimum hit area for every interactive element
  listed in FR-005.
- **Color**: existing tokens only; active bottom bar entry uses `text-foreground` with filled icon
  and amber accent like the active sidebar item, inactive `text-muted-foreground`.
- **States**: card list shares the table's empty state; loading stays `app/admin/loading.tsx`;
  offline reload shows `app/admin/error.tsx`.
- **Motion**: none new; existing dialog animation stays, reduced motion untouched.

## Security

- No new route, no data path change, no secret. Manifest and icons are public static files with no
  personal data. Bottom bar entries reuse `canSeeTab`; page guards (`guardTab`) stay the real gate
  (FR-022).

## Constitution Check

- I Fixed stack: Next.js metadata API, Tailwind, existing primitives; `sharp` only in a build
  script, no new runtime dependency. Pass.
- II Server boundary: unchanged, no privileged code touched. Pass.
- III Strict scope: admin dashboard usability, inside the admin scope of AGENTS.md section 4;
  offline, push and splash screens excluded. Pass.
- IV Single source of truth: no schema change; one registrations data set feeds table and cards.
  Pass.
- V Language: German copy in `lib/admin/messages.ts`, English code. Pass.
- VI Payment and pricing: not touched; cards show only amounts already visible in the table. Pass.
- VII Simplicity: CSS variants instead of JS viewport detection, no service worker, one shared
  `isActive` helper. Checks below. Pass.
- Writing rules: no dashes in copy, comments or commits. Pass.

## Checks

`npm run lint`, `npm test`, `npm run build` (layout metadata and new static files).

## Manual test

See [quickstart.md](quickstart.md).
