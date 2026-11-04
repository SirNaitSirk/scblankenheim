import { describe, expect, it } from "vitest";
import { answerCountForKey, answeredKeys, parseAnswers, questionChangeProblem, questionsToCopy, suggestKey } from "@/lib/feedback/rules";
import type { FeedbackQuestion, FeedbackResponse } from "@/lib/feedback/types";

function question(key: string, sortOrder: number, extra: Partial<FeedbackQuestion> = {}): FeedbackQuestion {
  return { id: `id_${key}`, campId: "c1", key, label: key, type: "rating", required: false, options: [], allowComment: false, sortOrder, ...extra };
}

const responses: FeedbackResponse[] = [
  { id: "a", answers: [{ key: "overall", label: "x", type: "rating", value: 4 }] },
  { id: "b", answers: [{ key: "overall", label: "x", type: "rating", value: 5 }, { key: "food", label: "y", type: "single", value: "Gut" }] },
];

describe("suggestKey", () => {
  it("turns a label into a key", () => {
    expect(suggestKey("Wie war das Essen?", [])).toBe("wie_war_das_essen");
    expect(suggestKey("Größe & Spaß", [])).toBe("groesse_spass");
    expect(suggestKey("1. Lobpreis", [])).toBe("lobpreis");
    expect(suggestKey("???", [])).toBe("frage");
  });

  it("caps the length and numbers collisions", () => {
    expect(suggestKey("a".repeat(60), []).length).toBe(40);
    expect(suggestKey("Essen", ["essen"])).toBe("essen_2");
    expect(suggestKey("Essen", ["essen", "essen_2"])).toBe("essen_3");
    expect(suggestKey("b".repeat(60), ["b".repeat(40)])).toBe(`${"b".repeat(38)}_2`);
  });
});

describe("answers per key", () => {
  it("collects answered keys and counts", () => {
    expect([...answeredKeys(responses)].sort()).toEqual(["food", "overall"]);
    expect(answerCountForKey(responses, "overall")).toBe(2);
    expect(answerCountForKey(responses, "food")).toBe(1);
    expect(answerCountForKey(responses, "none")).toBe(0);
  });
});

describe("questionChangeProblem", () => {
  const answered = new Set(["overall", "food"]);
  const food = { key: "food", type: "single" as const, options: ["Gut", "Schlecht"] };

  it("allows anything without answers", () => {
    expect(questionChangeProblem({ key: "new", type: "rating", options: [] }, { key: "other", type: "text", options: [] }, answered)).toBeNull();
  });

  it("locks key, type and existing options once answered", () => {
    expect(questionChangeProblem(food, { ...food, key: "meal" }, answered)).toBe("locked_key");
    expect(questionChangeProblem(food, { ...food, type: "multi" }, answered)).toBe("locked_type");
    expect(questionChangeProblem(food, { ...food, options: ["Gut", "Mies"] }, answered)).toBe("options_removed");
    expect(questionChangeProblem(food, { ...food, options: ["Gut", "Schlecht", "Okay"] }, answered)).toBeNull();
  });
});

describe("questionsToCopy", () => {
  it("copies only missing keys in source order after the target", () => {
    const source = [question("b", 1), question("a", 0, { type: "multi", options: ["x", "y"], allowComment: true }), question("c", 2)];
    const target = [question("b", 4)];
    expect(questionsToCopy(source, target)).toEqual([
      { key: "a", label: "a", type: "multi", required: false, options: ["x", "y"], allowComment: true, sortOrder: 5 },
      { key: "c", label: "c", type: "rating", required: false, options: [], allowComment: false, sortOrder: 6 },
    ]);
  });

  it("starts at 0 for an empty target and returns nothing when all exist", () => {
    expect(questionsToCopy([question("a", 3)], []).map((q) => q.sortOrder)).toEqual([0]);
    expect(questionsToCopy([question("a", 0)], [question("a", 0)])).toEqual([]);
  });
});

describe("parseAnswers", () => {
  it("keeps valid entries and skips broken ones", () => {
    expect(
      parseAnswers([
        { key: "a", label: "A", type: "rating", value: 3 },
        { key: "b", label: "B", type: "rating", value: 9 },
        { key: "c", label: "C", type: "multi", value: ["x"] },
        { key: "e", label: "E", type: "rating", value: 2, comment: "gut" },
        { key: "f", label: "F", type: "text", value: "x", comment: "nicht erlaubt" },
        { key: "d", type: "text", value: "no label" },
        "junk",
      ]),
    ).toEqual([
      { key: "a", label: "A", type: "rating", value: 3 },
      { key: "c", label: "C", type: "multi", value: ["x"] },
      { key: "e", label: "E", type: "rating", value: 2, comment: "gut" },
    ]);
    expect(parseAnswers(null)).toEqual([]);
  });
});
