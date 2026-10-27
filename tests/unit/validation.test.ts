import { describe, expect, it } from "vitest";
import { registerMessages } from "@/lib/register/messages";
import {
  CORE_FIELDS,
  mergeFields,
  validateField,
  validateFields,
} from "@/lib/register/validation";
import type { CampFormField } from "@/lib/admin/types";

const m = registerMessages.validation;

function field(overrides: Partial<CampFormField>): CampFormField {
  return {
    id: overrides.key ?? "f",
    campId: "camp",
    key: "f",
    label: "Feld",
    fieldType: "text",
    required: false,
    options: null,
    sortOrder: 0,
    config: {},
    ...overrides,
  };
}

describe("mergeFields", () => {
  it("puts the core fields first and keeps the camp order", () => {
    const merged = mergeFields([
      field({ key: "age", sortOrder: 1 }),
      field({ key: "church", sortOrder: 2 }),
    ]);
    expect(merged.map((f) => f.key)).toEqual([
      "first_name",
      "last_name",
      "email",
      "age",
      "church",
    ]);
  });

  it("drops camp questions that reuse a core key", () => {
    const merged = mergeFields([field({ key: "email", label: "Doppelt" })]);
    expect(merged).toHaveLength(CORE_FIELDS.length);
    expect(merged.find((f) => f.key === "email")?.label).toBe(
      registerMessages.fields.email,
    );
  });

  it("marks every core field as required", () => {
    expect(CORE_FIELDS.every((f) => f.required)).toBe(true);
  });
});

describe("validateField", () => {
  it("requires a trimmed non empty value for required text", () => {
    const f = field({ required: true });
    expect(validateField(f, "")).toBe(m.required);
    expect(validateField(f, "   ")).toBe(m.required);
    expect(validateField(f, undefined)).toBe(m.required);
    expect(validateField(f, "Lena")).toBeNull();
  });

  it("lets empty optional values pass for every type", () => {
    for (const fieldType of ["text", "textarea", "email", "tel", "number", "date", "select"]) {
      expect(validateField(field({ fieldType }), "")).toBeNull();
    }
    expect(validateField(field({ fieldType: "checkbox" }), false)).toBeNull();
  });

  it("requires true for a required checkbox", () => {
    const f = field({ fieldType: "checkbox", required: true });
    expect(validateField(f, false)).toBe(m.checkbox);
    expect(validateField(f, undefined)).toBe(m.checkbox);
    expect(validateField(f, true)).toBeNull();
  });

  it("checks the address pattern for email when not empty", () => {
    const f = field({ fieldType: "email" });
    expect(validateField(f, "keine adresse")).toBe(m.email);
    expect(validateField(f, "lena@example")).toBe(m.email);
    expect(validateField(f, " lena@example.com ")).toBeNull();
  });

  it("checks that number values parse when not empty", () => {
    const f = field({ fieldType: "number" });
    expect(validateField(f, "zwölf")).toBe(m.number);
    expect(validateField(f, "12")).toBeNull();
    expect(validateField(f, "12.5")).toBeNull();
  });
});

describe("validateFields", () => {
  it("returns one German message per invalid key", () => {
    const errors = validateFields(mergeFields([field({ key: "age", fieldType: "number" })]), {
      first_name: "Lena",
      last_name: "",
      email: "falsch",
      age: "abc",
    });
    expect(errors).toEqual({ last_name: m.required, email: m.email, age: m.number });
  });

  it("returns an empty object when everything is valid", () => {
    expect(
      validateFields(CORE_FIELDS, {
        first_name: "Lena",
        last_name: "Muster",
        email: "lena@example.com",
      }),
    ).toEqual({});
  });
});

describe("messages", () => {
  it("contain no dash punctuation", () => {
    const texts = Object.values(m).join(" ");
    expect(texts).not.toMatch(/[–—]/);
  });
});
