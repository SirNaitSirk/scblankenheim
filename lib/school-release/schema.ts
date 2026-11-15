import { z } from "zod";
import { RELEASE_DATES_MAX, SCHOOL_LOCATION_MAX, SCHOOL_NAME_MAX } from "./limits";
import { releaseMessages } from "./messages";

/**
 * Zod schemas of the school release letter (specs/020-school-release,
 * specs/042-church-release-letter data-model.md). Pure: shared by the
 * participant action, the admin actions and the tests.
 */

const e = releaseMessages.errors;

function requiredLine(max: number) {
  return z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .pipe(z.string().min(1, e.required).max(max, e.tooLong(max)));
}

export const schoolReleaseInputSchema = z.object({
  schoolName: requiredLine(SCHOOL_NAME_MAX),
  schoolLocation: requiredLine(SCHOOL_LOCATION_MAX),
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

export const releaseSettingsInputSchema = z.object({
  enabled: z.boolean(),
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .max(RELEASE_DATES_MAX)
    .transform((dates) => [...new Set(dates)].sort()),
});

export type ReleaseSettingsInput = z.input<typeof releaseSettingsInputSchema>;
