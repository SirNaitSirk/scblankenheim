/** Centralized limits for the public registration bot protection (specs/029-registration-bot-protection). */

// A person needs far longer for the multi step form; anything faster is a script.
export const FORM_MIN_FILL_MS = 3000;
// A form token older than this asks the person to reload instead of failing silently.
export const FORM_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Public attempts with valid fields per camp within the sliding window. Well above a
// real opening rush, low enough that admins can clean up an attack by hand.
export const REGISTRATION_HOURLY_CEILING = 60;
export const REGISTRATION_CEILING_WINDOW_MS = 60 * 60 * 1000; // 1 hour
