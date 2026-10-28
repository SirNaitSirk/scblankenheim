"use client";

import { Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { GENDER_ADJECTIVES, GENDER_LABELS, de } from "@/lib/admin/messages";
import { canAssign, fullName, isAssignable } from "@/lib/admin/room-planning";
import type { Gender, House, PlanningPerson } from "@/lib/admin/types";
import { toneFor } from "./room-styles";

const t = de.rooms;

/**
 * Click, tap and keyboard path for assigning (FR-015, FR-016): lists only rooms
 * that can take the person, grouped by house. Empty rooms that would adopt the
 * person's gender say so. Also offers „Aus Zimmer entfernen“ and, when the
 * gender is missing, setting it.
 */
export function RoomPickerDialog({
  person,
  age,
  houses,
  occupants,
  canWrite,
  onClose,
  onAssign,
  onUnassign,
  onSetGender,
}: {
  person: PlanningPerson | null;
  age: number | null;
  houses: House[];
  occupants: Map<string, PlanningPerson[]>;
  canWrite: boolean;
  onClose: () => void;
  onAssign: (person: PlanningPerson, roomId: string) => void;
  onUnassign: (person: PlanningPerson) => void;
  onSetGender: (person: PlanningPerson, gender: Gender) => void;
}) {
  if (!person) return null;
  const name = fullName(person);
  const subtitle = [
    person.gender ? GENDER_LABELS[person.gender] : t.panel.missing,
    age != null ? t.person.age(String(age)) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const options = houses
    .map((house) => ({
      house,
      rooms: house.rooms
        .map((room) => {
          const inRoom = occupants.get(room.id) ?? [];
          return { room, inRoom, check: canAssign(person, room, inRoom) };
        })
        .filter((entry) => isAssignable(entry.check) || entry.check === "already_here"),
    }))
    .filter((group) => group.rooms.length > 0);

  return (
    <Dialog
      open
      onClose={onClose}
      title={t.person.pickerTitle(name)}
      description={subtitle}
      closeLabel={t.panel.close}
      footer={
        canWrite && person.roomId ? (
          <Button type="button" variant="outline" onClick={() => onUnassign(person)}>
            {t.person.remove}
          </Button>
        ) : undefined
      }
    >
      {!canWrite ? null : !person.gender ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t.panel.missingHint}</p>
          <div className="grid grid-cols-2 gap-2">
            {(["female", "male"] as const).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => onSetGender(person, gender)}
                className={cn(
                  "h-11 rounded-input text-sm font-semibold transition-opacity hover:opacity-80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  toneFor(gender).soft,
                  toneFor(gender).text,
                )}
              >
                {GENDER_LABELS[gender]}
              </button>
            ))}
          </div>
        </div>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.person.noFittingRoom}</p>
      ) : (
        <div className="flex flex-col gap-5">
          {options.map(({ house, rooms }) => (
            <section key={house.id} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-muted-foreground">{house.name}</h3>
              <ul className="flex flex-col gap-1.5">
                {rooms.map(({ room, inRoom, check }) => {
                  const here = check === "already_here";
                  const tone = toneFor(check === "adopts_gender" ? person.gender : room.gender);
                  return (
                    <li key={room.id}>
                      <button
                        type="button"
                        disabled={here}
                        onClick={() => onAssign(person, room.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-input border border-border px-3 py-2.5 text-left transition-colors duration-150",
                          "hover:border-ink-300 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          here && "cursor-default border-accent bg-accent/10 hover:border-accent",
                        )}
                      >
                        <span aria-hidden="true" className={cn("h-2.5 w-2.5 shrink-0 rounded-full", tone.dot)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {room.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {check === "adopts_gender" && person.gender
                              ? t.room.willBecome(GENDER_ADJECTIVES[person.gender])
                              : room.gender
                                ? GENDER_LABELS[room.gender]
                                : t.room.unset}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                          {t.room.occupancy(String(inRoom.length), String(room.beds))}
                        </span>
                        {here && <Check size={16} weight="bold" className="shrink-0 text-accent-strong" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Dialog>
  );
}
