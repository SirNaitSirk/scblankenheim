import "server-only";

import { randomBytes } from "node:crypto";
import { appBaseUrl } from "@/lib/email/links";
import { FEEDBACK_LINK_CODE_BYTES, feedbackPath } from "./limits";

/** Fresh secret of the feedback page, 128 bit random, base64url (research R1). */
export function generateFeedbackCode(): string {
  return randomBytes(FEEDBACK_LINK_CODE_BYTES).toString("base64url");
}

/** Absolute address of the feedback page for the QR code; null without APP_URL. */
export function feedbackUrl(code: string): string | null {
  const base = appBaseUrl();
  return base ? `${base}${feedbackPath(code)}` : null;
}
