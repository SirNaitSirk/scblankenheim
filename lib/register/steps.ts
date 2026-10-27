import { registerMessages } from "@/lib/register/messages";
import { CORE_FIELDS, isCoreKey } from "@/lib/register/validation";
import type { CampFormField } from "@/lib/admin/types";

/**
 * Splits the public registration form into steps. Isomorphic and pure: the
 * public form, the admin preview and the data filters all derive steps from the
 * same ordered `camp_form_fields` list (constitution IV).
 */

/** Questions per step when the camp defines no step breaks. */
export const AUTO_STEP_SIZE = 4;

/** Above this many questions the admin preview suggests splitting a step. */
export const LONG_STEP_HINT = 6;

export type FormStep = {
  id: string;
  title: string;
  subtitle: string | null;
  /** Questions only, never a step break. */
  fields: CampFormField[];
};

const copy = registerMessages.steps;

export function isStepBreak(field: CampFormField): boolean {
  return field.fieldType === "step";
}

/** Drops every step break: the fields that actually collect answers. */
export function questionFields(fields: CampFormField[]): CampFormField[] {
  return fields.filter((field) => !isStepBreak(field));
}

function readSubtitle(field: CampFormField): string | null {
  const value = field.config.helpText;
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function chunk(fields: CampFormField[], size: number): FormStep[] {
  const steps: FormStep[] = [];
  for (let i = 0; i < fields.length; i += size) {
    steps.push({
      id: `auto-${steps.length + 1}`,
      title: copy.autoTitle,
      subtitle: null,
      fields: fields.slice(i, i + size),
    });
  }
  return steps;
}

/**
 * Core step first, then either the admin defined steps (each step break opens
 * one; questions before the first break get a neutral step) or automatic
 * chunks of `AUTO_STEP_SIZE`. Steps without questions are dropped.
 */
export function buildSteps(dynamicFields: CampFormField[]): FormStep[] {
  const core: FormStep = {
    id: "core",
    title: copy.coreTitle,
    subtitle: null,
    fields: CORE_FIELDS,
  };
  const ordered = dynamicFields.filter((field) => !isCoreKey(field.key));

  if (!ordered.some(isStepBreak)) {
    return [core, ...chunk(ordered, AUTO_STEP_SIZE)];
  }

  const steps: FormStep[] = [];
  let current: FormStep = { id: "lead", title: copy.autoTitle, subtitle: null, fields: [] };
  for (const field of ordered) {
    if (isStepBreak(field)) {
      steps.push(current);
      current = {
        id: field.id,
        title: field.label.trim() || copy.autoTitle,
        subtitle: readSubtitle(field),
        fields: [],
      };
    } else {
      current.fields.push(field);
    }
  }
  steps.push(current);

  return [core, ...steps.filter((step) => step.fields.length > 0)];
}

/** Index of the step holding `key`, or -1 when no step does. */
export function stepIndexOf(steps: FormStep[], key: string): number {
  return steps.findIndex((step) => step.fields.some((field) => field.key === key));
}
