import "server-only";

import { PROVIDER_TIMEOUT_MS } from "./limits";

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

export type SendResult = { ok: true; id: string | null } | { ok: false; error: SendError };

export async function sendEmail(
  email: OutgoingEmail,
  idempotencyKey: string,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return { ok: false, error: "not_configured" };
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();

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
    if (!response.ok) return { ok: false, error: "rejected" };

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
