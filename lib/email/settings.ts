import {
  INFO_ARRIVAL_BEFORE_DAYS,
  INFO_PACKING_BEFORE_DAYS,
  INFO_TEASER_BEFORE_DAYS,
  INFO_THANKS_AFTER_DAYS,
  REMINDER_BEFORE_DUE_DAYS,
  REMINDER_FIRST_AFTER_DAYS,
  REMINDER_MIN_GAP_DAYS,
} from "./limits";

/**
 * Resolved mail settings of one camp (specs/016-mail-settings, data-model.md).
 * Pure, no server imports: shared by the cron runs, the sender, the preview
 * and tests. Stored timing values may be null, which means the default.
 */

export type MailTiming = {
  teaserDaysBefore: number;
  packingDaysBefore: number;
  arrivalDaysBefore: number;
  thanksDaysAfter: number;
  reminderFirstAfterDays: number;
  reminderBeforeDueDays: number;
  reminderMinGapDays: number;
};

export type MailTimingKey = keyof MailTiming;

export type StoredMailTiming = { [K in MailTimingKey]: number | null };

export type MailTexts = {
  greeting: string | null;
  closing: string | null;
  contactName: string | null;
  contactPhone: string | null;
};

export type MailSender = {
  name: string | null;
  replyTo: string | null;
};

export type CampMailSettings = {
  remindersEnabled: boolean;
  timing: MailTiming;
  sender: MailSender;
  texts: MailTexts;
};

export const DEFAULT_TIMING: MailTiming = {
  teaserDaysBefore: INFO_TEASER_BEFORE_DAYS,
  packingDaysBefore: INFO_PACKING_BEFORE_DAYS,
  arrivalDaysBefore: INFO_ARRIVAL_BEFORE_DAYS,
  thanksDaysAfter: INFO_THANKS_AFTER_DAYS,
  reminderFirstAfterDays: REMINDER_FIRST_AFTER_DAYS,
  reminderBeforeDueDays: REMINDER_BEFORE_DUE_DAYS,
  reminderMinGapDays: REMINDER_MIN_GAP_DAYS,
};

export const MAIL_TIMING_KEYS = Object.keys(DEFAULT_TIMING) as MailTimingKey[];

export const DEFAULT_MAIL_SETTINGS: CampMailSettings = {
  remindersEnabled: true,
  timing: DEFAULT_TIMING,
  sender: { name: null, replyTo: null },
  texts: { greeting: null, closing: null, contactName: null, contactPhone: null },
};

/** Replaces every unset timing value with its default. */
export function resolveTiming(stored: StoredMailTiming): MailTiming {
  const timing = { ...DEFAULT_TIMING };
  for (const key of MAIL_TIMING_KEYS) timing[key] = stored[key] ?? DEFAULT_TIMING[key];
  return timing;
}
