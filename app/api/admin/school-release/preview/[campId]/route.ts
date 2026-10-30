import { z } from "zod";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { buildPreviewPdf } from "@/lib/school-release/data";
import { pdfResponse, plainResponse } from "@/lib/school-release/http";

/**
 * Preview of the release letter with sample data and the camp's current
 * settings (specs/020-school-release, US3). Works while the switch is off;
 * without a signature the PDF shows a placeholder box. Needs `camps`.
 */

const campIdSchema = z.guid();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ campId: string }> },
): Promise<Response> {
  try {
    await requirePermission("camps");
  } catch (error) {
    if (error instanceof AuthError) {
      return error.message === "forbidden" ? plainResponse(403, "Forbidden") : plainResponse(401, "Unauthorized");
    }
    throw error;
  }

  const parsed = campIdSchema.safeParse((await params).campId);
  if (!parsed.success) return plainResponse(404, "Not found");
  const pdf = await buildPreviewPdf(parsed.data);
  return pdf ? pdfResponse(pdf, "inline") : plainResponse(404, "Not found");
}
