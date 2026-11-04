import { describe, expect, it } from "vitest";
import { feedbackResponsesToCsv, shuffled } from "@/lib/feedback/csv";
import type { FeedbackQuestion, FeedbackResponse } from "@/lib/feedback/types";

const questions: FeedbackQuestion[] = [
  { id: "q2", campId: "c", key: "liked", label: "Was gefiel?", type: "multi", required: false, options: ["A", "B"], sortOrder: 1 },
  { id: "q1", campId: "c", key: "overall", label: "Gesamt", type: "rating", required: true, options: [], sortOrder: 0 },
];

const responses: FeedbackResponse[] = [
  { id: "1", answers: [{ key: "overall", label: "Gesamt", type: "rating", value: 5 }, { key: "liked", label: "Was gefiel?", type: "multi", value: ["A", "B"] }] },
  { id: "2", answers: [{ key: "overall", label: "Gesamt", type: "rating", value: 3 }, { key: "gone", label: "Weg", type: "text", value: "=SUMME(A1)" }] },
  { id: "3", answers: [{ key: "gone", label: "Weg", type: "text", value: 'Zitat "hier"; ok' }] },
];

describe("feedbackResponsesToCsv", () => {
  it("writes header by question order plus deleted keys, one row per response", () => {
    const keepOrder = () => 0.999;
    const csv = feedbackResponsesToCsv(questions, responses, keepOrder);
    expect(csv.startsWith("﻿")).toBe(true);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[0]).toBe("Gesamt;Was gefiel?;Weg");
    expect(lines).toHaveLength(4);
    expect(lines).toContain("5;A, B;");
    expect(lines).toContain("3;;'=SUMME(A1)");
    expect(lines).toContain(';;"Zitat ""hier""; ok"');
  });

  it("contains no ids", () => {
    const csv = feedbackResponsesToCsv(questions, [{ id: "secret-id", answers: [{ key: "overall", label: "Gesamt", type: "rating", value: 1 }] }]);
    expect(csv).not.toContain("secret-id");
  });
});

describe("shuffled", () => {
  it("keeps all items", () => {
    expect(shuffled([1, 2, 3, 4], () => 0).sort()).toEqual([1, 2, 3, 4]);
  });
});
