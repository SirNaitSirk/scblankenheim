# Prompt: Drag-and-drop column reordering in the "Spalten" dialog

## Goal

Let an admin reorder the registrations-table columns by **dragging** the rows in the
"Spalten" dialog to the desired position — in addition to the existing up/down arrow
buttons. The new order persists per user exactly as today (localStorage). Decided with
the user: drag lives **in the dialog** (not on the table headers). Implementation uses
**native HTML5 drag-and-drop** — no new dependency.

## Existing code inspected

- `components/admin/column-settings-dialog.tsx` — renders the ordered columns as a
  `<ul>` of `<li>` rows, each with a `Switch` (visibility) and two arrow buttons
  (`onMove(key, "up" | "down")`). Receives `columns: ColumnDef[]` in the current order.
- `hooks/use-column-settings.ts` — owns the persisted `{ order, hidden }` state; exposes
  `move(key, "up" | "down")`, `toggle`, `reset`, etc. `apply(next)` writes through to
  localStorage. Reorder-by-index does not exist yet.
- `components/admin/registrations-manager.tsx` — passes `orderedColumns`, `onMove={move}`,
  etc. into the dialog. No change needed beyond forwarding one new callback.

## Design / decisions

### Hook: add an index-based reorder

Add `reorder(fromIndex: number, toIndex: number)` to `useColumnSettings`:
- No-op when indices are equal, out of range, or `fromIndex === toIndex`.
- Splice the key out of `state.order` at `fromIndex` and insert it at `toIndex`, then
  `apply(...)` (same persist path as `move`). Keep `move` (arrows) as-is; it may be left
  independent or reimplemented on top of `reorder` — keep it simple, don't break it.
- Always-visible columns can still be reordered (only their *visibility* is locked), so
  no special-casing needed for drag.

### Dialog: native drag-and-drop

- Add a **drag handle** affordance at the start of each row: a `DotsSixVertical`
  (phosphor) icon button with `cursor-grab` (`cursor-grabbing` while dragging) and an
  `aria-label` = `de.registrations.columnsDialog.dragHandle`. Put `draggable` on the
  `<li>` (or on the handle) so a row can be picked up; the handle communicates the
  affordance. Keep the `Switch` and the two arrow buttons working (clicks must still
  toggle/nudge — don't let drag swallow them).
- Local state in the dialog: `draggingIndex: number | null` and `overIndex: number | null`.
  - `onDragStart(index)` → set `draggingIndex`; set `e.dataTransfer.effectAllowed = "move"`
    (and `setData` something harmless for Firefox).
  - `onDragOver(index)` → `e.preventDefault()` (to allow drop) and set `overIndex`.
  - `onDrop(index)` / `onDragEnd` → if `draggingIndex != null` and differs from target,
    call `onReorder(draggingIndex, index)`; then clear both indices.
- Visual feedback: dim the dragged row (`opacity-50`) and show a clear drop indicator on
  the hovered row (e.g. a top/bottom border or a `bg-ink-50` highlight via the design
  tokens). Keep it subtle and on-brand; no layout shift.
- Reordering during drag reads from the `columns` prop order (the source of truth stays
  the persisted order); the dialog does not keep its own copy of the list — it only tracks
  the transient drag/over indices and calls `onReorder`.
- Accessibility/touch: native DnD is mouse-oriented and not keyboard-accessible, so the
  **arrow buttons remain** as the accessible/touch fallback (do not remove them).

### Manager

- Forward the new callback: `onReorder={reorder}` to `ColumnSettingsDialog`.

### New German copy (messages.ts)

- Under `de.registrations.columnsDialog`: `dragHandle: "Zum Sortieren ziehen"`.

## Files likely to change

- `hooks/use-column-settings.ts` — add `reorder(fromIndex, toIndex)` to the returned API.
- `components/admin/column-settings-dialog.tsx` — drag handle + DnD handlers + `onReorder`
  prop; keep switches and arrow buttons.
- `components/admin/registrations-manager.tsx` — pass `onReorder={reorder}`.
- `lib/admin/messages.ts` — `columnsDialog.dragHandle`.

## Non-goals / constraints

- No new npm dependency; native HTML5 DnD only.
- No table-header dragging (dialog only, per the user).
- Keep the up/down arrows (accessibility + touch).
- Persistence, visibility toggles, reset, and the per-user localStorage behavior are
  unchanged. No DB/server changes. No `any`; small typed handlers.

## Acceptance criteria

- Dragging a row in "Spalten" by its handle drops it at the new position; the table
  column order updates to match and survives reload / logout→login (same user + browser).
- The drag handle shows a grab cursor; the dragged row is visually distinct and the drop
  target is clearly indicated.
- Switches and arrow buttons still work; toggling visibility never triggers a drag.
- Dropping a row on itself (or outside the list) leaves the order unchanged.

## Checks to run

- `npm run lint`
- `npm run build`

## Manual test steps

1. `npm run dev`, open `/admin` → "Spalten".
2. Drag a column by its handle to a new position → the list reorders; close the dialog and
   confirm the table columns match the new order.
3. Reload and (optionally) log out/in → the dragged order persists.
4. Verify the arrow buttons and visibility switches still work as before.
5. Start a drag and drop it back on itself → nothing changes.
