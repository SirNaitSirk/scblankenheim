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
import { Campfire, ChartBar, Plus, UserCheck, UsersThree } from "@phosphor-icons/react";
import { useCallback, useMemo, useOptimistic, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";
import {
  EMPTY_FILTER,
  ageAt,
  fullName,
  isFilterActive,
  matchesFilter,
} from "@/lib/admin/room-planning";
import {
  canJoin,
  kindText,
  membersByCircle,
  summarizeCircles,
  unassignedPeople,
  type CircleCheck,
} from "@/lib/admin/tent-circles";
import type { CirclePerson, Gender, PersonFilter, TentCircle, TentCirclePlan } from "@/lib/admin/types";
import {
  assignTentCircleAction,
  createTentCircleAction,
  deleteTentCircleAction,
  getTentCircleDeleteImpactAction,
  reorderTentCirclesAction,
  setRegistrationGenderAction,
  unassignTentCircleAction,
  updateTentCircleAction,
} from "@/app/admin/zeltkreise/actions";
import { PersonChipBody, type ChipEmphasis } from "./person-chip";
import { PersonFilters } from "./person-filters";
import { ConfirmDeleteDialog } from "./room-forms";
import { EmptyState } from "./states";
import { TentCircleCard, type TentCircleCardActions } from "./tent-circle-card";
import { TentCircleDialog } from "./tent-circle-dialog";
import { TentCirclePickerDialog } from "./tent-circle-picker-dialog";
import { UnassignedPanel, type PanelTexts } from "./unassigned-panel";

const t = de.tentCircles;

const PANEL_TEXTS: PanelTexts = {
  allAssigned: t.panel.allAssigned,
  missingHint: t.panel.missingHint,
  actionLabel: t.person.chooseCircle,
  dragHint: t.person.dragHint,
};

// --- optimistic board state ---------------------------------------------------

type BoardOp =
  | { type: "move"; personId: string; circleId: string | null }
  | { type: "personGender"; personId: string; gender: Gender };

function applyOp(people: CirclePerson[], op: BoardOp): CirclePerson[] {
  switch (op.type) {
    case "move":
      return people.map((p) => (p.id === op.personId ? { ...p, circleId: op.circleId } : p));
    case "personGender":
      return people.map((p) => (p.id === op.personId ? { ...p, gender: op.gender } : p));
  }
}

// --- small pieces -------------------------------------------------------------------

function Stat({
  icon,
  label,
  value,
  hint,
  inverse = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  inverse?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-card p-5 shadow-card",
        inverse ? "bg-surface-inverse text-on-inverse" : "bg-surface",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-semibold",
          inverse ? "text-on-inverse/70" : "text-muted-foreground",
        )}
      >
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "font-display text-2xl font-bold tabular-nums tracking-tight",
          !inverse && "text-foreground",
        )}
      >
        {value}
      </span>
      <span className={cn("text-xs", inverse ? "text-on-inverse/60" : "text-muted-foreground")}>{hint}</span>
    </div>
  );
}

type DeleteState = { circle: TentCircle; impact: number | null };

const numberFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

// --- planner ------------------------------------------------------------------------

