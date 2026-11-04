import type { FeedbackAnswer, FeedbackQuestion, FeedbackResponse } from "./types";

/**
 * CSV export of a camp's feedback (specs/038-camp-feedback, FR-022). One row per
 * response in shuffled order, one column per key, no person, id or time.
 */

const FORMULA_START = /^[=+\-@]/;

function escapeCsv(value: string): string {
  // A leading formula sign would run as a formula in spreadsheets.
  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function cellOf(answer: FeedbackAnswer | undefined): string {
  if (!answer) return "";
  if (answer.type === "multi") return answer.value.join(", ");
  return String(answer.value);
}

/** Fisher Yates with an injectable random source, so tests are deterministic. */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

export function feedbackResponsesToCsv(
  questions: readonly FeedbackQuestion[],
  responses: readonly FeedbackResponse[],
  random: () => number = Math.random,
): string {
  const columns = [...questions]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((question) => ({ key: question.key, label: question.label }));
  const known = new Set(columns.map((column) => column.key));
  const extra = new Map<string, string>();
  for (const response of responses) {
    for (const answer of response.answers) if (!known.has(answer.key)) extra.set(answer.key, answer.label);
  }
  for (const [key, label] of extra) columns.push({ key, label });

  const header = columns.map((column) => escapeCsv(column.label)).join(";");
  const lines = shuffled(responses, random).map((response) =>
    columns.map((column) => escapeCsv(cellOf(response.answers.find((answer) => answer.key === column.key)))).join(";"),
  );
  return `﻿${[header, ...lines].join("\r\n")}`;
}
