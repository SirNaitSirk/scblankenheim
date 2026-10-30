import { z } from "zod";
import { LINK_COOLDOWN_MS, LINK_DAY_MAX } from "./limits";

/**
 * Pure rules of the participant link request (specs/020-school-release, US2,
 * research R6). Server side lookups live in `link-request.ts`.
 */

/** Pages a link request may point to; the release card is the first one. */
export const LINK_TARGETS = ["school_release"] as const;
export type LinkTarget = (typeof LINK_TARGETS)[number];

export const linkRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email()),
  target: z.enum(LINK_TARGETS),
});

/** Lowercased and trimmed, so `Lena@Example.org ` matches `lena@example.org`. */
export function normalizeEmail(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

/** Whether another link mail may go out: cooldown passed and day limit not reached. */
export function mayReceiveLinkMail(
  lastSentAt: Date | null,
  sentToday: number,
  now: Date = new Date(),
): boolean {
  if (sentToday >= LINK_DAY_MAX) return false;
  return !lastSentAt || now.getTime() - lastSentAt.getTime() >= LINK_COOLDOWN_MS;
}
