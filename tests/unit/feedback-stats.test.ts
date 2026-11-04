import { describe, expect, it } from "vitest";
import { buildHistory, summarizeCamp } from "@/lib/feedback/stats";
import type { FeedbackQuestion, FeedbackResponse, HistoryInput } from "@/lib/feedback/types";

const questions: FeedbackQuestion[] = [
  { id: "q1", campId: "c", key: "overall", label: "Gesamt", type: "rating", required: true, options: [], allowComment: false, sortOrder: 0 },
  { id: "q2", campId: "c", key: "liked", label: "Gefallen", type: "multi", required: false, options: ["Lobpreis", "Essen"], allowComment: false, sortOrder: 1 },
  { id: "q3", campId: "c", key: "better", label: "Besser", type: "text", required: false, options: [], allowComment: false, sortOrder: 2 },
];

const responses: FeedbackResponse[] = [
  {
    id: "b",
    answers: [
      { key: "overall", label: "Gesamt", type: "rating", value: 5, comment: "Super Lobpreis" },
      { key: "liked", label: "Gefallen", type: "multi", value: ["Lobpreis", "Essen"] },
      { key: "better", label: "Besser", type: "text", value: "Mehr Schlaf" },
    ],
  },
  {
    id: "a",
    answers: [
      { key: "overall", label: "Gesamt", type: "rating", value: 4 },
      { key: "liked", label: "Gefallen", type: "multi", value: ["Essen", "Baden"] },
      { key: "old", label: "Alte Frage", type: "single", value: "Ja" },
    ],
  },
  { id: "c", answers: [{ key: "overall", label: "Gesamt", type: "rating", value: 4, comment: "Zu laut" }] },
];

describe("summarizeCamp", () => {
  const summary = summarizeCamp(questions, responses, 120, true);

  it("counts responses and passes context", () => {
    expect(summary).toMatchObject({ responseCount: 3, activeRegistrations: 120, open: true });
  });

  it("averages ratings with one decimal and a distribution", () => {
    expect(summary.questions[0]).toEqual({
      key: "overall", label: "Gesamt", answered: 3, deleted: false, type: "rating", average: 4.3, distribution: [0, 0, 0, 2, 1],
      comments: ["Super Lobpreis", "Zu laut"],
    });
  });

  it("shares relate to the answered count and keep old options", () => {
    expect(summary.questions[1]).toEqual({
      key: "liked", label: "Gefallen", answered: 2, deleted: false, type: "multi",
      options: [
        { option: "Lobpreis", count: 1, share: 0.5 },
        { option: "Essen", count: 2, share: 1 },
        { option: "Baden", count: 1, share: 0.5 },
      ],
      comments: [],
    });
  });

  it("lists texts and appends deleted questions", () => {
    expect(summary.questions[2]).toMatchObject({ type: "text", answered: 1, texts: ["Mehr Schlaf"] });
    expect(summary.questions[3]).toMatchObject({ key: "old", label: "Alte Frage", type: "single", deleted: true, answered: 1 });
  });

  it("handles a camp without responses", () => {
    const empty = summarizeCamp(questions, [], 10, false);
    expect(empty.responseCount).toBe(0);
    expect(empty.questions[0]).toMatchObject({ answered: 0, average: null });
  });
});

describe("buildHistory", () => {
  const camp = (id: string, startDate: string | null, label: string, values: number[]): HistoryInput => ({
    id, name: `Camp ${id}`, startDate,
    questions: [{ id: `q${id}`, campId: id, key: "overall", label, type: "rating", required: true, options: [], allowComment: false, sortOrder: 0 }],
    responses: values.map((value, i) => ({ id: `${id}${i}`, answers: [{ key: "overall", label, type: "rating", value: value as 1 }] })),
  });

  it("orders camps oldest first, skips camps without responses and keeps labels", () => {
    const food: HistoryInput = {
      ...camp("x", "2025-08-01", "Gesamt", [3]),
      questions: [],
      responses: [{ id: "x0", answers: [{ key: "food", label: "Essen", type: "rating", value: 2 }] }],
    };
    const history = buildHistory([camp("b", "2027-08-01", "Wie war es?", [5, 4]), camp("a", "2026-08-01", "Gesamt", [3]), camp("e", "2028-08-01", "Gesamt", []), food]);
    expect(history.camps.map((c) => c.id)).toEqual(["x", "a", "b"]);
    const overall = history.rows.find((row) => row.key === "overall");
    expect(overall).toMatchObject({ type: "rating", label: "Wie war es?", previousLabels: ["Gesamt"] });
    expect(overall?.cells).toEqual([null, { kind: "rating", answered: 1, average: 3 }, { kind: "rating", answered: 2, average: 4.5 }]);
    expect(history.rows.find((row) => row.key === "food")?.cells).toEqual([{ kind: "rating", answered: 1, average: 2 }, null, null]);
  });
});
