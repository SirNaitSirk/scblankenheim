import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { writeLog } from "@/lib/admin/data";
import type { PaymentStatus } from "@/lib/admin/types";
import {
  checkoutEligibility,
  outstandingAmount,
  type CheckoutEligibility,
} from "@/lib/payment/eligibility";
import { paymentMessages } from "@/lib/payment/messages";

/**
 * Builds Stripe Checkout Sessions for a stored registration (specs/006-stripe-payment,
 * research R1 to R3, R8). The amount always comes from the database, never from
 * the browser. Used by the register route and the pay later route.
 */

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: Exclude<CheckoutEligibility, "ok"> | "stripe_error" };

/** Base URL for Stripe redirects: APP_URL in production, else the request origin. */
export function resolveOrigin(request: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return new URL(request.url).origin;
}

/** Best effort: a still open earlier session must not be payable any more (FR-014). */
async function expirePreviousSession(sessionId: string | null): Promise<void> {
  if (!sessionId) return;
  try {
    await getStripe().checkout.sessions.expire(sessionId);
  } catch {
    // Already completed or expired; nothing to do.
  }
}

export async function createCheckoutForRegistration(
  registrationId: string,
  origin: string,
): Promise<CheckoutResult> {
  const supabase = getServiceClient();

  const { data: registration, error } = await supabase
    .from("registrations")
    .select(
      "id, reference, camp_id, email, amount_due, amount_paid, payment_status, status, deleted, stripe_session_id",
    )
    .eq("id", registrationId)
    .maybeSingle();
  if (error) return { ok: false, reason: "stripe_error" };

  const payable = registration
    ? {
        amountDue: registration.amount_due,
        amountPaid: registration.amount_paid,
        paymentStatus: registration.payment_status as PaymentStatus,
        status: registration.status,
        deleted: registration.deleted,
      }
    : null;
  const eligibility = checkoutEligibility(payable);
  if (eligibility !== "ok" || !registration || !payable) {
    return { ok: false, reason: eligibility === "ok" ? "not_found" : eligibility };
  }

  const { data: camp } = await supabase
    .from("camps")
    .select("name")
    .eq("id", registration.camp_id)
    .maybeSingle();

  try {
    await expirePreviousSession(registration.stripe_session_id);

    const reference = encodeURIComponent(registration.reference);
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        locale: "de",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: outstandingAmount(payable) * 100,
              product_data: {
                name: paymentMessages.productName(camp?.name ?? "Summercamp"),
              },
            },
          },
        ],
        client_reference_id: registration.id,
        customer_email: registration.email ?? undefined,
        metadata: {
          registration_id: registration.id,
          reference: registration.reference,
        },
        payment_intent_data: {
          metadata: {
            registration_id: registration.id,
            reference: registration.reference,
          },
        },
        success_url: `${origin}/bezahlen/danke?ref=${reference}`,
        cancel_url: `${origin}/bezahlen?ref=${reference}&abgebrochen=1`,
      },
      {
        idempotencyKey: `checkout:${registration.id}:${registration.stripe_session_id ?? "first"}`,
      },
    );

    if (!session.url) throw new Error("Stripe returned a session without url");

    await supabase
      .from("registrations")
      .update({ stripe_session_id: session.id, updated_at: new Date().toISOString() })
      .eq("id", registration.id);

    return { ok: true, url: session.url };
  } catch (err) {
    await writeLog({
      level: "warning",
      action: "payment.checkout_failed",
      message: `${registration.reference} · ${err instanceof Error ? err.message : "unknown error"}`,
    });
    return { ok: false, reason: "stripe_error" };
  }
}
