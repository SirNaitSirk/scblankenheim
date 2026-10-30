import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { berlinDate } from "@/lib/time/berlin";
import { buildLetter } from "./letter";
import { RELEASE_IP_MAX, RELEASE_IP_WINDOW_MS, SIGNATURE_BUCKET, SIGNATURE_URL_TTL_S } from "./limits";
import { releaseMessages } from "./messages";
import { renderReleasePdf, type SignatureImage } from "./pdf";
import { EMPTY_RELEASE_SETTINGS, isReleaseActive, isReleaseUnlocked, toReleaseSettings } from "./settings";
import type { ReleaseSettings, SchoolReleaseData } from "./types";

/**
 * Service role reads and writes for the school release letter
 * (specs/020-school-release). Callers check the token or the admin permission
 * before calling. The signature image lives in a private bucket and is only
 * read here.
 */

const SETTINGS_COLUMNS =
  "release_enabled, release_dates, release_signer_name, release_signer_role, release_signature_path, release_address_keys, contact_name, contact_phone, reply_to";

type SettingsRow = {
  release_enabled: boolean;
  release_dates: string[];
  release_signer_name: string | null;
  release_signer_role: string | null;
  release_signature_path: string | null;
  release_address_keys: string[];
  contact_name: string | null;
  contact_phone: string | null;
  reply_to: string | null;
};

