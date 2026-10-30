import { isParticipantThrottled, recordParticipantMiss } from "@/lib/participant/lookup";
import { findRegistrationForToken } from "@/lib/participant/submit";
import { normalizeAccessToken } from "@/lib/participant/token";
import { requestIp } from "@/lib/payment/lookup";
import { buildReleasePdf } from "@/lib/school-release/data";
import { pdfResponse, plainResponse } from "@/lib/school-release/http";

/**
 * Release letter PDF of one registration (specs/020-school-release, US1,
 * contracts/school-release.md). The token is the only authorization. Every
 * failure answers the same 404; unknown tokens count toward the participant
 * page miss throttle.
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
    if (registration.status !== "active") return plainResponse(404, NOT_FOUND);

    const pdf = await buildReleasePdf(registration.id, { requireActive: true });
    return pdf ? pdfResponse(pdf, "attachment") : plainResponse(404, NOT_FOUND);
  } catch (error) {
    console.error("[participant] release pdf failed", error);
    return plainResponse(404, NOT_FOUND);
  }
}