export function TentCirclePlanner({ plan, canWrite }: { plan: TentCirclePlan; canWrite: boolean }) {
  const hasCamp = plan.campId !== null;
  const circles = plan.circles;

  const [people, applyOptimistic] = useOptimistic(plan.people, applyOp);
  const [, startTransition] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const [filter, setFilter] = useState<PersonFilter>(EMPTY_FILTER);
  const [picker, setPicker] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [form, setForm] = useState<{ circle: TentCircle | null } | null>(null);
  const [toDelete, setToDelete] = useState<DeleteState | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const circleById = useMemo(() => new Map(circles.map((c) => [c.id, c])), [circles]);
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const members = useMemo(() => membersByCircle(people), [people]);
  const summary = useMemo(() => summarizeCircles(circles, people), [circles, people]);

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
    (person: CirclePerson) => matchesFilter(person, filter, filterContext),
    [filter, filterContext],
  );
  const groups = useMemo(() => unassignedPeople(people.filter(matches)), [people, matches]);
  const hits = useMemo(() => people.filter(matches).length, [people, matches]);

  const ageOf = useCallback(
    (person: CirclePerson) =>
      plan.birthdateKey ? ageAt(person.formData[plan.birthdateKey], plan.campStart) : null,
    [plan.birthdateKey, plan.campStart],
  );
  const emphasisOf = useCallback(
    (person: CirclePerson): ChipEmphasis =>
      !filterActive ? "normal" : matches(person) ? "match" : "muted",
    [filterActive, matches],
  );

  const dragged = dragId ? (personById.get(dragId) ?? null) : null;
  const pickerPerson = picker ? (personById.get(picker) ?? null) : null;

  // --- mutations ---------------------------------------------------------------

  const assign = useCallback(
    (person: CirclePerson, circleId: string) => {
      const circle = circleById.get(circleId);
      if (!circle) return;
      const check = canJoin(person, circle);
      if (check === "already_here") return setPicker(null);
      if (check === "is_leader") return showToast(t.errors.isLeader);
      if (check === "kind_mismatch") return showToast(t.errors.kindMismatch(kindText(circle.kind)));
      setPicker(null);
      startTransition(async () => {
        applyOptimistic({ type: "move", personId: person.id, circleId });
        const result = await assignTentCircleAction(person.id, circleId);
        showToast(result.ok ? t.toast.assigned(fullName(person), circle.name) : result.error);
      });
    },
    [circleById, applyOptimistic, showToast],
  );

  const unassign = useCallback(
    (person: CirclePerson) => {
      if (!person.circleId) return;
      setPicker(null);
      startTransition(async () => {
        applyOptimistic({ type: "move", personId: person.id, circleId: null });
        const result = await unassignTentCircleAction(person.id);
        showToast(result.ok ? t.toast.removed(fullName(person)) : result.error);
      });
    },
    [applyOptimistic, showToast],
  );

  const setPersonGender = useCallback(
    (person: CirclePerson, gender: Gender) => {
      startTransition(async () => {
        applyOptimistic({ type: "personGender", personId: person.id, gender });
        const result = await setRegistrationGenderAction(person.id, gender);
        showToast(result.ok ? t.toast.genderSaved : result.error);
      });
    },
    [applyOptimistic, showToast],
  );

  const move = useCallback(
    (circle: TentCircle, direction: -1 | 1) => {
      const index = circles.findIndex((c) => c.id === circle.id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= circles.length) return;
      const ids = circles.map((c) => c.id);
      [ids[index], ids[target]] = [ids[target], ids[index]];
      startTransition(async () => {
        const result = await reorderTentCirclesAction(ids);
        showToast(result.ok ? t.toast.saved : result.error);
      });
    },
    [circles, showToast],
  );

  const openDelete = useCallback((circle: TentCircle) => {
    setToDelete({ circle, impact: null });
    void getTentCircleDeleteImpactAction(circle.id).then((impact) =>
      setToDelete((current) =>
        current && current.circle.id === circle.id ? { ...current, impact: impact ?? 0 } : current,
      ),
    );
  }, []);

  const confirmDelete = useCallback(() => {
    if (!toDelete) return;
    startDelete(async () => {
      const result = await deleteTentCircleAction(toDelete.circle.id);
      setToDelete(null);
      showToast(result.ok ? t.toast.deleted : result.error);
    });
  }, [toDelete, showToast]);

  const cardActions: TentCircleCardActions = {
    onOpenPerson: (person) => setPicker(person.id),
    onEdit: (circle) => setForm({ circle }),
    onDelete: openDelete,
    onMove: move,
  };

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
    if (overId.startsWith("circle:")) assign(person, overId.slice("circle:".length));
  };

  const dragCheckFor = (circle: TentCircle): CircleCheck | null =>
    dragged ? canJoin(dragged, circle) : null;

  // --- render ----------------------------------------------------------------------

  const panel = (
    <UnassignedPanel
      groups={groups}
      totalPeople={people.length}
      canWrite={canWrite && hasCamp}
      isDragging={dragged !== null && dragged.circleId !== null}
      filterActive={filterActive}
      ageOf={ageOf}
      onOpen={(person) => {
        setPanelOpen(false);
        setPicker(person.id);
      }}
      onSetGender={setPersonGender}
      texts={PANEL_TEXTS}
      missingDraggable
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

  if (!hasCamp) {
    return (
      <p className="rounded-input border border-border bg-ink-50 px-4 py-3 text-sm text-muted-foreground">
        {t.noCurrentCamp}
      </p>
    );
  }

  return (
    <DndContext
      // Fixed id: the generated one differs between server and client render.
      id="tent-circle-board"
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragId(null)}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat
          icon={<Campfire size={14} weight="bold" />}
          label={t.stats.circles}
          value={String(summary.circles)}
          hint={t.stats.circlesHint(String(summary.withLeader))}
        />
        <Stat
          icon={<UserCheck size={14} weight="bold" />}
          label={t.stats.assigned}
          value={String(summary.assigned)}
          hint={t.stats.assignedHint(String(summary.total))}
        />
        <Stat
          inverse
          icon={<UsersThree size={14} weight="bold" />}
          label={t.stats.unassigned}
          value={String(summary.unassigned)}
          hint={
            summary.missingGender > 0
              ? t.stats.missingGender(String(summary.missingGender))
              : t.stats.unassignedHint
          }
        />
        <Stat
          icon={<ChartBar size={14} weight="bold" />}
          label={t.stats.average}
          value={numberFormat.format(summary.average)}
          hint={t.stats.averageHint}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-6 flex max-h-[calc(100dvh-3rem)] flex-col gap-4 overflow-y-auto overscroll-contain rounded-card bg-surface p-5 shadow-card">
            <h2 className="font-display text-base font-bold tracking-tight text-foreground">
              {t.panel.title}
            </h2>
            {panel}
          </div>
        </aside>

        {/* Bottom room on small screens so the floating panel button never covers the last action. */}
        <div className="flex min-w-0 flex-col gap-6 pb-20 lg:pb-0">
          {circles.length === 0 ? (
            <div className="rounded-card bg-surface shadow-card">
              <EmptyState
                icon={Campfire}
                title={t.emptyTitle}
                description={t.emptyDescription}
                action={
                  canWrite ? (
                    <Button onClick={() => setForm({ circle: null })}>
                      <Plus size={16} weight="bold" />
                      {t.addCircle}
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {circles.map((circle, index) => {
                const leader = circle.leaderId ? (personById.get(circle.leaderId) ?? null) : null;
                return (
                  <TentCircleCard
                    key={circle.id}
                    circle={circle}
                    leader={leader && leader.leads === circle.id ? leader : null}
                    members={members.get(circle.id) ?? []}
                    dragCheck={dragCheckFor(circle)}
                    canWrite={canWrite}
                    isFirst={index === 0}
                    isLast={index === circles.length - 1}
                    ageOf={ageOf}
                    emphasisOf={emphasisOf}
                    actions={cardActions}
                  />
                );
              })}
            </div>
          )}

          {canWrite && circles.length > 0 && (
            <Button variant="ghost" className="self-start" onClick={() => setForm({ circle: null })}>
              <Plus size={16} weight="bold" />
              {t.addCircle}
            </Button>
          )}
        </div>
      </div>

      {/* Phone and tablet: the unassigned list lives in a sheet behind a floating button. */}
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
        closeLabel={de.rooms.panel.close}
        className="lg:hidden"
      >
        {panel}
      </Dialog>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
        {dragged ? (
          <div className="w-60 rotate-[-1.5deg]">
            <PersonChipBody person={dragged} age={ageOf(dragged)} lifted />
          </div>
        ) : null}
      </DragOverlay>

      <TentCirclePickerDialog
        person={pickerPerson}
        age={pickerPerson ? ageOf(pickerPerson) : null}
        circles={circles}
        members={members}
        canWrite={canWrite}
        onClose={() => setPicker(null)}
        onAssign={assign}
        onUnassign={unassign}
        onSetGender={setPersonGender}
      />

      {form && (
        <TentCircleDialog
          key={form.circle?.id ?? "new"}
          circle={form.circle}
          circles={circles}
          people={people}
          ageOf={ageOf}
          onClose={() => setForm(null)}
          onSubmit={(values) =>
            form.circle ? updateTentCircleAction(form.circle.id, values) : createTentCircleAction(values)
          }
          onSaved={(result, values) => {
            setForm(null);
            const leader = personById.get(values.leaderId);
            showToast(
              result.ok && result.leaderMoved && leader ? t.toast.leaderMoved(fullName(leader)) : t.toast.saved,
            );
          }}
        />
      )}

      <ConfirmDeleteDialog
        open={toDelete !== null}
        title={toDelete ? t.confirm.deleteTitle(toDelete.circle.name) : ""}
        impact={toDelete?.impact ?? null}
        pending={deletePending}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        describeImpact={t.confirm.impact}
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
