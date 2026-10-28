"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ArrowDown,
  ArrowUp,
  Bed,
  GenderFemale,
  GenderMale,
  PencilSimple,
  Plus,
  Trash,
  UsersThree,
  Warning,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { cn } from "@/lib/cn";
import { GENDER_ADJECTIVES, de } from "@/lib/admin/messages";
import {
  EMPTY_FILTER,
  ageAt,
  canAssign,
  fullName,
  groupUnassigned,
  isAssignable,
  isFilterActive,
  matchesFilter,
  occupantsByRoom,
  summarize,
  type GenderSummary,
} from "@/lib/admin/room-planning";
import type {
  ActionResult,
  Gender,
  House,
  PersonFilter,
  PlanningPerson,
  Room,
  RoomGender,
  RoomPlan,
} from "@/lib/admin/types";
import {
  assignRoomAction,
  createHouseAction,
  createRoomAction,
  deleteHouseAction,
  deleteRoomAction,
  getDeleteImpactAction,
  reorderHousesAction,
  reorderRoomsAction,
  setHouseGenderAction,
  setRegistrationGenderAction,
  setRoomGenderAction,
  unassignRoomAction,
  updateHouseAction,
  updateRoomAction,
} from "@/app/admin/zimmerplanung/actions";
import { PersonChipBody, type ChipEmphasis } from "./person-chip";
import { PersonFilters } from "./person-filters";
import { RoomCard, type RoomCardActions } from "./room-card";
import { ConfirmDeleteDialog, RoomFormDialog } from "./room-forms";
import { RoomPickerDialog } from "./room-picker-dialog";
import { toneFor } from "./room-styles";
import { EmptyState } from "./states";
import { UnassignedPanel } from "./unassigned-panel";

const t = de.rooms;

// --- optimistic board state ---------------------------------------------------

type BoardState = { people: PlanningPerson[]; roomGenders: Record<string, RoomGender> };

type BoardOp =
  | { type: "move"; personId: string; roomId: string | null }
  | { type: "personGender"; personId: string; gender: Gender }
  | { type: "roomGender"; roomId: string; gender: RoomGender };

function applyOp(state: BoardState, op: BoardOp): BoardState {
  switch (op.type) {
    case "move": {
      const person = state.people.find((p) => p.id === op.personId);
      const roomGenders = { ...state.roomGenders };
      if (op.roomId && person?.gender) {
        const others = state.people.filter((p) => p.roomId === op.roomId && p.id !== person.id);
        if (others.length === 0) roomGenders[op.roomId] = person.gender; // empty room adopts
      }
      return {
        roomGenders,
        people: state.people.map((p) => (p.id === op.personId ? { ...p, roomId: op.roomId } : p)),
      };
    }
    case "personGender":
      return {
        ...state,
        people: state.people.map((p) => (p.id === op.personId ? { ...p, gender: op.gender } : p)),
      };
    case "roomGender":
      return { ...state, roomGenders: { ...state.roomGenders, [op.roomId]: op.gender } };
  }
}

// --- small pieces -------------------------------------------------------------------

