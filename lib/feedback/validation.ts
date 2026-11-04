import { FEEDBACK_TEXT_MAX } from "./limits";
import { feedbackMessages } from "./messages";
import type { FeedbackAnswer, PublicFeedbackQuestion, RatingValue } from "./types";

/**
 * Server check of a submitted feedback against the current questions
 * (specs/038-camp-feedback, FR-004). Pure, so it is unit tested. Values for keys
 * without a current question are dropped; unanswered optional questions are left
 * out of the stored answers.
 */

export type FeedbackValidation =
  | { ok: true; answers: FeedbackAnswer[] }
  | { ok: false; errors: Record<string, string> };

const t = feedbackMessages.errors;

function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function asStringList(value: unknown): string[] | null {
  if (typeof value === "string") return [value];
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value as string[];
  return null;
}

type Check = { answer: FeedbackAnswer } | { error: string };

function checkValue(question: PublicFeedbackQuestion, raw: unknown): Check {
  const base = { key: question.key, label: question.label };
  switch (question.type) {
    case "rating": {
      const value = typeof raw === "string" ? Number(raw.trim()) : raw;
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) return { error: t.rating };
      return { answer: { ...base, type: "rating", value: value as RatingValue } };
    }
    case "single": {
      if (typeof raw !== "string" || !question.options.includes(raw)) return { error: t.option };
      return { answer: { ...base, type: "single", value: raw } };
    }
    case "multi": {
      const list = asStringList(raw);
      if (!list) return { error: t.option };
      const unique = [...new Set(list)];
      if (unique.length === 0 || unique.some((item) => !question.options.includes(item))) return { error: t.option };
      // Keep the order of the configured options, not of the submission.
      return { answer: { ...base, type: "multi", value: question.options.filter((option) => unique.includes(option)) } };
    }
    case "text": {
      if (typeof raw !== "string") return { error: t.required };
      const value = raw.trim();
      if (value.length > FEEDBACK_TEXT_MAX) return { error: t.textTooLong };
      return { answer: { ...base, type: "text", value } };
    }
  }
}

export function validateFeedback(
  questions: readonly PublicFeedbackQuestion[],
  raw: Record<string, unknown>,
): FeedbackValidation {
  const errors: Record<string, string> = {};
  const answers: FeedbackAnswer[] = [];

  for (const question of questions) {
    const value = Object.prototype.hasOwnProperty.call(raw, question.key) ? raw[question.key] : undefined;
    if (isBlank(value)) {
      if (question.required) errors[question.key] = t.required;
      continue;
    }
    const result = checkValue(question, value);
    if ("error" in result) errors[question.key] = result.error;
    else answers.push(result.answer);
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  if (answers.length === 0) return { ok: false, errors: { _form: t.empty } };
  return { ok: true, answers };
}
