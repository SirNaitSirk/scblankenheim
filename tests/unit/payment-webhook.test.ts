import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { mapEventToPaymentUpdate } from "@/lib/payment/events";

function sessionEvent(
  type: string,
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Event {
  return {
    id: "evt_1",
    type,
    data: {
      object: {
        id: "cs_test_1",
        object: "checkout.session",
        payment_intent: "pi_1",
        payment_status: "paid",
        amount_total: 25000,
        client_reference_id: "reg_client",
        metadata: { registration_id: "reg_1", reference: "REG-1A2B3C4D" },
        ...overrides,
      },
    },
  } as unknown as Stripe.Event;
}

function refundEvent(amountRefunded: number): Stripe.Event {
  return {
    id: "evt_2",
    type: "charge.refunded",
    data: {
      object: {
        id: "ch_1",
        object: "charge",
        payment_intent: "pi_1",
        amount: 25000,
        amount_refunded: amountRefunded,
      },
    },
  } as unknown as Stripe.Event;
}

describe("mapEventToPaymentUpdate", () => {
  it("maps a paid checkout to a succeeded payment", () => {
    expect(mapEventToPaymentUpdate(sessionEvent("checkout.session.completed"))).toEqual({
      kind: "session",
      paymentIntentId: "pi_1",
      checkoutSessionId: "cs_test_1",
      registrationId: "reg_1",
      status: "succeeded",
      amountCents: 25000,
    });
  });

  it("maps a submitted SEPA checkout to processing", () => {
    const update = mapEventToPaymentUpdate(
      sessionEvent("checkout.session.completed", { payment_status: "unpaid" }),
    );
    expect(update).toMatchObject({ kind: "session", status: "processing" });
  });

  it("maps async success and failure", () => {
    expect(
      mapEventToPaymentUpdate(sessionEvent("checkout.session.async_payment_succeeded")),
    ).toMatchObject({ status: "succeeded" });
    expect(
      mapEventToPaymentUpdate(sessionEvent("checkout.session.async_payment_failed")),
    ).toMatchObject({ status: "failed" });
  });

  it("falls back to client_reference_id without metadata", () => {
    expect(
      mapEventToPaymentUpdate(sessionEvent("checkout.session.completed", { metadata: {} })),
    ).toMatchObject({ registrationId: "reg_client" });
  });

  it("reads an expanded payment intent object", () => {
    const update = mapEventToPaymentUpdate(
      sessionEvent("checkout.session.completed", {
        payment_intent: { id: "pi_obj" } as Stripe.PaymentIntent,
      }),
    );
    expect(update).toMatchObject({ paymentIntentId: "pi_obj" });
  });

  it("ignores a session without payment intent", () => {
    expect(
      mapEventToPaymentUpdate(sessionEvent("checkout.session.completed", { payment_intent: null })),
    ).toBeNull();
  });

  it("maps partial and full refunds with the cumulative amount", () => {
    expect(mapEventToPaymentUpdate(refundEvent(10000))).toEqual({
      kind: "refund",
      paymentIntentId: "pi_1",
      refundedCents: 10000,
    });
    expect(mapEventToPaymentUpdate(refundEvent(25000))).toMatchObject({ refundedCents: 25000 });
  });

  it("ignores unrelated events", () => {
    expect(mapEventToPaymentUpdate(sessionEvent("checkout.session.expired"))).toBeNull();
  });
});
