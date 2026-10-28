"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  CaretUp,
  Crown,
  PencilSimple,
  Trash,
  UserPlus,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";
import { fullName } from "@/lib/admin/room-planning";
import type { CircleCheck } from "@/lib/admin/tent-circles";
import type { CirclePerson, TentCircle, TentCircleKind } from "@/lib/admin/types";
import { PersonChip, type ChipEmphasis } from "./person-chip";
import { toneFor } from "./room-styles";

const t = de.tentCircles;

/** Chips shown before „Alle anzeigen“; circles have no capacity and can grow long. */
const COLLAPSED_COUNT = 12;

export function kindTone(kind: TentCircleKind) {
  return toneFor(kind === "mixed" ? null : kind);
}

export type TentCircleCardActions = {
  onOpenPerson: (person: CirclePerson) => void;
  onEdit: (circle: TentCircle) => void;
  onDelete: (circle: TentCircle) => void;
  onMove: (circle: TentCircle, direction: -1 | 1) => void;
};

/** Reason shown on a circle while someone is dragged over the board. */
function dragLabel(check: CircleCheck, circle: TentCircle): string | null {
  switch (check) {
    case "ok":
      return t.circle.dropHere;
    case "kind_mismatch":
      return t.kinds[circle.kind];
    case "is_leader":
      return t.circle.reasonLeader;
    default:
      return null;
  }
}

