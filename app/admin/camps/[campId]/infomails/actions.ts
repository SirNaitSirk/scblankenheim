"use server";

import { revalidatePath } from "next/cache";
import { campMailInfoSchema, type CampMailInfoFormValues } from "@/lib/admin/camp-mail-info";
import { getCampMailInfo, upsertCampMailInfo } from "@/lib/admin/camp-mail-info-data";
import { getCampById, writeLog } from "@/lib/admin/data";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import type { ActionResult } from "@/lib/admin/types";

const t = de.campMailInfo.toast;

// Saves the info mail content and switches of one camp (specs/012-info-mails,
// contracts/http-and-actions.md). Writes need the `camps` permission.
export async function saveCampMailInfoAction(
  campId: string,
  values: CampMailInfoFormValues,
): Promise<ActionResult> {
  let actor: string;
  try {
    const admin = await requirePermission("camps");
    actor = admin.name?.trim() || admin.email?.trim() || admin.id;
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: t.unauthorized };
    console.error("[camp mail info] auth check failed", error);
    return { ok: false, error: t.error };
  }

  try {
    const parsed = campMailInfoSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return { ok: false, error: t.invalid, fieldErrors };
    }

    const camp = await getCampById(campId);
    if (!camp) return { ok: false, error: t.notFound };

    // The form edits the info mail fields; keep the mail settings stored on the same row.
    const current = await getCampMailInfo(campId);
    await upsertCampMailInfo(campId, { ...current, ...parsed.data });
    await writeLog({ actor, action: "camp_mail_info.saved", message: camp.name });
    revalidatePath(`/admin/camps/${campId}/infomails`);
    revalidatePath("/admin/mail");
    return { ok: true };
  } catch (error) {
    console.error("[camp mail info] save failed", error);
    return { ok: false, error: t.error };
  }
}
