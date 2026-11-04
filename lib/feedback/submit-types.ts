import type { PublicFeedbackQuestion } from "./types";

/** Result of the public submit action (specs/038-camp-feedback, contracts). */
export type SubmitFeedbackResult =
  | { status: "ok" }
  | { status: "unavailable" }
  | { status: "expired" }
  | { status: "throttled" }
  | { status: "failed" }
  | { status: "invalid"; errors: Record<string, string>; questions?: PublicFeedbackQuestion[] };

export type SubmitFeedbackInput = {
  nonce: string;
  formToken: string;
  trap: string;
  answers: Record<string, unknown>;
};
