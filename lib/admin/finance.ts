/**
 * Pure helpers for the finance tab (specs/009-finance-tab). The page maps every
 * registration to a slim `FinanceRow` on the server, so form answers (health,
 * emergency contacts, addresses) never reach the browser of this tab.
 */

import { z } from "zod";
import { PAYMENT_STATUS_LABELS, de } from "./messages";
import type { PaymentStatus, Registration } from "./types";

export type FinanceRow = {
  reference: string;
  firstName: string;
  lastName: string;
  email: string;
  priceTierName: string | null;
  amountDue: number; // whole euros
  amountPaid: number; // whole euros
  payment: PaymentStatus;
  reminderCount: number;
  lastReminderAt: string | null;
  remindersPaused: boolean; // specs/016-mail-settings
};

export type FinanceFilter = "all" | "open" | "partial" | "overdue" | "paused";

export type FinanceSummaryView = {
  expected: number;
  collected: number;
  outstanding: number;
  openCount: number;
  unpaidCount: number;
  partialCount: number;
  overdueCount: number;
};

/** Upper bound for a single payment amount, guards against typos like 25000. */
export const MAX_FINANCE_AMOUNT = 100_000;

export const PAYMENT_STATUSES = [
  "unpaid",
  "processing",
  "partial",
  "paid",
  "refunded",
] as const satisfies readonly PaymentStatus[];

export const financeUpdateSchema = z.object({
  reference: z.string().trim().min(1).max(32),
  amountPaid: z.number().int().min(0).max(MAX_FINANCE_AMOUNT),
  payment: z.enum(PAYMENT_STATUSES),
});

/** Pause or resume automatic payment reminders (specs/016-mail-settings, US1). */
export const reminderPauseSchema = z.object({
  reference: z.string().trim().min(1).max(32),
  paused: z.boolean(),
});

/** Active means counted in sums: not deleted and not cancelled. */
export function isActiveRegistration(r: Pick<Registration, "deleted" | "status">): boolean {
  return !r.deleted && r.status !== "cancelled";
}

/** Maps a registration to the finance view, dropping every form answer. */
export function toFinanceRow(
  r: Registration,
  tierNames: ReadonlyMap<string, string>,
): FinanceRow {
  return {
    reference: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    priceTierName: tierNames.get(r.priceTierId) ?? null,
    amountDue: r.amountDue,
    amountPaid: r.amountPaid,
    payment: r.payment,
    reminderCount: r.reminderCount,
    lastReminderAt: r.lastReminderAt,
    remindersPaused: r.remindersPaused,
  };
}

/** Money still owed; negative means the person paid too much (credit). */
export function outstandingOf(row: Pick<FinanceRow, "amountDue" | "amountPaid">): number {
  return row.amountDue - row.amountPaid;
}

/** Today's calendar date in the camp's time zone as `YYYY-MM-DD`. */
export function todayInBerlin(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Overdue: a due date exists and lies before today, money is still owed, and no
 * Stripe payment is in flight or refunded.
 */
export function isOverdue(
  row: Pick<FinanceRow, "amountDue" | "amountPaid" | "payment">,
  dueDate: string | null,
  today: string,
): boolean {
  if (!dueDate) return false;
  if (row.payment === "processing" || row.payment === "refunded") return false;
  return dueDate.slice(0, 10) < today && outstandingOf(row) > 0;
}

/** Status that matches an entered amount; never suggests processing or refunded. */
export function suggestPaymentStatus(amountDue: number, amountPaid: number): PaymentStatus {
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid < amountDue) return "partial";
  return "paid";
}

export function summarizeFinance(
  rows: FinanceRow[],
  dueDate: string | null,
  today: string,
): FinanceSummaryView {
  const expected = rows.reduce((sum, r) => sum + r.amountDue, 0);
  const collected = rows.reduce((sum, r) => sum + r.amountPaid, 0);
  return {
    expected,
    collected,
    outstanding: expected - collected,
    openCount: rows.filter((r) => outstandingOf(r) > 0).length,
    unpaidCount: rows.filter((r) => r.payment === "unpaid").length,
    partialCount: rows.filter((r) => r.payment === "partial").length,
    overdueCount: rows.filter((r) => isOverdue(r, dueDate, today)).length,
  };
}

export function matchesFinanceFilter(
  row: FinanceRow,
  filter: FinanceFilter,
  dueDate: string | null,
  today: string,
): boolean {
  switch (filter) {
    case "open":
      return outstandingOf(row) > 0;
    case "partial":
      return row.payment === "partial";
    case "overdue":
      return isOverdue(row, dueDate, today);
    case "paused":
      return row.remindersPaused;
    default:
      return true;
  }
}

export function matchesFinanceSearch(row: FinanceRow, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return `${row.firstName} ${row.lastName} ${row.reference}`.toLowerCase().includes(needle);
}

export function filterFinanceRows(
  rows: FinanceRow[],
  filter: FinanceFilter,
  search: string,
  dueDate: string | null,
  today: string,
): FinanceRow[] {
  return rows.filter(
    (r) => matchesFinanceFilter(r, filter, dueDate, today) && matchesFinanceSearch(r, search),
  );
}

function escapeCsv(value: string | number): string {
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Semicolon separated CSV (German spreadsheets) with a BOM for umlauts. */
export function financeRowsToCsv(
  rows: FinanceRow[],
  dueDate: string | null,
  today: string,
): string {
  const c = de.finances.columns;
  const header = [
    c.name,
    c.reference,
    c.tier,
    c.due,
    c.paid,
    c.outstanding,
    c.payment,
    c.reminders,
    de.finances.csv.overdue,
  ];
  const lines = rows.map((r) =>
    [
      `${r.firstName} ${r.lastName}`.trim(),
      r.reference,
      r.priceTierName ?? de.finances.noTier,
      r.amountDue,
      r.amountPaid,
      outstandingOf(r),
      PAYMENT_STATUS_LABELS[r.payment],
      r.reminderCount,
      isOverdue(r, dueDate, today) ? de.finances.csv.overdueYes : de.finances.csv.overdueNo,
    ]
      .map(escapeCsv)
      .join(";"),
  );
  return `﻿${[header.map(escapeCsv).join(";"), ...lines].join("\r\n")}`;
}
