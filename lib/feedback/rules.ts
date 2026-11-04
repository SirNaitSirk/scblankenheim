import { FEEDBACK_KEY_MAX } from "./limits";
import { FEEDBACK_QUESTION_TYPES, type FeedbackAnswer, type FeedbackQuestion, type FeedbackQuestionType, type FeedbackResponse } from "./types";

/**
 * Pure rules of the question admin (specs/038-camp-feedback, research R7):
 * key suggestion, protection of answered questions and copying between camps.
 */

const UMLAUTS: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };

/** Key from a label: lowercase ascii, words joined by "_", unique among `taken`. */
export function suggestKey(label: string, taken: readonly string[]): string {
  const base =
    label
      .toLowerCase()
      .replace(/[äöüß]/g, (char) => UMLAUTS[char] ?? char)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^[^a-z]+/, "")
      .replace(/_+$/, "")
      .slice(0, FEEDBACK_KEY_MAX)
      .replace(/_+$/, "") || "frage";
  if (!taken.includes(base)) return base;
  for (let n = 2; ; n += 1) {
    const suffix = `_${n}`;
    const candidate = `${base.slice(0, FEEDBACK_KEY_MAX - suffix.length).replace(/_+$/, "")}${suffix}`;
    if (!taken.includes(candidate)) return candidate;
  }
}

/** Keys that appear in at least one stored answer. */
export function answeredKeys(responses: readonly FeedbackResponse[]): Set<string> {
  const keys = new Set<string>();
  for (const response of responses) for (const answer of response.answers) keys.add(answer.key);
  return keys;
}

export function answerCountForKey(responses: readonly FeedbackResponse[], key: string): number {
  return responses.filter((response) => response.answers.some((answer) => answer.key === key)).length;
}

export type QuestionChangeProblem = "locked_type" | "locked_key" | "options_removed";

/** Why an answered question may not change like this, or null when allowed. */
export function questionChangeProblem(
  existing: Pick<FeedbackQuestion, "key" | "type" | "options">,
  next: { key: string; type: FeedbackQuestionType; options: readonly string[] },
  answered: ReadonlySet<string>,
): QuestionChangeProblem | null {
  if (!answered.has(existing.key)) return null;
  if (next.key !== existing.key) return "locked_key";
  if (next.type !== existing.type) return "locked_type";
  if (existing.options.some((option) => !next.options.includes(option))) return "options_removed";
  return null;
}

export type CopiedQuestion = Omit<FeedbackQuestion, "id" | "campId">;

/** Questions of `source` whose key is missing in `target`, ordered after the target's. */
export function questionsToCopy(
  source: readonly FeedbackQuestion[],
  target: readonly FeedbackQuestion[],
): CopiedQuestion[] {
  const existing = new Set(target.map((question) => question.key));
  let order = target.reduce((max, question) => Math.max(max, question.sortOrder), -1);
  return [...source]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((question) => !existing.has(question.key))
    .map((question) => ({
      key: question.key,
      label: question.label,
      type: question.type,
      required: question.required,
      options: [...question.options],
      sortOrder: (order += 1),
    }));
}

function isAnswer(value: unknown): value is FeedbackAnswer {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.key !== "string" || typeof item.label !== "string") return false;
  switch (item.type) {
    case "rating":
      return typeof item.value === "number" && Number.isInteger(item.value) && item.value >= 1 && item.value <= 5;
    case "single":
    case "text":
      return typeof item.value === "string";
    case "multi":
      return Array.isArray(item.value) && item.value.every((entry) => typeof entry === "string");
    default:
      return false;
  }
}

/** Stored answers read defensively; malformed entries are skipped. */
export function parseAnswers(value: unknown): FeedbackAnswer[] {
  return Array.isArray(value) ? value.filter(isAnswer) : [];
}

export function isQuestionType(value: unknown): value is FeedbackQuestionType {
  return typeof value === "string" && (FEEDBACK_QUESTION_TYPES as readonly string[]).includes(value);
}
