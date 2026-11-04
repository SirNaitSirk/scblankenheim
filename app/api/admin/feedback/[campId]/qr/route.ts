import { NextResponse } from "next/server";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { qrPng } from "@/lib/bus/qr";
import { campSlug } from "@/lib/feedback/admin-data";
import { feedbackUrl } from "@/lib/feedback/code-server";
import { ensureFeedbackSettings } from "@/lib/feedback/data";
import { FEEDBACK_QR_PNG_SIZE } from "@/lib/feedback/limits";
import { uuidSchema } from "@/lib/feedback/schema";
import { getServiceClient } from "@/lib/supabase/server";

/** QR code of a camp's feedback page as PNG download (specs/038-camp-feedback, research R8). */

export async function GET(_request: Request, context: { params: Promise<{ campId: string }> }) {
  let admin;
  try {
    admin = await requirePermission("feedback");
  } catch (error) {
    if (error instanceof AuthError) return new NextResponse("Forbidden", { status: 403 });
    throw error;
  }

  const { campId } = await context.params;
  if (!uuidSchema.safeParse(campId).success) return new NextResponse("Not found", { status: 404 });
  const { data: camp, error } = await getServiceClient().from("camps").select("id, name").eq("id", campId).maybeSingle();
  if (error) throw error;
  if (!camp) return new NextResponse("Not found", { status: 404 });

  const settings = await ensureFeedbackSettings(campId, admin.id);
  const url = feedbackUrl(settings.linkCode);
  if (!url) return new NextResponse("APP_URL missing", { status: 500 });

  const png = await qrPng(url, FEEDBACK_QR_PNG_SIZE);
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="feedback-qr-${campSlug(camp.name)}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
