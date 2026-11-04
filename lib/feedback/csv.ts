import { feedbackCsvCommentHeader } from "./messages";
import type { FeedbackAnswer, FeedbackQuestion, FeedbackResponse } from "./types";

/**
 * CSV export of a camp's feedback (specs/038-camp-feedback, FR-022). One row per
 * response in shuffled order, one column per key plus a comment column after
 * every question that allows or has comments (US6); no person, id or time.
 */

const FORMULA_START = /^[=+\-@]/;
const BOM = "﻿";

type Column = { key: string; label: string; comment: boolean };

function escapeCsv(value: string): string {
  // A leading formula sign would run as a formula in spreadsheets.
  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function cellOf(answer: FeedbackAnswer | undefined, comment: boolean): string {
  if (!answer) return "";
  if (comment) return answer.type === "text" ? "" : (answer.comment ?? "");
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
  const commented = new Set<string>();
  const extra = new Map<string, string>();
  const known = new Set(questions.map((question) => question.key));
  for (const response of responses) {
    for (const answer of response.answers) {
      if (answer.type !== "text" && answer.comment) commented.add(answer.key);
      if (!known.has(answer.key)) extra.set(answer.key, answer.label);
    }
  }

  const base = [
    ...[...questions]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((question) => ({ key: question.key, label: question.label, allow: question.allowComment })),
    ...[...extra].map(([key, label]) => ({ key, label, allow: false })),
  ];
  const columns: Column[] = base.flatMap((column) => {
    const own = { key: column.key, label: column.label, comment: false };
    return column.allow || commented.has(column.key)
      ? [own, { key: column.key, label: feedbackCsvCommentHeader(column.label), comment: true }]
      : [own];
  });

  const header = columns.map((column) => escapeCsv(column.label)).join(";");
  const lines = shuffled(responses, random).map((response) =>
    columns
      .map((column) => escapeCsv(cellOf(response.answers.find((answer) => answer.key === column.key), column.comment)))
      .join(";"),
  );
  return `${BOM}${[header, ...lines].join("\r\n")}`;
}
