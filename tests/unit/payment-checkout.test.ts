import { describe, expect, it } from "vitest";
import {
  checkoutEligibility,
  outstandingAmount,
  type PayableRegistration,
} from "@/lib/payment/eligibility";

const base: PayableRegistration = {
  amountDue: 250,
  amountPaid: 0,
  paymentStatus: "unpaid",
  status: "pending",
  deleted: false,
};

describe("checkoutEligibility", () => {
  it("allows an open registration", () => {
    expect(checkoutEligibility(base)).toBe("ok");
  });

  it("treats missing and deleted registrations alike", () => {
    expect(checkoutEligibility(null)).toBe("not_found");
    expect(checkoutEligibility({ ...base, deleted: true })).toBe("not_found");
  });

  it("blocks cancelled registrations", () => {
    expect(checkoutEligibility({ ...base, status: "cancelled" })).toBe("cancelled");
  });

  it("blocks paid, processing and refunded registrations", () => {
    expect(checkoutEligibility({ ...base, paymentStatus: "paid" })).toBe("paid");
    expect(checkoutEligibility({ ...base, paymentStatus: "processing" })).toBe("processing");
    expect(checkoutEligibility({ ...base, paymentStatus: "refunded" })).toBe("refunded");
  });

  it("allows paying the rest of a partial payment", () => {
    const partial = { ...base, paymentStatus: "partial" as const, amountPaid: 100 };
    expect(checkoutEligibility(partial)).toBe("ok");
    expect(outstandingAmount(partial)).toBe(150);
  });

  it("reports nothing due for free or fully covered registrations", () => {
    expect(checkoutEligibility({ ...base, amountDue: 0 })).toBe("nothing_due");
    expect(
      checkoutEligibility({ ...base, paymentStatus: "partial", amountPaid: 300 }),
    ).toBe("nothing_due");
  });
});
