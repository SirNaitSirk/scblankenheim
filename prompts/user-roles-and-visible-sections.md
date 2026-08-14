# Prompt: Enforce user roles, visible sections & permissions

## Goal

A plain admin created with a limited access grant (e.g. **4 visible sections to see**, **2 sections to use**) currently sees the **entire** admin surface and can act everywhere. The grant is saved to `profiles.visible_tabs` / `profiles.permissions` and shown on the profile page, but **nothing enforces it**. Make the stored grant actually govern the UI and the server.

Access model (confirmed with the user):

- **`visibleTabs` = see.** Controls which nav items render and which `/admin/*` routes are reachable.
- **`permissions` = act.** Within a reachable section, controls whether write actions (add/edit/delete) are allowed. A section that is visible but not permitted is **read-only**.
- **Dashboard (`/admin`) and Profil (`/admin/profil`) are always visible/reachable** for every admin, regardless of `visibleTabs`.
- Direct navigation to a non-visible section (typing the URL) **redirects to `/admin`**.
- **Superadmin** always has every tab and every permission.

## Existing code inspected

- `lib/admin/data.ts` — `getCurrentProfile()` returns the `AdminUser` (role, `permissions`, `visibleTabs`). Correct; unchanged.
- `lib/admin/guard.ts` — `requireAdmin()` / `requireSuperadmin()` (Clerk session → profile, role check). We extend this file.
- `lib/admin/types.ts` — `AdminUser` shape (`permissions: string[]`, `visibleTabs: string[]`). Unchanged.
- `lib/admin/messages.ts` — `PERMISSION_LABELS` (`registrations, finances, camps, users, logs`) + `de.*` copy. Add a "no access" string.
- `components/admin/nav-items.ts` — `NAV_ITEMS` (hrefs: `/admin`, `/admin/finanzen`, `/admin/camps`, `/admin/logs`, `/admin/benutzer`, `/admin/profil`).
- `components/admin/admin-sidebar.tsx` — `SidebarContent` renders **all** `NAV_ITEMS` (the core visibility bug).
- `components/admin/admin-shell.tsx` — client shell; renders `SidebarContent` twice (desktop rail + mobile drawer). Rendered by `app/admin/layout.tsx`. Currently receives no profile data.
- `app/admin/layout.tsx` — server component, already `force-dynamic`; renders `<AdminShell>`.
- `app/admin/{page,finanzen,camps,logs,benutzer,profil}` — page server components; only `benutzer` reads the profile (for `isSuperadmin`). None guard by tab.
- `app/admin/benutzer/actions.ts` — defines local `PERMISSION_KEYS` / `NAV_HREFS`; user-management actions are `requireSuperadmin`. `components/admin/access-controls.tsx` also defines `PERMISSION_KEYS`.
- Write actions with server actions: `app/admin/camps/actions.ts` and `app/admin/camps/[campId]/felder/actions.ts` (both `requireAdmin`). Registrations mutations in `components/admin/registrations-manager.tsx` are **client-side local state only** (mock boundary) — no server action yet.

## Decisions / assumptions

- Introduce one **server-safe** access module so the client sidebar and server pages/actions share the same rules (no drift). Keep `PERMISSION_LABELS`/`NAV_ITEMS` as the underlying sources.
- Map each nav href to the permission that governs its write actions:
  - `/admin` → `registrations`
  - `/admin/finanzen` → `finances`
  - `/admin/camps` → `camps`
  - `/admin/logs` → `logs`
  - `/admin/benutzer` → `users`
  - `/admin/profil` → (none; always allowed)
- **Where "act" actually bites today:** only sections that have write UI/actions — **registrations** (dashboard, UI-only for now) and **camps** (dashboard + fields, real server actions). `finances` and `logs` are read-only pages, so their permission has no write to gate yet (visibility still governed by `visibleTabs`). `benutzer` actions stay **superadmin-only** as today; the `users` permission grants no extra power to a plain admin (documented, not expanded). This is intentional — do not invent new write features to make every permission meaningful.
- UI hiding is cosmetic; the **server action guard is the real gate**.

## Files to change / add

**Add**
- `lib/admin/access.ts` — server-safe (no `"use client"`, no `"server-only"`). Exports:
  - `PERMISSION_KEYS: string[]` (from `PERMISSION_LABELS`)
  - `NAV_HREFS: string[]` (from `NAV_ITEMS`)
  - `ALWAYS_VISIBLE_TABS = ["/admin", "/admin/profil"]`
  - `PERMISSION_BY_HREF: Record<string, string>` (the map above; `/admin/profil` omitted)
  - `canSeeTab(user: Pick<AdminUser, "role" | "visibleTabs">, href: string): boolean` — `true` if superadmin, else `ALWAYS_VISIBLE_TABS.includes(href) || visibleTabs.includes(href)`.
  - `canUseSection(user: Pick<AdminUser, "role" | "permissions">, permissionKey: string): boolean` — `true` if superadmin, else `permissions.includes(permissionKey)`.
  - Optionally have `access-controls.tsx` and `benutzer/actions.ts` import `PERMISSION_KEYS`/`NAV_HREFS` from here to kill the duplicated definitions (small, in-scope cleanup — keep behaviour identical).

