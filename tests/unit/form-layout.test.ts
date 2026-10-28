import { describe, expect, it } from "vitest";
import { splitCampFields } from "@/lib/admin/form-layout";
import type { CampFormField } from "@/lib/admin/types";

function field(key: string, fieldType: string): CampFormField {
  return {
    id: key,
    campId: "camp",
    key,
    label: key,
    fieldType,
    required: false,
    options: null,
    sortOrder: 0,
    config: {},
  };
}

const keys = (fields: CampFormField[]) => fields.map((f) => f.key);

describe("splitCampFields", () => {
  it("separates checkboxes and keeps the order in both groups", () => {
    const { inputs, toggles } = splitCampFields([
      field("a", "text"),
      field("b", "checkbox"),
      field("c", "textarea"),
      field("d", "checkbox"),
      field("e", "select"),
    ]);
    expect(keys(inputs)).toEqual(["a", "c", "e"]);
    expect(keys(toggles)).toEqual(["b", "d"]);
  });

  it("returns two empty groups for no fields", () => {
    expect(splitCampFields([])).toEqual({ inputs: [], toggles: [] });
  });

  it("returns no toggles when there are no checkboxes", () => {
    const { inputs, toggles } = splitCampFields([field("a", "text"), field("b", "date")]);
    expect(keys(inputs)).toEqual(["a", "b"]);
    expect(toggles).toEqual([]);
  });
});
