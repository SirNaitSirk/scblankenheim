import type { Tables } from "@/lib/database.types";
import { releaseMessages } from "./messages";
import type { ReleaseSettings } from "./types";

/**
 * Pure helpers for the per camp release settings (specs/020-school-release,
 * research R4, R5). A camp without a `camp_mail_info` row behaves like
 * `EMPTY_RELEASE_SETTINGS`: switched off and nothing filled.
 */

export const EMPTY_RELEASE_SETTINGS: ReleaseSettings = {
  enabled: false,
  dates: [],
  signerName: null,
  signerRole: null,
  signaturePath: null,
  addressKeys: [],
};

type ReleaseRow = Pick<
  Tables<"camp_mail_info">,
  | "release_enabled"
  | "release_dates"
  | "release_signer_name"
  | "release_signer_role"
  | "release_signature_path"
  | "release_address_keys"
>;

export function toReleaseSettings(row: ReleaseRow | null | undefined): ReleaseSettings {
  if (!row) return EMPTY_RELEASE_SETTINGS;
  return {
    enabled: row.release_enabled === true,
    dates: [...(row.release_dates ?? [])].map((date) => date.slice(0, 10)).sort(),
    signerName: row.release_signer_name?.trim() || null,
    signerRole: row.release_signer_role?.trim() || null,
    signaturePath: row.release_signature_path || null,
    addressKeys: [...(row.release_address_keys ?? [])],
  };
}

export type MissingItem = keyof typeof releaseMessages.missing;

/** What still blocks switching the release on; empty when complete. */
export function missingForEnable(settings: ReleaseSettings): MissingItem[] {
  const missing: MissingItem[] = [];
  if (!settings.signaturePath) missing.push("signature");
  if (settings.dates.length === 0) missing.push("dates");
  if (!settings.signerName) missing.push("signerName");
  return missing;
}

/** Switched on and complete. */
export function isReleaseActive(settings: ReleaseSettings): boolean {
  return settings.enabled && missingForEnable(settings).length === 0;
}

/** Payment fields that decide whether the person may create the letter (spec FR-006a). */
export type ReleasePayment = {
  paymentStatus: string;
  amountDue: number;
  amountPaid: number;
};

/**
 * The participant gets the letter once the registration is fully or partly
 * paid or owes nothing; refunded registrations never. Admins are not gated.
 */
export function isReleaseUnlocked(payment: ReleasePayment): boolean {
  if (payment.paymentStatus === "refunded") return false;
  if (payment.paymentStatus === "paid" || payment.paymentStatus === "partial") return true;
  return payment.amountPaid > 0 || payment.amountDue <= 0;
}

/** Every date lies within the camp period; false when the camp has no period. */
export function datesWithinCamp(
  dates: readonly string[],
  start: string | null,
  end: string | null,
): boolean {
  if (!start || !end) return false;
  const first = start.slice(0, 10);
  const last = end.slice(0, 10);
  return dates.every((date) => date >= first && date <= last);
}

function answerText(value: unknown): string {
  if (typeof value === "string") return value.trim().replace(/\s+/g, " ");
  if (typeof value === "number") return String(value);
  return "";
}

/**
 * Address prefill from the registration's form answers: the first configured
 * field on line one, the rest joined with spaces on line two. Empty answers
 * are skipped.
 */
export function prefillAddress(formData: unknown, addressKeys: readonly string[]): string {
  const answers =
    formData && typeof formData === "object" && !Array.isArray(formData)
      ? (formData as Record<string, unknown>)
      : {};
  const [firstKey, ...restKeys] = addressKeys;
  if (!firstKey) return "";
  const first = answerText(answers[firstKey]);
  const rest = restKeys.map((key) => answerText(answers[key])).filter((value) => value !== "").join(" ");
  return [first, rest].filter((line) => line !== "").join("\n");
}

const longDate = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** `2027-06-04` as „Freitag, 4. Juni 2027“. */
export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return longDate.format(new Date(Date.UTC(year!, month! - 1, day!)));
}

/**
 * Release dates in German long format, joined with „und“. Commas would be
 * ambiguous here, because every long date already contains one.
 */
export function formatReleaseDates(dates: readonly string[]): string {
  return [...dates].sort().map(formatLongDate).join(releaseMessages.dateJoin);
}

// Core answers live in their own columns, not in form_data, so they cannot prefill the address.
const CORE_KEYS = new Set(["first_name", "last_name", "email", "gender"]);
const ADDRESS_FIELD_TYPES = new Set(["text", "textarea", "number", "select"]);

export type AddressFieldOption = { key: string; label: string };

/** Form fields that may prefill the address, in form order. */
export function addressFieldOptions(
  fields: ReadonlyArray<{ key: string; label: string; fieldType: string; sortOrder: number }>,
): AddressFieldOption[] {
  return [...fields]
    .filter((field) => ADDRESS_FIELD_TYPES.has(field.fieldType) && !CORE_KEYS.has(field.key))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((field) => ({ key: field.key, label: field.label }));
}

/** Detects PNG or JPEG by magic bytes; null for anything else. */
export function signatureTypeOf(bytes: Uint8Array): "png" | "jpg" | null {
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  return null;
}
