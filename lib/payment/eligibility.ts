import type { PaymentStatus } from "@/lib/admin/types";

/**
 * Pure checkout eligibility (specs/006-stripe-payment, research R9). Kept apart
 * from the server module so it is unit testable and usable by the pages.
 */

export type PayableRegistration = {
  amountDue: number; // whole euros
  amountPaid: number; // whole euros
  paymentStatus: PaymentStatus;
  status: string;
  deleted: boolean;
};

export type CheckoutEligibility =
  | "ok"
  | "not_found"
  | "cancelled"
  | "paid"
  | "processing"
  | "refunded"
  | "nothing_due";

/** Euros still to pay; never negative. */
export function outstandingAmount(registration: PayableRegistration): number {
  return Math.max(0, registration.amountDue - registration.amountPaid);
}

export function checkoutEligibility(
  registration: PayableRegistration | null,
): CheckoutEligibility {
  if (!registration || registration.deleted) return "not_found";
  if (registration.status === "cancelled") return "cancelled";

  switch (registration.paymentStatus) {
    case "paid":
      return "paid";
    case "processing":
      return "processing";
    case "refunded":
      return "refunded";
    default:
      return outstandingAmount(registration) > 0 ? "ok" : "nothing_due";
  }
}
