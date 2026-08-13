/**
 * German (de-DE) formatting helpers. Centralized so currency, numbers, and dates
 * read identically across the admin surface.
 */

const currency = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const decimal = new Intl.NumberFormat("de-DE");

const percent = new Intl.NumberFormat("de-DE", {
  style: "percent",
  maximumFractionDigits: 1,
});

const dateShort = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateLong = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTime = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Whole-euro amount, e.g. `195 €`. */
export function formatCurrency(value: number): string {
  return currency.format(value);
}

/** Two-decimal euro amount, e.g. `195,00 €`. */
export function formatCurrencyPrecise(value: number): string {
  return currencyPrecise.format(value);
}

export function formatNumber(value: number): string {
  return decimal.format(value);
}

/** `ratio` in 0..1, e.g. `formatPercent(0.42)` -> `42 %`. */
export function formatPercent(ratio: number): string {
  return percent.format(ratio);
}

export function formatDate(iso: string): string {
  return dateShort.format(new Date(iso));
}

export function formatDateLong(iso: string): string {
  return dateLong.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}
