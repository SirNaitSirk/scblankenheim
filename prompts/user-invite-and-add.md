# Prompt: Benutzer einladen & direkt hinzufügen (Clerk)

## Goal

Extend the Benutzer surface (`/admin/benutzer`) with two superadmin-only creation
paths, both wiring into Clerk:

1. **Direkt hinzufügen** — the superadmin fills name, e-mail, **password**, role,
   permissions and visible tabs. The server creates the Clerk user immediately
   (`clerkClient().users.createUser`) and the matching `profiles` + `user_roles`
   rows (status `active`). Account works instantly.
2. **Einladen** — the superadmin enters e-mail, role, permissions and visible tabs.
   The server creates a Clerk **application invitation**
   (`clerkClient().invitations.createInvitation`); **Clerk sends the invite e-mail
   itself** (no separate email provider). The invitation's `publicMetadata` carries
   role/permissions/visibleTabs and lands on `user.publicMetadata` when they accept.
   A pending row is stored in `admin_invitations` and shown in a "Ausstehende
   Einladungen" list with a **Einladung zurückziehen** (revoke) action.

Decisions taken with the user: **add-user uses an admin-set password** (a `Passwort`
field in the form). Invite e-mail delivery is **Clerk-native**. This app does **not**
use Clerk Organizations — identity maps to `profiles`/`user_roles`, so use the
application-level invitation + user APIs, not org invitations.

Builds on the shipped edit/delete work (`prompts/user-management.md`).

## Existing code inspected

- `app/admin/benutzer/page.tsx`, `components/admin/users-board.tsx`,
  `components/admin/user-form-dialog.tsx` — the shipped edit/delete surface.
- `app/admin/benutzer/actions.ts` — `runGuarded`(superadmin) + Zod pattern to reuse.
- `lib/admin/data.ts` — service-role reads/writes; `updateAdminUser`, `deleteAdminUser`,
  `getAdminUserStatus`, `getAdminUsers`, `getCurrentProfile`, `writeLog`; already imports
  `clerkClient` from `@clerk/nextjs/server`.
- `lib/admin/guard.ts` — `requireSuperadmin()`.
- Clerk SDK `@clerk/nextjs` v7 (current). Verified in `@clerk/backend`:
  - `clerkClient().invitations.createInvitation({ emailAddress, redirectUrl?,
    publicMetadata?, notify?, ignoreExisting?, expiresInDays? })` → `Invitation`
    (has `id`). Invitation `publicMetadata` → `user.publicMetadata` on acceptance.
  - `clerkClient().invitations.revokeInvitation(invitationId)`.
  - `clerkClient().users.createUser({ emailAddress: string[], password, firstName?,
    lastName?, publicMetadata? })` → `User` (has `id`).
- Schema (`0001_init_schema.sql`): `admin_invitations(id uuid, email, role,
  permissions text[], visible_tabs text[], token unique, status default 'pending',
  invited_by, accepted_at, created_at)`; `profiles(id text pk = Clerk user id, name,
  email, permissions[], visible_tabs[], status)`; `user_roles(user_id, role, unique)`.
- `app/sign-up/[[...sign-up]]/page.tsx` — `<SignUp forceRedirectUrl="/admin" .../>`.
- `middleware.ts` — protects `/admin(.*)` (session required, not role). A signed-in
  user with no profile passes middleware but `getCurrentProfile()` returns null, so
  they have **no admin access and see no data** — this is the security floor for the
  accept flow and for any stray public sign-up.
- UI primitives: `Dialog`, `Field`, `Input`, `Button`, `Card`, `Menu`, `Badge`,
  `EmptyState`; no `Checkbox` (multi-select uses the existing ToggleChip pattern).

## Decisions / assumptions

1. **Superadmin-only.** All three actions (add, invite, revoke) go through
   `requireSuperadmin()`. Buttons/lists render only when `isSuperadmin`.
2. **Pending invitations are their own section**, not merged into the users table
   (`profiles` is keyed by the Clerk user id, which a pending invite does not have yet).
   Show them in an "Ausstehende Einladungen" `Card` below the users table with a revoke
   action. Editing a pending invite is out of scope (revoke + re-invite instead).
3. **Provisioning on accept happens on `/admin/accept-invitation`** (a new page), not a
   webhook — self-contained in the server layer, matching AGENTS.md. Robust source of
   truth: the accepted user's `publicMetadata` (role/permissions/visibleTabs), with a
   fallback lookup of `admin_invitations` by e-mail. The page creates `profiles` +
   `user_roles`, marks the invitation `accepted`, and shows a German success screen.
4. **Invitation `redirectUrl`** is absolute; derive the origin from `headers()` in the
   action (`(await headers()).get('origin')`), falling back to the `host` header. Point
   it at `/admin/accept-invitation`. Also update the sign-up page so a ticket completion
   (`__clerk_ticket` search param present) redirects to `/admin/accept-invitation`
   instead of `/admin`.
