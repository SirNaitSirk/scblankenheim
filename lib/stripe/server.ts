import "server-only";

import Stripe from "stripe";

/**
 * Stripe client, server only. The secret key never reaches the browser
 * (constitution II). The SDK pins its own API version, so none is set here.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing Stripe env: STRIPE_SECRET_KEY is required.");
  }

  client = new Stripe(secretKey);
  return client;
}
