# Prompt: Fix "script tag while rendering React component" in admin layout

## Goal

Remove the React 19 console error thrown by `app/admin/layout.tsx`:

> Encountered a script tag while rendering React component. Scripts inside React
> components are never executed when rendering on the client. Consider using
> template tag instead.

The admin layout renders a raw pre-hydration `<script dangerouslySetInnerHTML>`
inside the RSC tree. On a **fresh full-page load** the script is SSR'd into the
HTML and runs (setting `data-admin-theme` before paint, no flash). But on a
**client-side navigation** into `/admin`, React re-renders `AdminLayout` on the
client, hits the inline `<script>`, and warns — the script is never executed in
that path. The behaviour we actually need (no dark-theme flash on fresh admin
loads) must be preserved.

## Existing code inspected

- `app/admin/layout.tsx:17` — `themeInitScript` string.
- `app/admin/layout.tsx:31` — `<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />`
  rendered inside the returned fragment (the source of the warning).
- `app/layout.tsx:49-62` — root layout (`RootLayout`), already carries
  `suppressHydrationWarning` on `<html>`. Renders once on the server for the
  initial load and is not re-rendered on client-side navigation.
- `hooks/use-admin-theme.ts` — client theme hook, key `cc-admin-theme`,
  values `light | dark | system`; owns the attribute after hydration.

## Decisions / assumptions

- Move the pre-hydration theme script to the **root layout** using `next/script`
  with `strategy="beforeInteractive"` — the documented, React-idiomatic way to
  run an inline script before hydration without the raw-`<script>` warning, and
  `beforeInteractive` is only valid in the root layout, which is where it goes.
- Keep it **admin-scoped**: the script guards on
  `location.pathname.startsWith("/admin")` before touching `data-admin-theme`,
  so public pages never carry the attribute (preserves the original intent of
  scoping it to the admin surface).
- Remove the raw `<script>` (and the `themeInitScript` const) from
  `app/admin/layout.tsx` entirely — the admin layout goes back to just rendering
  `AdminShell`.
- No behaviour change to `hooks/use-admin-theme.ts`; it still owns the attribute
  after hydration.

## Files likely to change

- `app/layout.tsx` — add the `next/script` `beforeInteractive` theme-init script.
- `app/admin/layout.tsx` — remove `themeInitScript` and the `<script>` element.

## Implementation requirements

1. In `app/admin/layout.tsx`: delete the `themeInitScript` constant and the
   `<script>` element; return `<AdminShell …>{children}</AdminShell>` directly
   (drop the now-single-child fragment).
2. In `app/layout.tsx`: import `Script` from `next/script`. Inside `<body>`
   (or `<head>`), before `{children}`, render:
   ```tsx
   <Script id="admin-theme-init" strategy="beforeInteractive">
     {`(function(){try{if(!location.pathname.startsWith("/admin"))return;var c=localStorage.getItem("cc-admin-theme");var d=c==="dark"||((!c||c==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-admin-theme",d?"dark":"light");}catch(e){}})();`}
   </Script>
   ```
   Keep the exact `cc-admin-theme` key and `light|dark|system` semantics so it
   stays in sync with `hooks/use-admin-theme.ts`.
3. TypeScript throughout, no `any`, no new dependencies (`next/script` is built in).

## Security requirements

- No auth/authorization change. The inline script only reads `localStorage` and
  sets a presentational attribute; no secrets, no network, no user input.

## Acceptance criteria

- Navigating client-side into `/admin/*` no longer logs the "script tag while
  rendering React component" error.
- A fresh full-page load of an admin route still applies the correct
  `data-admin-theme` before first paint — no dark/light flash.
- Public (non-admin) pages never receive `data-admin-theme`.
- Toggling the admin theme (light/dark/system) still works with no flash.

## Checks to run

- `npm run lint`
- `npm run build`

## Manual test steps

1. `npm run dev`. Hard-reload `/admin/camps` in dark mode → no flash, no console
   error.
2. From an admin page, navigate client-side to another admin route → confirm the
   "script tag" console error is gone.
3. Load a public page (`/`) → confirm `<html>` has no `data-admin-theme`.
4. Toggle admin theme light/dark/system → confirm it still applies with no flash.
