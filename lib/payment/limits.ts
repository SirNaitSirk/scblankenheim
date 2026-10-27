/** Centralized limits for the public payment flow (specs/006-stripe-payment). */

export const PAYMENT_THROTTLE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
// Lookups (pay page, thank you page incl. its refreshes) or checkout posts per ip
// within the window. A thank you visit refreshes up to 10 times, so 40 leaves room
// for a few real attempts while guessing 32 bit references stays impractical.
export const PAYMENT_THROTTLE_MAX = 40;

export const CONFIRM_POLL_INTERVAL_MS = 3000;
export const CONFIRM_POLL_MAX_MS = 30000;

export const REFERENCE_MAX_LENGTH = 32;
