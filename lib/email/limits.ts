/**
 * Central limits for transactional email and payment reminders
 * (specs/007-transactional-emails, research R4, R5, R7).
 */

/** Max reminders per cron run; keeps the provider's free daily quota (100) free for other mails. */
export const REMINDER_RUN_CAP = 80;

/** Pause between two provider calls inside one run. */
export const SEND_SPACING_MS = 500;

/** First reminder: this many days after registration. */
export const REMINDER_FIRST_AFTER_DAYS = 7;

/** Second reminder window opens this many days before the payment due date. */
export const REMINDER_BEFORE_DUE_DAYS = 7;

/** Minimum days between registration and a reminder, and between two reminders. */
export const REMINDER_MIN_GAP_DAYS = 3;

/** A delivery stuck in `sending` longer than this counts as failed and is retried. */
export const STALE_SENDING_MS = 30 * 60 * 1000;

/** At most one admin payment link mail per registration within this window. */
export const PAYMENT_LINK_COOLDOWN_MS = 60 * 1000;

/** Provider request timeout. */
export const PROVIDER_TIMEOUT_MS = 10_000;

/** Provider quota per Berlin day, shared by every mail kind (specs/012-info-mails, research R5). */
export const DAILY_EMAIL_BUDGET = 100;

/** Part of the daily quota the info run leaves free for confirmations later that day. */
export const CONFIRMATION_RESERVE = 15;

/** Info mail due days relative to camp start and end (specs/012-info-mails, research R3). */
export const INFO_TEASER_BEFORE_DAYS = 56;
export const INFO_PACKING_BEFORE_DAYS = 21;
export const INFO_ARRIVAL_BEFORE_DAYS = 5;
export const INFO_THANKS_AFTER_DAYS = 5;

/** Last day after camp end on which the thank you mail may still go out. */
export const INFO_THANKS_LAST_DAY = 30;

/** Allowed per camp timing values in whole days (specs/016-mail-settings, FR-006). */
export const TIMING_BOUNDS = {
  teaserDaysBefore: { min: 14, max: 120 },
  packingDaysBefore: { min: 7, max: 60 },
  arrivalDaysBefore: { min: 1, max: 21 },
  thanksDaysAfter: { min: 1, max: 29 },
  reminderFirstAfterDays: { min: 3, max: 60 },
  reminderBeforeDueDays: { min: 1, max: 30 },
  reminderMinGapDays: { min: 1, max: 14 },
} as const;

/** At most one test send per admin within this window (specs/016-mail-settings, FR-017). */
export const TEST_SEND_COOLDOWN_MS = 60 * 1000;

/** Sender display name and text block lengths (specs/016-mail-settings, FR-009, FR-011). */
export const SENDER_NAME_MAX = 60;
export const MAIL_TEXT_LIMITS = {
  textGreeting: 300,
  textClosing: 200,
  contactName: 80,
  contactPhone: 40,
} as const;
