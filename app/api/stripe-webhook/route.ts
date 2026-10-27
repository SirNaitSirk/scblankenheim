import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { writeLog } from "@/lib/admin/data";
import { handleStripeEvent } from "@/lib/payment/webhook";

export const runtime = "nodejs";

// Public endpoint, authenticated by the Stripe signature instead of Clerk
// (constitution II). The raw body is required for signature verification.

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();

  let event: Stripe.Event;
  try {
    if (!signature || !secret) throw new Error("missing signature or secret");
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    await writeLog({
      level: "warning",
      action: "payment.webhook_rejected",
      message: err instanceof Error ? err.message : "invalid signature",
    });
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    const outcome = await handleStripeEvent(event);
    return NextResponse.json({ received: true, outcome }, { status: 200 });
  } catch (err) {
    await writeLog({
      level: "error",
      action: "payment.webhook_failed",
      message: `${event.type} · ${event.id} · ${err instanceof Error ? err.message : "unknown error"}`,
    });
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
