import { NextResponse } from "next/server";
import { z } from "zod";
import { submitRegistration } from "@/lib/register/service";

export const runtime = "nodejs";

// Public endpoint (see proxy.ts — only /admin is protected). All authorization,
// validation and abuse protection happen in the service layer.

const payloadSchema = z.object({
  values: z.record(z.string(), z.union([z.string(), z.boolean()])),
  priceTierToken: z.string().trim().min(1).optional(),
});

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
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
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
        { error: "Bitte prüfe deine Angaben.", fieldErrors: result.fieldErrors },
        { status: 400 },
      );
    case "full":
      return NextResponse.json(
        {
          error: "Für die gewählte Option sind keine Plätze mehr frei.",
          fieldErrors: result.fieldErrors,
        },
        { status: 409 },
      );
    case "closed":
      return NextResponse.json(
        { error: "Die Anmeldung ist derzeit geschlossen." },
        { status: 409 },
      );
    case "throttled":
      return NextResponse.json(
        {
          error:
            "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.",
        },
        { status: 429 },
      );
    default:
      return NextResponse.json(
        { error: "Etwas ist schiefgelaufen. Bitte versuche es erneut." },
        { status: 500 },
      );
  }
}
