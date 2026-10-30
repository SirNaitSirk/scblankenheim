/** Centralized limits for the school release letter (specs/020-school-release). */

export const TEACHER_NAME_MAX = 120;
export const SCHOOL_NAME_MAX = 160;
export const ADDRESS_MAX = 300;
export const ADDRESS_LINES_MAX = 4;
export const CLASS_NAME_MAX = 40;
export const SIGNER_MAX = 120;
export const RELEASE_DATES_MAX = 5;
export const ADDRESS_KEYS_MAX = 4;

export const SIGNATURE_MAX_BYTES = 512 * 1024;
export const SIGNATURE_URL_TTL_S = 60; // signed preview URL of the private signature image

export const RELEASE_IP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const RELEASE_IP_MAX = 10; // participant submits per ip within the window
export const RELEASE_DUPLICATE_MS = 60 * 1000; // unchanged data again within this window sends no second mail

export const LINK_IP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const LINK_IP_MAX = 5; // landing link requests per ip within the window
export const LINK_COOLDOWN_MS = 10 * 60 * 1000; // per registration
export const LINK_DAY_MAX = 3; // link mails per registration and Berlin day

/** Anchor of the release card on the participant page. */
export const RELEASE_ANCHOR = "schulbefreiung";

/** Storage bucket of the signature images; private, never served publicly. */
export const SIGNATURE_BUCKET = "signatures";