async function loadSettingsRow(campId: string): Promise<SettingsRow | null> {
  const { data, error } = await getServiceClient()
    .from("camp_mail_info")
    .select(SETTINGS_COLUMNS)
    .eq("camp_id", campId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getReleaseSettings(campId: string): Promise<ReleaseSettings> {
  const row = await loadSettingsRow(campId);
  return row ? toReleaseSettings(row) : EMPTY_RELEASE_SETTINGS;
}

export type ReleaseSettingsPatch = Partial<ReleaseSettings>;

/** Writes only the given release columns; other mail settings stay untouched. */
export async function saveReleaseSettings(campId: string, patch: ReleaseSettingsPatch): Promise<void> {
  const row: Record<string, unknown> = { camp_id: campId, updated_at: new Date().toISOString() };
  if (patch.enabled !== undefined) row.release_enabled = patch.enabled;
  if (patch.dates !== undefined) row.release_dates = patch.dates;
  if (patch.signerName !== undefined) row.release_signer_name = patch.signerName;
  if (patch.signerRole !== undefined) row.release_signer_role = patch.signerRole;
  if (patch.signaturePath !== undefined) row.release_signature_path = patch.signaturePath;
  if (patch.addressKeys !== undefined) row.release_address_keys = patch.addressKeys;
  const { error } = await getServiceClient()
    .from("camp_mail_info")
    .upsert(row as { camp_id: string }, { onConflict: "camp_id" });
  if (error) throw error;
}

export type StoredSchoolRelease = SchoolReleaseData & { updatedBy: string; updatedAt: string };

export async function getSchoolRelease(registrationId: string): Promise<StoredSchoolRelease | null> {
  const { data, error } = await getServiceClient()
    .from("school_releases")
    .select("teacher_name, school_name, school_address, participant_address, class_name, updated_by, updated_at")
    .eq("registration_id", registrationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    teacherName: data.teacher_name,
    schoolName: data.school_name,
    schoolAddress: data.school_address,
    participantAddress: data.participant_address,
    className: data.class_name,
    updatedBy: data.updated_by,
    updatedAt: data.updated_at,
  };
}

function sameData(a: SchoolReleaseData, b: SchoolReleaseData): boolean {
  return (
    a.teacherName === b.teacherName &&
    a.schoolName === b.schoolName &&
    a.schoolAddress === b.schoolAddress &&
    a.participantAddress === b.participantAddress &&
    (a.className ?? null) === (b.className ?? null)
  );
}

/**
 * Inserts or replaces the release data; returns whether anything changed and,
 * when not, when the stored data were last saved.
 */
export async function upsertSchoolRelease(
  registrationId: string,
  campId: string,
  data: SchoolReleaseData,
  updatedBy: string,
): Promise<{ changed: true } | { changed: false; savedAt: Date }> {
  const existing = await getSchoolRelease(registrationId);
  if (existing && sameData(existing, data)) return { changed: false, savedAt: new Date(existing.updatedAt) };
  const { error } = await getServiceClient()
    .from("school_releases")
    .upsert(
      {
        registration_id: registrationId,
        camp_id: campId,
        teacher_name: data.teacherName,
        school_name: data.schoolName,
        school_address: data.schoolAddress,
        participant_address: data.participantAddress,
        class_name: data.className,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "registration_id" },
    );
  if (error) throw error;
  return { changed: true };
}

export async function deleteSchoolRelease(registrationId: string): Promise<void> {
  const { error } = await getServiceClient()
    .from("school_releases")
    .delete()
    .eq("registration_id", registrationId);
  if (error) throw error;
}

/** Signature bytes and type; null when the object is missing or unreadable. */
export async function loadSignature(path: string | null): Promise<SignatureImage | null> {
  if (!path) return null;
  const { data, error } = await getServiceClient().storage.from(SIGNATURE_BUCKET).download(path);
  if (error || !data) return null;
  const bytes = new Uint8Array(await data.arrayBuffer());
  return { bytes, type: path.endsWith(".png") ? "png" : "jpg" };
}

/** Short lived URL for the admin thumbnail; null without an image. */
export async function signatureSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await getServiceClient()
    .storage.from(SIGNATURE_BUCKET)
    .createSignedUrl(path, SIGNATURE_URL_TTL_S);
  return error || !data ? null : data.signedUrl;
}

export async function uploadSignature(path: string, bytes: Uint8Array, contentType: string): Promise<void> {
  const { error } = await getServiceClient()
    .storage.from(SIGNATURE_BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw error;
}

export async function removeSignatureObject(path: string | null): Promise<void> {
  if (!path) return;
  await getServiceClient().storage.from(SIGNATURE_BUCKET).remove([path]);
}

/** Organizer and contact lines from the camp's mail settings (specs/016-mail-settings). */
function senderLines(row: SettingsRow | null): string[] {
  const m = releaseMessages.letter;
  const replyTo = row?.reply_to?.trim() || process.env.EMAIL_REPLY_TO?.trim() || "";
  return [
    m.organizer,
    row?.contact_name?.trim() ?? "",
    row?.contact_phone?.trim() ? m.phone(row.contact_phone.trim()) : "",
    replyTo ? m.email(replyTo) : "",
  ];
}

export type ReleasePdf = { bytes: Uint8Array; fileName: string };

type CampFacts = { name: string; start_date: string | null; end_date: string | null };

async function render(input: {
  row: SettingsRow | null;
  settings: ReleaseSettings;
  data: SchoolReleaseData;
  participantName: string;
  lastName: string;
  camp: CampFacts;
}): Promise<ReleasePdf> {
  const letter = buildLetter({
    settings: input.settings,
    data: input.data,
    participantName: input.participantName,
    campName: input.camp.name,
    campStart: input.camp.start_date,
    campEnd: input.camp.end_date,
    senderLines: senderLines(input.row),
    today: berlinDate(new Date()),
  });
  const bytes = await renderReleasePdf(letter, await loadSignature(input.settings.signaturePath));
  const safeLastName = input.lastName.normalize("NFKD").replace(/[^A-Za-z0-9]/g, "");
  return { bytes, fileName: releaseMessages.fileName(safeLastName) };
}

/**
 * PDF of one registration. With `requireActive` (participant side) the
 * registration must be active, paid in part at least (FR-006a) and the release
 * switched on; admins only need saved data. Null when unavailable.
 */
export async function buildReleasePdf(
  registrationId: string,
  options: { requireActive: boolean },
): Promise<ReleasePdf | null> {
  const supabase = getServiceClient();
  const { data: registration, error } = await supabase
    .from("registrations")
    .select("id, camp_id, first_name, last_name, status, payment_status, amount_due, amount_paid, deleted")
    .eq("id", registrationId)
    .maybeSingle();
  if (error) throw error;
  if (!registration || registration.deleted) return null;
  if (options.requireActive) {
    if (registration.status !== "active") return null;
    const payment = {
      paymentStatus: registration.payment_status,
      amountDue: registration.amount_due,
      amountPaid: registration.amount_paid,
    };
    if (!isReleaseUnlocked(payment)) return null;
  }

  const [{ data: camp }, row, data] = await Promise.all([
    supabase.from("camps").select("name, start_date, end_date").eq("id", registration.camp_id).maybeSingle(),
    loadSettingsRow(registration.camp_id),
    getSchoolRelease(registrationId),
  ]);
  if (!camp || !data) return null;
  const settings = row ? toReleaseSettings(row) : EMPTY_RELEASE_SETTINGS;
  if (options.requireActive && !isReleaseActive(settings)) return null;

  const firstName = registration.first_name?.trim() ?? "";
  const lastName = registration.last_name?.trim() ?? "";
  return render({ row, settings, data, participantName: `${firstName} ${lastName}`.trim(), lastName, camp });
}

/** Preview with sample data and the camp's current settings, switch on or off. */
export async function buildPreviewPdf(campId: string): Promise<ReleasePdf | null> {
  const { data: camp } = await getServiceClient()
    .from("camps")
    .select("name, start_date, end_date")
    .eq("id", campId)
    .maybeSingle();
  if (!camp) return null;
  const row = await loadSettingsRow(campId);
  const settings = row ? toReleaseSettings(row) : EMPTY_RELEASE_SETTINGS;
  const sample = releaseMessages.sample;
  return render({
    row,
    settings,
    data: { ...sample.data },
    participantName: sample.participantName,
    lastName: "Vorschau",
    camp,
  });
}

/** Counts this ip's release submits within the window and records the current one. */
export async function isReleaseThrottled(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const supabase = getServiceClient();
  const since = new Date(Date.now() - RELEASE_IP_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("submission_attempts")
    .select("id", { count: "exact", head: true })
    .eq("kind", "school_release")
    .eq("ip", ip)
    .gte("created_at", since);
  await supabase.from("submission_attempts").insert({ ip, kind: "school_release" });
  return (count ?? 0) >= RELEASE_IP_MAX;
}

export type ReleaseRegistration = {
  id: string;
  camp_id: string;
  first_name: string | null;
  last_name: string | null;
  form_data: unknown;
  status: string;
  payment_status: string;
  amount_due: number;
  amount_paid: number;
  deleted: boolean;
};

/** Registration by reference for the admin dialog; null when missing. */
export async function findRegistrationByReference(reference: string): Promise<ReleaseRegistration | null> {
  const { data, error } = await getServiceClient()
    .from("registrations")
    .select("id, camp_id, first_name, last_name, form_data, status, payment_status, amount_due, amount_paid, deleted")
    .eq("reference", reference)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Display name of the admin who last saved the data; null when unknown. */
export async function adminDisplayName(adminId: string): Promise<string | null> {
  const { data } = await getServiceClient()
    .from("profiles")
    .select("name, email")
    .eq("id", adminId)
    .maybeSingle();
  return data?.name?.trim() || data?.email?.trim() || null;
}

/** Removes the release data of a soft deleted registration (research R8). */
export async function deleteSchoolReleaseByReference(reference: string): Promise<void> {
  const registration = await findRegistrationByReference(reference);
  if (registration) await deleteSchoolRelease(registration.id);
}

/** Release settings per camp id; camps without a row get empty settings. */
export async function getReleaseSettingsMap(campIds: readonly string[]): Promise<Map<string, ReleaseSettings>> {
  const result = new Map<string, ReleaseSettings>(campIds.map((id) => [id, EMPTY_RELEASE_SETTINGS]));
  if (campIds.length === 0) return result;
  const { data, error } = await getServiceClient()
    .from("camp_mail_info")
    .select(`camp_id, ${SETTINGS_COLUMNS}`)
    .in("camp_id", campIds);
  if (error) throw error;
  for (const row of data ?? []) result.set(row.camp_id, toReleaseSettings(row));
  return result;
}
