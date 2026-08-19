# Prompt: Drag-and-drop reordering for camp form fields

## Goal

Replace the clunky up/down arrow reordering in the camp form fields manager
([components/admin/fields-manager.tsx](../components/admin/fields-manager.tsx))
with a drag-and-drop system, so admins can grab a field and drop it into the
desired position. Keep the arrow buttons as a keyboard/accessibility fallback,
mirroring the existing column-settings pattern.

## Existing code inspected

- [components/admin/fields-manager.tsx](../components/admin/fields-manager.tsx)
  — renders each `CampFormField` in a `Card`, with up/down arrow buttons that
  call `move(index, direction)`. `move` swaps neighbours and persists the full
  order via `reorderFieldsAction(campId, orderedIds)` + `router.refresh()`.
- [components/admin/column-settings-dialog.tsx](../components/admin/column-settings-dialog.tsx)
  — already implements native HTML5 drag-and-drop (draggable list items,
  `DotsSixVertical` handle, `draggingIndex`/`overIndex` transient state,
  `onDragStart`/`onDragOver`/`onDrop`/`onDragEnd`). This is the pattern to reuse.
- [app/admin/camps/[campId]/felder/actions.ts:265](../app/admin/camps/[campId]/felder/actions.ts#L265)
  — `reorderFieldsAction(campId, orderedIds)` already exists and persists an
  arbitrary ordered id list. No server change needed.
- [lib/admin/messages.ts:92](../lib/admin/messages.ts#L92) — `dragHandle`
  ("Zum Sortieren ziehen") already exists under `registrations.columnsDialog`;
  the fields manager needs its own equivalent under `fields`.

## Decisions / assumptions

- Use the **same native HTML5 drag-and-drop** approach as
  `column-settings-dialog.tsx` — no new dependency (`@dnd-kit` etc.). Keeps the
  change small, typed, and consistent with the codebase.
- **Keep the up/down arrow buttons** as an accessible fallback (drag-and-drop is
  not keyboard-accessible on its own), exactly like the column dialog keeps both.
  The drag handle becomes the primary affordance.
- `fields` stays a server-sourced prop. Reordering computes the new id order and
  persists immediately via `reorderFieldsAction` + `router.refresh()`, matching
  the current `move` behaviour. No local list state — only transient
  `draggingIndex` / `overIndex` visual state.
- Add a `DotsSixVertical` drag handle at the left of each field card; the whole
  card is `draggable`. Disable dragging entirely when `!canWrite`.

## Files likely to change

- `components/admin/fields-manager.tsx` — add drag state, make each field card
  draggable, add the drag handle, add a `reorder(fromIndex, toIndex)` helper
  that persists via `reorderFieldsAction`.
- `lib/admin/messages.ts` — add `de.fields.dragHandle: "Zum Sortieren ziehen"`.

No server/action/schema changes.

## Implementation requirements

1. In `fields-manager.tsx`:
   - Add `draggingIndex` / `overIndex` transient `useState<number | null>`.
   - Add `reorder(fromIndex, toIndex)`: build the reordered `fields` array
     (remove-at-from, insert-at-to), then
     `runAction(reorderFieldsAction(campId, ordered.map(f => f.id)), de.fields.toast.reordered)`.
   - Keep the existing `move(index, direction)` for the arrow buttons.
   - Make each field `Card` `draggable` (only when `canWrite`), wiring
     `onDragStart` / `onDragOver` (with `e.preventDefault()`) / `onDrop` /
     `onDragEnd`, mirroring the column dialog. Apply the same visual states:
     `opacity-50` on the dragged item, `bg-ink-100` on the drop target.
   - Add a `DotsSixVertical` handle (cursor-grab / active:cursor-grabbing) as the
     first element inside the card when `canWrite`, before/replacing the arrow
     column. Keep the up/down arrows next to or under the handle.
   - Set `e.dataTransfer.effectAllowed = "move"`, `dropEffect = "move"`, and
     `e.dataTransfer.setData("text/plain", field.id)` (Firefox needs data set).
2. In `messages.ts`: add `dragHandle` string under the `fields` object.
3. Preserve all existing behaviour: edit, delete, add, preview, `canWrite`
   gating, toasts.

## Security requirements

- No change to authorization: reordering still goes through the existing
  `reorderFieldsAction`, which runs `runGuarded` (Clerk session + role check) and
  logs the action. No new client secrets or endpoints.

## Acceptance criteria

- An admin with write permission can drag a field card by its handle and drop it
  into a new position; the order persists and survives a refresh.
- The up/down arrows still work.
- Read-only admins (`!canWrite`) see no handle/arrows and cannot drag.
- Dragged item shows reduced opacity; the current drop target is highlighted.
- All copy is German; no English leaks into the UI.

## Checks to run

- `npm run lint`
- `npm run build`

## Manual test steps

1. `npm run dev`, open `/admin/camps/<campId>/felder` for a camp with ≥3 fields.
2. Drag the second field above the first via the handle — order updates, toast
   "Reihenfolge gespeichert." appears.
3. Refresh the page — the new order persists.
4. Confirm the up/down arrows still reorder correctly.
5. As a read-only admin, confirm no drag handle/arrows appear and cards are not
   draggable.