export function TentCircleCard({
  circle,
  leader,
  members,
  dragCheck,
  canWrite,
  isFirst,
  isLast,
  ageOf,
  emphasisOf,
  actions,
}: {
  circle: TentCircle;
  /** Active leader, or null when missing (cancelled, deleted, gender changed). */
  leader: CirclePerson | null;
  members: CirclePerson[];
  /** Fit of the person currently dragged; null while nobody is dragged. */
  dragCheck: CircleCheck | null;
  canWrite: boolean;
  isFirst: boolean;
  isLast: boolean;
  ageOf: (person: CirclePerson) => number | null;
  emphasisOf: (person: CirclePerson) => ChipEmphasis;
  actions: TentCircleCardActions;
}) {
  const [expanded, setExpanded] = useState(false);
  const fits = dragCheck === "ok";
  const { setNodeRef, isOver } = useDroppable({
    id: `circle:${circle.id}`,
    data: { circleId: circle.id },
    disabled: !canWrite,
  });

  const tone = kindTone(circle.kind);
  const female = members.filter((p) => p.gender === "female").length;
  const male = members.filter((p) => p.gender === "male").length;
  const shown = expanded ? members : members.slice(0, COLLAPSED_COUNT);
  const hidden = members.length - shown.length;
  const label = dragCheck ? dragLabel(dragCheck, circle) : null;
  const leaderEmphasis = leader ? emphasisOf(leader) : "normal";
  const leaderAge = leader ? ageOf(leader) : null;

  const menu: MenuItem[] = [
    { label: t.circle.edit, icon: PencilSimple, onSelect: () => actions.onEdit(circle) },
  ];
  if (!isFirst) menu.push({ label: t.circle.moveUp, icon: ArrowLeft, onSelect: () => actions.onMove(circle, -1) });
  if (!isLast) menu.push({ label: t.circle.moveDown, icon: ArrowRight, onSelect: () => actions.onMove(circle, 1) });
  menu.push({ label: t.circle.delete, icon: Trash, danger: true, onSelect: () => actions.onDelete(circle) });

  return (
    <section
      ref={setNodeRef}
      aria-label={circle.name}
      className={cn(
        "relative flex flex-col gap-4 rounded-card border bg-surface p-4 shadow-card transition-[opacity,box-shadow,border-color,transform] duration-200 ease-[var(--ease-out-expo)]",
        tone.border,
        dragCheck && !fits && dragCheck !== "already_here" && "opacity-45",
        dragCheck && fits && "ring-2 ring-accent/50",
        isOver && fits && "-translate-y-0.5 ring-accent",
      )}
    >
      <header className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h3 className="truncate font-display text-base font-bold tracking-tight text-foreground">
            {circle.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-semibold",
                tone.soft,
                tone.text,
              )}
            >
              {t.kinds[circle.kind]}
            </span>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {t.circle.members(members.length)}
            </span>
          </div>
        </div>
        {canWrite && <Menu label={t.circle.menu} items={menu} />}
      </header>

      {/* The leader sits apart from the participants: never draggable, edited in the dialog. */}
      {leader ? (
        <button
          type="button"
          disabled={!canWrite}
          onClick={() => actions.onEdit(circle)}
          aria-label={`${t.circle.leader}: ${fullName(leader)}. ${t.circle.edit}`}
          className={cn(
            "flex items-center gap-2.5 rounded-input bg-accent/12 px-3 py-2 text-left ring-1 ring-inset ring-accent/30 transition-[opacity,box-shadow] duration-150",
            "hover:bg-accent/18 disabled:hover:bg-accent/12",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            leaderEmphasis === "muted" && "opacity-35",
            leaderEmphasis === "match" && "ring-2 ring-accent",
          )}
        >
          <Crown size={16} weight="fill" aria-hidden="true" className="shrink-0 text-accent-strong" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {fullName(leader) || "?"}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {[t.circle.leader, leaderAge != null ? de.rooms.person.age(String(leaderAge)) : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </button>
      ) : (
        <button
          type="button"
          disabled={!canWrite}
          onClick={() => actions.onEdit(circle)}
          className={cn(
            "flex items-center gap-2.5 rounded-input border border-dashed border-accent/60 px-3 py-2 text-left text-accent-strong transition-colors duration-150",
            "hover:bg-accent/10 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <UserPlus size={16} weight="bold" aria-hidden="true" className="shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t.circle.leaderMissing}</span>
          {canWrite && <span className="shrink-0 text-xs underline underline-offset-2">{t.circle.chooseLeader}</span>}
        </button>
      )}

      {circle.kind === "mixed" && members.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div
            aria-hidden="true"
            className="flex h-1.5 overflow-hidden rounded-pill bg-ink-100"
          >
            <div className={cn("h-full", toneFor("female").dot)} style={{ width: `${(female / members.length) * 100}%` }} />
            <div className={cn("h-full", toneFor("male").dot)} style={{ width: `${(male / members.length) * 100}%` }} />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {t.circle.split(String(female), String(male))}
          </span>
        </div>
      )}

      {members.length === 0 ? (
        <p
          className={cn(
            "rounded-input border border-dashed px-3 py-4 text-center text-xs text-muted-foreground transition-colors duration-150",
            isOver && fits ? "border-accent bg-accent/10" : "border-ink-200",
          )}
        >
          {t.circle.noMembers}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {shown.map((person) => (
            <li key={person.id}>
              <PersonChip
                person={person}
                age={ageOf(person)}
                emphasis={emphasisOf(person)}
                disabled={!canWrite}
                allowWithoutGender
                onOpen={actions.onOpenPerson}
                actionLabel={t.person.chooseCircle}
                dragHint={t.person.dragHint}
              />
            </li>
          ))}
          {isOver && fits && (
            <li aria-hidden="true" className="h-[34px] rounded-input border border-dashed border-accent bg-accent/10" />
          )}
        </ul>
      )}

      {(hidden > 0 || expanded) && members.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-1 self-start rounded-sm text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
          {expanded ? t.circle.showLess : t.circle.showAll(String(members.length))}
        </button>
      )}

      {label && (
        <p
          className={cn(
            "pointer-events-none absolute right-3 top-3 rounded-pill px-2.5 py-0.5 text-xs font-semibold shadow-card",
            fits ? "bg-accent text-accent-foreground" : "bg-surface-inverse text-on-inverse",
          )}
        >
          {label}
        </p>
      )}
    </section>
  );
}
