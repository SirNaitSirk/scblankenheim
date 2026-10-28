/**
 * Calendar date helpers in German time (specs/007-transactional-emails). Dates
 * are plain `YYYY-MM-DD` strings so comparisons never depend on the server's
 * time zone. Pure, no imports.
 */

const berlinFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Calendar date of `date` in Berlin, as `YYYY-MM-DD`. */
export function berlinDate(date: Date): string {
  return berlinFormat.format(date);
}

/** `isoDate` shifted by `days` calendar days. */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  const shifted = new Date(Date.UTC(year!, month! - 1, day! + days));
  return shifted.toISOString().slice(0, 10);
}

/** Negative when `a` is before `b`, 0 when equal, positive when after. */
export function compareDates(a: string, b: string): number {
  const left = a.slice(0, 10);
  const right = b.slice(0, 10);
  return left < right ? -1 : left > right ? 1 : 0;
}

/** `YYYY-MM-DD` as German `DD.MM.YYYY`, independent of the server time zone. */
export function formatGermanDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}.${month}.${year}`;
}

/** Start of the Berlin calendar day of `date` as an ISO instant (handles summer time). */
export function berlinDayStartIso(date: Date): string {
  const day = berlinDate(date);
  for (const offset of ["+01:00", "+02:00"]) {
    const start = new Date(`${day}T00:00:00${offset}`);
    if (berlinDate(start) === day && berlinDate(new Date(start.getTime() - 1)) !== day) {
      return start.toISOString();
    }
  }
  return `${day}T00:00:00.000Z`;
}
