import { ACCESS_TOKEN_PATTERN } from "./limits";

/**
 * Pure access token helpers for the participant page (specs/017-participant-page,
 * research R2). Generation lives in `token-server.ts`.
 */

export function isAccessToken(value: unknown): value is string {
  return typeof value === "string" && ACCESS_TOKEN_PATTERN.test(value);
}

/** Trimmed, lowercased token from a route or search param, or null when it cannot be one. */
export function normalizeAccessToken(value: string | string[] | undefined): string | null {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase();
  return isAccessToken(raw) ? raw : null;
}
