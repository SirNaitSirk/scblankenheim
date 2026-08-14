# Prompt: Benutzerverwaltung (Rollen & Berechtigungen)

## Goal

Turn the currently read-only **Benutzer** page (`/admin/benutzer`) into an interactive
user-management surface where an admin can **edit a user's role, permissions and
visible tabs** and **delete a user** (removing the Clerk user + the Supabase
`profiles`/`user_roles` rows). No invitation/email flow in this pass — the "Benutzer
einladen" button stays a disabled placeholder.

Scope decided with the user: **edit roles + permissions + visible tabs, and delete**.
Not in scope: invite-by-email, `create-invitation`/`accept-invitation`, email provider.

## Existing code inspected

- `app/admin/benutzer/page.tsx` — read-only Server Component table over `getAdminUsers()`.
- `app/admin/profil/page.tsx` — own-profile read view (unchanged; reference for labels).
- `lib/admin/data.ts` — `getAdminUsers()`, `getCurrentProfile()`, `mapAdminUser()`,
  `writeLog()`. Service-role reads/writes; all camp/field writes live here.
- `app/admin/camps/actions.ts` — the Server Action pattern to mirror exactly:
  `runGuarded()` wrapper, Zod validation → `fieldErrorResult`, `writeLog`, `revalidatePath`.
- `components/admin/camps-board.tsx` + `camp-form-dialog.tsx` — the client
  board + dialog + delete-confirm + toast pattern to mirror.
- `lib/admin/guard.ts` — `requireAdmin()` / `AuthError` / `isAdminRole()`.
- `lib/admin/messages.ts` — `de.users`, `ROLE_LABELS`, `PERMISSION_LABELS`.
- `lib/admin/types.ts` — `AdminUser`, `UserRole`, `ActionResult`.
- `components/admin/nav-items.ts` — `NAV_ITEMS` (source of truth for visible-tab hrefs).
- `components/ui/*` — available primitives: `Dialog`, `Field`, `Input`, `Switch`,
  `Menu`, `Button`, `Badge`, `Card`. **No `Checkbox` primitive** — multi-selects use
  toggle chips (styled `<button type="button">`), not native checkboxes.
- Schema (`supabase/migrations/0001_init_schema.sql`): `profiles(id text pk, name,
  email, permissions text[], visible_tabs text[], status, last_active_at)`,
  `user_roles(user_id → profiles.id, role, unique(user_id))`.

## Decisions / assumptions

1. **Superadmin-only.** Editing roles/permissions and deleting users is privileged;
   add `requireSuperadmin()` to `guard.ts` (throws `AuthError('forbidden')` for plain
   admins). The board only renders the row action menu when the current viewer is a
   superadmin; plain admins keep the read-only table.
2. **No self-lockout.** A superadmin cannot delete their own account, and cannot
   change their own role away from `superadmin`. Enforced both server-side (reject in
   the action) and in the UI (self-delete disabled; own role toggle locked).
3. **Role is stored in `user_roles`** (upsert on `user_id`), permissions + visible_tabs
   in `profiles`. A single `updateAdminUser(id, input)` helper writes both.
4. **Permissions source of truth** = `Object.keys(PERMISSION_LABELS)`. **Visible-tabs
   source of truth** = `NAV_ITEMS.map(n => n.href)`. Validation rejects unknown keys/hrefs.
5. **Delete order** (per AGENTS.md): delete the Clerk user via the Clerk backend API
   first, then the `profiles` row (`user_roles` cascades via FK). Wire the Clerk backend
   client only for deletion — `import { clerkClient } from '@clerk/nextjs/server'` →
   `(await clerkClient()).users.deleteUser(id)`. If the Clerk user is already gone
   (404), treat as success and still remove the DB rows. Uses the existing
   `CLERK_SECRET_KEY` env; do not hardcode secrets.
6. **`invited` users have no Clerk user yet** — deleting one only removes DB rows
   (skip the Clerk call when `status === 'invited'`).
7. Keep everything German in the UI; code stays English (AGENTS.md language rules).

## Files likely to change / add

