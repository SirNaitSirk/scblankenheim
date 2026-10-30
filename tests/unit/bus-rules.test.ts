import { describe, expect, it } from "vitest";
import type { CampFormField } from "@/lib/admin/types";
import {
  answerValueOf,
  buildBoardingList,
  decideScan,
  isBusActive,
  isBusRegistration,
  mappingProblem,
  type ScanInput,
} from "@/lib/bus/rules";
import type { BoardingInfo, BusRegistration, BusSettings } from "@/lib/bus/types";

const CAMP = "11111111-1111-1111-1111-111111111111";
const OTHER_CAMP = "22222222-2222-2222-2222-222222222222";

function field(key: string, fieldType: string, options: unknown = null): CampFormField {
  return { id: key, campId: CAMP, key, label: key, fieldType, required: false, options, sortOrder: 0, config: {} };
}

const FIELDS = [
  field("anreise", "select", ["Mit dem Bus", "Selbst"]),
  field("bus_ok", "checkbox"),
  field("hinweis", "textarea"),
];

const SETTINGS: BusSettings = { enabled: true, fieldKey: "anreise", answers: ["Mit dem Bus"] };

function registration(overrides: Partial<BusRegistration> = {}): BusRegistration {
  return {
    id: "r1",
    camp_id: CAMP,
    reference: "SC-1001",
    first_name: "Lena",
    last_name: "Bauer",
    email: "lena@example.org",
    form_data: { anreise: "Mit dem Bus" },
    status: "active",
    deleted: false,
    amount_due: 200,
    amount_paid: 200,
    ...overrides,
  };
}

describe("answerValueOf", () => {
  it("reads strings trimmed, booleans as true or false, else null", () => {
    expect(answerValueOf({ a: "  Mit dem Bus " }, "a")).toBe("Mit dem Bus");
    expect(answerValueOf({ a: true }, "a")).toBe("true");
    expect(answerValueOf({ a: false }, "a")).toBe("false");
    expect(answerValueOf({ a: "" }, "a")).toBeNull();
    expect(answerValueOf({}, "a")).toBeNull();
    expect(answerValueOf(null, "a")).toBeNull();
  });
});

describe("mappingProblem", () => {
  it("reports each problem", () => {
    expect(mappingProblem({ fieldKey: null, answers: [] }, FIELDS)).toBe("no_field");
    expect(mappingProblem({ fieldKey: "weg", answers: ["x"] }, FIELDS)).toBe("field_missing");
    expect(mappingProblem({ fieldKey: "hinweis", answers: ["x"] }, FIELDS)).toBe("wrong_type");
    expect(mappingProblem({ fieldKey: "anreise", answers: [] }, FIELDS)).toBe("no_answers");
    expect(mappingProblem({ fieldKey: "anreise", answers: ["Bus"] }, FIELDS)).toBe("answers_missing");
  });

  it("accepts select options and checkbox values", () => {
    expect(mappingProblem(SETTINGS, FIELDS)).toBeNull();
    expect(mappingProblem({ fieldKey: "bus_ok", answers: ["true"] }, FIELDS)).toBeNull();
  });

  it("is inactive when switched off or broken", () => {
    expect(isBusActive(SETTINGS, FIELDS)).toBe(true);
    expect(isBusActive({ ...SETTINGS, enabled: false }, FIELDS)).toBe(false);
    expect(isBusActive({ ...SETTINGS, answers: ["Bus"] }, FIELDS)).toBe(false);
  });
});

describe("isBusRegistration", () => {
  it("matches select and checkbox answers", () => {
    expect(isBusRegistration(registration(), SETTINGS, FIELDS)).toBe(true);
    expect(isBusRegistration(registration({ form_data: { anreise: "Selbst" } }), SETTINGS, FIELDS)).toBe(false);
    const checkbox: BusSettings = { enabled: true, fieldKey: "bus_ok", answers: ["true"] };
    expect(isBusRegistration(registration({ form_data: { bus_ok: true } }), checkbox, FIELDS)).toBe(true);
    expect(isBusRegistration(registration({ form_data: { bus_ok: false } }), checkbox, FIELDS)).toBe(false);
  });

  it("excludes cancelled, deleted and missing answers", () => {
    expect(isBusRegistration(registration({ status: "cancelled" }), SETTINGS, FIELDS)).toBe(false);
    expect(isBusRegistration(registration({ deleted: true }), SETTINGS, FIELDS)).toBe(false);
    expect(isBusRegistration(registration({ form_data: {} }), SETTINGS, FIELDS)).toBe(false);
  });
});

describe("decideScan", () => {
  const base: ScanInput = {
    ticket: { campId: CAMP, revoked: false },
    currentCampId: CAMP,
    settings: SETTINGS,
    fields: FIELDS,
    registration: registration(),
  };

  it("follows the order unknown, invalid, other camp, disabled, cancelled, no ticket", () => {
    expect(decideScan({ ...base, ticket: null }).kind).toBe("unknown");
    expect(decideScan({ ...base, registration: null }).kind).toBe("unknown");
    expect(decideScan({ ...base, ticket: { campId: OTHER_CAMP, revoked: true } }).kind).toBe("invalid");
    expect(decideScan({ ...base, ticket: { campId: OTHER_CAMP, revoked: false } }).kind).toBe("other_camp");
    expect(decideScan({ ...base, settings: { ...SETTINGS, enabled: false } }).kind).toBe("disabled");
    expect(decideScan({ ...base, registration: registration({ status: "cancelled", form_data: {} }) }).kind).toBe(
      "cancelled",
    );
    expect(decideScan({ ...base, registration: registration({ form_data: { anreise: "Selbst" } }) })).toEqual({
      kind: "no_ticket",
      name: "Lena Bauer",
      reference: "SC-1001",
    });
  });

  it("boards with a payment hint only when something is open", () => {
    expect(decideScan(base)).toEqual({ kind: "board", name: "Lena Bauer", reference: "SC-1001", paymentOpen: false });
    expect(decideScan({ ...base, registration: registration({ amount_paid: 50 }) })).toMatchObject({
      kind: "board",
      paymentOpen: true,
    });
  });
});

describe("buildBoardingList", () => {
  it("lists missing first, each sorted by last then first name", () => {
    const rows = [
      registration({ id: "a", first_name: "Max", last_name: "Zeller", reference: "A" }),
      registration({ id: "b", first_name: "Ölf", last_name: "Arndt", reference: "B" }),
      registration({ id: "c", first_name: "Anna", last_name: "Arndt", reference: "C" }),
    ];
    const boardings = new Map<string, BoardingInfo>([["c", { at: "2027-07-01T06:12:00Z", method: "manual" }]]);
    const list = buildBoardingList(rows, boardings);
    expect(list.total).toBe(3);
    expect(list.boarded).toBe(1);
    expect(list.entries.map((entry) => entry.registrationId)).toEqual(["b", "a", "c"]);
    expect(list.entries[2]).toMatchObject({ method: "manual", boardedAt: "2027-07-01T06:12:00Z" });
  });
});
