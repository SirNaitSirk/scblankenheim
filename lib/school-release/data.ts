import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { berlinDate } from "@/lib/time/berlin";
import { buildLetter } from "./letter";
import { RELEASE_IP_MAX, RELEASE_IP_WINDOW_MS, SIGNATURE_BUCKET, SIGNATURE_URL_TTL_S } from "./limits";
import { releaseMessages } from "./messages";
import { renderReleasePdf, type SignatureImage } from "./pdf";
import { EMPTY_RELEASE_SETTINGS, isReleaseActive, isReleaseUnlocked, toReleaseSettings } from "./settings";
import type { ReleaseGender, ReleaseSettings, SchoolReleaseData } from "./types";

/**
 * Service role reads and writes for the school release letter
 * (specs/020-school-release, specs/042-church-release-letter). Callers check the token or the admin permission
 * before calling. The signature image lives in a private bucket and is only
 * read here.
 */

const SETTINGS_COLUMNS = "release_enabled, release_dates, release_signature_path";

type SettingsRow = {
  release_enabled: boolean;
  release_dates: string[];
  release_signature_path: string | null;
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
  if (patch.signaturePath !== undefined) row.release_signature_path = patch.signaturePath;
  const { error } = await getServiceClient()
    .from("camp_mail_info")
    .upsert(row as { camp_id: string }, { onConflict: "camp_id" });
  if (error) throw error;
}

export type StoredSchoolRelease = SchoolReleaseData & { updatedBy: string; updatedAt: string };

export async function getSchoolRelease(registrationId: string): Promise<StoredSchoolRelease | null> {
  const { data, error } = await getServiceClient()
    .from("school_releases")
    .select("school_name, school_location, updated_by, updated_at")
    .eq("registration_id", registrationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    schoolName: data.school_name,
    schoolLocation: data.school_location,
    updatedBy: data.updated_by,
    updatedAt: data.updated_at,
  };
}

function sameData(a: SchoolReleaseData, b: SchoolReleaseData): boolean {
  return a.schoolName === b.schoolName && a.schoolLocation === b.schoolLocation;
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
        school_name: data.schoolName,
        school_location: data.schoolLocation,
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

export type ReleasePdf = { bytes: Uint8Array; fileName: string };

type CampFacts = { start_date: string | null; end_date: string | null; location: string | null };

const CAMP_COLUMNS = "start_date, end_date, location";

function toGender(value: string | null | undefined): ReleaseGender {
  return value === "female" || value === "male" ? value : null;
}

async function render(input: {
  settings: ReleaseSettings;
  data: SchoolReleaseData;
  participantName: string;
  gender: ReleaseGender;
  lastName: string;
  camp: CampFacts;
}): Promise<ReleasePdf> {
  const letter = buildLetter({
    data: input.data,
    participantName: input.participantName,
    gender: input.gender,
    campStart: input.camp.start_date,
    campEnd: input.camp.end_date,
    campLocation: input.camp.location,
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
    .select("id, camp_id, first_name, last_name, gender, status, payment_status, amount_due, amount_paid, deleted")
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
    supabase.from("camps").select(CAMP_COLUMNS).eq("id", registration.camp_id).maybeSingle(),
    loadSettingsRow(registration.camp_id),
    getSchoolRelease(registrationId),
  ]);
  if (!camp || !data) return null;
  const settings = row ? toReleaseSettings(row) : EMPTY_RELEASE_SETTINGS;
  if (options.requireActive && !isReleaseActive(settings)) return null;

  const firstName = registration.first_name?.trim() ?? "";
  const lastName = registration.last_name?.trim() ?? "";
  return render({
    settings,
    data,
    participantName: `${firstName} ${lastName}`.trim(),
    gender: toGender(registration.gender),
    lastName,
    camp,
  });
}

/** Preview with sample data and the camp's current settings, switch on or off. */
export async function buildPreviewPdf(campId: string): Promise<ReleasePdf | null> {
  const { data: camp } = await getServiceClient()
    .from("camps")
    .select(CAMP_COLUMNS)
    .eq("id", campId)
    .maybeSingle();
  if (!camp) return null;
  const row = await loadSettingsRow(campId);
  const settings = row ? toReleaseSettings(row) : EMPTY_RELEASE_SETTINGS;
  const sample = releaseMessages.sample;
  return render({
    settings,
    data: { ...sample.data },
    participantName: sample.participantName,
    gender: toGender(sample.gender),
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
