# Prompt: Fix transient Supabase read error + admin theme hydration warning

## Goal

Resolve two independent, intermittent runtime issues on the admin surface:

1. **Transient `PostgrestError` after idle** — after the app sits idle and the user
   switches back to the tab (triggering a Server Component re-render), a Supabase
   read occasionally fails with a `PostgrestError` (`{ code, details: null,
   hint: null, message }`). The data layer does `if (error) throw error`, so the
   raw error bubbles out of the server render. In production the existing
   `app/admin/error.tsx` boundary catches it and shows the German retry state; in
   dev the Turbopack overlay shows the raw object. The failure is transient
   (cold Supabase instance / schema-cache not yet loaded / brief connection or
   timeout blip) and succeeds on retry.

2. **Hydration mismatch on `<html>`** — `app/admin/layout.tsx` injects a
   pre-hydration inline script that sets `data-admin-theme` on `<html>` before
   paint (to avoid a dark-theme flash). The server-rendered `<html>` in
   `app/layout.tsx` has no such attribute, so React logs a hydration mismatch.
   Cosmetic but noisy.

## Existing code inspected

- `app/layout.tsx:49-61` — root layout renders `<html lang="de" className=...>`
  with no `data-admin-theme`.
- `app/admin/layout.tsx:17` — `themeInitScript` sets `data-admin-theme` pre-hydration.
- `hooks/use-admin-theme.ts` — client theme hook (key `cc-admin-theme`), mirrors the script.
- `lib/admin/data.ts` — service-role read layer; throws raw `PostgrestError` at
  lines 128, 143-145, 185, 246, 259, 272, 282, 392-393, etc. Read getters:
  `buildCamps`, `getRegistrations`, `getCurrentProfile`, `getCampFormFields`,
  `getPriceTiers`, `getAppSettings`, `getUsers`, `getLogs`, invitations reads.
- `lib/supabase/server.ts` — `getServiceClient()` (module-cached).
- `app/admin/error.tsx` — existing error boundary with a "Erneut versuchen" retry button.

## Decisions / assumptions

- **Hydration:** add `suppressHydrationWarning` to the root `<html>` element. This
  is the idiomatic fix (same as `next-themes`) and only suppresses attribute-diff
  warnings for that single element, not its subtree. No behavior change.
- **Transient read errors:** add a small, typed retry helper that retries a read
  thunk a few times with short backoff **only** for transient errors, then
  rethrows the original error if all attempts fail. Non-transient errors (e.g.
  unique-violation, permission, real bugs) are rethrown immediately — no masking.
- "Transient" = Postgrest `code` in a small allowlist (`PGRST002` schema cache,
  `PGRST001`, statement timeout `57014`, connection codes `08006`/`08003`/`08000`)
  **or** a network/fetch failure with no `code` (e.g. `TypeError: fetch failed`).
- Keep retries minimal (e.g. 2 retries, ~150ms then ~400ms backoff) so a genuine
  outage still fails fast into the error boundary rather than hanging the render.
- Apply retry to the **admin read getters** in `lib/admin/data.ts`. Writes are
  left as-is (retrying writes risks duplicates). The public landing layer already
  degrades to `null`, so it is out of scope.

## Files likely to change

- `app/layout.tsx` — add `suppressHydrationWarning` to `<html>`.
- `lib/admin/data.ts` — add a `retryTransient` helper + `isTransientError` guard;
  wrap the read getters with it.

## Implementation requirements

1. In `app/layout.tsx`, add `suppressHydrationWarning` to the `<html>` element.
2. In `lib/admin/data.ts` (or a small colocated helper), add:
   - `isTransientError(error: unknown): boolean` — true for the allowlisted
     transient Postgrest codes and for code-less fetch/network failures.
   - `retryTransient<T>(fn: () => Promise<T>, opts?): Promise<T>` — runs `fn`,
     and on a transient error retries up to N times with backoff; rethrows the
     last error otherwise. Fully typed, no `any`.
3. Wrap the read getters (`buildCamps`, `getRegistrations`, `getCurrentProfile`,
   `getCampFormFields`, `getPriceTiers`, `getAppSettings`, `getUsers`, `getLogs`,
   pending-invitations read) so their Supabase query blocks run through
   `retryTransient`. Preserve existing signatures and the `if (error) throw error`
   pattern inside the thunk so the helper sees the throw.
4. No new dependencies. TypeScript throughout, small functions with explicit types.

## Security requirements

- No change to auth/authorization. Retry runs on the already-service-role,
  Clerk-guarded server read path. No secrets touched. Retries are bounded so a
  real outage can't be used to hang the server render indefinitely.

## Acceptance criteria

- Root `<html>` carries `suppressHydrationWarning`; the `data-admin-theme`
  hydration warning no longer appears on admin page load.
- A transient Supabase read error is retried and, when the instance recovers,
  the page renders normally instead of surfacing the error object.
- A persistent/non-transient error still reaches `app/admin/error.tsx` (German
  retry state) — retries do not hide genuine failures or loop indefinitely.
- No signature changes to the data getters; consumers unchanged.

## Checks to run

- `npm run lint`
- `npm run build`

## Manual test steps

1. `npm run dev`, open `/admin/camps`, hard reload → confirm the
   `data-admin-theme` hydration console error is gone.
2. Toggle admin theme (light/dark/system) → confirm no flash and no new warning.
3. (Transient simulation) Temporarily make one read getter throw a fake
   `{ code: "PGRST002", message: "schema cache" }` on the first call only, load
   the page → confirm it retries and renders (then remove the simulation).
4. Simulate a persistent error (throw a non-transient `PostgrestError`) → confirm
   the German error boundary with the retry button appears, after bounded retries.
