import "server-only";

import { PROVIDER_TIMEOUT_MS } from "./limits";
import type { MailSender } from "./settings";

/**
 * Thin Resend client over `fetch` (research R1). Reads the API key and sender
 * settings from server env only. Never throws: every outcome is a typed result
 * so a mail problem can never break registration or payment.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendError = "not_configured" | "rejected" | "rate_limited" | "network";

export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; error: SendError; detail?: string };

/** Longest provider error text kept for the log, so one bad response cannot flood it. */
const DETAIL_MAX_LENGTH = 300;

/** Failure code plus the provider's own reason when it gave one, for log lines. */
export function describeSendError(result: { error: SendError; detail?: string }): string {
  return result.detail ? `${result.error} (${result.detail})` : result.error;
}

/** HTTP status and Resend's error message, e.g. `403: You can only send ...`. */
async function rejectionDetail(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const message =
    body && typeof body === "object" && "message" in body && typeof body.message === "string"
      ? body.message.trim()
      : "";
  const detail = message ? `${response.status}: ${message}` : String(response.status);
  return detail.slice(0, DETAIL_MAX_LENGTH);
}

/**
 * Sender line with an optional per camp display name (specs/016-mail-settings,
 * research R5). The address always comes from `EMAIL_FROM` (`Name <addr>` or
 * `addr`), because only that domain is verified at the provider.
 */
export function formatFrom(envFrom: string, name: string | null): string {
  const displayName = name?.trim();
  if (!displayName) return envFrom;
  const address = envFrom.match(/<([^<>]+)>/)?.[1]?.trim() ?? envFrom;
  return `"${displayName.replace(/["\\]/g, "")}" <${address}>`;
}

export async function sendEmail(
  email: OutgoingEmail,
  idempotencyKey: string,
  sender?: MailSender,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const envFrom = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !envFrom) return { ok: false, error: "not_configured" };
  const from = formatFrom(envFrom, sender?.name ?? null);
  const replyTo = sender?.replyTo?.trim() || process.env.EMAIL_REPLY_TO?.trim();

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [email.to],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });

    if (response.status === 429) return { ok: false, error: "rate_limited" };
    if (!response.ok) {
      return { ok: false, error: "rejected", detail: await rejectionDetail(response) };
    }

    const body: unknown = await response.json().catch(() => null);
    const id =
      body && typeof body === "object" && "id" in body && typeof body.id === "string"
        ? body.id
        : null;
    return { ok: true, id };
  } catch {
    return { ok: false, error: "network" };
  }
}
