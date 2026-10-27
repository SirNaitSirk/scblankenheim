import type { PaymentStatus } from "@/lib/admin/types";

/**
 * Pure payment status logic (specs/006-stripe-payment, research R5). A
 * registration's payment_status and amount_paid are never stored by an event
 * directly; they are recomputed from all of its Stripe payment rows, which keeps
 * double payments, refunds and out of order events correct.
 */

export type StripePaymentStatus = "processing" | "succeeded" | "failed";

export type StripePaymentRow = {
  status: StripePaymentStatus;
  amountCents: number;
  refundedCents: number;
};

export type DerivedPaymentState = {
  paymentStatus: PaymentStatus;
  amountPaid: number; // whole euros
};

const RANK: Record<StripePaymentStatus, number> = {
  processing: 1,
  succeeded: 2,
  failed: 2,
};

export function isStripePaymentStatus(value: string): value is StripePaymentStatus {
  return value === "processing" || value === "succeeded" || value === "failed";
}

/**
 * Status a payment row moves to when an event arrives. A row never moves to a
 * lower rank, so a late "processing" cannot undo a settled payment.
 */
export function nextRowStatus(
  current: StripePaymentStatus | null,
  incoming: StripePaymentStatus,
): StripePaymentStatus {
  if (current === null) return incoming;
  return RANK[incoming] < RANK[current] ? current : incoming;
}

export function derivePaymentState(
  amountDueEuros: number,
  rows: StripePaymentRow[],
): DerivedPaymentState {
  const succeeded = rows.filter((row) => row.status === "succeeded");
  const netCents = succeeded.reduce(
    (sum, row) => sum + Math.max(0, row.amountCents - row.refundedCents),
    0,
  );
  const amountPaid = Math.floor(netCents / 100);

  if (amountDueEuros > 0 && netCents >= amountDueEuros * 100) {
    return { paymentStatus: "paid", amountPaid };
  }
  if (netCents > 0) return { paymentStatus: "partial", amountPaid };
  if (rows.some((row) => row.status === "processing")) {
    return { paymentStatus: "processing", amountPaid: 0 };
  }
  if (succeeded.some((row) => row.refundedCents >= row.amountCents)) {
    return { paymentStatus: "refunded", amountPaid: 0 };
  }
  return { paymentStatus: "unpaid", amountPaid: 0 };
}
