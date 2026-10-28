import { calendarMessages } from "./messages";

/**
 * Pure iCalendar builder for the camp event (specs/019-calendar-file,
 * contracts/calendar.md). One all day event per camp; only public camp facts,
 * never personal data or prices.
 */

export type CampEvent = {
  campId: string;
  name: string;
  start: string; // ISO date, inclusive
  end: string; // ISO date, inclusive
  location: string | null;
  websiteUrl: string;
};

export type CalendarLinks = { icsUrl: string; googleUrl: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LINE_OCTETS = 75;

/** Event for a camp with valid dates, or null when a date is missing or inverted. */
export function toCampEvent(
  camp: { id: string; name: string; start_date: string | null; end_date: string | null; location: string | null },
  websiteUrl: string,
): CampEvent | null {
  const start = camp.start_date?.slice(0, 10) ?? "";
  const end = camp.end_date?.slice(0, 10) ?? "";
  if (!ISO_DATE.test(start) || !ISO_DATE.test(end) || end < start) return null;
  return {
    campId: camp.id,
    name: camp.name,
    start,
    end,
    location: camp.location?.trim() || null,
    websiteUrl,
  };
}

/** ISO date plus `days`, computed in UTC so no time zone shifts the day. */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function compactDate(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

function utcStamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapes TEXT values (RFC 5545 section 3.3.11). */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Folds a content line at 75 octets; continuation lines start with one space. */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let octets = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (octets + size > limit) {
      parts.push(current);
      current = "";
      octets = 0;
    }
    current += char;
    octets += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildCampIcs(event: CampEvent, now: Date, host: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FCG Blankenheim//CampConnect//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:camp-${event.campId}@${host}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART;VALUE=DATE:${compactDate(event.start)}`,
    `DTEND;VALUE=DATE:${compactDate(addDays(event.end, 1))}`,
    `SUMMARY:${escapeIcsText(event.name)}`,
    ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
    `DESCRIPTION:${escapeIcsText(calendarMessages.description(event.websiteUrl))}`,
    `URL:${event.websiteUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

/** Prefilled Google Calendar template link with the exclusive end date. */
export function googleCalendarUrl(event: CampEvent): string {
  const params = [
    ["action", "TEMPLATE"],
    ["text", event.name],
    ["dates", `${compactDate(event.start)}/${compactDate(addDays(event.end, 1))}`],
    ["details", calendarMessages.description(event.websiteUrl)],
    ...(event.location ? [["location", event.location]] : []),
  ];
  const query = params.map(([key, value]) => `${key}=${encodeURIComponent(value!)}`).join("&");
  return `https://calendar.google.com/calendar/render?${query}`;
}

/** Download name from the camp name, e.g. "Summercamp 2027" → "summercamp-2027.ics". */
export function calendarFileName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "camp"}.ics`;
}
