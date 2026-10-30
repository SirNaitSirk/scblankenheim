"use server";

import { revalidatePath } from "next/cache";
import { campMailInfoSchema, type CampMailInfoFormValues } from "@/lib/admin/camp-mail-info";
import { getCampMailInfo, upsertCampMailInfo } from "@/lib/admin/camp-mail-info-data";
import { getCampById, getCampFormFields, writeLog } from "@/lib/admin/data";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import type { ActionResult } from "@/lib/admin/types";
import {
  getReleaseSettings,
  removeSignatureObject,
  saveReleaseSettings,
  uploadSignature,
} from "@/lib/school-release/data";
import { SIGNATURE_MAX_BYTES } from "@/lib/school-release/limits";
import { releaseSettingsInputSchema, type ReleaseSettingsInput } from "@/lib/school-release/schema";
import {
  addressFieldOptions,
  datesWithinCamp,
  missingForEnable,
  signatureTypeOf,
} from "@/lib/school-release/settings";

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

// --- school release settings (specs/020-school-release, contracts/school-release.md) ---

const r = de.schoolRelease.settings.toast;

type CampsAdmin = { label: string } | { error: string };

async function campsAdmin(): Promise<CampsAdmin> {
  try {
    const admin = await requirePermission("camps");
    return { label: admin.name?.trim() || admin.email?.trim() || admin.id };
  } catch (error) {
    if (error instanceof AuthError) return { error: r.unauthorized };
    console.error("[school release] auth check failed", error);
    return { error: r.error };
  }
}

function revalidateRelease(campId: string): void {
  revalidatePath(`/admin/camps/${campId}/infomails`);
  revalidatePath("/admin/mail");
  revalidatePath("/");
}

export async function saveReleaseSettingsAction(
  campId: string,
  input: ReleaseSettingsInput,
): Promise<ActionResult> {
  const admin = await campsAdmin();
  if ("error" in admin) return { ok: false, error: admin.error };

  try {
    const parsed = releaseSettingsInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: r.invalid };
    const values = parsed.data;

    const camp = await getCampById(campId);
    if (!camp) return { ok: false, error: r.notFound };
    if (!datesWithinCamp(values.dates, camp.startDate || null, camp.endDate || null)) {
      return { ok: false, error: r.datesOutside, fieldErrors: { dates: r.datesOutside } };
    }
    const allowed = new Set(addressFieldOptions(await getCampFormFields(campId)).map((field) => field.key));
    if (values.addressKeys.some((key) => !allowed.has(key))) {
      return { ok: false, error: r.unknownField, fieldErrors: { addressKeys: r.unknownField } };
    }

    const current = await getReleaseSettings(campId);
    const next = { ...current, ...values };
    if (next.enabled && missingForEnable(next).length > 0) return { ok: false, error: r.incomplete };

    await saveReleaseSettings(campId, values);
    await writeLog({ actor: admin.label, action: "school_release.settings_saved", message: camp.name });
    revalidateRelease(campId);
    return { ok: true };
  } catch (error) {
    console.error("[school release] save settings failed", error);
    return { ok: false, error: r.error };
  }
}

export async function uploadSignatureAction(campId: string, formData: FormData): Promise<ActionResult> {
  const admin = await campsAdmin();
  if ("error" in admin) return { ok: false, error: admin.error };

  try {
    const file = formData.get("signature");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: r.fileMissing };
    if (file.size > SIGNATURE_MAX_BYTES) return { ok: false, error: r.fileSize };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = signatureTypeOf(bytes);
    if (!type) return { ok: false, error: r.fileType };

    const camp = await getCampById(campId);
    if (!camp) return { ok: false, error: r.notFound };

    const previous = (await getReleaseSettings(campId)).signaturePath;
    const path = `${campId}/signature-${Date.now()}.${type}`;
    await uploadSignature(path, bytes, type === "png" ? "image/png" : "image/jpeg");
    await saveReleaseSettings(campId, { signaturePath: path });
    if (previous && previous !== path) await removeSignatureObject(previous);

    await writeLog({ actor: admin.label, action: "school_release.signature_uploaded", message: camp.name });
    revalidateRelease(campId);
    return { ok: true };
  } catch (error) {
    console.error("[school release] signature upload failed", error);
    return { ok: false, error: r.error };
  }
}

export async function removeSignatureAction(campId: string): Promise<ActionResult> {
  const admin = await campsAdmin();
  if ("error" in admin) return { ok: false, error: admin.error };

  try {
    const camp = await getCampById(campId);
    if (!camp) return { ok: false, error: r.notFound };
    const previous = (await getReleaseSettings(campId)).signaturePath;
    await saveReleaseSettings(campId, { signaturePath: null, enabled: false });
    await removeSignatureObject(previous);

    await writeLog({ actor: admin.label, action: "school_release.signature_removed", message: camp.name });
    revalidateRelease(campId);
    return { ok: true };
  } catch (error) {
    console.error("[school release] signature removal failed", error);
    return { ok: false, error: r.error };
  }
}
