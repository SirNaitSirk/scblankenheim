import { after, NextResponse } from "next/server";
import { z } from "zod";
import { writeLog } from "@/lib/admin/data";
import { sendConfirmationEmail } from "@/lib/email/send";
import { registerMessages } from "@/lib/register/messages";
import { submitRegistration } from "@/lib/register/service";
import {
  createCheckoutForRegistration,
  resolveOrigin,
} from "@/lib/payment/checkout";

export const runtime = "nodejs";

// Public endpoint (see proxy.ts; only /admin is protected). All authorization,
// validation and abuse protection happen in the service layer. After a paid
// registration the response carries a Stripe Checkout URL; a Stripe failure
// never fails the registration (tolerant fallback, constitution VI). The
// confirmation mail is sent after the response (specs/007-transactional-emails),
// so the redirect never waits for the mail provider.

const payloadSchema = z.object({
  values: z.record(z.string(), z.union([z.string(), z.boolean()])),
  priceTierToken: z.string().trim().min(1).optional(),
});

const api = registerMessages.api;

/** First hop of `x-forwarded-for`, or null when absent. */
function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0]!.trim() : null;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: api.badRequest }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: api.badRequest }, { status: 400 });
  }

  const result = await submitRegistration({
    values: parsed.data.values,
    priceTierToken: parsed.data.priceTierToken,
    ip: clientIp(request),
  });

  if (result.ok) {
    const free = result.amountDue === 0;
    const checkout =
      free || !result.registrationId
        ? null
        : await createCheckoutForRegistration(result.registrationId, resolveOrigin(request));
    const registrationId = result.registrationId;
    after(() =>
      registrationId
        ? sendConfirmationEmail(registrationId)
        : writeLog({
            level: "warning",
            action: "email.skipped",
            message: `confirmation ${result.reference}: keine Anmeldungs ID`,
          }),
    );
    return NextResponse.json(
      {
        reference: result.reference,
        free,
        checkoutUrl: checkout?.ok ? checkout.url : null,
      },
      { status: 200 },
    );
  }

  switch (result.reason) {
    case "invalid":
      return NextResponse.json(
        { error: api.invalid, fieldErrors: result.fieldErrors },
        { status: 400 },
      );
    case "full":
      return NextResponse.json(
        { error: api.optionFull, fieldErrors: result.fieldErrors },
        { status: 409 },
      );
    case "camp_full":
      return NextResponse.json({ error: api.campFull }, { status: 409 });
    case "closed":
      return NextResponse.json({ error: api.closed }, { status: 409 });
    case "throttled":
      return NextResponse.json({ error: api.throttled }, { status: 429 });
    default:
      return NextResponse.json({ error: api.generic }, { status: 500 });
  }
}
