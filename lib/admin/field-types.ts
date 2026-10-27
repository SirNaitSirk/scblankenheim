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
  "step",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/** Whether a given field type stores a list of choices (`options`). */
export function isChoiceType(type: FieldType): boolean {
  return type === "select";
}

/**
 * `step` rows only mark where a new form step begins; every other type is a
 * question that collects an answer.
 */
export function isQuestionType(type: string): boolean {
  return type !== "step";
}

// German aware slug: transliterate umlauts, lowercase, non alphanumerics → `_`.
export function slugifyKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^([0-9])/, "feld_$1");
}
