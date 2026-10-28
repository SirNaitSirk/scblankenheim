"use client";

import { useDraggable } from "@dnd-kit/core";
import { DotsSixVertical } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";
import { fullName } from "@/lib/admin/room-planning";
import type { PlanningPersonBase } from "@/lib/admin/types";
import { toneFor } from "./room-styles";

const t = de.rooms;

export type ChipEmphasis = "normal" | "match" | "muted";

/** Visual body of a person, shared by the draggable chip and the drag overlay. */
export function PersonChipBody({
  person,
  age,
  lifted = false,
}: {
  person: PlanningPersonBase;
  age: number | null;
  lifted?: boolean;
}) {
  const tone = toneFor(person.gender);
  return (
    <span
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-input border bg-surface px-2.5 py-1.5 text-left text-sm",
        lifted ? "border-ink-300 shadow-pop" : "border-border",
      )}
    >
      <span aria-hidden="true" className={cn("h-2 w-2 shrink-0 rounded-full", tone.dot)} />
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
        {fullName(person) || "?"}
      </span>
      {age != null && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {t.person.age(String(age))}
        </span>
      )}
      <DotsSixVertical
        aria-hidden="true"
        size={14}
        weight="bold"
        className="hidden shrink-0 text-ink-300 sm:block"
      />
    </span>
  );
}

/**
 * A person that can be dragged onto a room, or clicked/tapped (and activated by
 * keyboard) to open the room picker. Dragging needs a small move first, so a
 * plain click still opens the picker.
 */
export function PersonChip<P extends PlanningPersonBase>({
  person,
  age,
  emphasis,
  disabled,
  onOpen,
  allowWithoutGender = false,
  actionLabel = t.person.chooseRoom,
  dragHint = t.person.dragHint,
}: {
  person: P;
  age: number | null;
  emphasis: ChipEmphasis;
  disabled: boolean;
  onOpen: (person: P) => void;
  /** Tent circles: people without gender may still be dragged (into mixed circles). */
  allowWithoutGender?: boolean;
  actionLabel?: string;
  dragHint?: string;
}) {
  const draggable = !disabled && (allowWithoutGender || person.gender !== null);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: person.id,
    data: { person },
    disabled: !draggable,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      // dnd-kit sets role="button"; keep the native button semantics instead.
      role={undefined}
      title={dragHint}
      aria-label={`${fullName(person)}${age != null ? `, ${t.person.age(String(age))}` : ""}. ${actionLabel}`}
      onClick={() => onOpen(person)}
      className={cn(
        "block w-full touch-manipulation rounded-input text-left transition-[opacity,transform] duration-150 ease-[var(--ease-out-expo)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
        "hover:-translate-y-px",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-30",
        emphasis === "muted" && "opacity-35",
        emphasis === "match" && "rounded-input ring-2 ring-accent",
      )}
    >
      <PersonChipBody person={person} age={age} />
    </button>
  );
}
