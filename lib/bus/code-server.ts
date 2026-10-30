import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { TICKET_CODE_BYTES } from "./limits";

/** Fresh ticket code, 128 bit random, base64url (research R1). */
export function generateTicketCode(): string {
  return randomBytes(TICKET_CODE_BYTES).toString("base64url");
}

/** Short version tag for the mail image URL, so a new ticket gets a new URL (research R5). */
export function codeVersion(code: string): string {
  return createHash("sha256").update(code).digest("hex").slice(0, 8);
}
