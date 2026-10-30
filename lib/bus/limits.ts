/** Central limits and keys of the bus ticket (specs/021-bus-ticket). */

export const TICKET_CODE_BYTES = 16; // 128 bit, base64url gives 22 characters
export const TICKET_CODE_PATTERN = /^[A-Za-z0-9_-]{22}$/;

export const TRIPS = ["outbound", "return"] as const;
/** Short German values for `?fahrt=` in the scan page URL. */
export const TRIP_PARAM = { outbound: "hin", return: "rueck" } as const;

export const LIST_POLL_MS = 4000;
export const RESULT_DISPLAY_MS = 3000;
export const DECODE_INTERVAL_MS = 200;
export const TRIP_STORAGE_KEY = "bus.trip";

export const TICKET_ANCHOR = "busticket";
export const SCAN_PATH = "/admin/bus";

export const QR_PNG_SIZE = 480;
export const ANSWERS_MAX = 20;
export const ANSWER_MAX = 200;
export const FIELD_KEY_MAX = 64;

/** Stored answer values of a checkbox question. */
export const CHECKBOX_TRUE = "true";
export const CHECKBOX_FALSE = "false";
