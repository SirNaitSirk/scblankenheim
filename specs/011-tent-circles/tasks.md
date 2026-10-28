---

description: "Task list for Zeltkreise"
---

# Tasks: Zeltkreise

**Input**: Design documents from `specs/011-tent-circles/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md

**Tests**: Unit tests for the pure rules in `lib/admin/tent-circles.ts` (project convention, constitution VII). UI is verified manually via quickstart.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (scope and registry)

- [X] T001 Amend AGENTS.md section 4 (admin dashboard bullet „Tent circles (`/admin/zeltkreise`) ... (specs/011-tent-circles)“), section 5 (`tent_circles`, `tent_circle_members`) and the quick reference, as worded in plan.md „Scope amendment“
- [X] T002 [P] Add `PERMISSION_LABELS.tentCircles = "Zeltkreise"`, `de.nav.tentCircles` and the full `de.tentCircles` copy block (title, description, stats, panel title „Noch ohne Zeltkreis“, empty states, dialog labels, kind labels „Gemischt“, „Nur weiblich“, „Nur männlich“, „Leitung“, „Leiter fehlt“, „Leiter wählen“, picker, toasts incl. `leaderMoved(name)`, errors `leaderTaken`, `leaderMismatch`, `leaderInactive`, `kindConflict(count)`, `isLeader`, `kindMismatch`, `inactive`, `notFound`, `unauthorized`, print) in lib/admin/messages.ts, German only and without dashes
- [X] T003 [P] Add `{ label: de.nav.tentCircles, href: "/admin/zeltkreise" }` after Zimmerplanung in components/admin/nav-items.ts and an icon (Phosphor `UsersThree` or `Campfire`) in components/admin/admin-sidebar.tsx

---

## Phase 2: Foundational (blocking)

- [X] T004 Write supabase/migrations/0010_tent_circles.sql per data-model.md: table `tent_circles` (`name text not null`, `kind text not null default 'mixed' check (kind in ('mixed','female','male'))`, `leader_registration_id uuid null references registrations(id) on delete set null`, unique index on `leader_registration_id` where not null, index `(camp_id, sort_order)`), table `tent_circle_members` (`registration_id uuid primary key references registrations(id) on delete cascade`, `camp_id`, `tent_circle_id references tent_circles(id) on delete cascade`, index `(camp_id, tent_circle_id)`), RLS enabled on both, no policies
- [X] T005 In the same migration add `fits_tent_circle(kind, gender)`, `assign_tent_circle(p_camp_id, p_registration_id, p_circle_id)` (statuses `ok`, `is_leader`, `kind_mismatch`, `inactive`, `not_found`) and `save_tent_circle(p_camp_id, p_circle_id, p_name, p_kind, p_leader_id)` (statuses `ok` with `id`, `ok_leader_moved`, `leader_taken`, `leader_mismatch`, `leader_inactive`, `kind_conflict` with `count`, `not_found`); lock the registration row first, then the circle row (`for update`); `save_tent_circle` removes the leader's membership and drops inactive memberships that no longer fit a new kind; revoke execute from `public, anon, authenticated`, grant to `service_role`
- [X] T006 Apply the migration locally (`npx supabase db reset`) and regenerate lib/database.types.ts
- [X] T007 [P] Add `PlanningPersonBase`, `TentCircleKind`, `TentCircle`, `CirclePerson`, `TentCirclePlan` to lib/admin/types.ts; make `PlanningPerson` extend `PlanningPersonBase`
- [X] T008 Move `loadCamp` and the active registrations query from lib/admin/rooms-data.ts into a new server only lib/admin/planning-data.ts (`loadPlanningCamp`, `loadActiveRegistrations`); rooms-data.ts uses them, behaviour unchanged
- [X] T009 Generalize lib/admin/room-planning.ts filter and grouping helpers (`matchesFilter`, `groupUnassigned`, `fullName`, `compareByName`) to accept `PlanningPersonBase`; keep tests/unit/room-planning.test.ts green
- [X] T010 Make components/admin/unassigned-panel.tsx take `title` and `emptyText` (and drop target id) as props; pass the room texts from components/admin/room-planner.tsx
- [X] T011 Create lib/admin/tent-circles.ts: `KINDS`, Zod `tentCircleSchema` (`name` 1 to 60 chars trimmed, `kind` enum, `leaderId` uuid required), `fitsCircle(kind, gender)`, `summarizeCircles(circles, people)` (circles, assigned, unassigned, average with one decimal), `membersByCircle`, `unassignedPeople` (excludes leaders and members)
- [X] T012 [P] Add tests/unit/tent-circles.test.ts for `fitsCircle` (missing gender only fits mixed), `summarizeCircles` (spec Story 5 example: 4 circles, 30 assigned, 6 unassigned, 7,5 average), `unassignedPeople` and the Zod schema
- [X] T013 Create lib/admin/tent-circles-data.ts (server only): `getTentCirclePlan(campId)`, `saveTentCircle`, `deleteTentCircle(campId, id)`, `reorderTentCircles`, `assignTentCircle`, `unassignTentCircle`, `getTentCircleName`, `syncTentCircle(registrationId)` (removes membership or clears leader when gender no longer fits the kind); reads ignore deleted and cancelled registrations
- [X] T014 Call `syncTentCircle` next to `syncRoomAssignment` in lib/admin/rooms-data.ts `setRegistrationGender` and in app/admin/actions.ts after registration updates

**Checkpoint**: schema, types, data layer and shared UI ready.

---

## Phase 3: User Story 1 · Zeltkreise mit Leiter anlegen (P1) 🎯 MVP

**Goal**: create, edit, reorder and delete circles with a leader.

**Independent Test**: three circles with leaders, rename one, change a leader, delete one, reload; another current camp shows no circles.

- [X] T015 [US1] Create app/admin/zeltkreise/actions.ts with `createTentCircleAction`, `updateTentCircleAction`, `deleteTentCircleAction`, `reorderTentCirclesAction` per contracts/server-actions.md (`requirePermission("tentCircles")`, Zod, status to German error mapping, logs `tent_circle.create|update|delete`, `revalidatePath("/admin/zeltkreise")`), following the `runGuarded` pattern of app/admin/zimmerplanung/actions.ts
- [X] T016 [P] [US1] Create components/admin/tent-circle-dialog.tsx: name field, kind segmented control, searchable leader list of active registrations that fit the kind and lead no other circle, members marked „ist Teilnehmer in X“; field errors in German
- [X] T017 [P] [US1] Create components/admin/tent-circle-card.tsx: name, kind tag (text plus color via room-styles.ts, neutral for mixed), leader row set apart or „Leiter fehlt · Leiter wählen“, count and female/male split bar, droppable area, card menu (Bearbeiten, Löschen)
- [X] T018 [US1] Create components/admin/tent-circle-planner.tsx (client): layout from plan.md UI design, empty state with „Zeltkreis anlegen“, dialogs, delete confirmation with participant count (reuse `ConfirmDeleteDialog` from room-forms.tsx), toast `leaderMoved`
- [X] T019 [US1] Create app/admin/zeltkreise/page.tsx with `guardTab("/admin/zeltkreise")`, camp badge, no camp hint, `getTentCirclePlan`, `canUseSection(profile, "tentCircles")`

**Checkpoint**: circles can be managed.

---

## Phase 4: User Story 2 · Teilnehmer verteilen (P1)

**Goal**: assign, move and remove participants by drag and drop, click and keyboard.

**Independent Test**: one drag, one click assignment, one move, one removal, reload; all saved.

- [X] T020 [US2] Add `assignTentCircleAction`, `unassignTentCircleAction` and a `setRegistrationGenderAction` wrapper (permission `tentCircles`, calls `setRegistrationGender`) to app/admin/zeltkreise/actions.ts
- [X] T021 [P] [US2] Create components/admin/tent-circle-picker-dialog.tsx listing only fitting circles, with „Aus Zeltkreis entfernen“ for members
- [X] T022 [US2] Wire DnD in components/admin/tent-circle-planner.tsx: `DndContext` with mouse, touch and keyboard sensors, `DragOverlay` with `PersonChipBody`, `useOptimistic` board, fitting circles outlined and non fitting dimmed with reason, leaders not draggable, `UnassignedPanel` titled „Noch ohne Zeltkreis“ with gender entry for „Geschlecht fehlt“, rollback and German toast on failure
- [X] T023 [US2] Mobile: bottom sheet for the panel and tap path as in room-planner.tsx

**Checkpoint**: MVP complete (US1 + US2).

---

## Phase 5: User Story 3 · Art und Leiter ändern (P2)

**Independent Test**: kind change with mismatching members is rejected with count; leader change frees the old leader.

- [X] T024 [US3] In components/admin/tent-circle-dialog.tsx show the `kindConflict(count)` error at the kind field and filter the leader list when the kind changes; ensure the previous leader returns to the panel after save in components/admin/tent-circle-planner.tsx

---

## Phase 6: User Story 4 · Suchen und filtern (P2)

**Independent Test**: age and form field filter narrows the panel, matches highlighted in cards including leaders.

- [X] T025 [US4] Reuse `PersonFilters` and `matchesFilter` in components/admin/tent-circle-planner.tsx; pass `emphasis` to member chips and the leader row in components/admin/tent-circle-card.tsx

---

## Phase 7: User Story 5 · Überblick und Ausdruck (P3)

**Independent Test**: stats match the board; print shows every circle with leader and sorted participants.

- [X] T026 [P] [US5] Add the four stat cards (Zeltkreise, Verteilt, Noch ohne Zeltkreis, Ø Teilnehmer) from `summarizeCircles` in components/admin/tent-circle-planner.tsx
- [X] T027 [P] [US5] Create app/admin/zeltkreise/druck/page.tsx (guarded, print CSS, `break-inside: avoid`, leader on top, participants alphabetical) and the „Drucken“ button in app/admin/zeltkreise/page.tsx

---

## Phase 8: Polish

- [X] T028 [P] Add three circles with leaders and members to supabase/seed.sql
- [X] T029 Design pass with `impeccable` and `tasteskill` on the new tab (consistency with Zimmerplanung, light and dark, 375 px)
- [X] T030 Run `npm run lint`, `npm test`, `npm run build` and report output verbatim
- [X] T031 Walk through specs/011-tent-circles/quickstart.md in the browser

---

## Dependencies

- Phase 1 → Phase 2 → US1 → US2 → US3, US4, US5 (US3 to US5 independent of each other).
- T004 → T005 → T006 → T007, T011, T013. T008 → T009 → T010.

## Parallel examples

- Phase 1: T002 and T003.
- Phase 2: T007 and T012 after T011.
- US1: T016 and T017 after T015.
- US5: T026 and T027.

## Implementation strategy

MVP is US1 + US2 (both P1). Then US3, US4, US5, polish. Stop after each checkpoint to verify in the browser.
