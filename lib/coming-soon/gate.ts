/**
 * Prelaunch gate (specs/023-coming-soon). While the server env `COMING_SOON` is
 * `true`, every path outside the open list answers visitors without an admin
 * profile with the coming soon page. Pure, so the decision table is unit tested.
 */

/** Internal route of the coming soon page; the proxy rewrites gated requests here. */
export const COMING_SOON_PATH = "/demnaechst";

/** Seconds a refused request is told to wait before trying again. */
export const COMING_SOON_RETRY_AFTER_SECONDS = 86400;

/**
 * Paths that are never gated: the admin surface, Clerk pages, the Stripe webhook,
 * cron jobs, the gate page itself, the legal pages (specs/025-legal-pages) and
 * the share image, so link previews in messengers show it during the gate.
 * Everything else, including future public pages, is gated (research R2).
 */
const OPEN_PATH_PREFIXES = [
  "/admin",
  "/api/admin",
  "/sign-in",
  "/sign-up",
  "/api/stripe-webhook",
  "/api/cron",
  COMING_SOON_PATH,
  "/impressum",
  "/datenschutz",
  "/opengraph-image",
] as const;

export type GateDecision = "pass" | "rewrite" | "refuse";

export type GateInput = {
  enabled: boolean;
  pathname: string;
  method: string;
  isAdmin: boolean;
};

/** Only the exact value `true` (trimmed, any case) turns the gate on; typos keep it off. */
export function isComingSoonEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

/** Whether the path equals an open prefix or lies below it (segment exact). */
export function isOpenPath(pathname: string): boolean {
  return OPEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Whether a request must be checked against the admin profile at all. */
export function isGatedRequest(enabled: boolean, pathname: string): boolean {
  return enabled && !isOpenPath(pathname);
}

/** Gate decision per contracts/gate.md. */
export function decideGate({ enabled, pathname, method, isAdmin }: GateInput): GateDecision {
  if (!isGatedRequest(enabled, pathname) || isAdmin) return "pass";
  const upper = method.toUpperCase();
  return upper === "GET" || upper === "HEAD" ? "rewrite" : "refuse";
}
