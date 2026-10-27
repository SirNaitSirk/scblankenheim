import { NextResponse } from "next/server";
import { z } from "zod";
import { registerMessages } from "@/lib/register/messages";
import { submitRegistration } from "@/lib/register/service";

export const runtime = "nodejs";

// Public endpoint (see proxy.ts; only /admin is protected). All authorization,
// validation and abuse protection happen in the service layer.

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
    return NextResponse.json({ reference: result.reference }, { status: 200 });
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
