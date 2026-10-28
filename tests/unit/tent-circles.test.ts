import { describe, expect, it } from "vitest";
import { de } from "@/lib/admin/messages";
import {
  canJoin,
  fitsCircle,
  membersByCircle,
  summarizeCircles,
  tentCircleSchema,
  unassignedPeople,
} from "@/lib/admin/tent-circles";
import type { CirclePerson, TentCircle } from "@/lib/admin/types";

const t = de.tentCircles;
const LEADER = "00000000-0000-0000-0000-000000000001";

function person(id: string, overrides: Partial<CirclePerson> = {}): CirclePerson {
  return {
    id,
    firstName: id,
    lastName: "Muster",
    gender: "female",
    formData: {},
    circleId: null,
    leads: null,
    ...overrides,
  };
}

function circle(id: string, overrides: Partial<TentCircle> = {}): TentCircle {
  return { id, name: id, kind: "mixed", leaderId: null, sortOrder: 0, ...overrides };
}

describe("fitsCircle", () => {
  it("lets everyone into mixed circles, also without gender", () => {
    expect(fitsCircle("mixed", "female")).toBe(true);
    expect(fitsCircle("mixed", "male")).toBe(true);
    expect(fitsCircle("mixed", null)).toBe(true);
  });

  it("keeps single gender circles to that gender", () => {
    expect(fitsCircle("female", "female")).toBe(true);
    expect(fitsCircle("female", "male")).toBe(false);
    expect(fitsCircle("male", null)).toBe(false);
  });
});

describe("canJoin", () => {
  it("rejects leaders, flags the current circle and the kind", () => {
    const c = circle("c1", { kind: "male" });
    expect(canJoin(person("a", { leads: "c2" }), c)).toBe("is_leader");
    expect(canJoin(person("b", { gender: "male", circleId: "c1" }), c)).toBe("already_here");
    expect(canJoin(person("c"), c)).toBe("kind_mismatch");
    expect(canJoin(person("d", { gender: "male" }), c)).toBe("ok");
  });
});

describe("membersByCircle and unassignedPeople", () => {
  const people = [
    person("lead", { leads: "c1" }),
    person("b", { lastName: "Zeller", circleId: "c1" }),
    person("a", { lastName: "Adler", circleId: "c1" }),
    person("free", { gender: "male" }),
    person("nogender", { gender: null }),
  ];

  it("lists participants sorted by name, never the leader", () => {
    expect(membersByCircle(people).get("c1")?.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("groups only people without circle and without leadership", () => {
    const groups = unassignedPeople(people);
    expect(groups.female).toEqual([]);
    expect(groups.male.map((p) => p.id)).toEqual(["free"]);
    expect(groups.missing.map((p) => p.id)).toEqual(["nogender"]);
  });
});

describe("summarizeCircles", () => {
  it("matches the spec example: 4 circles, 30 assigned, 6 open, 7,5 average", () => {
    const circles = ["c1", "c2", "c3", "c4"].map((id) => circle(id));
    const people: CirclePerson[] = [
      ...circles.map((c) => person(`lead-${c.id}`, { leads: c.id })),
      ...Array.from({ length: 30 }, (_, i) => person(`m${i}`, { circleId: circles[i % 4].id })),
      ...Array.from({ length: 6 }, (_, i) => person(`u${i}`, { gender: i === 0 ? null : "male" })),
    ];
    const summary = summarizeCircles(circles, people);
    expect(summary).toMatchObject({
      circles: 4,
      withLeader: 4,
      assigned: 30,
      unassigned: 6,
      missingGender: 1,
      total: 40,
      average: 7.5,
    });
  });

  it("has an average of 0 without circles", () => {
    expect(summarizeCircles([], [person("a")]).average).toBe(0);
  });
});

describe("tentCircleSchema", () => {
  it("accepts a valid circle and trims the name", () => {
    const parsed = tentCircleSchema.safeParse({ name: "  Senfkorn ", kind: "female", leaderId: LEADER });
    expect(parsed.success && parsed.data.name).toBe("Senfkorn");
  });

  it("reports German errors for name, kind and leader", () => {
    const parsed = tentCircleSchema.safeParse({ name: " ", kind: "other", leaderId: "" });
    expect(parsed.success).toBe(false);
    const messages = parsed.success ? [] : parsed.error.issues.map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([t.errors.nameRequired, t.errors.kindInvalid, t.errors.leaderRequired]),
    );
  });
});
