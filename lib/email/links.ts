import { googleCalendarUrl, type CalendarLinks, type CampEvent } from "@/lib/calendar/ics";

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

/** Path of the camp calendar file (specs/019-calendar-file). */
export function calendarPath(campId: string): string {
  return `/kalender/${encodeURIComponent(campId)}`;
}

/** Calendar file and Google links for an event, or null without `APP_URL`. */
export function calendarLinks(event: CampEvent | null): CalendarLinks | null {
  const base = appBaseUrl();
  if (!base || !event) return null;
  return { icsUrl: `${base}${calendarPath(event.campId)}`, googleUrl: googleCalendarUrl(event) };
}

/** Absolute link to the packing list (specs/012-info-mails), or null without `APP_URL`. */
export function packingUrl(): string | null {
  const base = appBaseUrl();
  return base ? `${base}/packzettel` : null;
}
