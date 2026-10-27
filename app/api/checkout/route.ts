import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createCheckoutForRegistration,
  resolveOrigin,
} from "@/lib/payment/checkout";
import { checkoutEligibility } from "@/lib/payment/eligibility";
import {
  findRegistrationByReference,
  isPaymentThrottled,
  normalizeReference,
} from "@/lib/payment/lookup";
import { REFERENCE_MAX_LENGTH } from "@/lib/payment/limits";

export const runtime = "nodejs";

// Public "pay later" endpoint (see proxy.ts; only /admin is protected). Takes a
// reference only, never an amount. Always answers with a redirect, so the pay
// button is a plain HTML form and no state leaks in a JSON body.

const payloadSchema = z.object({
  reference: z.string().trim().min(1).max(REFERENCE_MAX_LENGTH),
});

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0]!.trim() : null;
}

async function readReference(request: Request): Promise<string | null> {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const raw = contentType.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
    const parsed = payloadSchema.safeParse(raw);
    return parsed.success ? normalizeReference(parsed.data.reference) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const origin = resolveOrigin(request);
  const reference = await readReference(request);

  const backTo = (query = "") =>
    NextResponse.redirect(
      new URL(
        reference
          ? `/bezahlen?ref=${encodeURIComponent(reference)}${query}`
          : "/bezahlen",
        origin,
      ),
      303,
    );

  if (!reference) return backTo();
  if (await isPaymentThrottled(clientIp(request))) return backTo("&fehler=limit");

  const registration = await findRegistrationByReference(reference);
  if (!registration || checkoutEligibility(registration) !== "ok") return backTo();

  const checkout = await createCheckoutForRegistration(registration.id, origin);
  if (!checkout.ok) {
    return checkout.reason === "stripe_error" ? backTo("&fehler=stripe") : backTo();
  }
  return NextResponse.redirect(checkout.url, 303);
}
