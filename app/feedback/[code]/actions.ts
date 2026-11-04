"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { findOpenFeedbackByCode, insertFeedbackResponse, isFeedbackThrottled, toPublicQuestion } from "@/lib/feedback/data";
import { FEEDBACK_COOKIE_MAX_AGE_S, FEEDBACK_LINK_CODE_PATTERN, FEEDBACK_PATH, feedbackCookieName } from "@/lib/feedback/limits";
import type { SubmitFeedbackInput, SubmitFeedbackResult } from "@/lib/feedback/submit-types";
import { validateFeedback } from "@/lib/feedback/validation";
import { requestIp } from "@/lib/payment/lookup";
import { checkSubmission } from "@/lib/register/form-token-server";

/**
 * Public feedback submit (specs/038-camp-feedback, contracts/feedback-routes.md).
 * Stores only the camp and the answers; no log entry, no mail.
 */

const inputSchema = z.object({
  nonce: z.guid(),
  formToken: z.string().max(200),
  trap: z.string().max(500),
  answers: z.record(z.string(), z.unknown()),
});

function sameKeys(a: readonly { key: string }[], b: readonly { key: string }[]): boolean {
  return a.length === b.length && a.every((item, index) => item.key === b[index]?.key);
}

export async function submitFeedback(
  code: string,
  shownKeys: string[],
  raw: SubmitFeedbackInput,
): Promise<SubmitFeedbackResult> {
  try {
    if (!FEEDBACK_LINK_CODE_PATTERN.test(code)) return { status: "unavailable" };
    const parsed = inputSchema.safeParse(raw);
    if (!parsed.success) return { status: "failed" };

    const feedback = await findOpenFeedbackByCode(code);
    if (!feedback) return { status: "unavailable" };

    const verdict = checkSubmission(parsed.data.trap, parsed.data.formToken);
    if (verdict.kind === "expired") return { status: "expired" };
    if (verdict.kind === "silent") return { status: "ok" };

    if (await isFeedbackThrottled(await requestIp(), feedback.campId)) return { status: "throttled" };

    const questions = feedback.questions.map(toPublicQuestion);
    const result = validateFeedback(questions, parsed.data.answers);
    const changed = !sameKeys(questions, shownKeys.map((key) => ({ key })));
    if (!result.ok) return { status: "invalid", errors: result.errors, ...(changed ? { questions } : {}) };

    await insertFeedbackResponse(feedback.campId, parsed.data.nonce, result.answers);
    (await cookies()).set(feedbackCookieName(feedback.campId), "1", {
      path: FEEDBACK_PATH,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: FEEDBACK_COOKIE_MAX_AGE_S,
    });
    return { status: "ok" };
  } catch (error) {
    console.error("[feedback] submit failed", error);
    return { status: "failed" };
  }
}
