import { registerMessages } from "@/lib/register/messages";
import type { CampFormField } from "@/lib/admin/types";

/**
 * Shared field rules for the public registration form. Isomorphic: the client
 * form validates with these for instant feedback and the register service
 * validates with the very same functions, so messages never drift apart.
 */

export type FieldValue = string | boolean;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CORE_KEYS = ["first_name", "last_name", "email"] as const;
export type CoreKey = (typeof CORE_KEYS)[number];

/**
 * Fixed identity fields backed by dedicated `registrations` columns rather than
 * `form_data`. Synthetic `CampFormField`s so the renderer and the rules below
 * apply unchanged. Always rendered above the camp's own questions.
 */
export const CORE_FIELDS: CampFormField[] = [
  { key: "first_name", label: registerMessages.fields.firstName, fieldType: "text" },
  { key: "last_name", label: registerMessages.fields.lastName, fieldType: "text" },
  { key: "email", label: registerMessages.fields.email, fieldType: "email" },
].map((f) => ({
  ...f,
  id: `core-${f.key}`,
  campId: "",
  required: true,
  options: null,
  sortOrder: -1,
  config: {},
}));

const CORE_KEY_SET: ReadonlySet<string> = new Set(CORE_KEYS);

export function isCoreKey(key: string): key is CoreKey {
  return CORE_KEY_SET.has(key);
}

/** Core fields first, then the camp's questions in order, deduped by key. */
export function mergeFields(dynamic: CampFormField[]): CampFormField[] {
  return [...CORE_FIELDS, ...dynamic.filter((f) => !isCoreKey(f.key))];
}

/** Validates one value; returns the German message or `null` when valid. */
export function validateField(
  field: CampFormField,
  value: FieldValue | undefined,
): string | null {
  if (field.fieldType === "checkbox") {
    return field.required && value !== true
      ? registerMessages.validation.checkbox
      : null;
  }

  const text = typeof value === "string" ? value.trim() : "";

  if (text === "") {
    return field.required ? registerMessages.validation.required : null;
  }
  if (field.fieldType === "email" && !EMAIL_RE.test(text)) {
    return registerMessages.validation.email;
  }
  if (field.fieldType === "number" && Number.isNaN(Number(text))) {
    return registerMessages.validation.number;
  }
  return null;
}

/** Validates every field; returns per key messages (empty when all valid). */
export function validateFields(
  fields: CampFormField[],
  values: Record<string, FieldValue>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const message = validateField(field, values[field.key]);
    if (message) errors[field.key] = message;
  }
  return errors;
}
