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
