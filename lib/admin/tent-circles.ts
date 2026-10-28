import { z } from "zod";
import { de } from "./messages";
import { MAX_NAME_LENGTH, compareByName, groupByGender, type UnassignedGroups } from "./room-planning";
import type { CirclePerson, Gender, TentCircle, TentCircleKind } from "./types";

/**
 * Shared, client safe tent circle rules (specs/011-tent-circles): dialog
 * validation, the fit rule mirrored from `fits_tent_circle` (for instant
 * feedback and drop target highlighting) and summary numbers. The database
 * functions stay the real gate.
 */

const t = de.tentCircles;

export const KINDS = ["mixed", "female", "male"] as const satisfies readonly TentCircleKind[];

export function isKind(value: unknown): value is TentCircleKind {
  return value === "mixed" || value === "female" || value === "male";
}

export const tentCircleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, t.errors.nameRequired)
    .max(MAX_NAME_LENGTH, t.errors.nameTooLong),
  kind: z.enum(KINDS, { error: t.errors.kindInvalid }),
  leaderId: z.guid({ error: t.errors.leaderRequired }),
});

export type TentCircleValues = z.infer<typeof tentCircleSchema>;

/** Mirrors `fits_tent_circle`: without gender only mixed circles fit. */
export function fitsCircle(kind: TentCircleKind, gender: Gender | null): boolean {
  return kind === "mixed" || kind === gender;
}

export type CircleCheck = "ok" | "already_here" | "is_leader" | "kind_mismatch";

export function canJoin(person: CirclePerson, circle: TentCircle): CircleCheck {
  if (person.leads) return "is_leader";
  if (person.circleId === circle.id) return "already_here";
  return fitsCircle(circle.kind, person.gender) ? "ok" : "kind_mismatch";
}

/** Participants per circle id, sorted by name. Leaders are not participants. */
export function membersByCircle(people: CirclePerson[]): Map<string, CirclePerson[]> {
  const map = new Map<string, CirclePerson[]>();
  for (const person of people) {
    if (!person.circleId || person.leads) continue;
    const list = map.get(person.circleId);
    if (list) list.push(person);
    else map.set(person.circleId, [person]);
  }
  for (const list of map.values()) list.sort(compareByName);
  return map;
}

/** People neither leading nor taking part in a circle, grouped by gender. */
export function unassignedPeople(people: CirclePerson[]): UnassignedGroups<CirclePerson> {
  return groupByGender(people.filter((person) => !person.circleId && !person.leads));
}

export type CircleSummary = {
  circles: number;
  withLeader: number;
  assigned: number; // participants in a circle
  leaders: number;
  unassigned: number;
  missingGender: number; // among the unassigned
  total: number;
  average: number; // participants per circle, one decimal
};

/** Numbers for the stat cards. A leader only counts when the person is active. */
export function summarizeCircles(circles: TentCircle[], people: CirclePerson[]): CircleSummary {
  const circleIds = new Set(circles.map((c) => c.id));
  let assigned = 0;
  let leaders = 0;
  let unassigned = 0;
  let missingGender = 0;
  for (const person of people) {
    if (person.leads && circleIds.has(person.leads)) leaders += 1;
    else if (person.circleId && circleIds.has(person.circleId)) assigned += 1;
    else {
      unassigned += 1;
      if (!person.gender) missingGender += 1;
    }
  }
  const average = circles.length > 0 ? Math.round((assigned / circles.length) * 10) / 10 : 0;
  return {
    circles: circles.length,
    withLeader: leaders,
    assigned,
    leaders,
    unassigned,
    missingGender,
    total: people.length,
    average,
  };
}

/** Lowercase kind for running text („Dieser Zeltkreis ist nur weiblich.“). */
export function kindText(kind: TentCircleKind): string {
  return t.kinds[kind].toLowerCase();
}
