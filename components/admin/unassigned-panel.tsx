"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { GENDER_LABELS, de } from "@/lib/admin/messages";
import type { UnassignedGroups } from "@/lib/admin/room-planning";
import type { Gender, PlanningPersonBase } from "@/lib/admin/types";
import { PersonChip, type ChipEmphasis } from "./person-chip";
import { toneFor } from "./room-styles";

const t = de.rooms.panel;

function Group({
  title,
  count,
  dotClass,
  children,
}: {
  title: string;
  count: number;
  dotClass: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", dotClass)} />
        {title}
        <span className="ml-auto font-medium tabular-nums text-muted-foreground">{count}</span>
      </h3>
      {children}
    </section>
  );
}

export type PanelTexts = {
  allAssigned: string;
  missingHint: string;
  actionLabel: string;
  dragHint: string;
};

const ROOM_TEXTS: PanelTexts = {
  allAssigned: t.allAssigned,
  missingHint: t.missingHint,
  actionLabel: de.rooms.person.chooseRoom,
  dragHint: de.rooms.person.dragHint,
};

/**
 * People of the current camp not yet placed (no room, or no tent circle), grouped
 * by gender. Dropping a chip from a room or circle here removes the assignment.
 */
export function UnassignedPanel<P extends PlanningPersonBase>({
  groups,
  totalPeople,
  filters,
  canWrite,
  isDragging,
  filterActive,
  ageOf,
  onOpen,
  onSetGender,
  texts = ROOM_TEXTS,
  missingDraggable = false,
}: {
  groups: UnassignedGroups<P>;
  totalPeople: number;
  filters: ReactNode;
  canWrite: boolean;
  isDragging: boolean;
  filterActive: boolean;
  ageOf: (person: P) => number | null;
  onOpen: (person: P) => void;
  onSetGender: (person: P, gender: Gender) => void;
  /** Wording of the hosting planner; defaults to room planning. */
  texts?: PanelTexts;
  /** Tent circles: people without gender can still go into mixed circles. */
  missingDraggable?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned", disabled: !canWrite });
  const shown = groups.female.length + groups.male.length + groups.missing.length;

  const chips = (people: P[]) => (
    <ul className="flex flex-col gap-1.5">
      {people.map((person) => (
        <li key={person.id}>
          <PersonChip
            person={person}
            age={ageOf(person)}
            emphasis={"normal" satisfies ChipEmphasis}
            disabled={!canWrite}
            onOpen={onOpen}
            actionLabel={texts.actionLabel}
            dragHint={texts.dragHint}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-5 rounded-card transition-[box-shadow] duration-200",
        isDragging && "outline-2 outline-offset-8 outline-dashed outline-ink-300",
        isOver && "outline-accent",
      )}
    >
      {filters}

      {totalPeople === 0 ? (
        <p className="text-sm text-muted-foreground">{t.noPeople}</p>
      ) : shown === 0 ? (
        <p className="text-sm text-muted-foreground">
          {filterActive ? t.noMatches : texts.allAssigned}
        </p>
      ) : null}

      {groups.missing.length > 0 && (
        <Group title={t.missing} count={groups.missing.length} dotClass={toneFor(null).dot}>
          <p className="text-xs text-muted-foreground">{texts.missingHint}</p>
          <ul className="flex flex-col gap-2">
            {groups.missing.map((person) => (
              <li key={person.id} className="flex flex-col gap-1.5">
                <PersonChip
                  person={person}
                  age={ageOf(person)}
                  emphasis="normal"
                  disabled={!missingDraggable || !canWrite}
                  allowWithoutGender={missingDraggable}
                  onOpen={onOpen}
                  actionLabel={texts.actionLabel}
                  dragHint={texts.dragHint}
                />
                {canWrite && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["female", "male"] as const).map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => onSetGender(person, gender)}
                        className={cn(
                          "h-8 rounded-sm text-xs font-semibold transition-opacity duration-150 hover:opacity-80",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          toneFor(gender).soft,
                          toneFor(gender).text,
                        )}
                      >
                        {GENDER_LABELS[gender]}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Group>
      )}

      {groups.female.length > 0 && (
        <Group title={t.female} count={groups.female.length} dotClass={toneFor("female").dot}>
          {chips(groups.female)}
        </Group>
      )}

      {groups.male.length > 0 && (
        <Group title={t.male} count={groups.male.length} dotClass={toneFor("male").dot}>
          {chips(groups.male)}
        </Group>
      )}

    </div>
  );
}
