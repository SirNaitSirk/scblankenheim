import { z } from "zod";
import { de } from "./messages";
import type {
  CampFormField,
  Gender,
  House,
  PersonFilter,
  PlanningPerson,
  PlanningPersonBase,
  Room,
} from "./types";

/**
 * Shared, client safe room planning rules (specs/008-room-planning): dialog
 * validation, the assignment rule mirrored from the `assign_room` database
 * function (for instant feedback and drop target highlighting), summary numbers
 * and the person filters. The database stays the real gate.
 */

export const MAX_NAME_LENGTH = 60;
export const MAX_BEDS = 99;

export const GENDERS = ["female", "male"] as const satisfies readonly Gender[];

export function isGender(value: unknown): value is Gender {
  return value === "female" || value === "male";
}

export const genderSchema = z.enum(GENDERS);

const nameField = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, de.rooms.errors.nameRequired)
      .max(MAX_NAME_LENGTH, de.rooms.errors.nameTooLong),
  );

export const houseSchema = z.object({ name: nameField });

export const roomSchema = z.object({
  name: nameField,
  beds: z
    .string()
    .trim()
    .regex(/^\d+$/, de.rooms.errors.invalidBeds)
    .transform(Number)
    .pipe(z.number().int().min(1, de.rooms.errors.invalidBeds).max(MAX_BEDS, de.rooms.errors.invalidBeds)),
});

// --- assignment rule ----------------------------------------------------------

export type AssignCheck =
  | "ok"
  | "already_here"
  | "adopts_gender"
  | "full"
  | "gender_mismatch"
  | "no_gender";

/** Ids of the people currently in each room. */
export function occupantsByRoom(people: PlanningPerson[]): Map<string, PlanningPerson[]> {
  const map = new Map<string, PlanningPerson[]>();
  for (const person of people) {
    if (!person.roomId) continue;
    const list = map.get(person.roomId) ?? [];
    list.push(person);
    map.set(person.roomId, list);
  }
  return map;
}

/**
 * Whether `person` may move into `room`, which currently holds `occupants`.
 * Mirrors `assign_room`: an empty room adopts the person's gender; an occupied
 * room only takes the same gender and only while a bed is free.
 */
export function canAssign(
  person: Pick<PlanningPerson, "id" | "gender" | "roomId">,
  room: Pick<Room, "id" | "beds" | "gender">,
  occupants: Pick<PlanningPerson, "id">[],
): AssignCheck {
  if (!person.gender) return "no_gender";
  if (person.roomId === room.id) return "already_here";
  const others = occupants.filter((o) => o.id !== person.id).length;
  if (others >= room.beds) return "full";
  if (others === 0) return room.gender === person.gender ? "ok" : "adopts_gender";
  return room.gender === person.gender ? "ok" : "gender_mismatch";
}

export function isAssignable(check: AssignCheck): boolean {
  return check === "ok" || check === "adopts_gender";
}

// --- summary --------------------------------------------------------------------

export type GenderSummary = {
  beds: number;
  occupied: number;
  free: number;
  people: number;
  unassigned: number;
  /** People of this gender that cannot get a bed even if every unset room took them. */
  shortage: number;
};

export type PlanSummary = {
  female: GenderSummary;
  male: GenderSummary;
  totalBeds: number;
  openBeds: number; // beds in rooms without a gender yet
  unassigned: number;
  missingGender: number;
};

export function allRooms(houses: House[]): Room[] {
  return houses.flatMap((house) => house.rooms);
}

export function summarize(houses: House[], people: PlanningPerson[]): PlanSummary {
  const rooms = allRooms(houses);
  const occupants = occupantsByRoom(people);
  const empty = (): GenderSummary => ({
    beds: 0,
    occupied: 0,
    free: 0,
    people: 0,
    unassigned: 0,
    shortage: 0,
  });
  const byGender: Record<Gender, GenderSummary> = { female: empty(), male: empty() };
  let openBeds = 0;
  let totalBeds = 0;

  for (const room of rooms) {
    totalBeds += room.beds;
    const taken = occupants.get(room.id)?.length ?? 0;
    if (room.gender) {
      byGender[room.gender].beds += room.beds;
      byGender[room.gender].occupied += taken;
    } else {
      openBeds += room.beds;
    }
  }

  let missingGender = 0;
  let unassigned = 0;
  for (const person of people) {
    if (!person.roomId) unassigned += 1;
    if (!person.gender) {
      missingGender += 1;
      continue;
    }
    byGender[person.gender].people += 1;
    if (!person.roomId) byGender[person.gender].unassigned += 1;
  }

  for (const gender of GENDERS) {
    const summary = byGender[gender];
    summary.free = Math.max(0, summary.beds - summary.occupied);
    summary.shortage = Math.max(0, summary.unassigned - summary.free - openBeds);
  }

  return { ...byGender, totalBeds, openBeds, unassigned, missingGender };
}

