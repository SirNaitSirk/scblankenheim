---
description: "Tasks for specs/040-admin-mobile-app"
---

# Tasks: Admin am Handy und als Homescreen App

**Input**: `specs/040-admin-mobile-app/` (plan.md, spec.md, research.md, data-model.md,
contracts/ui.md, quickstart.md)

**Tests**: one unit test for the shared nav helper (plan D13); everything else is checked by hand
per quickstart.md.

## Phase 1: Setup

- [x] T001 Add `@custom-variant standalone (@media (display-mode: standalone));` below
  `@import "tailwindcss";` in app/globals.css (plan D10)
- [x] T002 [P] Add German strings to lib/admin/messages.ts: `de.shell.reload` „Neu laden“,
  `de.shell.bottomNav` „Schnellzugriff“, `de.shell.menu` „Menü“, `de.registrations.card`
  (labels for due and outstanding amount, reuse existing labels where they exist) (plan D16)

## Phase 2: Foundational

- [x] T003 Move `isActive(pathname, href)` from components/admin/admin-sidebar.tsx into
  components/admin/nav-items.ts as an exported helper and import it in the sidebar (plan D13)
- [x] T004 [P] Unit test `isActive` in tests/unit/admin-nav.test.ts: `/admin` only exact,
  `/admin/finanzen` matches `/admin/finanzen` and `/admin/finanzen/x`, not `/admin/finanzenx`

## Phase 3: User Story 1 · Eingaben ohne Hineinzoomen (P1)

**Goal**: no iOS focus zoom. **Independent test**: quickstart, iPhone step 1.

- [x] T005 [P] [US1] Admin scoped 16px rule for `input`, `select`, `textarea` below `md` in
  app/globals.css (plan D1; primitives untouched because public pages share them)
- [x] T006 [P] [US1] Checked: no caller passes its own text size to `Input`, `Select`, `Textarea`
- [x] T007 [P] [US1] Checked: components/ui/dialog.tsx and menu.tsx are used only in the admin
- [x] T008 [US1] Check components/admin/release-settings-card.tsx and
  components/admin/field-preview.tsx raw controls; give any text control below 16px on phones
  `text-base md:text-sm` (file inputs and checkboxes excluded)

## Phase 4: User Story 2 · Dialoge, die aufs Handy passen (P1)

**Goal**: full screen dialogs on phones. **Independent test**: quickstart, browser step 3.

- [x] T009 [US2] In components/ui/dialog.tsx: wrapper `items-start p-0 sm:items-center sm:p-6`;
  panel `h-[100dvh] max-h-[100dvh] rounded-none border-0 sm:h-auto sm:max-h-[calc(100dvh-2rem)]
  sm:rounded-card sm:border` keeping `w-full` and the caller's max width from `sm`; header
  `pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4`; footer `flex-wrap` plus
  `pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4`; close button `h-11 w-11 sm:h-8 sm:w-8`
  (plan D2)
- [x] T010 [US2] Check components/admin/registration-form-dialog.tsx footer (`mr-auto` delete
  button) wraps cleanly at 375px; adjust only classes if needed

## Phase 5: User Story 5 · Auf den Homescreen legen (P1)

**Goal**: installable admin app. **Independent test**: quickstart, browser step 6 and iPhone
steps 2, 3, 8, 9.

- [x] T011 [P] [US5] Create scripts/build-admin-icons.mjs: inline SVG of the „SC“ monogram
  (inverse surface `#141416` background, white Archivo style bold letters, amber accent), rendered
  with `sharp` to public/admin-icons/icon-192.png, public/admin-icons/icon-512.png,
  public/admin-icons/icon-maskable-512.png (letters inside the 80% safe zone) and
  app/admin/apple-icon.png (180px, no transparency); run it and commit the PNGs (plan D8)
- [x] T012 [P] [US5] Create public/admin.webmanifest exactly as in contracts/ui.md (plan D7)
- [x] T013 [US5] In app/admin/layout.tsx extend `metadata` with `manifest: "/admin.webmanifest"`
  and `appleWebApp: { capable: true, title: "Summercamp Admin", statusBarStyle: "default" }`;
  export `viewport` with `viewportFit: "cover"` and `themeColor` light `#ffffff` and dark
  `#17171a` by `prefers-color-scheme` (plan D9)
- [x] T014 [US5] `npm run build`, then `npm run start` and check the head of `/admin` and `/`
  against contracts/ui.md: exactly one `apple-touch-icon` per page, admin icon on `/admin`,
  public icon and no manifest on `/`; if `/admin` shows both icons apply the fallback of
  research R3

## Phase 6: User Story 3 · Anmeldungen am Handy als Liste (P2)

**Goal**: card list below `md`. **Independent test**: quickstart, browser step 2.

- [x] T015 [US3] Move the empty state out of components/admin/registrations-table.tsx into
  components/admin/registrations-manager.tsx so it renders once for both views
