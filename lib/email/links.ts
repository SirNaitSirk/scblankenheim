/**
 * Public payment link for a registration (research R8). Always built from
 * `APP_URL`, never from a request origin, because cron runs have none.
 */

/** Configured public base URL without trailing slashes, or null. */
export function appBaseUrl(): string | null {
  const configured = process.env.APP_URL?.trim();
  return configured ? configured.replace(/\/+$/, "") : null;
}

/** Path of the pay later page for `reference`. */
export function paymentPath(reference: string): string {
  return `/bezahlen?ref=${encodeURIComponent(reference)}`;
}

/** Absolute pay later link, or null when `APP_URL` is not configured. */
export function paymentUrl(reference: string): string | null {
  const base = appBaseUrl();
  return base ? `${base}${paymentPath(reference)}` : null;
}

/** Path of the participant page for `token` (specs/017-participant-page). */
export function participantPath(token: string): string {
  return `/meine-anmeldung/${encodeURIComponent(token)}`;
}

/** Absolute participant page link, or null when `APP_URL` is not configured. */
export function participantUrl(token: string): string | null {
  const base = appBaseUrl();
  return base ? `${base}${participantPath(token)}` : null;
}

/** Absolute link to the packing list (specs/012-info-mails), or null without `APP_URL`. */
export function packingUrl(): string | null {
  const base = appBaseUrl();
  return base ? `${base}/packzettel` : null;
}
