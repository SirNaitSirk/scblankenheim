/** Centralized limits for the participant page (specs/017-participant-page). */

// 32 random bytes as lowercase hex; the database default produces the same shape.
export const ACCESS_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
export const ACCESS_TOKEN_BYTES = 32;

export const PARTICIPANT_THROTTLE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
// Misses (unknown tokens) per ip within the window. Hits are not counted, so a
// family can reload its own page as often as it likes.
export const PARTICIPANT_THROTTLE_MAX = 20;

// Messages and change requests from the participant page (specs/018-participant-messages).
export const MESSAGE_TEXT_MAX = 2000;
export const CHANGE_REASON_MAX = 500;
export const CHANGE_VALUE_MAX = 2000;
export const MESSAGE_IP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const MESSAGE_IP_MAX = 10; // send attempts per ip within the window
export const MESSAGE_DAY_MAX = 5; // stored items per registration and Berlin day
export const MESSAGE_DUPLICATE_MS = 60 * 1000; // same item again is a double click
export const OWN_MESSAGES_SHOWN = 20;