function CapacityStat({
  label,
  gender,
  summary,
}: {
  label: string;
  gender: Gender;
  summary: GenderSummary;
}) {
  const tone = toneFor(gender);
  const ratio = summary.beds > 0 ? Math.min(1, summary.occupied / summary.beds) : 0;
  return (
    <div className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", tone.text)}>
          {gender === "female" ? <GenderFemale size={14} weight="bold" /> : <GenderMale size={14} weight="bold" />}
          {label}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {t.stats.free(String(summary.free))}
        </span>
      </div>
      <span className="font-display text-2xl font-bold tabular-nums tracking-tight text-foreground">
        {summary.occupied}
        <span className="text-base font-semibold text-muted-foreground"> / {summary.beds}</span>
      </span>
      <div
        role="meter"
        aria-label={t.stats.occupied(String(summary.occupied), String(summary.beds))}
        aria-valuemin={0}
        aria-valuemax={summary.beds}
        aria-valuenow={summary.occupied}
        className="h-1.5 overflow-hidden rounded-pill bg-ink-100"
      >
        <div
          className={cn("h-full rounded-pill transition-[width] duration-500 ease-[var(--ease-out-expo)]", tone.dot)}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

type FormState =
  | { kind: "house"; mode: "create" }
  | { kind: "house"; mode: "edit"; house: House }
  | { kind: "room"; mode: "create"; houseId: string }
  | { kind: "room"; mode: "edit"; room: Room };

type DeleteState = { kind: "house" | "room"; id: string; name: string; impact: number | null };

// --- planner ------------------------------------------------------------------------

export function RoomPlanner({ plan, canWrite }: { plan: RoomPlan; canWrite: boolean }) {
  const hasCamp = plan.campId !== null;

  const base = useMemo<BoardState>(
    () => ({
      people: plan.people,
      roomGenders: Object.fromEntries(
        plan.houses.flatMap((h) => h.rooms.map((r) => [r.id, r.gender] as const)),
      ),
    }),
    [plan],
  );
  const [board, applyOptimistic] = useOptimistic(base, applyOp);
  const [, startTransition] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const [filter, setFilter] = useState<PersonFilter>(EMPTY_FILTER);
  const [picker, setPicker] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [toDelete, setToDelete] = useState<DeleteState | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  // Houses with the optimistic room genders applied.
  const houses = useMemo<House[]>(
    () =>
      plan.houses.map((house) => ({
        ...house,
        rooms: house.rooms.map((room) => ({ ...room, gender: board.roomGenders[room.id] ?? null })),
      })),
    [plan.houses, board.roomGenders],
  );
  const roomById = useMemo(
    () => new Map(houses.flatMap((h) => h.rooms.map((r) => [r.id, r] as const))),
    [houses],
  );
  const occupants = useMemo(() => {
    const map = occupantsByRoom(board.people);
    for (const list of map.values()) list.sort((a, b) => a.lastName.localeCompare(b.lastName, "de"));
    return map;
  }, [board.people]);
  const summary = useMemo(() => summarize(houses, board.people), [houses, board.people]);

  const filterContext = useMemo(
    () => ({
      fieldsByKey: new Map(plan.fields.map((f) => [f.key, f])),
      birthdateKey: plan.birthdateKey,
      campStart: plan.campStart,
    }),
    [plan.fields, plan.birthdateKey, plan.campStart],
  );
  const filterActive = isFilterActive(filter);
  const matches = useCallback(
    (person: PlanningPerson) => matchesFilter(person, filter, filterContext),
    [filter, filterContext],
  );
  const groups = useMemo(
    () => groupUnassigned(board.people.filter(matches)),
    [board.people, matches],
  );
  const hits = useMemo(() => board.people.filter(matches).length, [board.people, matches]);

  const ageOf = useCallback(
    (person: PlanningPerson) =>
      plan.birthdateKey ? ageAt(person.formData[plan.birthdateKey], plan.campStart) : null,
    [plan.birthdateKey, plan.campStart],
  );
  const emphasisOf = useCallback(
    (person: PlanningPerson): ChipEmphasis =>
      !filterActive ? "normal" : matches(person) ? "match" : "muted",
    [filterActive, matches],
  );

  const personById = useMemo(() => new Map(board.people.map((p) => [p.id, p])), [board.people]);
  const dragged = dragId ? (personById.get(dragId) ?? null) : null;
  const pickerPerson = picker ? (personById.get(picker) ?? null) : null;

  // --- mutations ---------------------------------------------------------------

  const assign = useCallback(
    (person: PlanningPerson, roomId: string) => {
      const room = roomById.get(roomId);
      if (!room) return;
      const check = canAssign(person, room, occupants.get(roomId) ?? []);
      if (!isAssignable(check)) {
        if (check === "full") showToast(t.errors.full);
        else if (check === "gender_mismatch" && room.gender)
          showToast(t.errors.genderMismatch(t.shortageGender[room.gender]));
        else if (check === "no_gender") showToast(t.errors.noGender);
        return;
      }
      setPicker(null);
      startTransition(async () => {
        applyOptimistic({ type: "move", personId: person.id, roomId });
        const result = await assignRoomAction(person.id, roomId);
        if (!result.ok) return showToast(result.error);
        showToast(
          result.roomGender
            ? t.toast.roomGenderSet(room.name, GENDER_ADJECTIVES[result.roomGender])
            : t.toast.assigned(fullName(person), room.name),
        );
      });
    },
    [roomById, occupants, applyOptimistic, showToast],
  );

  const unassign = useCallback(
    (person: PlanningPerson) => {
      if (!person.roomId) return;
      setPicker(null);
      startTransition(async () => {
        applyOptimistic({ type: "move", personId: person.id, roomId: null });
        const result = await unassignRoomAction(person.id);
        showToast(result.ok ? t.toast.removed(fullName(person)) : result.error);
      });
    },
    [applyOptimistic, showToast],
  );

  const setPersonGender = useCallback(
    (person: PlanningPerson, gender: Gender) => {
      startTransition(async () => {
        applyOptimistic({ type: "personGender", personId: person.id, gender });
        const result = await setRegistrationGenderAction(person.id, gender);
        showToast(result.ok ? t.toast.genderSaved : result.error);
      });
    },
    [applyOptimistic, showToast],
  );

  const run = useCallback(
    (action: Promise<ActionResult>, success: string | ((r: ActionResult) => string)) => {
      startTransition(async () => {
        const result = await action;
        showToast(result.ok ? (typeof success === "string" ? success : success(result)) : result.error);
      });
    },
    [showToast],
  );

  const setRoomGender = useCallback(
    (room: Room, gender: Gender | null) => {
      startTransition(async () => {
        applyOptimistic({ type: "roomGender", roomId: room.id, gender });
        const result = await setRoomGenderAction(room.id, gender);
        showToast(result.ok ? t.toast.saved : result.error);
      });
    },
    [applyOptimistic, showToast],
  );

  const moveInList = useCallback(
    <T extends { id: string }>(list: T[], id: string, direction: -1 | 1): string[] | null => {
      const index = list.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= list.length) return null;
      const ids = list.map((item) => item.id);
      [ids[index], ids[target]] = [ids[target], ids[index]];
      return ids;
    },
    [],
  );

  const openDelete = useCallback((kind: "house" | "room", id: string, name: string) => {
    setToDelete({ kind, id, name, impact: null });
    void getDeleteImpactAction(kind === "room" ? { roomId: id } : { houseId: id }).then((impact) =>
      setToDelete((current) => (current && current.id === id ? { ...current, impact: impact ?? 0 } : current)),
    );
  }, []);

  const confirmDelete = useCallback(() => {
    if (!toDelete) return;
    startDelete(async () => {
      const result =
        toDelete.kind === "room" ? await deleteRoomAction(toDelete.id) : await deleteHouseAction(toDelete.id);
      setToDelete(null);
      showToast(result.ok ? t.toast.deleted : result.error);
    });
  }, [toDelete, showToast]);

  const roomActions: RoomCardActions = {
    onOpenPerson: (person) => setPicker(person.id),
    onEdit: (room) => setForm({ kind: "room", mode: "edit", room }),
    onDelete: (room) => openDelete("room", room.id, room.name),
    onSetGender: setRoomGender,
    onMove: (room, direction) => {
      const house = houses.find((h) => h.id === room.houseId);
      const ids = house ? moveInList(house.rooms, room.id, direction) : null;
      if (house && ids) run(reorderRoomsAction(house.id, ids), t.toast.saved);
    },
  };

  function houseMenu(house: House, index: number): MenuItem[] {
    const items: MenuItem[] = [
      { label: t.house.rename, icon: PencilSimple, onSelect: () => setForm({ kind: "house", mode: "edit", house }) },
    ];
    if (hasCamp && house.rooms.length > 0) {
      items.push(
        {
          label: t.house.allFemale,
          icon: GenderFemale,
          onSelect: () =>
            run(setHouseGenderAction(house.id, "female"), (r) => t.toast.houseGenderSet(Number(r.ok ? r.id : 0))),
        },
        {
          label: t.house.allMale,
          icon: GenderMale,
          onSelect: () =>
            run(setHouseGenderAction(house.id, "male"), (r) => t.toast.houseGenderSet(Number(r.ok ? r.id : 0))),
        },
      );
    }
    if (index > 0) {
      items.push({
        label: t.house.moveUp,
        icon: ArrowUp,
        onSelect: () => {
          const ids = moveInList(houses, house.id, -1);
          if (ids) run(reorderHousesAction(ids), t.toast.saved);
        },
      });
    }
    if (index < houses.length - 1) {
      items.push({
        label: t.house.moveDown,
        icon: ArrowDown,
        onSelect: () => {
          const ids = moveInList(houses, house.id, 1);
          if (ids) run(reorderHousesAction(ids), t.toast.saved);
        },
      });
    }
    items.push({
      label: t.house.delete,
      icon: Trash,
      danger: true,
      onSelect: () => openDelete("house", house.id, house.name),
    });
    return items;
  }

  // --- drag and drop -------------------------------------------------------------

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  );

  const onDragStart = (event: DragStartEvent) => setDragId(String(event.active.id));
  const onDragEnd = (event: DragEndEvent) => {
    setDragId(null);
    const person = personById.get(String(event.active.id));
    const overId = event.over ? String(event.over.id) : null;
    if (!person || !overId) return;
    if (overId === "unassigned") return unassign(person);
    if (overId.startsWith("room:")) assign(person, overId.slice("room:".length));
  };

  const dragCheckFor = (room: Room) =>
    dragged ? canAssign(dragged, room, occupants.get(room.id) ?? []) : null;

  // --- render ----------------------------------------------------------------------

  const shortages = (["female", "male"] as const).filter((g) => summary[g].shortage > 0);

  const panel = (
    <UnassignedPanel
      groups={groups}
      totalPeople={board.people.length}
      canWrite={canWrite && hasCamp}
      isDragging={dragged !== null && dragged.roomId !== null}
      filterActive={filterActive}
      ageOf={ageOf}
      onOpen={(person) => {
        setPanelOpen(false);
        setPicker(person.id);
      }}
      onSetGender={setPersonGender}
      filters={
        <PersonFilters
          filter={filter}
          onChange={setFilter}
          fields={plan.fields}
          hasAge={plan.birthdateKey !== null}
          hits={hits}
        />
      }
    />
  );

  return (
    <DndContext
      // Fixed id: the generated one differs between server and client render.
      id="room-board"
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragId(null)}
    >
      {hasCamp && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <CapacityStat label={t.stats.female} gender="female" summary={summary.female} />
          <CapacityStat label={t.stats.male} gender="male" summary={summary.male} />
          <div className="flex flex-col gap-3 rounded-card bg-surface-inverse p-5 text-on-inverse shadow-card">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-inverse/70">
              <UsersThree size={14} weight="bold" />
              {t.stats.unassigned}
            </span>
            <span className="font-display text-2xl font-bold tabular-nums tracking-tight">
              {summary.unassigned}
            </span>
            <span className="text-xs text-on-inverse/60">
              {summary.missingGender > 0
                ? t.stats.missingGender(String(summary.missingGender))
                : t.stats.unassignedHint}
            </span>
          </div>
          <div className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Bed size={14} weight="bold" />
              {t.stats.beds}
            </span>
            <span className="font-display text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {summary.totalBeds}
            </span>
            <span className="text-xs text-muted-foreground">
              {t.stats.bedsHint(
                String(summary.female.beds),
                String(summary.male.beds),
                String(summary.openBeds),
              )}
            </span>
          </div>
        </div>
      )}

      {shortages.map((gender) => (
        <p
          key={gender}
          role="status"
          className="flex items-start gap-2.5 rounded-input bg-accent/12 px-4 py-3 text-sm text-foreground ring-1 ring-inset ring-accent/30"
        >
          <Warning size={18} weight="bold" className="mt-px shrink-0 text-accent-strong" />
          {t.shortage(t.shortageGender[gender], String(summary[gender].shortage))}
        </p>
      ))}

      {!hasCamp && (
        <p className="rounded-input border border-border bg-ink-50 px-4 py-3 text-sm text-muted-foreground">
          {t.noCurrentCamp}
        </p>
      )}

      <div className={cn("grid gap-6", hasCamp && "lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8")}>
        {hasCamp && (
          <aside className="hidden lg:block">
            <div className="sticky top-6 flex max-h-[calc(100dvh-3rem)] flex-col gap-4 overflow-y-auto overscroll-contain rounded-card bg-surface p-5 shadow-card">
              <h2 className="font-display text-base font-bold tracking-tight text-foreground">
                {t.panel.title}
              </h2>
              {panel}
            </div>
          </aside>
        )}

        {/* Bottom room on small screens so the floating panel button never covers the last action. */}
        <div className="flex min-w-0 flex-col gap-8 pb-20 lg:pb-0">
          {houses.length === 0 ? (
            <div className="rounded-card bg-surface shadow-card">
              <EmptyState
                icon={Bed}
                title={t.emptyTitle}
                description={t.emptyDescription}
                action={
                  canWrite ? (
                    <Button onClick={() => setForm({ kind: "house", mode: "create" })}>
                      <Plus size={16} weight="bold" />
                      {t.addHouse}
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            houses.map((house, index) => {
              const beds = house.rooms.reduce((sum, r) => sum + r.beds, 0);
              return (
                <section key={house.id} aria-labelledby={`house-${house.id}`} className="flex flex-col gap-4">
                  <header className="flex items-center gap-3 border-b border-ink-200 pb-3">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h2
                        id={`house-${house.id}`}
                        className="truncate font-display text-xl font-extrabold tracking-tight text-foreground"
                      >
                        {house.name}
                      </h2>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {t.house.summary(String(house.rooms.length), String(beds))}
                      </span>
                    </div>
                    {canWrite && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setForm({ kind: "room", mode: "create", houseId: house.id })}
                        >
                          <Plus size={14} weight="bold" />
                          {t.addRoom}
                        </Button>
                        <Menu label={t.house.menu} items={houseMenu(house, index)} />
                      </>
                    )}
                  </header>
                  {house.rooms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t.houseEmpty}</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                      {house.rooms.map((room, roomIndex) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          occupants={occupants.get(room.id) ?? []}
                          dragCheck={dragCheckFor(room)}
                          dragGender={dragged?.gender ?? null}
                          canWrite={canWrite}
                          hasCamp={hasCamp}
                          isFirst={roomIndex === 0}
                          isLast={roomIndex === house.rooms.length - 1}
                          ageOf={ageOf}
                          emphasisOf={emphasisOf}
                          actions={roomActions}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })
          )}

          {canWrite && houses.length > 0 && (
            <Button
              variant="ghost"
              className="self-start"
              onClick={() => setForm({ kind: "house", mode: "create" })}
            >
              <Plus size={16} weight="bold" />
              {t.addHouse}
            </Button>
          )}
        </div>
      </div>

      {/* Phone and tablet: the unassigned list lives in a sheet behind a floating button. */}
      {hasCamp && (
        <>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-pill bg-surface-inverse px-5 text-sm font-semibold text-on-inverse shadow-pop transition-transform active:scale-95 lg:hidden"
          >
            <UsersThree size={18} weight="bold" />
            {t.panel.open(String(summary.unassigned))}
          </button>
          <Dialog
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
            title={t.panel.title}
            closeLabel={t.panel.close}
            className="lg:hidden"
          >
            {panel}
          </Dialog>
        </>
      )}

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
        {dragged ? (
          <div className="w-60 rotate-[-1.5deg]">
            <PersonChipBody person={dragged} age={ageOf(dragged)} lifted />
          </div>
        ) : null}
      </DragOverlay>

      <RoomPickerDialog
        person={pickerPerson}
        age={pickerPerson ? ageOf(pickerPerson) : null}
        houses={houses}
        occupants={occupants}
        canWrite={canWrite && hasCamp}
        onClose={() => setPicker(null)}
        onAssign={assign}
        onUnassign={unassign}
        onSetGender={(person, gender) => setPersonGender(person, gender)}
      />

      {form && (
        <RoomFormDialog
          key={form.kind + form.mode + ("house" in form ? form.house.id : "room" in form ? form.room.id : "")}
          open
          kind={form.kind}
          mode={form.mode}
          initial={
            form.kind === "room" && form.mode === "edit"
              ? { name: form.room.name, beds: String(form.room.beds) }
              : form.kind === "house" && form.mode === "edit"
                ? { name: form.house.name, beds: "" }
                : { name: "", beds: form.kind === "room" ? "4" : "" }
          }
          onClose={() => setForm(null)}
          onSubmit={(values) => {
            if (form.kind === "house") {
              return form.mode === "edit"
                ? updateHouseAction(form.house.id, { name: values.name })
                : createHouseAction({ name: values.name });
            }
            return form.mode === "edit"
              ? updateRoomAction(form.room.id, values)
              : createRoomAction(form.houseId, values);
          }}
          onSaved={() => {
            setForm(null);
            showToast(t.toast.saved);
          }}
        />
      )}

      <ConfirmDeleteDialog
        open={toDelete !== null}
        title={
          toDelete
            ? toDelete.kind === "room"
              ? t.confirm.deleteRoomTitle(toDelete.name)
              : t.confirm.deleteHouseTitle(toDelete.name)
            : ""
        }
        impact={toDelete?.impact ?? null}
        pending={deletePending}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-center text-sm text-on-inverse shadow-pop lg:bottom-6"
        >
          {toast}
        </div>
      )}
    </DndContext>
  );
}
