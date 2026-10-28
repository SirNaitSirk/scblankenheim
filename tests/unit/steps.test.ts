import { describe, expect, it } from "vitest";
import { registerMessages } from "@/lib/register/messages";
import {
  AUTO_STEP_SIZE,
  buildSteps,
  questionFields,
  stepIndexOf,
} from "@/lib/register/steps";
import { mergeFields, validateFields } from "@/lib/register/validation";
import type { CampFormField } from "@/lib/admin/types";

const copy = registerMessages.steps;

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

function stepBreak(key: string, label: string, helpText?: string): CampFormField {
  return field(key, { fieldType: "step", label, config: helpText ? { helpText } : {} });
}

const keys = (fields: CampFormField[]) => fields.map((f) => f.key);

describe("buildSteps", () => {
  it("returns only the core step for a camp without questions", () => {
    const steps = buildSteps([]);
    expect(steps).toHaveLength(1);
    expect(steps[0].title).toBe(copy.coreTitle);
    expect(keys(steps[0].fields)).toEqual(["first_name", "last_name", "email", "gender"]);
  });

  it("chunks questions automatically when there is no step break", () => {
    const questions = Array.from({ length: 9 }, (_, i) => field(`q${i + 1}`));
    const steps = buildSteps(questions);
    expect(AUTO_STEP_SIZE).toBe(4);
    expect(steps.map((s) => s.fields.length)).toEqual([4, 4, 4, 1]);
    expect(steps.slice(1).every((s) => s.title === copy.autoTitle)).toBe(true);
  });

  it("follows admin step breaks and keeps leading questions in a neutral step", () => {
    const steps = buildSteps([
      field("lead"),
      stepBreak("schritt_gesundheit", "Gesundheit", "Damit wir gut für dich sorgen"),
      field("allergies"),
      field("meds"),
      stepBreak("schritt_ok", "Einverständnis"),
      field("consent", { fieldType: "checkbox" }),
    ]);
    expect(steps.map((s) => s.title)).toEqual([
      copy.coreTitle,
      copy.autoTitle,
      "Gesundheit",
      "Einverständnis",
    ]);
    expect(steps[2].subtitle).toBe("Damit wir gut für dich sorgen");
    expect(steps[3].subtitle).toBeNull();
    expect(keys(steps[2].fields)).toEqual(["allergies", "meds"]);
  });

  it("drops empty steps from consecutive and trailing breaks", () => {
    const steps = buildSteps([
      stepBreak("schritt_a", "A"),
      stepBreak("schritt_b", "B"),
      field("q1"),
      stepBreak("schritt_c", "C"),
    ]);
    expect(steps.map((s) => s.title)).toEqual([copy.coreTitle, "B"]);
  });

  it("never puts a step break into a step", () => {
    const steps = buildSteps([field("q1"), stepBreak("schritt_x", "X"), field("q2")]);
    const all = steps.flatMap((s) => s.fields);
    expect(all.some((f) => f.fieldType === "step")).toBe(false);
  });
});

describe("questionFields", () => {
  it("removes step breaks and keeps the order", () => {
    const result = questionFields([field("a"), stepBreak("schritt_x", "X"), field("b")]);
    expect(keys(result)).toEqual(["a", "b"]);
  });

  it("keeps a posted step break key out of validation and answers", () => {
    const fields = mergeFields(
      questionFields([stepBreak("schritt_x", "X"), field("q1", { required: true })]),
    );
    expect(keys(fields)).not.toContain("schritt_x");
    const errors = validateFields(fields, {
      first_name: "Ada",
      last_name: "L",
      email: "ada@example.org",
      gender: "Weiblich",
      q1: "ok",
      schritt_x: "egal",
    });
    expect(errors).toEqual({});
  });
});

describe("stepIndexOf", () => {
  const steps = buildSteps([field("q1"), stepBreak("schritt_x", "X"), field("q2")]);

  it("finds core, dynamic and unknown keys", () => {
    expect(stepIndexOf(steps, "email")).toBe(0);
    expect(stepIndexOf(steps, "q2")).toBe(2);
    expect(stepIndexOf(steps, "nope")).toBe(-1);
  });
});
