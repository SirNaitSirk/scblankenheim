import { describe, expect, it } from "vitest";
import { de } from "@/lib/admin/messages";
import {
  EMPTY_FILTER,
  ageAt,
  canAssign,
  findBirthdateKey,
  groupUnassigned,
  houseSchema,
  isFilterActive,
  matchesFilter,
  roomSchema,
  summarize,
} from "@/lib/admin/room-planning";
import type { CampFormField, House, PlanningPerson, Room } from "@/lib/admin/types";

function person(id: string, overrides: Partial<PlanningPerson> = {}): PlanningPerson {
  return {
    id,
    firstName: id,
    lastName: "Muster",
    gender: "female",
    roomId: null,
    formData: {},
    ...overrides,
  };
}

function room(id: string, overrides: Partial<Room> = {}): Room {
  return { id, houseId: "h1", name: id, beds: 2, sortOrder: 0, gender: null, ...overrides };
}

function field(key: string, overrides: Partial<CampFormField> = {}): CampFormField {
  return {
    id: key,
    campId: "c1",
    key,
    label: key,
    fieldType: "text",
    required: false,
    options: null,
    sortOrder: 0,
    config: {},
    ...overrides,
  };
}

describe("schemas", () => {
  it("trims and requires a house name", () => {
    expect(houseSchema.parse({ name: "  Haupthaus " })).toEqual({ name: "Haupthaus" });
    expect(houseSchema.safeParse({ name: "  " }).error?.issues[0].message).toBe(
      de.rooms.errors.nameRequired,
    );
  });

  it("parses beds between 1 and 99", () => {
    expect(roomSchema.parse({ name: "Zimmer 1", beds: "4" })).toEqual({ name: "Zimmer 1", beds: 4 });
    for (const beds of ["0", "100", "2.5", "", "abc"]) {
      expect(roomSchema.safeParse({ name: "Z", beds }).success).toBe(false);
    }
  });
});

describe("canAssign", () => {
  it("lets an empty room adopt the gender", () => {
    expect(canAssign(person("a"), room("r"), [])).toBe("adopts_gender");
    expect(canAssign(person("a"), room("r", { gender: "male" }), [])).toBe("adopts_gender");
    expect(canAssign(person("a"), room("r", { gender: "female" }), [])).toBe("ok");
  });

  it("keeps occupied rooms separated and within beds", () => {
    const female = room("r", { gender: "female" });
    expect(canAssign(person("m", { gender: "male" }), female, [person("x")])).toBe("gender_mismatch");
    expect(canAssign(person("a"), female, [person("x")])).toBe("ok");
    expect(canAssign(person("a"), female, [person("x"), person("y")])).toBe("full");
  });

  it("needs a gender and ignores the person itself", () => {
    expect(canAssign(person("a", { gender: null }), room("r"), [])).toBe("no_gender");
    expect(canAssign(person("a", { roomId: "r" }), room("r"), [person("a")])).toBe("already_here");
  });
});

describe("summarize", () => {
  it("counts beds, occupancy and shortage per gender", () => {
    const houses: House[] = [
      {
        id: "h1",
        name: "Haus",
        sortOrder: 0,
        rooms: [
          room("f", { gender: "female", beds: 2 }),
          room("m", { gender: "male", beds: 3 }),
          room("o", { beds: 1 }),
        ],
      },
    ];
    const people = [
      person("a", { roomId: "f" }),
      person("b"),
      person("c"),
      person("d"),
      person("e", { gender: "male" }),
      person("g", { gender: null }),
    ];
    const summary = summarize(houses, people);
    expect(summary.female).toMatchObject({ beds: 2, occupied: 1, free: 1, unassigned: 3, shortage: 1 });
    expect(summary.male).toMatchObject({ beds: 3, occupied: 0, free: 3, shortage: 0 });
    expect(summary).toMatchObject({ totalBeds: 6, openBeds: 1, unassigned: 5, missingGender: 1 });
  });
});

describe("people helpers", () => {
  it("computes the age at camp start", () => {
    expect(ageAt("2012-07-20", "2026-07-19")).toBe(13);
    expect(ageAt("2012-07-20", "2026-07-20")).toBe(14);
    expect(ageAt("", "2026-07-20")).toBeNull();
    expect(ageAt("kein Datum", "2026-07-20")).toBeNull();
  });

  it("finds the birth date field", () => {
    expect(findBirthdateKey([field("x", { fieldType: "date" }), field("birthdate", { fieldType: "date" })])).toBe("birthdate");
    expect(findBirthdateKey([field("geb", { fieldType: "date" })])).toBe("geb");
    expect(findBirthdateKey([field("name")])).toBeNull();
  });

  it("groups unassigned people by gender, sorted by last name", () => {
    const groups = groupUnassigned([
      person("a", { lastName: "Zeller" }),
      person("b", { lastName: "Adam" }),
      person("c", { gender: "male" }),
      person("d", { gender: null }),
      person("e", { roomId: "r" }),
    ]);
    expect(groups.female.map((p) => p.id)).toEqual(["b", "a"]);
    expect(groups.male).toHaveLength(1);
    expect(groups.missing).toHaveLength(1);
  });
});

describe("matchesFilter", () => {
  const fields = [
    field("youth", { fieldType: "select", options: ["Bonn", "Köln"] }),
    field("vegan", { fieldType: "checkbox" }),
    field("note"),
    field("birthdate", { fieldType: "date" }),
  ];
  const context = {
    fieldsByKey: new Map(fields.map((f) => [f.key, f])),
    birthdateKey: "birthdate",
    campStart: "2026-07-20",
  };
  const lena = person("Lena", {
    formData: { youth: "Bonn", vegan: true, note: "Zimmer mit Mia", birthdate: "2012-05-01" },
  });

  it("is inactive by default and matches everyone", () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
    expect(matchesFilter(lena, EMPTY_FILTER, context)).toBe(true);
  });

  it("filters by name, gender and age", () => {
    expect(matchesFilter(lena, { ...EMPTY_FILTER, search: "len" }, context)).toBe(true);
    expect(matchesFilter(lena, { ...EMPTY_FILTER, search: "tom" }, context)).toBe(false);
    expect(matchesFilter(lena, { ...EMPTY_FILTER, gender: "male" }, context)).toBe(false);
    expect(matchesFilter(lena, { ...EMPTY_FILTER, gender: "missing" }, context)).toBe(false);
    expect(matchesFilter(lena, { ...EMPTY_FILTER, ageMin: 13, ageMax: 14 }, context)).toBe(true);
    expect(matchesFilter(lena, { ...EMPTY_FILTER, ageMin: 15 }, context)).toBe(false);
    expect(matchesFilter(person("x"), { ...EMPTY_FILTER, ageMax: 20 }, context)).toBe(false);
  });

  it("filters by camp fields by type", () => {
    const by = (key: string, value: string) => ({
      ...EMPTY_FILTER,
      fields: [{ id: "1", key, value }],
    });
    expect(matchesFilter(lena, by("youth", "Bonn"), context)).toBe(true);
    expect(matchesFilter(lena, by("youth", "Köln"), context)).toBe(false);
    expect(matchesFilter(lena, by("vegan", "yes"), context)).toBe(true);
    expect(matchesFilter(lena, by("vegan", "no"), context)).toBe(false);
    expect(matchesFilter(lena, by("note", "mia"), context)).toBe(true);
    expect(matchesFilter(lena, by("note", ""), context)).toBe(true);
  });
});
