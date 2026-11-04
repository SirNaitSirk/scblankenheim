import { describe, expect, it } from "vitest";
import { feedbackMessages } from "@/lib/feedback/messages";
import type { PublicFeedbackQuestion } from "@/lib/feedback/types";
import { validateFeedback } from "@/lib/feedback/validation";

const questions: PublicFeedbackQuestion[] = [
  { key: "overall", label: "Wie war das Camp?", type: "rating", required: true, options: [], allowComment: false },
  { key: "liked", label: "Was hat dir gefallen?", type: "multi", required: false, options: ["Lobpreis", "Workshops", "Essen"], allowComment: false },
  { key: "again", label: "Kommst du wieder?", type: "single", required: false, options: ["Ja", "Nein"], allowComment: false },
  { key: "better", label: "Was sollen wir besser machen?", type: "text", required: false, options: [], allowComment: false },
];

const t = feedbackMessages.errors;

describe("validateFeedback", () => {
  it("accepts a full answer and keeps labels and types", () => {
    const result = validateFeedback(questions, {
      overall: "4",
      liked: ["Essen", "Lobpreis"],
      again: "Ja",
      better: "  Mehr Schlaf  ",
    });
    expect(result).toEqual({
      ok: true,
      answers: [
        { key: "overall", label: "Wie war das Camp?", type: "rating", value: 4 },
        { key: "liked", label: "Was hat dir gefallen?", type: "multi", value: ["Lobpreis", "Essen"] },
        { key: "again", label: "Kommst du wieder?", type: "single", value: "Ja" },
        { key: "better", label: "Was sollen wir besser machen?", type: "text", value: "Mehr Schlaf" },
      ],
    });
  });

  it("omits unanswered optional questions and drops unknown keys", () => {
    const result = validateFeedback(questions, { overall: 5, unknown: "x", better: "   " });
    expect(result).toEqual({ ok: true, answers: [{ key: "overall", label: "Wie war das Camp?", type: "rating", value: 5 }] });
  });

  it("requires required questions", () => {
    expect(validateFeedback(questions, { again: "Ja" })).toEqual({ ok: false, errors: { overall: t.required } });
  });

  it("rejects ratings outside 1 to 5 and non integers", () => {
    for (const value of [0, 6, 2.5, "abc", "7"]) {
      expect(validateFeedback(questions, { overall: value })).toEqual({ ok: false, errors: { overall: t.rating } });
    }
  });

  it("rejects unknown options", () => {
    expect(validateFeedback(questions, { overall: 3, again: "Vielleicht" })).toEqual({ ok: false, errors: { again: t.option } });
    expect(validateFeedback(questions, { overall: 3, liked: ["Essen", "Baden"] })).toEqual({ ok: false, errors: { liked: t.option } });
  });

  it("dedupes multi answers and accepts a single string", () => {
    const result = validateFeedback(questions, { overall: 3, liked: "Essen" });
    expect(result.ok && result.answers[1]).toEqual({ key: "liked", label: "Was hat dir gefallen?", type: "multi", value: ["Essen"] });
    const dup = validateFeedback(questions, { overall: 3, liked: ["Essen", "Essen"] });
    expect(dup.ok && dup.answers[1]?.value).toEqual(["Essen"]);
  });

  it("limits text length", () => {
    expect(validateFeedback(questions, { overall: 3, better: "a".repeat(2001) })).toEqual({ ok: false, errors: { better: t.textTooLong } });
    expect(validateFeedback(questions, { overall: 3, better: "a".repeat(2000) }).ok).toBe(true);
  });

  it("keeps a trimmed comment only next to a value of a question that allows it", () => {
    const commented = questions.map((question) => (question.key === "overall" ? { ...question, allowComment: true } : question));
    expect(validateFeedback(commented, { overall: 4, overall__comment: "  Toll  " })).toEqual({
      ok: true,
      answers: [{ key: "overall", label: "Wie war das Camp?", type: "rating", value: 4, comment: "Toll" }],
    });
    expect(validateFeedback(commented, { overall: 4, overall__comment: "   " })).toEqual({
      ok: true,
      answers: [{ key: "overall", label: "Wie war das Camp?", type: "rating", value: 4 }],
    });
    expect(validateFeedback(questions, { overall: 4, overall__comment: "nicht erlaubt" })).toEqual({
      ok: true,
      answers: [{ key: "overall", label: "Wie war das Camp?", type: "rating", value: 4 }],
    });
    const liked = commented.map((question) => ({ ...question, allowComment: true }));
    const withoutValue = validateFeedback(liked, { overall: 4, liked__comment: "ohne Antwort" });
    expect(withoutValue.ok && withoutValue.answers).toHaveLength(1);
  });

  it("limits comment length", () => {
    const commented = questions.map((question) => (question.key === "overall" ? { ...question, allowComment: true } : question));
    expect(validateFeedback(commented, { overall: 4, overall__comment: "a".repeat(2001) })).toEqual({
      ok: false,
      errors: { overall: t.commentTooLong },
    });
  });

  it("refuses an empty submission without required questions", () => {
    const optional = questions.filter((question) => !question.required);
    expect(validateFeedback(optional, {})).toEqual({ ok: false, errors: { _form: t.empty } });
  });
});

describe("uuidSchema", () => {
  it("accepts seeded ids without an RFC version", async () => {
    const { uuidSchema } = await import("@/lib/feedback/schema");
    expect(uuidSchema.safeParse("00000000-0000-0000-0000-000000000001").success).toBe(true);
    expect(uuidSchema.safeParse("not-an-id").success).toBe(false);
  });
});
