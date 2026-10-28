import type { PaymentStatus } from "@/lib/admin/types";
import type { CalendarLinks } from "@/lib/calendar/ics";
import { paymentPath } from "@/lib/email/links";
import {
  checkoutEligibility,
  outstandingAmount,
  type PayableRegistration,
} from "@/lib/payment/eligibility";
import { formatGermanDate } from "@/lib/time/berlin";
import { participantMessages as copy } from "./messages";

/**
 * Pure view builder for the participant page (specs/017-participant-page,
 * data-model.md). Whitelists what the page may show: own data, own amounts and
 * camp facts. Price tiers, notes, reminder pause, rooms and tent circles never
 * enter the result.
 */

export type PayState = "pay" | "paid" | "processing" | "refunded" | "cancelled" | "free";

export type ParticipantRow = { label: string; value: string };

export type ParticipantView = {
  firstName: string;
  campName: string;
  campDates: { start: string; end: string } | null;
  campLocation: string | null;
  calendar: CalendarLinks | null; // specs/019-calendar-file
  status: "active" | "cancelled";
  amounts: { total: number; paid: number; outstanding: number };
  payState: PayState;
  payHref: string | null;
  rows: ParticipantRow[];
};

export type ParticipantRegistrationInput = {
  reference: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  gender: string | null;
  form_data: unknown;
  status: string;
  payment_status: string;
  amount_due: number;
  amount_paid: number;
  deleted: boolean;
};

export type ParticipantCampInput = {
  name: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
};

export type ParticipantFieldInput = {
  key: string;
  label: string;
  field_type: string;
  sort_order: number;
};

// Core answers have dedicated columns and are shown first, never as field rows.
const CORE_KEYS = new Set(["first_name", "last_name", "email", "gender"]);

function text(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function payStateOf(registration: PayableRegistration): PayState {
  switch (checkoutEligibility(registration)) {
    case "ok":
      return "pay";
    case "cancelled":
    case "not_found":
      return "cancelled";
    case "processing":
      return "processing";
    case "refunded":
      return "refunded";
    case "paid":
    case "nothing_due":
      return registration.amountDue > 0 ? "paid" : "free";
  }
}

function formatAnswer(field: ParticipantFieldInput, value: unknown): string {
  if (field.field_type === "checkbox") {
    if (value === true) return copy.answers.yes;
    if (value === false) return copy.answers.no;
    return "";
  }
  if (value == null) return "";
  const raw = String(value).trim();
  if (field.field_type === "date" && /^\d{4}-\d{2}-\d{2}/.test(raw)) return formatGermanDate(raw);
  return raw;
}

function coreRows(registration: ParticipantRegistrationInput): ParticipantRow[] {
  const gender = text(registration.gender);
  const rows: ParticipantRow[] = [
    { label: copy.answers.firstName, value: text(registration.first_name) },
    { label: copy.answers.lastName, value: text(registration.last_name) },
    { label: copy.answers.email, value: text(registration.email) },
    { label: copy.answers.gender, value: copy.answers.genders[gender] ?? "" },
  ];
  return rows.filter((row) => row.value !== "");
}

function fieldRows(
  formData: unknown,
  fields: ReadonlyArray<ParticipantFieldInput>,
): ParticipantRow[] {
  const answers =
    formData && typeof formData === "object" && !Array.isArray(formData)
      ? (formData as Record<string, unknown>)
      : {};
  return [...fields]
    .filter((field) => field.field_type !== "step" && !CORE_KEYS.has(field.key))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((field) => ({ label: field.label, value: formatAnswer(field, answers[field.key]) }))
    .filter((row) => row.value !== "");
}

export function buildParticipantView(input: {
  registration: ParticipantRegistrationInput;
  camp: ParticipantCampInput;
  fields: ReadonlyArray<ParticipantFieldInput>;
  calendar?: CalendarLinks | null;
}): ParticipantView {
  const { registration, camp, fields } = input;
  const payable: PayableRegistration = {
    amountDue: registration.amount_due,
    amountPaid: registration.amount_paid,
    paymentStatus: registration.payment_status as PaymentStatus,
    status: registration.status,
    deleted: registration.deleted,
  };
  const payState = payStateOf(payable);

  return {
    firstName: text(registration.first_name),
    campName: camp.name,
    campDates:
      camp.start_date && camp.end_date ? { start: camp.start_date, end: camp.end_date } : null,
    campLocation: text(camp.location) || null,
    calendar: input.calendar ?? null,
    status: registration.status === "cancelled" ? "cancelled" : "active",
    amounts: {
      total: registration.amount_due,
      paid: registration.amount_paid,
      outstanding: outstandingAmount(payable),
    },
    payState,
    payHref: payState === "pay" ? paymentPath(registration.reference) : null,
    rows: [...coreRows(registration), ...fieldRows(registration.form_data, fields)],
  };
}
