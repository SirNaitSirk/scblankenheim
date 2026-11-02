import type { CampFormField, FieldCondition } from "@/lib/admin/types";
import type { FieldValue } from "@/lib/register/validation";

/**
 * Conditional fields (specs/037-conditional-form-fields). Pure and isomorphic:
 * the public form, the register service, the admin dialog and the participant
 * page all decide visibility with these functions, so they never disagree.
 * Only type imports from `validation.ts`, which itself imports from here.
 */

export type FormValues = Record<string, FieldValue | undefined>;

export type ConditionProblemReason =
  | "trigger_missing"
  | "trigger_not_select"
  | "trigger_self"
  | "trigger_conditional"
  | "value_missing"
  | "no_values"
  | "not_allowed";

export type ConditionProblem = {
  /** The dependent field, the one that carries the condition. */
  fieldKey: string;
  fieldLabel: string;
  reason: ConditionProblemReason;
};

function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((item) => typeof item === "string") ? (value as string[]) : null;
}

/** Reads `config.showWhen`; anything malformed counts as no condition. */
export function readCondition(field: Pick<CampFormField, "config">): FieldCondition | null {
  const raw = field.config.showWhen;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const { fieldKey, values } = raw as Record<string, unknown>;
  const list = stringList(values);
  if (typeof fieldKey !== "string" || fieldKey === "" || !list) return null;
  return { fieldKey, values: list };
}

/** Always true without a condition; otherwise the trigger holds one of the values. */
export function isFieldVisible(field: CampFormField, values: FormValues): boolean {
  const condition = readCondition(field);
  if (!condition) return true;
  const answer = values[condition.fieldKey];
  return typeof answer === "string" && condition.values.includes(answer.trim());
}

/** The visible fields, order unchanged. */
export function visibleFields(fields: CampFormField[], values: FormValues): CampFormField[] {
  return fields.filter((field) => isFieldVisible(field, values));
}

/**
 * `formData` without the answers of hidden fields. `triggerValues` are the
 * values the conditions compare against (the answers plus gender as German
 * option text). Keys of unknown fields pass through untouched.
 */
export function dropHiddenAnswers<T>(
  fields: CampFormField[],
  formData: Record<string, T>,
  triggerValues: FormValues,
): Record<string, T> {
  const hidden = new Set(
    fields.filter((field) => !isFieldVisible(field, triggerValues)).map((field) => field.key),
  );
  return Object.fromEntries(Object.entries(formData).filter(([key]) => !hidden.has(key)));
}

function optionsOf(field: CampFormField): string[] {
  return stringList(field.options) ?? [];
}

function problemOf(
  field: CampFormField,
  condition: FieldCondition,
  byKey: Map<string, CampFormField>,
): ConditionProblemReason | null {
  if (field.fieldType === "step" || field.id.startsWith("core-")) return "not_allowed";
  if (condition.values.length === 0) return "no_values";
  if (condition.fieldKey === field.key) return "trigger_self";
  const trigger = byKey.get(condition.fieldKey);
  if (!trigger) return "trigger_missing";
  if (trigger.fieldType !== "select") return "trigger_not_select";
  if (readCondition(trigger)) return "trigger_conditional";
  const options = optionsOf(trigger);
  if (condition.values.some((value) => !options.includes(value))) return "value_missing";
  return null;
}

/**
 * Every broken condition in a complete field list. Pass the merged list (core
 * fields included, see `mergeFields`) so gender resolves as a trigger.
 */
export function conditionProblems(fields: CampFormField[]): ConditionProblem[] {
  const byKey = new Map(fields.map((field) => [field.key, field]));
  const problems: ConditionProblem[] = [];
  for (const field of fields) {
    const condition = readCondition(field);
    if (!condition) continue;
    const reason = problemOf(field, condition, byKey);
    if (reason) problems.push({ fieldKey: field.key, fieldLabel: field.label, reason });
  }
  return problems;
}

/** Problems in `next` that `current` did not have, so old damage never blocks a repair. */
export function newConditionProblems(
  current: CampFormField[],
  next: CampFormField[],
): ConditionProblem[] {
  const before = new Set(
    conditionProblems(current).map((problem) => `${problem.fieldKey}:${problem.reason}`),
  );
  return conditionProblems(next).filter(
    (problem) => !before.has(`${problem.fieldKey}:${problem.reason}`),
  );
}

/** Fields whose condition points at `triggerKey`. */
export function dependentsOf(fields: CampFormField[], triggerKey: string): CampFormField[] {
  return fields.filter((field) => readCondition(field)?.fieldKey === triggerKey);
}

/**
 * Trigger label and answers of a conditional field, for the admin badge. Pass
 * the merged list (see `mergeFields`) so gender resolves to its label.
 */
export function conditionSummary(
  field: CampFormField,
  fields: CampFormField[],
): { trigger: string; values: string[] } | null {
  const condition = readCondition(field);
  if (!condition) return null;
  const trigger = fields.find((candidate) => candidate.key === condition.fieldKey);
  return { trigger: trigger?.label ?? condition.fieldKey, values: condition.values };
}
