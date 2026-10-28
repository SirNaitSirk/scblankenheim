import { z } from "zod";
import { de } from "@/lib/admin/messages";
import type { Tables } from "@/lib/database.types";
import { MAIL_TEXT_LIMITS, SENDER_NAME_MAX, TIMING_BOUNDS } from "@/lib/email/limits";
import {
  MAIL_TIMING_KEYS,
  resolveTiming,
  type CampMailSettings,
  type MailTimingKey,
  type StoredMailTiming,
} from "@/lib/email/settings";

/**
 * Per camp content and switches for the four info mails
 * (specs/012-info-mails, data-model.md). Pure: shared by the admin form, the
 * save action, the cron run and the preview. A camp without a row behaves like
 * `EMPTY_MAIL_INFO`: nothing filled, every info mail switched off, payment
 * reminders on and every mail setting at its default (specs/016-mail-settings).
 */

/** Content and switches of the four info mails (specs/012-info-mails). */
export type InfoMailFields = {
  highlights: string | null;
  teamGreeting: string | null;
  arrivalAddress: string | null;
  arrivalTime: string | null;
  pickupTime: string | null;
  firstDay: string | null;
  emergencyPhone: string | null;
  phoneRules: string | null;
  photosUrl: string | null;
  feedbackUrl: string | null;
  nextCampNote: string | null;
  teaserEnabled: boolean;
  packingEnabled: boolean;
  arrivalEnabled: boolean;
  thanksEnabled: boolean;
};

/** Mail settings per camp (specs/016-mail-settings); null means the default. */
export type MailSettingsFields = StoredMailTiming & {
  remindersEnabled: boolean;
  senderName: string | null;
  replyTo: string | null;
  textGreeting: string | null;
  textClosing: string | null;
  contactName: string | null;
  contactPhone: string | null;
};

export type CampMailInfo = InfoMailFields & MailSettingsFields;

export type CampMailTextKey = Exclude<
  keyof InfoMailFields,
  "teaserEnabled" | "packingEnabled" | "arrivalEnabled" | "thanksEnabled"
>;

/** Fields the camp mail settings form saves (specs/012-info-mails, specs/016-mail-settings). */
export type CampMailFormFields = InfoMailFields &
  StoredMailTiming &
  Pick<
    MailSettingsFields,
    | "remindersEnabled"
    | "senderName"
    | "replyTo"
    | "textGreeting"
    | "textClosing"
    | "contactName"
    | "contactPhone"
  >;

/** Short text blocks for confirmation, payment link and reminders (specs/016-mail-settings, US5). */
export type MailTextKey = keyof typeof MAIL_TEXT_LIMITS;
export const MAIL_TEXT_KEYS = Object.keys(MAIL_TEXT_LIMITS) as MailTextKey[];

/** Raw form values: every text and timing value as a string, empty means not set or default. */
export type CampMailInfoFormValues = Record<CampMailTextKey, string> &
  Record<MailTimingKey, string> &
  Record<MailTextKey, string> & {
  senderName: string;
  replyTo: string;
  remindersEnabled: boolean;
  teaserEnabled: boolean;
  packingEnabled: boolean;
  arrivalEnabled: boolean;
  thanksEnabled: boolean;
};

export const EMPTY_MAIL_INFO: CampMailInfo = {
  highlights: null,
  teamGreeting: null,
  arrivalAddress: null,
  arrivalTime: null,
  pickupTime: null,
  firstDay: null,
  emergencyPhone: null,
  phoneRules: null,
  photosUrl: null,
  feedbackUrl: null,
  nextCampNote: null,
  teaserEnabled: false,
  packingEnabled: false,
  arrivalEnabled: false,
  thanksEnabled: false,
  remindersEnabled: true,
  teaserDaysBefore: null,
  packingDaysBefore: null,
  arrivalDaysBefore: null,
  thanksDaysAfter: null,
  reminderFirstAfterDays: null,
  reminderBeforeDueDays: null,
  reminderMinGapDays: null,
  senderName: null,
  replyTo: null,
  textGreeting: null,
  textClosing: null,
  contactName: null,
  contactPhone: null,
};

const TEXT_LIMIT = 500;
const LONG_TEXT_LIMIT = 2000;

export const TEXT_LIMITS: Record<CampMailTextKey, number> = {
  highlights: TEXT_LIMIT,
  teamGreeting: TEXT_LIMIT,
  arrivalAddress: TEXT_LIMIT,
  arrivalTime: TEXT_LIMIT,
  pickupTime: TEXT_LIMIT,
  firstDay: LONG_TEXT_LIMIT,
  emergencyPhone: TEXT_LIMIT,
  phoneRules: LONG_TEXT_LIMIT,
  photosUrl: TEXT_LIMIT,
  feedbackUrl: TEXT_LIMIT,
  nextCampNote: TEXT_LIMIT,
};

