import { scanUrl } from "@/lib/bus/code";
import { busTicketCode } from "@/lib/bus/participant";
import { qrPng } from "@/lib/bus/qr";
import { appBaseUrl } from "@/lib/email/links";
import { isParticipantThrottled, recordParticipantMiss } from "@/lib/participant/lookup";
import { findRegistrationForToken } from "@/lib/participant/submit";
import { normalizeAccessToken } from "@/lib/participant/token";
import { requestIp } from "@/lib/payment/lookup";
import { plainResponse } from "@/lib/school-release/http";

/**
 * QR image of the bus ticket for mails (specs/021-bus-ticket, research R5,
 * contracts/bus-ticket.md). The participant token is the only authorization.
 * Every failure answers the same 404; unknown tokens count toward the
 * participant page miss throttle. `?v=` only busts image caches.
 */

const NOT_FOUND = "Nicht gefunden";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  try {
    const ip = await requestIp();
    if (await isParticipantThrottled(ip)) return plainResponse(404, NOT_FOUND);

    const token = normalizeAccessToken((await params).token);
    const registration = token ? await findRegistrationForToken(token) : null;
    if (!registration) {
      await recordParticipantMiss(ip);
      return plainResponse(404, NOT_FOUND);
    }

    const base = appBaseUrl();
    // `findRegistrationForToken` already drops deleted registrations.
    const ticket = base ? await busTicketCode({ ...registration, deleted: false }) : null;
    if (!base || !ticket || ticket.blocked) return plainResponse(404, NOT_FOUND);

    const png = await qrPng(scanUrl(base, ticket.code));
    return new Response(new Blob([new Uint8Array(png)], { type: "image/png" }), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("[participant] bus ticket image failed", error);
    return plainResponse(404, NOT_FOUND);
  }
}
