# Contract: Server Actions in `app/admin/zeltkreise/actions.ts`

All return the existing `ActionResult` (`{ ok: true, id? } | { ok: false, error, fieldErrors? }`).
All run `requirePermission("tentCircles")` first; auth failure → `de.tentCircles.toast.unauthorized`.
Inputs are validated with Zod (`lib/admin/tent-circles.ts`). Every write calls
`revalidatePath("/admin/zeltkreise")`. The current camp is resolved on the server
(`getCurrentCampId()`); the client never sends a camp id.

## Circles (logged, FR-025)

| Action | Input | Behaviour | Log action |
|--------|-------|-----------|------------|
| `createTentCircleAction` | `{ name, kind, leaderId }` | `save_tent_circle` with `p_circle_id = null`, appended last | `tent_circle.create` |
| `updateTentCircleAction` | `id, { name, kind, leaderId }` | `save_tent_circle`; leader change logged with old and new name | `tent_circle.update` |
| `deleteTentCircleAction` | `id` | delete row of the current camp, members cascade | `tent_circle.delete` (warning) |
| `reorderTentCirclesAction` | `orderedIds[]` | ids must match all circles of the camp | none |

Error mapping of `save_tent_circle`:

| Status | German text key |
|--------|-----------------|
| `leader_taken` | `errors.leaderTaken` („leitet bereits einen anderen Zeltkreis“) |
| `leader_mismatch` | `errors.leaderMismatch` |
| `leader_inactive` | `errors.leaderInactive` |
| `kind_conflict` | `errors.kindConflict(count)` |
| `not_found` | `errors.notFound` |
| `ok_leader_moved` | success, client toasts `toast.leaderMoved(name)` |

## Members (not logged)

| Action | Input | Behaviour | Error mapping |
|--------|-------|-----------|---------------|
| `assignTentCircleAction` | `registrationId, circleId` | `assign_tent_circle` (assign or move) | `is_leader`, `kind_mismatch`, `inactive`, `not_found` → German text |
| `unassignTentCircleAction` | `registrationId` | delete membership in the current camp | none |
| `setRegistrationGenderAction` | reused from `app/admin/zimmerplanung/actions.ts` logic; a thin wrapper here requires `tentCircles` | update gender, then `syncRoomAssignment` and `syncTentCircle` | `notFound` |

## Changed existing code

- `lib/admin/rooms-data.ts` `setRegistrationGender` and `app/admin/actions.ts` registration update:
  call `syncTentCircle` next to `syncRoomAssignment`.

## Read helper (`lib/admin/tent-circles-data.ts`, server only)

- `getTentCirclePlan(campId | null): Promise<TentCirclePlan>` · circles of the camp, memberships,
  active registrations with `form_data`, question fields and camp start (shared loaders in
  `lib/admin/planning-data.ts`). Joined in JS (AGENTS.md gotcha).