- [x] T016 [P] [US3] Create components/admin/registration-card-list.tsx: `ul md:hidden divide-y`,
  one `li` per row with a full width `button` calling `onEdit(row)`; shows full name, reference
  (`font-mono text-xs`), status badge, payment badge (tones as in the table), due and outstanding
  amount via `formatCurrency`; long names truncate; follows the finance card pattern
  (components/admin/finance-table.tsx:265) (plan D5)
- [x] T017 [US3] In components/admin/registrations-manager.tsx render the card list with the same
  `rows` and wrap the table in `hidden md:block` (column drag stays table only)

## Phase 7: User Story 4 · Bedienelemente und Menü für den Finger (P2)

**Goal**: 44px targets, clean drawer. **Independent test**: quickstart, browser steps 4 and 5.

- [x] T018 [P] [US4] components/ui/button.tsx: `data-size` on `Button` and `ButtonLink`, admin
  scoped 44px minimum height for `sm` in app/globals.css (plan D3)
- [x] T019 [P] [US4] components/ui/menu.tsx: trigger `h-11 w-11 md:h-8 md:w-8`
- [x] T020 [US4] components/admin/admin-sidebar.tsx: nav items `py-3 md:py-2`; accept an optional
  `footer` slot rendered below the nav
- [x] T021 [US4] components/admin/admin-topbar.tsx: export `ThemeControl` with a `size` prop
  (`h-11 w-11` buttons for the drawer, today's size in the topbar); topbar instance
  `hidden md:flex`; two toggle buttons: `md:hidden` with `aria-label` openMenu or closeMenu and
  `aria-expanded`, and `hidden md:flex` with collapse or expand (plan D4, D6)
- [x] T022 [US4] components/admin/admin-shell.tsx: pass `mobileOpen` to the topbar, render
  `ThemeControl` in the drawer footer, lock body scroll while open, trap Tab inside the drawer,
  return focus to the mobile toggle on close; drawer padding for top and bottom safe areas
  (plan D6, D11)

## Phase 8: User Story 6 · Wirkt wie eine App (P2)

**Goal**: safe areas, status bar, reload, bottom bar. **Independent test**: quickstart, iPhone
steps 4 to 7.

- [x] T023 [US6] components/admin/admin-topbar.tsx: header `pt-[env(safe-area-inset-top)]` with
  the 64px row inside, side padding `max(1rem, env(safe-area-inset-left/right))` (plan D11)
- [x] T024 [P] [US6] Create components/admin/reload-button.tsx: icon button (phosphor
  `ArrowClockwise`), 44px below `md`, `hidden standalone:flex`, `aria-label` `de.shell.reload`,
  calls `window.location.reload()`; place it in the topbar right group (plan D12)
- [x] T025 [P] [US6] Create components/admin/admin-bottom-bar.tsx: fixed bottom `nav` with
  `aria-label` `de.shell.bottomNav`, visible only in standalone below `md`, entries Übersicht,
  Finanzen, Bus filtered by `canSeeTab`, plus „Menü“ calling `onOpenMenu`; active via `isActive`
  from nav-items.ts; each entry at least 44px, icon 22px, label 11px; bottom safe area padding;
  `z-30` (plan D13)
- [x] T026 [US6] components/admin/admin-shell.tsx: render the bottom bar with `visibleTabs`, role
  and the open handler; give `main` bottom padding of bar height plus safe area in standalone below
  `md`
- [x] T027 [P] [US6] hooks/use-admin-theme.ts: after applying the theme, set every
  `meta[name=theme-color]` content to `#ffffff` or `#17171a` by the resolved theme (research R4)
- [x] T028 [P] [US6] app/globals.css: `@media (display-mode: standalone) { html[data-admin-theme]
  { overscroll-behavior: none; } }` and `.admin-theme-scope { -webkit-tap-highlight-color:
  transparent; }` (plan D14)

## Phase 9: Polish

- [x] T029 Update AGENTS.md section 4 (admin dashboard) with one sentence on phone use and the
  home screen app, referencing specs/040-admin-mobile-app
- [x] T030 Check new copy, comments and the commit message for dashes (constitution writing rules)
- [x] T031 Run `npm run lint`, `npm test`, `npm run build` and report the output verbatim
- [ ] T032 Walk through quickstart.md in the browser phone view; list the iPhone steps that still
  need a real device

## Dependencies

- T001 before T024, T025, T026, T028. T002 before T021, T024, T025. T003 before T004, T025.
- US1, US2, US5, US3 are independent of each other after Phase 2.
- US4 (T021, T022) before US6 T023 and T026, which touch the same files.
- Polish last.

## Parallel examples

- After Phase 2: T005, T006, T007, T011, T012, T016, T018, T019 in parallel (different files).
- In US6: T024, T025, T027, T028 in parallel, then T026.

## Implementation strategy

MVP: Phase 1, 2, US1, US2, US5. That already fixes the zoom, the dialogs and gives the home screen
app. Then US3 and US4, last US6 for the app feel.
