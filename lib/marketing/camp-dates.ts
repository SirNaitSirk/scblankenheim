/**
 * German date range of a camp for the share image and the facts tile (specs/024-landing-structure,
 * data-model.md). Works on `YYYY-MM-DD` strings only, so no time zone can shift
 * a day. Pure.
 */

const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
] as const;

type DateParts = { year: number; month: number; day: number };

function parse(isoDate: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function dayMonth({ day, month }: DateParts): string {
  return `${day}. ${MONTHS[month - 1]}`;
}

function full(parts: DateParts): string {
  return `${dayMonth(parts)} ${parts.year}`;
}

/** Year of the camp start for season labels; null without a valid start. */
export function campYear(start: string | null): number | null {
  return (start ? parse(start) : null)?.year ?? null;
}

/**
 * „24. bis 28. Mai 2027“, „30. Mai bis 2. Juni 2027“,
 * „28. Dezember 2026 bis 3. Januar 2027“; a single date when both are equal or
 * the end is missing; null without a valid start.
 */
export function formatCampDateRange(start: string | null, end: string | null): string | null {
  const from = start ? parse(start) : null;
  if (!from) return null;
  const to = end ? parse(end) : null;
  if (!to) return full(from);

  if (from.year !== to.year) return `${full(from)} bis ${full(to)}`;
  if (from.month !== to.month) return `${dayMonth(from)} bis ${full(to)}`;
  if (from.day === to.day) return full(from);
  return `${from.day}. bis ${full(to)}`;
}
