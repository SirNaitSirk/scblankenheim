import { describe, expect, it } from "vitest";
import {
  derivePaymentState,
  nextRowStatus,
  type StripePaymentRow,
} from "@/lib/payment/status";

const row = (
  status: StripePaymentRow["status"],
  amountCents: number,
  refundedCents = 0,
): StripePaymentRow => ({ status, amountCents, refundedCents });

describe("derivePaymentState", () => {
  it("is unpaid without payments", () => {
    expect(derivePaymentState(250, [])).toEqual({ paymentStatus: "unpaid", amountPaid: 0 });
  });

  it("is paid when the full amount succeeded", () => {
    expect(derivePaymentState(250, [row("succeeded", 25000)])).toEqual({
      paymentStatus: "paid",
      amountPaid: 250,
    });
  });

  it("is processing while a SEPA payment is pending", () => {
    expect(derivePaymentState(250, [row("processing", 25000)])).toEqual({
      paymentStatus: "processing",
      amountPaid: 0,
    });
  });

  it("falls back to unpaid when SEPA failed", () => {
    expect(derivePaymentState(250, [row("failed", 25000)])).toEqual({
      paymentStatus: "unpaid",
      amountPaid: 0,
    });
  });

  it("is partial after a partial refund, rounding down to whole euros", () => {
    expect(derivePaymentState(250, [row("succeeded", 25000, 12550)])).toEqual({
      paymentStatus: "partial",
      amountPaid: 124,
    });
  });

  it("is refunded after a full refund", () => {
    expect(derivePaymentState(250, [row("succeeded", 25000, 25000)])).toEqual({
      paymentStatus: "refunded",
      amountPaid: 0,
    });
  });

  it("stays paid and records the overpayment when paid twice", () => {
    expect(
      derivePaymentState(250, [row("succeeded", 25000), row("succeeded", 25000)]),
    ).toEqual({ paymentStatus: "paid", amountPaid: 500 });
  });

  it("prefers a settled payment over another one still processing", () => {
    expect(
      derivePaymentState(250, [row("processing", 25000), row("succeeded", 25000)]),
    ).toEqual({ paymentStatus: "paid", amountPaid: 250 });
  });

  it("does not treat money as paid when nothing is due", () => {
    expect(derivePaymentState(0, [])).toEqual({ paymentStatus: "unpaid", amountPaid: 0 });
  });
});

describe("nextRowStatus", () => {
  it("takes the incoming status for a new row", () => {
    expect(nextRowStatus(null, "processing")).toBe("processing");
  });

  it("moves forward from processing", () => {
    expect(nextRowStatus("processing", "succeeded")).toBe("succeeded");
    expect(nextRowStatus("processing", "failed")).toBe("failed");
  });

  it("ignores a late processing after a settled payment", () => {
    expect(nextRowStatus("succeeded", "processing")).toBe("succeeded");
    expect(nextRowStatus("failed", "processing")).toBe("failed");
  });
});
