import { z } from "zod";
import { isQuestionType } from "@/lib/admin/field-types";
import type { CampFormField } from "@/lib/admin/types";
import type { Json } from "@/lib/database.types";
import {
  GENDER_OPTIONS,
  genderFromOption,
  isCoreKey,
  mergeFields,
  validateField,
  type FieldValue,
} from "@/lib/register/validation";
import { formatGermanDate } from "@/lib/time/berlin";
import { CHANGE_REASON_MAX, CHANGE_VALUE_MAX, MESSAGE_TEXT_MAX } from "./limits";
import { participantMessages as copy } from "./messages";

/**
 * Pure rules for messages and change requests from the participant page
 * (specs/018-participant-messages, research R6). Shared by the public action,
 * the admin apply step and tests, so both sides check values the same way the
 * one registration form does.
 */

export const participantMessageInputSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("message"),
    text: z.string().trim().min(1).max(MESSAGE_TEXT_MAX),
  }),
  z.object({
    kind: z.literal("change_request"),
    fieldKey: z.string().trim().min(1).max(64),
    value: z.string().max(CHANGE_VALUE_MAX),
    reason: z.string().trim().max(CHANGE_REASON_MAX).default(""),
  }),
]);

export type ParticipantMessageInput = z.infer<typeof participantMessageInputSchema>;

/** Registration columns the change rules read. */
export type ChangeableRegistration = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  gender: string | null;
  form_data: unknown;
};

/** Core fields first, then the camp's questions; never `step` rows. */
export function allowedChangeFields(campFields: ReadonlyArray<CampFormField>): CampFormField[] {
  return mergeFields(campFields.filter((field) => isQuestionType(field.fieldType)));
}

function formData(registration: ChangeableRegistration): Record<string, unknown> {
  const data = registration.form_data;
  return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
}

/** Stored value in the shape the form uses (gender as its German option text). */
export function storedFieldValue(
  registration: ChangeableRegistration,
  key: string,
): FieldValue | null {
  switch (key) {
    case "first_name":
    case "last_name":
    case "email":
      return registration[key] ?? null;
    case "gender": {
      const gender = registration.gender;
      return gender === "female" || gender === "male" ? GENDER_OPTIONS[gender] : null;
    }
    default: {
      const value = formData(registration)[key];
      if (typeof value === "boolean") return value;
      return value == null ? null : String(value);
    }
  }
}

/** Raw form input as the field's value type (checkbox inputs arrive as "true" or "false"). */
export function parseFieldInput(field: CampFormField, raw: string): FieldValue {
  return field.fieldType === "checkbox" ? raw === "true" : raw.trim();
}

function normalized(value: FieldValue | null): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  return (value ?? "").trim();
}

export function sameFieldValue(a: FieldValue | null, b: FieldValue | null): boolean {
  return normalized(a) === normalized(b);
}

export type ChangeCheck =
  | { ok: true }
  | { ok: false; reason: "invalid"; message: string }
  | { ok: false; reason: "unchanged" };

/** Form rules plus "must differ from the stored value". */
export function checkChangeRequest(
  field: CampFormField,
  stored: FieldValue | null,
  value: FieldValue,
): ChangeCheck {
  const message = validateField(field, value);
  if (message) return { ok: false, reason: "invalid", message };
  if (sameFieldValue(stored, value)) return { ok: false, reason: "unchanged" };
  return { ok: true };
}

export type ChangePatch = {
  first_name?: string;
  last_name?: string;
  email?: string;
  gender?: "female" | "male" | null;
  form_data?: { [key: string]: Json | undefined };
};

/** Registration row patch that writes `value` into the field `key`. */
export function changePatch(
  registration: ChangeableRegistration,
  key: string,
  value: FieldValue,
): ChangePatch {
  if (isCoreKey(key)) {
    if (key === "gender") return { gender: genderFromOption(value) };
    return { [key]: typeof value === "string" ? value.trim() : String(value) };
  }
  // Stored answers came from a jsonb column, so they are Json already.
  const answers = formData(registration) as { [key: string]: Json | undefined };
  return { form_data: { ...answers, [key]: value } };
}

/** Value as people read it: Ja or Nein, German dates, plain text otherwise. */
export function displayFieldValue(field: Pick<CampFormField, "fieldType">, value: unknown): string {
  if (field.fieldType === "checkbox") {
    if (value === true) return copy.answers.yes;
    if (value === false) return copy.answers.no;
    return "";
  }
  if (value == null) return "";
  const text = String(value).trim();
  if (field.fieldType === "date" && /^\d{4}-\d{2}-\d{2}/.test(text)) return formatGermanDate(text);
  return text;
}

/** Field list row from `camp_form_fields` (snake case) in the shared shape. */
export function toCampFormField(row: {
  id: string;
  camp_id: string;
  key: string;
  label: string;
  field_type: string;
  required: boolean;
  options: unknown;
  sort_order: number;
}): CampFormField {
  return {
    id: row.id,
    campId: row.camp_id,
    key: row.key,
    label: row.label,
    fieldType: row.field_type,
    required: row.required,
    options: row.options,
    sortOrder: row.sort_order,
    config: {},
  };
}
