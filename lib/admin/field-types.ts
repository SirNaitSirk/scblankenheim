/**
 * Allowed registration-form field types. Single source of truth for both the
 * editor UI and server-side Zod validation. Keys are English/stable — the German
 * labels live in `de.fields.types` (messages.ts). Only `select` carries `options`.
 */
export const FIELD_TYPES = [
  "text",
  "textarea",
  "email",
  "tel",
  "number",
  "date",
  "select",
  "checkbox",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/** Whether a given field type stores a list of choices (`options`). */
export function isChoiceType(type: FieldType): boolean {
  return type === "select";
}
