import type Stripe from "stripe";
import type { StripePaymentStatus } from "@/lib/payment/status";

/**
 * Pure mapping from a verified Stripe event to the change of one payment row
 * (specs/006-stripe-payment, research R4 and R7). No database or network access,
 * so every event type is unit testable with plain fixture objects.
 */

export type PaymentUpdate =
  | {
      kind: "session";
      paymentIntentId: string;
      checkoutSessionId: string;
      registrationId: string | null;
      status: StripePaymentStatus;
      amountCents: number;
    }
  | {
      kind: "refund";
      paymentIntentId: string;
      refundedCents: number;
    };

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function sessionUpdate(
  session: Stripe.Checkout.Session,
  status: StripePaymentStatus,
): PaymentUpdate | null {
  const paymentIntentId = idOf(session.payment_intent);
  if (!paymentIntentId) return null;
  return {
    kind: "session",
    paymentIntentId,
    checkoutSessionId: session.id,
    registrationId:
      session.metadata?.registration_id ?? session.client_reference_id ?? null,
    status,
    amountCents: session.amount_total ?? 0,
  };
}

export function mapEventToPaymentUpdate(event: Stripe.Event): PaymentUpdate | null {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // "unpaid" here means a delayed method (SEPA) was submitted but not settled.
      const status = session.payment_status === "paid" ? "succeeded" : "processing";
      return sessionUpdate(session, status);
    }
    case "checkout.session.async_payment_succeeded":
      return sessionUpdate(event.data.object, "succeeded");
    case "checkout.session.async_payment_failed":
      return sessionUpdate(event.data.object, "failed");
    case "charge.refunded": {
      const charge = event.data.object;
      const paymentIntentId = idOf(charge.payment_intent);
      if (!paymentIntentId) return null;
      // amount_refunded is cumulative, so repeats and late events cannot double count.
      return { kind: "refund", paymentIntentId, refundedCents: charge.amount_refunded };
    }
    default:
      return null;
  }
}
