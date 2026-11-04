import { z } from "zod";
import { de } from "@/lib/admin/messages";
import {
  FEEDBACK_KEY_PATTERN,
  FEEDBACK_LABEL_MAX,
  FEEDBACK_OPTION_MAX,
  FEEDBACK_OPTIONS_MAX,
  FEEDBACK_OPTIONS_MIN,
} from "./limits";
import { FEEDBACK_QUESTION_TYPES } from "./types";

/** Zod for admin question input (specs/038-camp-feedback, data-model.md). */

const e = de.feedback.errors;

export const feedbackQuestionInputSchema = z
  .object({
    label: z.string().trim().min(1, e.label).max(FEEDBACK_LABEL_MAX, e.label),
    type: z.enum(FEEDBACK_QUESTION_TYPES),
    required: z.boolean(),
    key: z.string().trim().regex(FEEDBACK_KEY_PATTERN, e.key),
    options: z.array(z.string()).default([]),
  })
  .transform((input, ctx) => {
    if (input.type !== "single" && input.type !== "multi") return { ...input, options: [] as string[] };
    const options = input.options.map((option) => option.trim()).filter((option) => option !== "");
    const unique = new Set(options);
    const valid =
      options.length >= FEEDBACK_OPTIONS_MIN &&
      options.length <= FEEDBACK_OPTIONS_MAX &&
      unique.size === options.length &&
      options.every((option) => option.length <= FEEDBACK_OPTION_MAX);
    if (!valid) {
      ctx.addIssue({ code: "custom", path: ["options"], message: e.options });
      return z.NEVER;
    }
    return { ...input, options };
  });

export type FeedbackQuestionInput = z.output<typeof feedbackQuestionInputSchema>;

export const uuidSchema = z.string().uuid();
