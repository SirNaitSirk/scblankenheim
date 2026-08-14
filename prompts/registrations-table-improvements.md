# Prompt: Registrations table improvements

## Goal

Improve the admin dashboard registrations table (`components/admin/registrations-table.tsx` + `registrations-manager.tsx`) with six changes:

1. **User-specific column order** — the admin can reorder columns; the order persists across logout/login and revisits.
2. **User-specific column visibility** — the admin can show/hide columns; the choice persists the same way.
3. **CSV export respects the current view** — export only the currently visible columns, in the current order (still already limited to the current filter/sort result set).
4. **Fix the sort bug** — sorting toggles asc↔desc correctly on repeated clicks of the same column.
5. **Remove the row action menu** (the 3-dot menu with "E-Mail kopieren" + "Löschen"), and add a **confirmation** before a registration is deleted.
6. **Inline payment editing** — change a registration's payment status directly in the table (a 3-state dropdown), without opening the edit dialog.

Persistence for (1)/(2): **browser localStorage keyed by the Clerk user id** (per-device, survives logout/login; no DB migration). Decided with the user.
Inline payment control for (6): **a small 3-state `<Select>`** (Bezahlt / Teilweise / Offen) that updates `payment_status` only — it does **not** touch `amount_paid` (admins adjust amounts in the edit dialog). Decided with the user.

## Existing code inspected

- `components/admin/registrations-table.tsx` — table markup, `SortHeader`, per-row action `Menu` (copy email + delete/restore), responsive `hidden … table-cell` column hiding.
- `components/admin/registrations-manager.tsx` — owns filter/sort/dialog/toast state, `filtered` memo (filter + sort), `toCsv`, `onExport`, `onSort` (**the bug**), `onDelete`/`onRestore`/`onCopyEmail`, `onDeleteFromDialog`.
- `components/admin/registration-form-dialog.tsx` — edit/create dialog; footer already has an `onDelete` "Löschen" button (edit mode only).
- `components/admin/camps-board.tsx` — reference pattern for a `DeleteCampDialog` confirm dialog + `deleteTarget` state.
- `components/admin/fields-manager.tsx` — reference pattern for move-up/move-down reordering (`de.fields.moveUp` / `moveDown`).
- `components/ui/dialog.tsx`, `components/ui/select.tsx`, `components/ui/switch.tsx`, `components/ui/button.tsx` — reusable primitives.
- `lib/admin/data.ts` — `updateRegistration`, `setRegistrationDeleted` (service-role writes); add a payment-only writer here.
- `app/admin/actions.ts` — `runGuarded` + `requirePermission("registrations")`, `revalidateRegistrations`, `writeLog`; add a payment-only action here.
- `lib/admin/messages.ts` — German copy; `de.registrations.columns.*` labels exist; `de.registrations.remove.*` (delete confirm copy) already exists.
- `app/admin/page.tsx` — server component; has `profile` (so `profile?.id` is available to pass down).

## The sort bug (root cause + fix)

In `registrations-manager.tsx`, `onSort` calls `setSortDir` **inside** the `setSortKey` updater:

```ts
const onSort = useCallback((key) => {
  setSortKey((prevKey) => {
    if (prevKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc")); // side effect in an updater
      return prevKey;
    }
    setSortDir("asc");
    return key;
  });
}, []);
```

React invokes state updaters **twice** under Strict Mode (dev), so the direction toggles twice per click and never actually flips — it stays stuck on the initial `desc`. Fix by computing both next values from current state without nesting setState calls. Prefer a single combined sort state OR read both current values in the handler:

```ts
const onSort = useCallback((key: SortKey) => {
  if (key === sortKey) {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  } else {
    setSortKey(key);
    setSortDir("asc");
  }
}, [sortKey]);
```