/** Fields the arrival mail cannot go out without (FR-015). */
export const ARRIVAL_REQUIRED: readonly CampMailTextKey[] = [
  "arrivalAddress",
  "arrivalTime",
  "emergencyPhone",
];

const URL_KEYS: readonly CampMailTextKey[] = ["photosUrl", "feedbackUrl"];

export function arrivalMissingFields(info: CampMailInfo): CampMailTextKey[] {
  return ARRIVAL_REQUIRED.filter((key) => !info[key]);
}

export function mapMailInfoRow(row: Tables<"camp_mail_info"> | null): CampMailInfo {
  if (!row) return EMPTY_MAIL_INFO;
  return {
    highlights: row.highlights,
    teamGreeting: row.team_greeting,
    arrivalAddress: row.arrival_address,
    arrivalTime: row.arrival_time,
    pickupTime: row.pickup_time,
    firstDay: row.first_day,
    emergencyPhone: row.emergency_phone,
    phoneRules: row.phone_rules,
    photosUrl: row.photos_url,
    feedbackUrl: row.feedback_url,
    nextCampNote: row.next_camp_note,
    teaserEnabled: row.teaser_enabled,
    packingEnabled: row.packing_enabled,
    arrivalEnabled: row.arrival_enabled,
    thanksEnabled: row.thanks_enabled,
    remindersEnabled: row.reminders_enabled,
    teaserDaysBefore: row.teaser_days_before,
    packingDaysBefore: row.packing_days_before,
    arrivalDaysBefore: row.arrival_days_before,
    thanksDaysAfter: row.thanks_days_after,
    reminderFirstAfterDays: row.reminder_first_after_days,
    reminderBeforeDueDays: row.reminder_before_due_days,
    reminderMinGapDays: row.reminder_min_gap_days,
    senderName: row.sender_name,
    replyTo: row.reply_to,
    textGreeting: row.text_greeting,
    textClosing: row.text_closing,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
  };
}

export function mailInfoToRow(campId: string, info: CampMailInfo) {
  return {
    camp_id: campId,
    highlights: info.highlights,
    team_greeting: info.teamGreeting,
    arrival_address: info.arrivalAddress,
    arrival_time: info.arrivalTime,
    pickup_time: info.pickupTime,
    first_day: info.firstDay,
    emergency_phone: info.emergencyPhone,
    phone_rules: info.phoneRules,
    photos_url: info.photosUrl,
    feedback_url: info.feedbackUrl,
    next_camp_note: info.nextCampNote,
    teaser_enabled: info.teaserEnabled,
    packing_enabled: info.packingEnabled,
    arrival_enabled: info.arrivalEnabled,
    thanks_enabled: info.thanksEnabled,
    reminders_enabled: info.remindersEnabled,
    teaser_days_before: info.teaserDaysBefore,
    packing_days_before: info.packingDaysBefore,
    arrival_days_before: info.arrivalDaysBefore,
    thanks_days_after: info.thanksDaysAfter,
    reminder_first_after_days: info.reminderFirstAfterDays,
    reminder_before_due_days: info.reminderBeforeDueDays,
    reminder_min_gap_days: info.reminderMinGapDays,
    sender_name: info.senderName,
    reply_to: info.replyTo,
    text_greeting: info.textGreeting,
    text_closing: info.textClosing,
    contact_name: info.contactName,
    contact_phone: info.contactPhone,
    updated_at: new Date().toISOString(),
  };
}

export function mailInfoToFormValues(info: CampMailInfo): CampMailInfoFormValues {
  const values: Record<string, string | boolean> = {
    senderName: info.senderName ?? "",
    replyTo: info.replyTo ?? "",
    textGreeting: info.textGreeting ?? "",
    textClosing: info.textClosing ?? "",
    contactName: info.contactName ?? "",
    contactPhone: info.contactPhone ?? "",
    remindersEnabled: info.remindersEnabled,
    teaserEnabled: info.teaserEnabled,
    packingEnabled: info.packingEnabled,
    arrivalEnabled: info.arrivalEnabled,
    thanksEnabled: info.thanksEnabled,
  };
  for (const key of Object.keys(TEXT_LIMITS)) values[key] = info[key as CampMailTextKey] ?? "";
  for (const key of MAIL_TIMING_KEYS) values[key] = info[key] === null ? "" : String(info[key]);
  return values as CampMailInfoFormValues;
}

/** Settings the senders and rules use, defaults filled in (specs/016-mail-settings). */
export function resolveMailSettings(info: CampMailInfo): CampMailSettings {
  const stored = Object.fromEntries(
    MAIL_TIMING_KEYS.map((key) => [key, info[key]]),
  ) as StoredMailTiming;
  return {
    remindersEnabled: info.remindersEnabled,
    timing: resolveTiming(stored),
    sender: { name: info.senderName, replyTo: info.replyTo },
    texts: {
      greeting: info.textGreeting,
      closing: info.textClosing,
      contactName: info.contactName,
      contactPhone: info.contactPhone,
    },
  };
}

