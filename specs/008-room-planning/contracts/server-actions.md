# Contract: Server Actions in `app/admin/zimmerplanung/actions.ts`

All return the existing `ActionResult` (`{ ok: true, id? } | { ok: false, error, fieldErrors? }`).
All run `requirePermission("rooms")` first; auth failure → `de.rooms.toast.unauthorized`.
Inputs are validated with Zod (`lib/admin/room-planning.ts`). Every write calls
`revalidatePath("/admin/zimmerplanung")`. Camp scoped actions resolve the current camp on the
server (`getCurrentCampId()`); the client never sends a camp id.

## Houses and rooms (logged, FR-030)

| Action | Input | Behaviour | Log action |
|--------|-------|-----------|------------|
| `createHouseAction` | `{ name }` | append last | `house.create` |
| `updateHouseAction` | `id, { name }` | rename | `house.update` |
| `deleteHouseAction` | `id` | cascade rooms and assignments | `house.delete` (warning) |
| `reorderHousesAction` | `orderedIds[]` | ids must match all houses | none |
| `createRoomAction` | `houseId, { name, beds }` | append last in house | `room.create` |
| `updateRoomAction` | `id, { name, beds }` | rename; beds via `update_room_beds` for the current camp; `below_occupancy` → `de.rooms.errors.bedsBelowOccupancy` | `room.update` |
| `deleteRoomAction` | `id` | cascade assignments | `room.delete` (warning) |
| `reorderRoomsAction` | `houseId, orderedIds[]` | ids must match the house's rooms | none |
| `getRoomDeleteImpact` | `{ roomId } \| { houseId }` | count of assignments across all camps, for the confirm text | none |

## Per camp gender and assignment (not logged)

| Action | Input | Behaviour | Error mapping |
|--------|-------|-----------|---------------|
| `setRoomGenderAction` | `roomId, gender \| null` | `set_room_gender` | `not_empty` → `errors.roomNotEmpty` |
| `setHouseGenderAction` | `houseId, gender` | `set_room_gender` for every room of the house that is empty and not already that gender; returns how many changed | none (skips occupied) |
| `assignRoomAction` | `registrationId, roomId` | `assign_room` (assign or move; empty room adopts the person's gender) | `full`, `gender_mismatch`, `no_gender`, `inactive` → matching German text. Success returns `{ ok: true, roomGender? }`; when set the client toasts „Zimmer ist jetzt weiblich/männlich“ |
| `unassignRoomAction` | `registrationId` | delete assignment | none |
| `setRegistrationGenderAction` | `registrationId, gender` | update `registrations.gender` of a current camp registration; drop the assignment if it no longer matches | `notFound` |

## Changed existing actions

- `app/admin/actions.ts` create and update registration: accept `gender`; on cancel, soft delete or
  gender mismatch delete the assignment (research R4).
- `POST /api/register`: body `values.gender` required (`female` | `male`), passed as `p_gender`.

## Read helpers (`lib/admin/data.ts`, server only)

- `getRoomPlan(campId | null): Promise<RoomPlan>` · houses, rooms, gender for the camp, assignments,
  active registrations of the camp with `form_data`, the camp's question fields (for filters) and the
  camp start date (for age). Three or four queries, joined in JS (AGENTS.md gotcha: no
  `.eq` on joined tables).
