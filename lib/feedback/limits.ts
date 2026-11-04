/** Centralized limits of the camp feedback (specs/038-camp-feedback). */

export const FEEDBACK_KEY_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
export const FEEDBACK_KEY_MAX = 40;
export const FEEDBACK_LABEL_MAX = 200;
export const FEEDBACK_OPTIONS_MIN = 2;
export const FEEDBACK_OPTIONS_MAX = 20;
export const FEEDBACK_OPTION_MAX = 100;
export const FEEDBACK_TEXT_MAX = 2000;
export const FEEDBACK_QUESTIONS_MAX = 20;

// Many people answer over one camp wifi, so the per ip limit is generous (research R4).
export const FEEDBACK_IP_MAX = 20;
export const FEEDBACK_IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const FEEDBACK_CAMP_DAILY_MAX = 1000;
export const FEEDBACK_CAMP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export const FEEDBACK_LINK_CODE_BYTES = 16;
export const FEEDBACK_LINK_CODE_PATTERN = /^[A-Za-z0-9_-]{22}$/;
export const FEEDBACK_COOKIE_MAX_AGE_S = 365 * 24 * 60 * 60;
export const FEEDBACK_PATH = "/feedback";
export const FEEDBACK_QR_PNG_SIZE = 1024;

/** Cookie that marks an answer given in this browser; content is only "1". */
export function feedbackCookieName(campId: string): string {
  return `feedback_${campId.replace(/[^A-Za-z0-9]/g, "")}`;
}

export function feedbackPath(code: string): string {
  return `${FEEDBACK_PATH}/${code}`;
}