- **Add** `app/admin/benutzer/actions.ts` — `updateAdminUserAction(id, values)`,
  `deleteAdminUserAction(id)`. Mirrors `camps/actions.ts` (`runGuarded` → but guarded by
  `requireSuperadmin`; Zod validation; `writeLog`; `revalidatePath('/admin/benutzer')`
  and `revalidatePath('/admin/profil')`).
- **Add** `components/admin/users-board.tsx` — client component; the interactive table +
  row `Menu` (Bearbeiten/Löschen) + toast, mirroring `CampsBoard`. Receives
  `users`, `currentUserId`, `isSuperadmin`.
- **Add** `components/admin/user-form-dialog.tsx` — edit dialog: role segmented control,
  permissions toggle-chip grid, visible-tabs toggle-chip grid. Mirrors `CampFormDialog`
  (controlled `values`, `errors`, `saving`, remount via `key`).
- **Edit** `app/admin/benutzer/page.tsx` — fetch `getAdminUsers()` + `getCurrentProfile()`,
  render `<UsersBoard>` for superadmins, keep the existing static table for plain admins
  (or render the same board with `isSuperadmin={false}` so the menu is hidden — prefer the
  single-board approach to avoid duplicated markup).
- **Edit** `lib/admin/data.ts` — add `updateAdminUser(id, input)` and `deleteAdminUser(id)`.
- **Edit** `lib/admin/guard.ts` — add `requireSuperadmin()`.
- **Edit** `lib/admin/types.ts` — add `AdminUserFormValues` and `AdminUserInput`.
- **Edit** `lib/admin/messages.ts` — extend `de.users` with `edit`, `delete`, `actions`,
  `form.*` (title/description/role/permissions/visibleTabs/save/cancel/saving/close),
  `remove.*` (type-to-confirm on email), `toast.*` (updated/deleted/error/unauthorized),
  `errors.*` (invalidRole/unknownPermission/unknownTab/selfDemote/selfDelete),
  `selfBadge` ("Du"), `allPermissionsToggle` ("Alle auswählen").

## Implementation requirements

### Data layer (`lib/admin/data.ts`)

```ts
export async function updateAdminUser(id: string, input: AdminUserInput): Promise<void> {
  const supabase = getServiceClient();
  const { error: pErr } = await supabase
    .from("profiles")
    .update({ permissions: input.permissions, visible_tabs: input.visibleTabs })
    .eq("id", id);
  if (pErr) throw pErr;
  const { error: rErr } = await supabase
    .from("user_roles")
    .upsert({ user_id: id, role: input.role }, { onConflict: "user_id" });
  if (rErr) throw rErr;
}
```

`deleteAdminUser(id, { hasClerkUser })`: when `hasClerkUser`, call the Clerk backend
delete inside a try/catch that swallows a 404 (already deleted), rethrows otherwise;
then `supabase.from('profiles').delete().eq('id', id)`.

### Guard (`lib/admin/guard.ts`)

```ts
export async function requireSuperadmin(): Promise<AdminUser> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AuthError("no-session-or-profile");
  if (profile.role !== "superadmin") throw new AuthError("forbidden");
  return profile;
}
```

### Actions (`app/admin/benutzer/actions.ts`)

- `runGuarded` variant using `requireSuperadmin`; map `AuthError` → `de.users.toast.unauthorized`.
- `updateAdminUserAction(id, values)`: Zod-validate `values` (role ∈ {admin,superadmin};
  permissions ⊆ known permission keys; visibleTabs ⊆ known nav hrefs). If `id === admin.id`
  and `values.role !== 'superadmin'` → `{ ok:false, error: de.users.errors.selfDemote }`.
  On success `updateAdminUser`, `writeLog({ action:'user.update', actor, message: id })`,
  revalidate, `{ ok:true }`.
- `deleteAdminUserAction(id)`: reject `id === admin.id` → `de.users.errors.selfDelete`.
  Look up the target's `status` (need `hasClerkUser = status !== 'invited'`) — pass it in
  from the client (already known) or re-read; prefer re-read to avoid trusting the client.
  `writeLog({ level:'warning', action:'user.delete', ... })`.

### UI — `UsersBoard` (Operate mode; mirror `CampsBoard`)

