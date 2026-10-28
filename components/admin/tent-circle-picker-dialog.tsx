"use client";

import { Check, Crown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { GENDER_LABELS, de } from "@/lib/admin/messages";
import { fullName } from "@/lib/admin/room-planning";
import { canJoin } from "@/lib/admin/tent-circles";
import type { CirclePerson, Gender, TentCircle } from "@/lib/admin/types";
import { toneFor } from "./room-styles";
import { kindTone } from "./tent-circle-card";

const t = de.tentCircles;

/**
 * Click, tap and keyboard path for assigning (FR-012): lists only circles the
 * person fits. Also offers „Aus Zeltkreis entfernen“ and, when the gender is
 * missing, setting it (which opens up the single gender circles).
 */
export function TentCirclePickerDialog({
  person,
  age,
  circles,
  members,
  canWrite,
  onClose,
  onAssign,
  onUnassign,
  onSetGender,
}: {
  person: CirclePerson | null;
  age: number | null;
  circles: TentCircle[];
  members: Map<string, CirclePerson[]>;
  canWrite: boolean;
  onClose: () => void;
  onAssign: (person: CirclePerson, circleId: string) => void;
  onUnassign: (person: CirclePerson) => void;
  onSetGender: (person: CirclePerson, gender: Gender) => void;
}) {
  if (!person) return null;
  const subtitle = [
    person.gender ? GENDER_LABELS[person.gender] : de.rooms.panel.missing,
    age != null ? de.rooms.person.age(String(age)) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const options = circles
    .map((circle) => ({ circle, check: canJoin(person, circle) }))
    .filter((entry) => entry.check === "ok" || entry.check === "already_here");

  return (
    <Dialog
      open
      onClose={onClose}
      title={t.person.pickerTitle(fullName(person))}
      description={subtitle}
      closeLabel={de.rooms.panel.close}
      footer={
        canWrite && person.circleId ? (
          <Button type="button" variant="outline" onClick={() => onUnassign(person)}>
            {t.person.remove}
          </Button>
        ) : undefined
      }
    >
      {!canWrite ? null : (
        <div className="flex flex-col gap-5">
          {!person.gender && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">{t.panel.missingHint}</p>
              <div className="grid grid-cols-2 gap-2">
                {(["female", "male"] as const).map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => onSetGender(person, gender)}
                    className={cn(
                      "h-10 rounded-input text-sm font-semibold transition-opacity hover:opacity-80",
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
          )}

          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.person.noFittingCircle}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {options.map(({ circle, check }) => {
                const here = check === "already_here";
                const count = members.get(circle.id)?.length ?? 0;
                return (
                  <li key={circle.id}>
                    <button
                      type="button"
                      disabled={here}
                      onClick={() => onAssign(person, circle.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-input border border-border px-3 py-2.5 text-left transition-colors duration-150",
                        "hover:border-ink-300 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        here && "cursor-default border-accent bg-accent/10 hover:border-accent",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn("h-2.5 w-2.5 shrink-0 rounded-full", kindTone(circle.kind).dot)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {circle.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">{t.kinds[circle.kind]}</span>
                      </span>
                      <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                        {t.circle.members(count)}
                      </span>
                      {here && <Check size={16} weight="bold" className="shrink-0 text-accent-strong" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      {person.leads && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Crown size={14} weight="fill" aria-hidden="true" />
          {t.errors.isLeader}
        </p>
      )}
    </Dialog>
  );
}
