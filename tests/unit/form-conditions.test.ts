import { describe, expect, it } from "vitest";
import {
  conditionProblems,
  dependentsOf,
  dropHiddenAnswers,
  isFieldVisible,
  newConditionProblems,
  readCondition,
  visibleFields,
} from "@/lib/register/conditions";
import { GENDER_OPTIONS, mergeFields, validateFields } from "@/lib/register/validation";
import type { CampFormField } from "@/lib/admin/types";

function field(key: string, overrides: Partial<CampFormField> = {}): CampFormField {
  return {
    id: key,
    campId: "camp",
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

const youth = field("jugend", {
  label: "Jugend",
  fieldType: "select",
  options: ["Blankenheim", "Eingeladen", "Andere"],
});

function invitedBy(values: unknown = ["Eingeladen"], fieldKey = "jugend"): CampFormField {
  return field("eingeladen_von", {
    label: "Eingeladen von",
    required: true,
    config: { showWhen: { fieldKey, values } },
  });
}

describe("readCondition", () => {
  it("reads a valid condition", () => {
    expect(readCondition(invitedBy())).toEqual({ fieldKey: "jugend", values: ["Eingeladen"] });
  });

  it("treats missing or malformed values as no condition", () => {
    expect(readCondition(field("a"))).toBeNull();
    expect(readCondition(field("a", { config: { showWhen: null } }))).toBeNull();
    expect(readCondition(field("a", { config: { showWhen: "jugend" } }))).toBeNull();
    expect(readCondition(field("a", { config: { showWhen: { fieldKey: "", values: [] } } }))).toBeNull();
    expect(readCondition(field("a", { config: { showWhen: { fieldKey: "x", values: [1] } } }))).toBeNull();
  });
});

describe("isFieldVisible and visibleFields", () => {
  it("shows a field without condition always", () => {
    expect(isFieldVisible(field("a"), {})).toBe(true);
  });

  it("shows a conditional field only for a matching answer", () => {
    const dependent = invitedBy(["Eingeladen", "Andere"]);
    expect(isFieldVisible(dependent, {})).toBe(false);
    expect(isFieldVisible(dependent, { jugend: "Blankenheim" })).toBe(false);
    expect(isFieldVisible(dependent, { jugend: "Eingeladen" })).toBe(true);
    expect(isFieldVisible(dependent, { jugend: "Andere" })).toBe(true);
    expect(isFieldVisible(dependent, { jugend: true })).toBe(false);
  });

  it("compares gender by its German option text", () => {
    const dependent = invitedBy([GENDER_OPTIONS.female], "gender");
    expect(isFieldVisible(dependent, { gender: GENDER_OPTIONS.female })).toBe(true);
    expect(isFieldVisible(dependent, { gender: GENDER_OPTIONS.male })).toBe(false);
  });

  it("keeps the order of the visible fields", () => {
    const fields = [youth, invitedBy(), field("notes")];
    expect(visibleFields(fields, {}).map((f) => f.key)).toEqual(["jugend", "notes"]);
  });
});

describe("validateFields with conditions", () => {
  const fields = mergeFields([youth, invitedBy()]);
  const core = { first_name: "A", last_name: "B", email: "a@b.de", gender: GENDER_OPTIONS.male };

  it("requires a visible conditional field", () => {
    const errors = validateFields(fields, { ...core, jugend: "Eingeladen", eingeladen_von: "" });
    expect(Object.keys(errors)).toEqual(["eingeladen_von"]);
  });

  it("never requires a hidden conditional field", () => {
    expect(validateFields(fields, { ...core, jugend: "Andere", eingeladen_von: "" })).toEqual({});
  });
});

describe("dropHiddenAnswers", () => {
  const fields = [youth, invitedBy()];

  it("drops answers of hidden fields and keeps the rest", () => {
    const formData = { jugend: "Andere", eingeladen_von: "Max", unknown: "x" };
    expect(dropHiddenAnswers(fields, formData, formData)).toEqual({ jugend: "Andere", unknown: "x" });
  });

  it("keeps answers of visible fields", () => {
    const formData = { jugend: "Eingeladen", eingeladen_von: "Max" };
    expect(dropHiddenAnswers(fields, formData, formData)).toEqual(formData);
  });
});

describe("conditionProblems", () => {
  const reasons = (fields: CampFormField[]) => conditionProblems(mergeFields(fields)).map((p) => p.reason);

  it("accepts a valid condition, also on gender", () => {
    expect(reasons([youth, invitedBy()])).toEqual([]);
    expect(reasons([invitedBy([GENDER_OPTIONS.female], "gender")])).toEqual([]);
  });

  it("reports every broken condition", () => {
    expect(reasons([invitedBy()])).toEqual(["trigger_missing"]);
    expect(reasons([field("jugend"), invitedBy()])).toEqual(["trigger_not_select"]);
    expect(reasons([youth, invitedBy(["Weg"])])).toEqual(["value_missing"]);
    expect(reasons([youth, invitedBy([])])).toEqual(["no_values"]);
    expect(reasons([invitedBy(["Eingeladen"], "eingeladen_von")])).toEqual(["trigger_self"]);
    expect(
      reasons([
        field("step", { fieldType: "step", config: { showWhen: { fieldKey: "jugend", values: ["Andere"] } } }),
        youth,
      ]),
    ).toEqual(["not_allowed"]);
  });

  it("rejects chains", () => {
    const conditionalYouth = { ...youth, config: { showWhen: { fieldKey: "gender", values: [GENDER_OPTIONS.male] } } };
    expect(reasons([conditionalYouth, invitedBy()])).toEqual(["trigger_conditional"]);
  });
});

describe("newConditionProblems", () => {
  it("reports only problems the change introduced", () => {
    const current = mergeFields([youth, invitedBy()]);
    const renamed = mergeFields([{ ...youth, options: ["Blankenheim", "Gast", "Andere"] }, invitedBy()]);
    expect(newConditionProblems(current, renamed)).toEqual([
      { fieldKey: "eingeladen_von", fieldLabel: "Eingeladen von", reason: "value_missing" },
    ]);
  });

  it("ignores problems that already existed", () => {
    const broken = mergeFields([invitedBy()]);
    expect(newConditionProblems(broken, broken)).toEqual([]);
  });

  it("flags deleting the trigger", () => {
    const current = mergeFields([youth, invitedBy()]);
    const deleted = mergeFields([invitedBy()]);
    expect(newConditionProblems(current, deleted).map((p) => p.reason)).toEqual(["trigger_missing"]);
  });
});

describe("dependentsOf", () => {
  it("lists the fields hanging on a trigger", () => {
    expect(dependentsOf([youth, invitedBy(), field("x")], "jugend").map((f) => f.key)).toEqual([
      "eingeladen_von",
    ]);
  });
});