- Keep the existing table columns (Benutzer / Rolle / Berechtigungen / Zuletzt aktiv /
  Status). Add a trailing **Aktionen** column with the shared `Menu` (Bearbeiten →
  `PencilSimple`, Löschen → `Trash`, `danger`), shown only when `isSuperadmin`.
- Mark the current viewer's own row with a subtle `de.users.selfBadge` ("Du") chip; its
  delete menu item is disabled/omitted.
- Reuse the exact toast pattern (fixed bottom-center pill) and `router.refresh()` on success.
- `EmptyState` when no users (unlikely, but keep parity).

### UI — `UserFormDialog` (edit)

Mirror `CampFormDialog` structure/props (`open`, `user`, `onClose`, `onSubmit`,
`onSuccess`; remounted via `key`). Sections, top to bottom:

1. **Rolle** — a two-option segmented control (Admin / Superadmin) built from
   `Button`/toggle styling. When editing your own account, lock it to Superadmin with a
   small helper note (`de.users.form.roleSelfLocked`).
2. **Berechtigungen** — responsive grid of toggle chips (one per `PERMISSION_LABELS`
   entry), plus an "Alle auswählen" / "Alle abwählen" shortcut. Selected chip uses the
   accent/inverse treatment already used elsewhere (`bg-surface-inverse text-on-inverse`
   when active; `border-border text-foreground` when inactive). A superadmin implicitly
   has all permissions — when role = superadmin, show the grid disabled with an
   "Alle Berechtigungen" note instead of individual toggles (matches `profil` copy).
3. **Sichtbare Bereiche** — same toggle-chip pattern over `NAV_ITEMS` (label = nav label).

Validation errors surface via `de.users.toast.error` + inline where sensible. On success
call `onSuccess` (parent shows `de.users.toast.updated`, refreshes).

### UI — Delete confirm

Mirror `DeleteCampDialog`: type-to-confirm using the user's **email** (or name fallback),
`variant="danger"` confirm button disabled until it matches. Description warns the account
+ Clerk login are removed permanently.

## Security requirements

- All writes go through Server Actions guarded by `requireSuperadmin()`; never trust a
  client-sent role/permission list without server Zod validation against the known sets.
- Service-role client and the Clerk backend client run **only** in the action/data layer,
  never imported into a Client Component. `import "server-only"` already guards `data.ts`.
- No secrets in the browser; `CLERK_SECRET_KEY` used only server-side.
- Enforce self-lockout guards server-side (do not rely on the disabled UI).
- `revalidatePath` the affected routes so the table + own profile refresh.

## Acceptance criteria

- A superadmin sees a row action menu; a plain admin sees the read-only table (no menu).
- Editing a user's role, permissions, and visible tabs persists to `user_roles`/`profiles`
  and is reflected after refresh (and in that user's `/admin/profil`).
- Promoting to superadmin shows "Alle Berechtigungen"; demoting restores per-permission
  toggles with the previously selected set.
- Deleting an active user removes the Clerk user then the DB rows; deleting an `invited`
  user removes only DB rows; the row disappears after refresh.
- A superadmin cannot delete or demote themselves (UI disabled + server rejects).
- All visible copy is German; no English leaks; no `any`; functions typed.

## Checks to run

- `npm run lint`
- `npm run build` (new route handler-free, but Server Actions + client components affect it)
- Impeccable mechanical detector on the changed UI:
  `node .agents/skills/impeccable/scripts/detect.mjs --json components/admin/users-board.tsx components/admin/user-form-dialog.tsx`

## Manual test steps

1. `npm run dev`, sign in as a superadmin, open `/admin/benutzer`.
2. Open a non-self user's ⋯ menu → **Bearbeiten**. Toggle some permissions and visible
   tabs, switch role admin↔superadmin, save. Confirm the table row updates.
3. Open that user's `/admin/profil` (or verify via DB) — permissions/tabs match.
4. Try to open your own row's menu: delete disabled, role locked to Superadmin.
5. Delete an `invited` user → only DB rows removed (no Clerk error). Delete an active
   test user → Clerk user + rows removed.
6. Sign in as a plain `admin`: `/admin/benutzer` shows the read-only table, no action menu;
   confirm the actions reject if invoked directly (guard returns unauthorized toast).
