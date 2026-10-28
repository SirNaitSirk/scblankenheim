# Tasks: Zimmerplanung

**Input**: `specs/008-room-planning/` (spec.md, plan.md, research.md, data-model.md,
contracts/server-actions.md, quickstart.md)

Format: `[ID] [P?] [Story] Description`. `[P]` = can run in parallel (different files, no open dependency).

## Phase 1: Setup

- [x] T001 Add dependency `@dnd-kit/core` in `package.json` (`npm install @dnd-kit/core`)
- [x] T002 Create migration `supabase/migrations/0009_room_planning.sql`: tables `houses` (name text not null, sort_order), `rooms` (house_id on delete cascade, name, `beds int not null check (beds >= 1)`, sort_order), `camp_rooms` (PK camp_id + room_id, `gender text not null check (gender in ('female','male'))`), `room_assignments` (`registration_id` PK on delete cascade, camp_id, room_id on delete cascade, assigned_at, index (camp_id, room_id)); RLS on, no policies; column `registrations.gender text` (no CHECK); functions `assign_room(p_camp_id, p_registration_id, p_room_id)` (room row lock, auto adopt gender when empty, results `ok`, `ok_gender_set`, `full`, `gender_mismatch`, `no_gender`, `inactive`), `set_room_gender(p_camp_id, p_room_id, p_gender)` (`ok`, `not_empty`), `update_room_beds(p_room_id, p_beds, p_camp_id)` (`ok`, `below_occupancy`); replace `create_public_registration` with extra `p_gender text`
- [x] T003 Regenerate or hand update `lib/database.types.ts` for the new tables, column and functions · DONE BY HAND as for earlier migrations; applying `0009_room_planning.sql` to the database is done by the owner

## Phase 2: Foundational (blocks all stories)

- [x] T004 [P] Extend `lib/admin/types.ts`: `Gender`, `RoomGender`, `Room`, `House`, `PlanningPerson`, `RoomPlan`, `PersonFilter`; `Registration.gender`, `RegistrationFormValues.gender`, `RegistrationInput.gender`; `ActionResult` success may carry `roomGender`
- [x] T005 [P] Add German copy `de.nav.rooms`, `de.rooms.*` (title, description, stats, panel, filters, card, dialogs, confirmations, toasts, errors, empty states, print) and `PERMISSION_LABELS.rooms = "Zimmerplanung"` in `lib/admin/messages.ts`
- [x] T006 Create `lib/admin/room-planning.ts`: Zod `houseSchema` (name 1 to 60), `roomSchema` (name 1 to 60, beds integer 1 to 99), `genderSchema`; `canAssign`, `summarize`, `groupUnassigned`, `ageAt`, `matchesFilters` (depends on T004)
- [x] T007 Register tab: `components/admin/nav-items.ts` (`/admin/zimmerplanung`), `lib/admin/access.ts` (`PERMISSION_BY_HREF["/admin/zimmerplanung"] = "rooms"`), icon in `components/admin/admin-sidebar.tsx`
- [x] T008 [P] Unit tests `tests/unit/room-planning.test.ts` for schemas, `canAssign` (incl. adopts_gender), `summarize`, `ageAt`, `matchesFilters` (depends on T006)

## Phase 3: User Story 2 · Häuser und Zimmer anlegen (P1)

- [x] T009 [US2] `lib/admin/data.ts`: `getRoomPlan(campId)`, house and room CRUD (`createHouse`, `updateHouse`, `deleteHouse`, `reorderHouses`, `createRoom`, `updateRoomName`, `updateRoomBeds` via RPC, `deleteRoom`, `reorderRooms`), `countAssignmentsForRoom/House`
- [x] T010 [US2] Create `app/admin/zimmerplanung/actions.ts` with `runGuarded` (`requirePermission("rooms")`) and house/room actions per contract incl. logs and `getRoomDeleteImpact`
- [x] T011 [P] [US2] Create `components/admin/house-form-dialog.tsx` and `components/admin/room-form-dialog.tsx`
- [x] T012 [US2] Create `app/admin/zimmerplanung/page.tsx` (guardTab, current camp badge, no camp hint, empty state) and the house section/room card shell in `components/admin/room-planner.tsx` and `components/admin/room-card.tsx`

