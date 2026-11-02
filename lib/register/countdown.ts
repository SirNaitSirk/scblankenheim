/**
 * Pure helpers for the countdown panel (specs/031-landing-review-fixes,
 * research R1, R4). Isomorphic: no clock access, the caller passes "now".
 */

export type CountdownRemaining =
  | { kind: "days"; value: number }
  | { kind: "hours"; value: number }
  | { kind: "underHour" };

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/** Remaining time in whole days, whole hours or under an hour; null once reached. */
export function countdownRemaining(targetMs: number, nowMs: number): CountdownRemaining | null {
  const diff = targetMs - nowMs;
  if (diff <= 0) return null;
  if (diff >= DAY_MS) return { kind: "days", value: Math.floor(diff / DAY_MS) };
  if (diff >= HOUR_MS) return { kind: "hours", value: Math.floor(diff / HOUR_MS) };
  return { kind: "underHour" };
}

const openingDate = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

const openingTime = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

/** „Samstag, 1. Februar 2027“ in Berlin time. */
export function formatOpeningDate(date: Date): string {
  return openingDate.format(date);
}

/** „18:00“ in Berlin time. */
export function formatOpeningTime(date: Date): string {
  return openingTime.format(date);
}
