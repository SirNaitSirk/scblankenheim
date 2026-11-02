import { createHmac, timingSafeEqual } from "node:crypto";
import { FORM_MIN_FILL_MS, FORM_TOKEN_MAX_AGE_MS } from "@/lib/register/limits";

/**
 * Pure helpers for the signed form timestamp and the trap field of the public
 * registration form (specs/029-registration-bot-protection, research R1, R3).
 * The key is passed in, so tests run without env; the server wrapper lives in
 * `form-token-server.ts`.
 */

export type FormTokenCheck = "ok" | "missing" | "forged" | "too_fast" | "expired";

export type SilentReason = "trap" | "fast" | "token";

export type SubmissionVerdict =
  | { kind: "pass" }
  | { kind: "silent"; reason: SilentReason }
  | { kind: "expired" };

function sign(issuedAtMs: string, key: Buffer): string {
  return createHmac("sha256", key).update(issuedAtMs).digest("base64url");
}

export function createFormToken(issuedAtMs: number, key: Buffer): string {
  const stamp = String(Math.trunc(issuedAtMs));
  return `${stamp}.${sign(stamp, key)}`;
}

export function checkFormToken(
  token: string | undefined,
  now: number,
  key: Buffer,
): FormTokenCheck {
  const match = /^(\d{1,16})\.([A-Za-z0-9_-]{1,128})$/.exec(token?.trim() ?? "");
  if (!match) return "missing";
  const [, stamp, signature] = match as unknown as [string, string, string];

  const expected = Buffer.from(sign(stamp, key));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received))
    return "forged";

  const age = now - Number(stamp);
  if (age < FORM_MIN_FILL_MS) return "too_fast"; // also a timestamp in the future
  if (age > FORM_TOKEN_MAX_AGE_MS) return "expired";
  return "ok";
}

/** Trap first, then the token; only an expired but genuine token is told apart. */
export function classifySubmission(input: {
  trap: string | undefined;
  formToken: string | undefined;
  now: number;
  key: Buffer;
}): SubmissionVerdict {
  if (input.trap && input.trap.trim() !== "") return { kind: "silent", reason: "trap" };
  const check = checkFormToken(input.formToken, input.now, input.key);
  switch (check) {
    case "ok":
      return { kind: "pass" };
    case "expired":
      return { kind: "expired" };
    case "too_fast":
      return { kind: "silent", reason: "fast" };
    default:
      return { kind: "silent", reason: "token" };
  }
}
