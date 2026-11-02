import "server-only";

import { createHmac } from "node:crypto";
import { getServiceClient } from "@/lib/supabase/server";
import {
  classifySubmission,
  createFormToken,
  type SilentReason,
  type SubmissionVerdict,
} from "@/lib/register/form-token";

/**
 * Server side of the registration bot protection (specs/029-registration-bot-protection).
 * The signing key is derived from the server only Supabase key with a fixed label
 * (research R2), so no extra env value is needed and the browser never sees it.
 */

const KEY_LABEL = "registration-form-token";

function formKey(): Buffer {
  const secret = process.env.SUPABASE_ROLE_KEY;
  if (!secret) throw new Error("Missing SUPABASE_ROLE_KEY for the form token.");
  return createHmac("sha256", secret).update(KEY_LABEL).digest();
}

export function issueFormToken(now: number = Date.now()): string {
  return createFormToken(now, formKey());
}

export function checkSubmission(trap: string | undefined, formToken: string | undefined): SubmissionVerdict {
  return classifySubmission({ trap, formToken, now: Date.now(), key: formKey() });
}

const BOT_KIND: Record<SilentReason, string> = {
  trap: "registration_bot_trap",
  fast: "registration_bot_fast",
  token: "registration_bot_token",
};

/** Records a silently rejected attempt: kind and ip only, never form data or email. */
export async function recordBotAttempt(reason: SilentReason, ip: string | null): Promise<void> {
  try {
    await getServiceClient().from("submission_attempts").insert({ ip, kind: BOT_KIND[reason] });
  } catch {
    // Tracking is best effort; the bot is rejected either way.
  }
}
