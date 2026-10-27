import { addDays, compareDates } from "@/lib/time/berlin";
import {
  REMINDER_BEFORE_DUE_DAYS,
  REMINDER_FIRST_AFTER_DAYS,
  REMINDER_MIN_GAP_DAYS,
} from "./limits";
import type { ReminderKind } from "./templates";

/**
 * Payment reminder rules (specs/007-transactional-emails, FR-012 to FR-014,
 * research R5). Pure and deterministic; all dates are Berlin calendar dates
 * (`YYYY-MM-DD`). Reminders never change a registration; they only decide
 * whether a mail is due.
 */

export type ReminderInput = {
  paymentStatus: string;
  outstanding: number;
  deleted: boolean;
  status: string;
  hasEmail: boolean;
  registeredDate: string;
  campStartDate: string | null;
  paymentDueDate: string | null;
  sentKinds: readonly ReminderKind[];
  lastReminderDate: string | null;
};

const STAGES: readonly ReminderKind[] = ["reminder_1", "reminder_2", "reminder_3"];

export function isReminderEligible(input: ReminderInput): boolean {
  return (
    !input.deleted &&
    input.status !== "cancelled" &&
    input.hasEmail &&
    (input.paymentStatus === "unpaid" || input.paymentStatus === "partial") &&
    input.outstanding > 0
  );
}

/** Highest stage whose window is open today, or null. */
function openStage(input: ReminderInput, today: string): ReminderKind | null {
  const due = input.paymentDueDate;
  if (due && compareDates(today, due) > 0) return "reminder_3";
  if (due && compareDates(today, addDays(due, -REMINDER_BEFORE_DUE_DAYS)) >= 0) return "reminder_2";
  if (compareDates(today, addDays(input.registeredDate, REMINDER_FIRST_AFTER_DAYS)) >= 0) {
    return "reminder_1";
  }
  return null;
}

export function nextReminder(input: ReminderInput, today: string): ReminderKind | null {
  if (!isReminderEligible(input)) return null;
  if (input.campStartDate && compareDates(today, input.campStartDate) >= 0) return null;

  const stage = openStage(input, today);
  if (!stage) return null;

  // Overtaken earlier stages are skipped, never sent late.
  const stageIndex = STAGES.indexOf(stage);
  if (input.sentKinds.some((kind) => STAGES.indexOf(kind) >= stageIndex)) return null;

  if (compareDates(today, addDays(input.registeredDate, REMINDER_MIN_GAP_DAYS)) < 0) return null;
  if (
    input.lastReminderDate &&
    compareDates(today, addDays(input.lastReminderDate, REMINDER_MIN_GAP_DAYS)) < 0
  ) {
    return null;
  }
  return stage;
}