(Two independent `setState` calls at the top level are safe; the forbidden thing is calling one setter inside another setter's updater.)

## Decisions / assumptions

- **Column registry.** Introduce a single source of truth for the table columns in a new `components/admin/registration-columns.ts`:
  - `ColumnKey = "name" | "contact" | "id" | "registeredAt" | "amount" | "payment" | "status"`.
  - Exported `REGISTRATION_COLUMNS: { key: ColumnKey; label: string; sortKey: SortKey | null; alwaysVisible?: boolean }[]` in the current default order.
  - `name` is `alwaysVisible: true` (the row's clickable anchor) — reorderable but not hideable, so the table can't become unusable/empty. Every other column is hideable.
  - `label` pulls from `de.registrations.columns.*`.
- **Default order** = today's order: name, contact, id, registeredAt, amount, payment, status.
- **Persistence via a `hooks/use-column-settings.ts` hook** (the `useColumnSettings` name referenced in AGENTS.md §3):
  - Signature: `useColumnSettings(userId: string | null)` → `{ order, isHidden, visibleColumns, toggle, move, reset }` (or similar).
  - State shape stored in localStorage: `{ v: 1, order: ColumnKey[], hidden: ColumnKey[] }`. Include a version so a future column change can be migrated/reset cleanly.
  - Storage key: `` `campconnect.registrations.columns.${userId ?? "anon"}` ``.
  - **SSR-safe**: initialize state from defaults, then read localStorage in a `useEffect` on mount / when `userId` changes (avoid hydration mismatch — no `localStorage` access during render). Persist on every change via `useEffect`.
  - **Merge with defaults on read**: unknown keys are dropped; columns missing from the stored order are appended in default order (so a newly added column shows up). `alwaysVisible` columns can never be in `hidden`.
- **Column settings UI**: a "Spalten" (columns) `<Button variant="outline" size="sm">` next to Export/Add opens a `Dialog` (`components/admin/column-settings-dialog.tsx`) listing columns in current order, each row: a `Switch` for visibility (disabled + on for `alwaysVisible`) plus up/down icon-buttons to reorder (reuse the `fields-manager` move pattern / `de.fields.moveUp`/`moveDown` icons). Include a "Zurücksetzen" (reset to defaults) action.
- **CSV** (`toCsv`): build header + row cells from the **ordered visible columns** using each column's value accessor. Keep the existing `;` separator, quote-escaping, and BOM. Payment/status export the German label or the raw enum — keep current behavior (raw enum values `status`, `payment`) but only for **visible** columns, in order. (If a column is hidden, it is omitted from the CSV entirely.)
- **Inline payment**: new server action `setRegistrationPaymentAction(reference, payment)` + data writer `setRegistrationPayment(reference, payment)` (updates `payment_status` + `updated_at` only). Guarded by `requirePermission("registrations")`, writes a `registration.payment` log, calls `revalidateRegistrations()`. In the table's payment cell, when `canWrite` render a compact `<Select>` (3 options) whose `onChange` fires the action; when not `canWrite` render the existing `Badge`. The cell must `stopPropagation` on click/keydown so changing payment doesn't open the row's edit dialog.
- **Remove the action menu**: delete the `Menu`/`MenuItem` column and its imports from the table; drop `onCopyEmail`/`onDelete`/`onRestore` props from `RegistrationsTable`. "E-Mail kopieren" is dropped entirely (per user). Delete + restore move into the edit dialog:
  - `RegistrationFormDialog` gains a `deleted: boolean` prop and an optional `onRestore`. In edit mode, if `deleted` show a "Wiederherstellen" button (calls `onRestore`, no confirm — restore is non-destructive); otherwise show the existing "Löschen" button.
  - Deleting from the dialog no longer deletes immediately: it closes the form dialog and opens a **confirm dialog** (`DeleteRegistrationDialog` in the manager, modeled on `DeleteCampDialog` but **no type-to-confirm** — a soft delete only needs a yes/no). Use the existing `de.registrations.remove.*` copy. Confirm → `runAction(setRegistrationDeletedAction(id, true), …)`.
- **Responsive**: since visibility is now user-controlled, drop the per-column `hidden … md:table-cell` auto-hiding; the table keeps `overflow-x-auto` + `min-w-*` so hidden-by-user columns simply aren't rendered and the rest scroll horizontally on small screens.

## Files likely to change / add

- **New** `hooks/use-column-settings.ts` — persistence hook.
- **New** `components/admin/registration-columns.ts` — column registry + `ColumnKey`.
- **New** `components/admin/column-settings-dialog.tsx` — show/hide + reorder dialog.
- `components/admin/registrations-table.tsx` — render columns from order/visibility; inline payment `<Select>`; remove menu column; new props (`order`, `isHidden`/`visibleColumns`, `onPaymentChange`); keep row-open behavior.
- `components/admin/registrations-manager.tsx` — fix `onSort`; use `useColumnSettings(userId)`; "Spalten" button + dialog; CSV from visible/ordered columns; delete-confirm dialog + `deleteTarget` state; payment change handler; remove `onCopyEmail`; pass `userId` prop through.
- `components/admin/registration-form-dialog.tsx` — `deleted` prop + restore-vs-delete footer button.
- `app/admin/actions.ts` — `setRegistrationPaymentAction`.
- `lib/admin/data.ts` — `setRegistrationPayment`.
- `lib/admin/messages.ts` — new copy (see below).
- `app/admin/page.tsx` — pass `userId={profile?.id ?? null}` to `RegistrationsManager`.

## New German copy (messages.ts)

Add under `de.registrations`:

- `columnsButton: "Spalten"`
- `columnsDialog: { title: "Spalten anpassen", description: "Wähle, welche Spalten sichtbar sind, und ordne sie per Pfeil.", visible: "Sichtbar", reset: "Zurücksetzen", close: "Schließen" }`
- `toast.paymentUpdated: "Zahlungsstatus aktualisiert."`

Reuse existing: `de.fields.moveUp`/`moveDown`, `de.registrations.remove.*`, `de.common.exportCsv`.

## Implementation requirements

- TypeScript throughout; explicit types; no `any`. Keep functions small and single-purpose.
- Do not access `localStorage` during render (SSR/hydration safety). Wrap reads/writes in guards and effects.
- Keep the column value accessors (cell render + CSV value) defined once per column where practical to avoid drift between what's on screen and what's exported.
- Keep all user-facing strings in `lib/admin/messages.ts` (German). Code identifiers stay English.
- Preserve existing behaviors: row click / keyboard opens the edit dialog (when `canWrite`), deleted-row `opacity`, empty state, toasts, `router.refresh()` after writes.

## Security requirements

- `setRegistrationPaymentAction` runs through `runGuarded` → `requirePermission("registrations")`; validate `payment` with a Zod enum `["paid","partial","unpaid"]`; reject unauthorized with the existing German unauthorized result. Service-role write only in `lib/admin/data.ts`. No secrets in client code.
- Column settings are pure client-side UI prefs (localStorage) — no server/authorization concerns.

## Acceptance criteria

- Reordering / hiding columns persists after logout→login and after a full page reload (same browser + same user). A second user on the same browser gets their own settings.
- `name` cannot be hidden; all other columns can.
- CSV contains exactly the visible columns, in the current order, for the currently filtered/sorted rows.
- Clicking a sort header toggles asc↔desc reliably on every repeat click (verify in `npm run dev`, i.e. Strict Mode).
- The 3-dot row menu is gone. Deleting a registration (from the edit dialog) shows a confirmation; confirming soft-deletes it; canceling does nothing. A deleted registration (with "Gelöschte anzeigen" on) can be restored from its dialog.
- Changing the payment dropdown in a row updates the status without opening the dialog, shows a toast, and the finance/dashboard figures refresh. Non-write admins see a static badge, no dropdown.

## Checks to run

- `npm run lint`
- `npm run build` (new hook, server action, and component wiring can affect it)

## Manual test steps

1. `npm run dev`, open `/admin` as an admin with registrations permission.
2. Click a sortable header (e.g. Betrag) repeatedly → arrow flips asc↔desc and rows re-sort each click.
3. Open "Spalten": hide "ID" and "Kontakt", move "Zahlung" above "Betrag". Reload the page → the same order/visibility is restored. Log out, log back in → still restored.
4. Export CSV → only visible columns appear, in the chosen order.
5. In a row, change the payment dropdown to "Bezahlt" → toast appears, badge/finance update, dialog does NOT open.
6. Open a registration, click "Löschen" → confirm dialog; confirm → row marked deleted + toast. Enable "Gelöschte anzeigen", open the deleted row → "Wiederherstellen" restores it.
7. Confirm there is no 3-dot menu / "E-Mail kopieren" anywhere in the table.
