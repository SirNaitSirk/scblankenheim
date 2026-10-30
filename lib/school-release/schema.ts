import { z } from "zod";
import {
  ADDRESS_KEYS_MAX,
  ADDRESS_LINES_MAX,
  ADDRESS_MAX,
  CLASS_NAME_MAX,
  RELEASE_DATES_MAX,
  SCHOOL_NAME_MAX,
  SIGNER_MAX,
  TEACHER_NAME_MAX,
} from "./limits";
import { releaseMessages } from "./messages";

/**
 * Zod schemas of the school release letter (specs/020-school-release,
 * data-model.md). Pure: shared by the participant action, the admin actions
 * and the tests.
 */

const e = releaseMessages.errors;

/** Trims every line, drops empty lines and joins with `\n`. */
export function normalizeMultiline(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line !== "")
    .join("\n");
}

function requiredLine(max: number) {
  return z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .pipe(z.string().min(1, e.required).max(max, e.tooLong(max)));
}

const address = z
  .string()
  .transform(normalizeMultiline)
  .pipe(
    z
      .string()
      .min(1, e.required)
      .max(ADDRESS_MAX, e.tooLong(ADDRESS_MAX))
      .refine((value) => value.split("\n").length <= ADDRESS_LINES_MAX, e.tooManyLines(ADDRESS_LINES_MAX)),
  );

export const schoolReleaseInputSchema = z.object({
  teacherName: requiredLine(TEACHER_NAME_MAX),
  schoolName: requiredLine(SCHOOL_NAME_MAX),
  schoolAddress: address,
  participantAddress: address,
  className: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .pipe(z.string().max(CLASS_NAME_MAX, e.tooLong(CLASS_NAME_MAX)))
    .transform((value) => (value === "" ? null : value)),
});

export type SchoolReleaseInput = z.infer<typeof schoolReleaseInputSchema>;

/** First error message per field, for inline errors. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

const optionalText = (max: number) =>
  z
    .string()
    .nullable()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .pipe(z.string().max(max, e.tooLong(max)))
    .transform((value) => (value === "" ? null : value));

export const releaseSettingsInputSchema = z.object({
  enabled: z.boolean(),
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .max(RELEASE_DATES_MAX)
    .transform((dates) => [...new Set(dates)].sort()),
  signerName: optionalText(SIGNER_MAX),
  signerRole: optionalText(SIGNER_MAX),
  addressKeys: z
    .array(z.string().trim().min(1))
    .max(ADDRESS_KEYS_MAX)
    .transform((keys) => [...new Set(keys)]),
});

export type ReleaseSettingsInput = z.input<typeof releaseSettingsInputSchema>;