## Phase 4: User Story 3 · Zimmer weiblich oder männlich (P1)

- [x] T013 [US3] `lib/admin/data.ts` `setRoomGender` RPC; actions `setRoomGenderAction`, `setHouseGenderAction` in `app/admin/zimmerplanung/actions.ts`
- [x] T014 [US3] Room card gender tag and toggle, house menu „Alle Zimmer weiblich/männlich“ in `components/admin/room-card.tsx`, `components/admin/room-planner.tsx`

## Phase 5: User Story 1 · Verteilen (P1)

- [x] T015 [US1] `lib/admin/data.ts` `assignRoom` RPC and `unassignRoom`; actions `assignRoomAction`, `unassignRoomAction`
- [x] T016 [P] [US1] Create `components/admin/person-chip.tsx` (draggable, menu: Zimmer wählen, Aus Zimmer entfernen, Geschlecht setzen)
- [x] T017 [P] [US1] Create `components/admin/unassigned-panel.tsx` (groups Weiblich, Männlich, Geschlecht fehlt; counts; mobile bottom sheet)
- [x] T018 [US1] `components/admin/room-planner.tsx`: DndContext (pointer, touch, keyboard sensors), drag overlay, droppable room cards with fit state, `useOptimistic` moves, toasts incl. „Zimmer ist jetzt …“, room picker menu
- [x] T019 [US1] Stats row and shortage banner in `components/admin/room-planner.tsx`

## Phase 6: User Story 4 · Geschlecht bei der Anmeldung (P2)

- [x] T020 [US4] Gender core field: `lib/register/validation.ts` (`CORE_KEYS` + select field with options Weiblich/Männlich mapped to `female`/`male`), `lib/register/messages.ts`, `lib/register/service.ts` (`p_gender`), `components/marketing/registration-form.tsx` if the select needs value labels
- [x] T021 [US4] Admin edit: `components/admin/registration-form-dialog.tsx` gender select, `app/admin/actions.ts` + `lib/admin/data.ts` map `gender`; drop assignment on cancel, soft delete or gender mismatch (research R4)
- [x] T022 [US4] `setRegistrationGenderAction` and inline gender setter in the „Geschlecht fehlt“ group
- [x] T023 [P] [US4] Extend `tests/unit/validation.test.ts` for the gender core field

## Phase 7: User Story 6 · Suchen und filtern (P2)

- [x] T024 [US6] Create `components/admin/person-filters.tsx` (search, gender segmented control, age von/bis, field filters by type, chips, hit count, reset) and highlight or dim chips in rooms in `components/admin/room-planner.tsx`

## Phase 8: User Story 5 · Überblick und Druck (P3)

- [x] T025 [US5] Create `app/admin/zimmerplanung/druck/page.tsx` with print CSS (one house per page) and a print button

## Phase 9: Polish

- [x] T026 Seed houses, rooms, genders in `supabase/seed.sql`
- [x] T027 Update the nav comment in `components/admin/nav-items.ts`
- [ ] T028 Run `npm run lint`, `npm test`, `npm run build` (done, all green); browser check per quickstart.md still open until migration 0009 is applied

## Dependencies

Setup → Foundational → US2 → US3 → US1 → (US4, US6, US5 in any order) → Polish.
US2 and US3 are needed for US1 to have rooms to fill; US4 can run in parallel with US2.

## Parallel examples

- T004, T005 together; T008 after T006.
- T011, T016, T017 are separate component files.

## Implementation strategy

MVP = Phases 1 to 5 (rooms, genders, assignment). Then gender field (US4), filters (US6), print (US5).

## Notes from implementation

- Room planning data access lives in `lib/admin/rooms-data.ts` instead of growing `lib/admin/data.ts`
  (already over 1000 lines). House and room dialogs share `components/admin/room-forms.tsx`; the
  click and keyboard path is `components/admin/room-picker-dialog.tsx`.
- The gender core field shows „Weiblich“/„Männlich“ in the form and stores `female`/`male`
  (`genderFromOption` in `lib/register/validation.ts`).