5. **Passwords never logged.** `writeLog` records the action + actor + target e-mail
   only. The add-user password is validated (min 8 chars, Clerk's default) and passed
   straight to `createUser`.
6. **Clerk errors → German field errors.** Map the common cases: e-mail already
   exists / already invited, password too short, password found in a breach. Unknown
   Clerk errors fall back to the generic toast. Detect via the Clerk error shape
   (`error.errors[0].code`, e.g. `form_identifier_exists`,
   `form_password_pwned`, `form_password_length_too_short`, `duplicate_record`).
7. **Superadmin implies all** permissions + tabs, exactly as the edit action already
   enforces — reuse that normalization for add + invite.
8. Public sign-up is left open but grants nothing without a profile (see middleware
   note); flag this in the response, do not change auth config in this pass.

## Files to add / change

**Add**
- `components/admin/access-controls.tsx` — shared, extracted selectors: `RoleSelect`
  (segmented control), `AccessPicker` (permission + visible-tab ToggleChip grids with
  the superadmin "Alle Berechtigungen" collapse), and the `ToggleChip` primitive.
  Refactor `user-form-dialog.tsx` to consume these (no behavior change there).
- `components/admin/add-user-dialog.tsx` — name, e-mail, password `Field`s + role +
  access pickers. Mirrors `CampFormDialog` structure (controlled values, per-field
  `errors`, `saving`, remount via `key`).
- `components/admin/invite-dialog.tsx` — e-mail + role + access pickers.
- `app/admin/accept-invitation/page.tsx` — Server Component provisioning screen.
- `app/admin/accept-invitation/loading.tsx` — optional skeleton (match `app/admin/loading.tsx`).

**Change**
- `app/admin/benutzer/actions.ts` — add `addAdminUserAction(values)`,
  `inviteAdminUserAction(values)`, `revokeInvitationAction(id)`. New Zod schemas
  (email, password for add; email for invite; permissions/tabs against known sets).
- `lib/admin/data.ts` — add `createAdminUserDirect(input)`, `createAdminInvitation(input,
  redirectUrl)`, `getPendingInvitations()`, `revokeAdminInvitation(id)`,
  `provisionInvitedProfile(clerkUserId, email, meta)`; a `mapInvitation` row→domain helper;
  and a `clerkErrorCode(error)` helper.
- `components/admin/users-board.tsx` — own the `PageHeader` (like `CampsBoard`), with
  superadmin action buttons "Benutzer hinzufügen" (primary) + "Einladen" (outline).
  Render the pending-invitations `Card` + its revoke confirm dialog. Accept a new
  `pendingInvitations` prop.
- `app/admin/benutzer/page.tsx` — fetch `getPendingInvitations()` too; drop the
  `PageHeader`/`PendingAction` (moved into the board); pass `pendingInvitations`.
- `lib/admin/types.ts` — `AddUserFormValues`, `InviteFormValues`, `PendingInvitation`.
- `lib/admin/messages.ts` — `de.users.add.*`, `de.users.inviteDialog.*`,
  `de.users.invitations.*` (pending list + revoke), `de.users.accept.*`, and the new
  `de.users.errors.*` (emailInvalid, emailTaken, passwordTooShort, passwordWeak,
  alreadyInvited, inviteFailed).
- `app/sign-up/[[...sign-up]]/page.tsx` — redirect ticket completions to
  `/admin/accept-invitation` (read `searchParams`).

## Implementation requirements

### Data layer (`lib/admin/data.ts`)

- `createAdminUserDirect(input)`: `const user = await (await clerkClient()).users.createUser({
  emailAddress: [input.email], password: input.password, firstName, lastName,
  publicMetadata: { role, permissions, visibleTabs } })`; then insert `profiles`
  (`id: user.id`, name, email, permissions, visible_tabs, status:'active') and upsert
  `user_roles`. Split `input.name` into first/last on the first space (best effort).
  On a Clerk throw, do **not** write DB rows (rethrow so the action maps it).
- `createAdminInvitation(input, redirectUrl)`: `invitations.createInvitation({
  emailAddress: input.email, redirectUrl, publicMetadata: { role, permissions,
  visibleTabs }, ignoreExisting: false, notify: true })`; then insert `admin_invitations`
  (`token: invitation.id`, role, permissions, visible_tabs, invited_by, status:'pending').
  If the DB insert fails after the Clerk invite succeeded, revoke the Clerk invite to
  avoid an orphan (best effort) and rethrow.
- `getPendingInvitations()`: select `admin_invitations` where `status = 'pending'`,
  newest first → `PendingInvitation[]`.
- `revokeAdminInvitation(id)`: read the row; `invitations.revokeInvitation(token)` inside
  try/catch (tolerate already-accepted/revoked); delete the `admin_invitations` row.
- `provisionInvitedProfile(userId, email, meta)`: insert `profiles` + upsert `user_roles`
  from `meta` (role/permissions/visibleTabs, normalized for superadmin); mark the matching
  pending `admin_invitations` row (by e-mail) `accepted` with `accepted_at = now()`.
  Idempotent: if a profile already exists, no-op.

### Actions (`app/admin/benutzer/actions.ts`)

- Reuse the superadmin `runGuarded`. Build the absolute `redirectUrl` from `headers()`.
- `addAdminUserAction(values)`: Zod (email format; password ≥ 8; role enum; permissions ⊆
  known; tabs ⊆ known) → normalize superadmin → `createAdminUserDirect` → `writeLog({
  action:'user.create', message: email })` → revalidate → `{ ok:true }`. Map Clerk errors
  to `fieldErrors` (`email`/`password`) via `clerkErrorCode`.
- `inviteAdminUserAction(values)`: Zod (email; role; sets) → `createAdminInvitation` →
  `writeLog({ action:'user.invite', message: email })` → revalidate → `{ ok:true }`.
  Map `duplicate_record`/`form_identifier_exists` → `de.users.errors.alreadyInvited` /
  `emailTaken` on the `email` field.
- `revokeInvitationAction(id)`: `revokeAdminInvitation` → `writeLog({ level:'warning',
  action:'user.invite_revoke', message: id })` → revalidate → `{ ok:true }`.
- `revalidatePath('/admin/benutzer')` in all three.

### Accept page (`app/admin/accept-invitation/page.tsx`)

- Server Component. `const user = await currentUser()`. If no user → prompt to sign in
  (link to `/sign-in`). If a profile already exists (`getCurrentProfile()`), show
  "already active" + link to `/admin`. Else read `user.publicMetadata` for
  role/permissions/visibleTabs (fallback: `admin_invitations` by primary e-mail); if
  found, `provisionInvitedProfile(...)` and show success + link to `/admin`; if nothing
  found, show a "no pending invitation" message. All copy German, centered card layout
  consistent with the sign-in/up pages.

### UI (Operate mode; reuse the incumbent system, run taste + impeccable on new UI)

- `UsersBoard` owns `PageHeader`; superadmin actions: primary "Benutzer hinzufügen"
  (`UserPlus`) + outline "Einladen" (`EnvelopeSimple`). Non-superadmins: header only.
- Pending-invitations `Card`: heading + list rows (e-mail, role `Badge`, invited date,
  `Menu`/button → "Einladung zurückziehen" with confirm dialog). Hidden when empty.
- `AddUserDialog` / `InviteDialog` reuse `RoleSelect` + `AccessPicker` from
  `access-controls.tsx`; same toast + `router.refresh()` pattern as the edit flow.
- Follow `.claude/skills/impeccable` and the taste skill for the new dialogs/section:
  clear sectioning, real error/empty/loading states, no generic filler.

## Security requirements

- Every action behind `requireSuperadmin()`; reject with `de.users.toast.unauthorized`.
- Clerk backend + service-role clients stay server-only (`import "server-only"` in
  `data.ts`); never import into a Client Component. `CLERK_SECRET_KEY` server-only.
- Never log or echo the password; validate server-side regardless of client checks.
- Reuse self-lockout guards already in place for edit/delete (unchanged).
- Note (do not fix here): public `/sign-up` stays open but confers no access without a
  `profiles` row — the profile/role gate is the real authorization boundary.

## Acceptance criteria

- Superadmin sees "Benutzer hinzufügen" + "Einladen"; plain admin sees neither.
- Add-user with a valid password creates a Clerk user (visible in Clerk dashboard) and
  an active row in the table; the new user can sign in with that password.
- Duplicate e-mail / short / breached password surface inline German field errors; no
  DB row is written on Clerk failure.
- Invite creates a Clerk invitation (Clerk sends the e-mail) and a pending row in the
  "Ausstehende Einladungen" list; revoke removes it and invalidates the link.
- Accepting the invite (sign-up via the e-mail link) lands on `/admin/accept-invitation`,
  provisions `profiles` + `user_roles` from the invitation metadata, and the user then
  has exactly the granted role/permissions/tabs.
- All UI copy German; code English; no `any`; typed functions; no secret in the client.

## Checks to run

- `npm run lint`
- `npm run build`
- `node .agents/skills/impeccable/scripts/detect.mjs --json components/admin/add-user-dialog.tsx components/admin/invite-dialog.tsx components/admin/access-controls.tsx app/admin/accept-invitation/page.tsx`

## Manual test steps

1. `npm run dev`, sign in as superadmin → `/admin/benutzer`.
2. **Add:** "Benutzer hinzufügen", fill name/e-mail/password/role/permissions, save →
   row appears active. Sign out, sign in as that user with the password → correct access.
3. Re-add the same e-mail → inline "E-Mail bereits vergeben". Try a 4-char password →
   inline length error.
4. **Invite:** "Einladen", enter a real e-mail you can open, role admin + some
   permissions, send → pending row appears; Clerk sends the e-mail.
5. Open the invite e-mail → complete sign-up → you land on `/admin/accept-invitation`,
   see success, then `/admin` shows the granted tabs only; the pending row is gone.
6. **Revoke:** invite another e-mail, then "Einladung zurückziehen" → row removed and the
   emailed link no longer works.
7. Sign in as a plain admin → no add/invite buttons, no pending-invitations actions;
   direct action calls return the unauthorized toast.
