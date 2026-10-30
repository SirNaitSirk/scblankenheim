import { SCAN_PATH, TICKET_CODE_PATTERN } from "./limits";

/**
 * Pure helpers for the ticket code and the QR payload (specs/021-bus-ticket,
 * research R1 and R4). Generation lives in `code-server.ts`.
 */

export function isTicketCode(value: unknown): value is string {
  return typeof value === "string" && TICKET_CODE_PATTERN.test(value);
}

/** QR payload: the scan page with the code, so a phone camera opens it directly. */
export function scanUrl(baseUrl: string, code: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${SCAN_PATH}?t=${code}`;
}

/** Code from a scanned text: the scan URL of any host, or a bare code; null otherwise. */
export function parseTicketCode(text: string): string | null {
  const raw = text.trim();
  if (isTicketCode(raw)) return raw;
  try {
    const url = new URL(raw);
    if (url.pathname.replace(/\/+$/, "") !== SCAN_PATH) return null;
    const code = url.searchParams.get("t");
    return isTicketCode(code) ? code : null;
  } catch {
    return null;
  }
}
