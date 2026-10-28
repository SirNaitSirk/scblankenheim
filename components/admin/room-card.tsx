"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  ArrowLeft,
  ArrowRight,
  GenderFemale,
  GenderMale,
  PencilSimple,
  Trash,
  X,
} from "@phosphor-icons/react";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { cn } from "@/lib/cn";
import { GENDER_ADJECTIVES, GENDER_LABELS, de } from "@/lib/admin/messages";
import type { AssignCheck } from "@/lib/admin/room-planning";
import type { Gender, PlanningPerson, Room } from "@/lib/admin/types";
import { PersonChip, type ChipEmphasis } from "./person-chip";
import { toneFor } from "./room-styles";

const t = de.rooms;

export type RoomCardActions = {
  onOpenPerson: (person: PlanningPerson) => void;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  onSetGender: (room: Room, gender: Gender | null) => void;
  onMove: (room: Room, direction: -1 | 1) => void;
};

/** Reason shown on a room while someone is dragged over the board. */
function dragLabel(check: AssignCheck, room: Room, dragGender: Gender | null): string | null {
  switch (check) {
    case "full":
      return t.room.reasonFull;
    case "gender_mismatch":
      return room.gender ? t.room.reasonGender(GENDER_ADJECTIVES[room.gender]) : null;
    case "adopts_gender":
      return dragGender ? t.room.willBecome(GENDER_ADJECTIVES[dragGender]) : null;
    case "ok":
      return t.room.dropHere;
    default:
      return null;
  }
}

export function RoomCard({
  room,
  occupants,
  dragCheck,
  dragGender,
  canWrite,
  hasCamp,
  isFirst,
  isLast,
  ageOf,
  emphasisOf,
  actions,
}: {
  room: Room;
  occupants: PlanningPerson[];
  /** Fit of the person currently dragged; null while nobody is dragged. */
  dragCheck: AssignCheck | null;
  dragGender: Gender | null;
  canWrite: boolean;
  hasCamp: boolean;
  isFirst: boolean;
  isLast: boolean;
  ageOf: (person: PlanningPerson) => number | null;
  emphasisOf: (person: PlanningPerson) => ChipEmphasis;
  actions: RoomCardActions;
}) {
  const fits = dragCheck === "ok" || dragCheck === "adopts_gender";
  const { setNodeRef, isOver } = useDroppable({
    id: `room:${room.id}`,
    data: { roomId: room.id },
    disabled: !canWrite || !hasCamp,
  });

  const tone = toneFor(room.gender);
  const taken = occupants.length;
  const isFull = taken >= room.beds;
  const freeSlots = Math.max(0, room.beds - taken);
  const label = dragCheck ? dragLabel(dragCheck, room, dragGender) : null;

  const menu: MenuItem[] = [
    { label: t.room.edit, icon: PencilSimple, onSelect: () => actions.onEdit(room) },
  ];
  if (hasCamp && taken === 0) {
    if (room.gender !== "female") {
      menu.push({ label: t.room.setFemale, icon: GenderFemale, onSelect: () => actions.onSetGender(room, "female") });
    }
    if (room.gender !== "male") {
      menu.push({ label: t.room.setMale, icon: GenderMale, onSelect: () => actions.onSetGender(room, "male") });
    }
    if (room.gender) {
      menu.push({ label: t.room.setUnset, icon: X, onSelect: () => actions.onSetGender(room, null) });
    }
  }
  if (!isFirst) menu.push({ label: t.room.moveUp, icon: ArrowLeft, onSelect: () => actions.onMove(room, -1) });
  if (!isLast) menu.push({ label: t.room.moveDown, icon: ArrowRight, onSelect: () => actions.onMove(room, 1) });
  menu.push({ label: t.room.delete, icon: Trash, danger: true, onSelect: () => actions.onDelete(room) });

  return (
    <section
      ref={setNodeRef}
      aria-label={room.name}
      className={cn(
        "relative flex flex-col gap-3 rounded-card border bg-surface p-4 shadow-card transition-[opacity,box-shadow,border-color,transform] duration-200 ease-[var(--ease-out-expo)]",
        tone.border,
        dragCheck && !fits && "opacity-45",
        dragCheck && fits && "ring-2 ring-accent/50",
        isOver && fits && "-translate-y-0.5 ring-accent",
      )}
    >
      <header className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h3 className="truncate font-display text-base font-bold tracking-tight text-foreground">
            {room.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-semibold",
                tone.soft,
                tone.text,
              )}
            >
              {room.gender === "female" ? (
                <GenderFemale size={12} weight="bold" aria-hidden="true" />
              ) : room.gender === "male" ? (
                <GenderMale size={12} weight="bold" aria-hidden="true" />
              ) : null}
              {room.gender ? GENDER_LABELS[room.gender] : t.room.unset}
            </span>
            <span
              className={cn(
                "text-xs font-medium tabular-nums",
                isFull ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {isFull ? t.room.full : t.room.occupancy(String(taken), String(room.beds))}
            </span>
          </div>
        </div>
        {canWrite && <Menu label={t.room.menu} items={menu} />}
      </header>

      {/* One slot per bed: filled by a person or drawn as a free place. */}
      <ul className="flex flex-col gap-1.5" aria-label={t.room.bedsLabel(String(room.beds))}>
        {occupants.map((person) => (
          <li key={person.id}>
            <PersonChip
              person={person}
              age={ageOf(person)}
              emphasis={emphasisOf(person)}
              disabled={!canWrite}
              onOpen={actions.onOpenPerson}
            />
          </li>
        ))}
        {Array.from({ length: freeSlots }, (_, index) => (
          <li
            key={`free-${index}`}
            aria-hidden="true"
            className={cn(
              "h-[34px] rounded-input border border-dashed transition-colors duration-150",
              isOver && fits && index === 0
                ? "border-accent bg-accent/10"
                : "border-ink-200",
            )}
          />
        ))}
      </ul>

      {room.gender === null && taken === 0 && !dragCheck && (
        <p className="text-xs text-muted-foreground">{t.room.unsetHint}</p>
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