const t = de.campMailInfo.errors;
const textValue = z.string();

/** Letters (with umlauts), digits, spaces and simple punctuation; no header syntax (research R5). */
const SENDER_NAME_RE = /^[\p{L}\p{N} .,&'()!?]+$/u;
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

/** Empty means the default (null); a whole number of days; anything else is invalid (undefined). */
function parseTiming(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^\d{1,3}$/.test(trimmed)) return undefined;
  return Number(trimmed);
}

export const campMailInfoSchema = z
  .object({
    highlights: textValue,
    teamGreeting: textValue,
    arrivalAddress: textValue,
    arrivalTime: textValue,
    pickupTime: textValue,
    firstDay: textValue,
    emergencyPhone: textValue,
    phoneRules: textValue,
    photosUrl: textValue,
    feedbackUrl: textValue,
    nextCampNote: textValue,
    teaserDaysBefore: textValue,
    packingDaysBefore: textValue,
    arrivalDaysBefore: textValue,
    thanksDaysAfter: textValue,
    reminderFirstAfterDays: textValue,
    reminderBeforeDueDays: textValue,
    reminderMinGapDays: textValue,
    senderName: textValue,
    replyTo: textValue,
    textGreeting: textValue,
    textClosing: textValue,
    contactName: textValue,
    contactPhone: textValue,
    remindersEnabled: z.boolean(),
    teaserEnabled: z.boolean(),
    packingEnabled: z.boolean(),
    arrivalEnabled: z.boolean(),
    thanksEnabled: z.boolean(),
  })
  .superRefine((values, ctx) => {
    for (const [key, max] of Object.entries(TEXT_LIMITS)) {
      const value = values[key as CampMailTextKey].trim();
      if (value.length > max) {
        ctx.addIssue({ code: "custom", path: [key], message: t.tooLong(max) });
      }
    }
    for (const key of URL_KEYS) {
      const value = values[key].trim();
      if (value !== "" && !/^https:\/\/\S+$/.test(value)) {
        ctx.addIssue({ code: "custom", path: [key], message: t.invalidUrl });
      }
    }
    const stored = {} as StoredMailTiming;
    let timingValid = true;
    for (const key of MAIL_TIMING_KEYS) {
      const parsed = parseTiming(values[key]);
      const { min, max } = TIMING_BOUNDS[key];
      if (parsed === undefined || (parsed !== null && (parsed < min || parsed > max))) {
        ctx.addIssue({ code: "custom", path: [key], message: t.outOfRange(min, max) });
        timingValid = false;
      }
      stored[key] = parsed ?? null;
    }
    if (timingValid) {
      const timing = resolveTiming(stored);
      if (timing.packingDaysBefore >= timing.teaserDaysBefore) {
        ctx.addIssue({ code: "custom", path: ["packingDaysBefore"], message: t.stageOrder });
      } else if (timing.arrivalDaysBefore >= timing.packingDaysBefore) {
        ctx.addIssue({ code: "custom", path: ["arrivalDaysBefore"], message: t.stageOrder });
      }
    }
    const senderName = values.senderName.trim();
    if (senderName.length > SENDER_NAME_MAX) {
      ctx.addIssue({ code: "custom", path: ["senderName"], message: t.tooLong(SENDER_NAME_MAX) });
    } else if (senderName !== "" && !SENDER_NAME_RE.test(senderName)) {
      ctx.addIssue({ code: "custom", path: ["senderName"], message: t.senderNameChars });
    }
    for (const key of MAIL_TEXT_KEYS) {
      const max = MAIL_TEXT_LIMITS[key];
      if (values[key].trim().length > max) {
        ctx.addIssue({ code: "custom", path: [key], message: t.tooLong(max) });
      }
    }
    const replyTo = values.replyTo.trim();
    if (replyTo !== "" && (replyTo.length > 254 || !EMAIL_RE.test(replyTo))) {
      ctx.addIssue({ code: "custom", path: ["replyTo"], message: t.invalidEmail });
    }
    if (values.arrivalEnabled) {
      for (const key of ARRIVAL_REQUIRED) {
        if (values[key].trim() === "") {
          ctx.addIssue({ code: "custom", path: [key], message: t.arrivalMissing });
        }
      }
    }
  })
  .transform((values): CampMailFormFields => {
    const info = { ...values } as Record<string, string | number | boolean | null>;
    for (const key of Object.keys(TEXT_LIMITS)) {
      const trimmed = values[key as CampMailTextKey].trim();
      info[key] = trimmed === "" ? null : trimmed;
    }
    for (const key of MAIL_TIMING_KEYS) info[key] = parseTiming(values[key]) ?? null;
    info.senderName = values.senderName.trim() || null;
    info.replyTo = values.replyTo.trim() || null;
    for (const key of MAIL_TEXT_KEYS) info[key] = values[key].trim() || null;
    return info as CampMailFormFields;
  });
