import type { RegistrationStatus } from "./types";

/**
 * Maps a stored status to the domain value (specs/014-simplify-registration-status).
 * Only `cancelled` changes behaviour, so anything else reads as `active`.
 */
export function toRegistrationStatus(value: string): RegistrationStatus {
  return value === "cancelled" ? "cancelled" : "active";
}