// --- people ---------------------------------------------------------------------

export function fullName(person: Pick<PlanningPersonBase, "firstName" | "lastName">): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function compareByName(a: PlanningPersonBase, b: PlanningPersonBase): number {
  return (
    a.lastName.localeCompare(b.lastName, "de") || a.firstName.localeCompare(b.firstName, "de")
  );
}

/** Full years at `reference` (camp start), or null when a date is missing or invalid. */
export function ageAt(birthdate: unknown, reference: string | null): number | null {
  if (typeof birthdate !== "string" || birthdate.trim() === "") return null;
  const birth = new Date(birthdate);
  const ref = reference ? new Date(reference) : new Date();
  if (Number.isNaN(birth.getTime()) || Number.isNaN(ref.getTime())) return null;
  let age = ref.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    ref.getMonth() < birth.getMonth() ||
    (ref.getMonth() === birth.getMonth() && ref.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}

/** The camp field holding the birth date: key `birthdate`, else the first date field. */
export function findBirthdateKey(fields: CampFormField[]): string | null {
  const byKey = fields.find((f) => f.key === "birthdate" && f.fieldType === "date");
  if (byKey) return byKey.key;
  return fields.find((f) => f.fieldType === "date")?.key ?? null;
}

export type UnassignedGroups<P extends PlanningPersonBase = PlanningPerson> = {
  female: P[];
  male: P[];
  missing: P[];
};

/** Splits people by gender, each group sorted by name. */
export function groupByGender<P extends PlanningPersonBase>(people: P[]): UnassignedGroups<P> {
  const groups: UnassignedGroups<P> = { female: [], male: [], missing: [] };
  for (const person of people) groups[person.gender ?? "missing"].push(person);
  groups.female.sort(compareByName);
  groups.male.sort(compareByName);
  groups.missing.sort(compareByName);
  return groups;
}

export function groupUnassigned(people: PlanningPerson[]): UnassignedGroups {
  return groupByGender(people.filter((person) => !person.roomId));
}

// --- filters --------------------------------------------------------------------

export const EMPTY_FILTER: PersonFilter = {
  search: "",
  gender: "all",
  ageMin: null,
  ageMax: null,
  fields: [],
};

export function fieldOptions(field: CampFormField): string[] {
  return Array.isArray(field.options)
    ? field.options.filter((o): o is string => typeof o === "string")
    : [];
}

export const CHECKBOX_YES = "yes";
export const CHECKBOX_NO = "no";

function matchesField(
  field: CampFormField | undefined,
  value: unknown,
  wanted: string,
): boolean {
  const needle = wanted.trim();
  if (!field || needle === "") return true;
  if (field.fieldType === "checkbox") {
    return (value === true) === (needle === CHECKBOX_YES);
  }
  const text = value == null ? "" : String(value);
  if (field.fieldType === "select") return text === needle;
  return text.toLowerCase().includes(needle.toLowerCase());
}

export function isFilterActive(filter: PersonFilter): boolean {
  return (
    filter.search.trim() !== "" ||
    filter.gender !== "all" ||
    filter.ageMin != null ||
    filter.ageMax != null ||
    filter.fields.some((f) => f.value.trim() !== "")
  );
}

/** Does `person` satisfy every part of `filter`? */
export function matchesFilter(
  person: PlanningPersonBase,
  filter: PersonFilter,
  context: {
    fieldsByKey: Map<string, CampFormField>;
    birthdateKey: string | null;
    campStart: string | null;
  },
): boolean {
  const search = filter.search.trim().toLowerCase();
  if (search && !fullName(person).toLowerCase().includes(search)) return false;

  if (filter.gender === "missing" && person.gender) return false;
  if ((filter.gender === "female" || filter.gender === "male") && person.gender !== filter.gender) {
    return false;
  }

  if (filter.ageMin != null || filter.ageMax != null) {
    const age = context.birthdateKey
      ? ageAt(person.formData[context.birthdateKey], context.campStart)
      : null;
    if (age == null) return false;
    if (filter.ageMin != null && age < filter.ageMin) return false;
    if (filter.ageMax != null && age > filter.ageMax) return false;
  }

  return filter.fields.every((f) =>
    matchesField(context.fieldsByKey.get(f.key), person.formData[f.key], f.value),
  );
}