**Edit**
- `lib/admin/guard.ts` — add two server-only guards:
  - `guardTab(href: string): Promise<AdminUser>` — `requireAdmin()`, then if `!canSeeTab(profile, href)` call `redirect("/admin")` (Next `redirect` from `next/navigation`). Returns the profile for reuse.
  - `requirePermission(permissionKey: string): Promise<AdminUser>` — `requireAdmin()`, then throw `AuthError("forbidden")` if `!canUseSection(profile, permissionKey)`. For use inside server actions.
- `app/admin/layout.tsx` — `const profile = await getCurrentProfile();` and pass `visibleTabs={profile?.visibleTabs ?? []}` and `isSuperadmin={profile?.role === "superadmin"}` to `<AdminShell>`.
- `components/admin/admin-shell.tsx` — accept `visibleTabs: string[]` + `isSuperadmin: boolean`, forward to both `SidebarContent` renders.
- `components/admin/admin-sidebar.tsx` — `SidebarContent` accepts `visibleTabs` + `isSuperadmin`; filter `NAV_ITEMS` with `canSeeTab({ role: isSuperadmin ? "superadmin" : "admin", visibleTabs }, item.href)` before mapping.
- Route guards (server components, top of each):
  - `app/admin/finanzen/page.tsx` → `await guardTab("/admin/finanzen")`
  - `app/admin/camps/page.tsx` → `const profile = await guardTab("/admin/camps")`
  - `app/admin/logs/page.tsx` → `await guardTab("/admin/logs")`
  - `app/admin/benutzer/page.tsx` → replace bare `getCurrentProfile()` with `await guardTab("/admin/benutzer")` (keep the `isSuperadmin` derivation).
  - `app/admin/camps/[campId]/felder/page.tsx` → `await guardTab("/admin/camps")` (fields live under camps).
  - Dashboard (`/admin`) and Profil (`/admin/profil`): **no** guard (always visible).
- "Act" gating (read-only when not permitted):
  - `app/admin/page.tsx` (dashboard) — read profile, compute `canWriteRegistrations = canUseSection(profile, "registrations")`, pass to `RegistrationsManager`.
  - `components/admin/registrations-manager.tsx` — accept `canWrite: boolean`; when false, hide/omit add/edit/delete/restore controls (keep read, search, filters, CSV export). Export is a read action — keep it.
  - `app/admin/camps/page.tsx` — `canWriteCamps = canUseSection(profile, "camps")`, pass to `CampsBoard`.
  - `components/admin/camps-board.tsx` — accept `canWrite: boolean`; when false hide the "Camp erstellen" button, the edit/delete/set-current row actions, and the field-config action if it mutates (viewing fields is fine). Keep the table visible.
  - Server-action guards (defense in depth): in `app/admin/camps/actions.ts` change the mutating actions (`createCampAction`, `updateCampAction`, `deleteCampAction`, `setCurrentCampAction`) from `requireAdmin()` to `requirePermission("camps")`; in `app/admin/camps/[campId]/felder/actions.ts` change `create/update/delete/reorderFieldAction` to `requirePermission("camps")`. Keep the existing `AuthError` → German toast mapping.
- `lib/admin/messages.ts` — add any needed copy (e.g. reuse existing `toast.unauthorized`; no new page needed since unauthorized routes redirect).

## Security requirements

- Authorization is enforced **on the server**: `guardTab` (route access) and `requirePermission` (mutations) run in server components / server actions, never trusting the client. Hiding nav items / buttons is UX only.
- Superadmin bypass is explicit and centralized in `access.ts`.
- No secrets touched. No change to Clerk/Supabase client boundaries.

## Acceptance criteria

- A plain admin whose `visibleTabs` = `["/admin/finanzen", "/admin/camps"]` sees exactly: **Dashboard, Finanzen, Camps, Profil** in the sidebar (Dashboard/Profil always on) — Logs and Benutzer hidden.
- Typing `/admin/benutzer` as that admin redirects to `/admin`.
- If that admin's `permissions` = `["finances", "camps"]` but **not** `registrations`: the dashboard registrations table is read-only (no add/edit/delete), while Camps shows create/edit/delete.
- If an admin lacks `camps` permission but can see the tab, invoking a camp mutation (even via a crafted request) is rejected with `forbidden` → German error toast.
- Superadmin: unchanged — every tab visible, every action available.
- Profile page still lists the grant correctly (unchanged).

## Checks to run

- `npm run lint`
- `npm run build` (routing + server components + server actions changed)

## Manual test steps

1. As **superadmin**: confirm all 6 nav items show and all actions work.
2. Edit a plain admin (Benutzer → Bearbeiten): set **Sichtbare Bereiche** = Finanzen + Camps, **Berechtigungen** = Camps only. Save.
3. Sign in as that admin (or impersonate): sidebar shows Dashboard, Finanzen, Camps, Profil only.
4. Visit `/admin/logs` and `/admin/benutzer` directly → redirected to `/admin`.
5. On Dashboard: registrations table is read-only (no add/edit/delete buttons).
6. On Camps: create/edit/delete available; performing them succeeds.
7. Remove the Camps permission, keep the tab visible → Camps page loads read-only; attempting a mutation is rejected (German toast).
