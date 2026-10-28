/** Centralized limits for the participant page (specs/017-participant-page). */

// 32 random bytes as lowercase hex; the database default produces the same shape.
export const ACCESS_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
export const ACCESS_TOKEN_BYTES = 32;

export const PARTICIPANT_THROTTLE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
// Misses (unknown tokens) per ip within the window. Hits are not counted, so a
// family can reload its own page as often as it likes.
export const PARTICIPANT_THROTTLE_MAX = 20;
