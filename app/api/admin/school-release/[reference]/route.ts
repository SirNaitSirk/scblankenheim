import { z } from "zod";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { buildReleasePdf, findRegistrationByReference } from "@/lib/school-release/data";
import { pdfResponse, plainResponse } from "@/lib/school-release/http";

/**
 * Release letter PDF of one registration for admins (specs/020-school-release,
 * US4). Addressed by the registration reference like every other dialog
 * action. Works while the release is off, as long as data are saved.
 */

const referenceSchema = z.string().trim().min(1).max(32);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
): Promise<Response> {
  try {
    await requirePermission("registrations");
  } catch (error) {
    if (error instanceof AuthError) {
      return error.message === "forbidden" ? plainResponse(403, "Forbidden") : plainResponse(401, "Unauthorized");
    }
    throw error;
  }

  const parsed = referenceSchema.safeParse((await params).reference);
  const registration = parsed.success ? await findRegistrationByReference(parsed.data) : null;
  if (!registration) return plainResponse(404, "Not found");
  const pdf = await buildReleasePdf(registration.id, { requireActive: false });
  return pdf ? pdfResponse(pdf, "attachment") : plainResponse(404, "Not found");
}
