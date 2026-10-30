import type { ParticipantBusTicket } from "@/lib/bus/types";
import type { CampFormField, PaymentStatus } from "@/lib/admin/types";
import type { CalendarLinks } from "@/lib/calendar/ics";
import { paymentPath } from "@/lib/email/links";
import {
  checkoutEligibility,
  outstandingAmount,
  type PayableRegistration,
} from "@/lib/payment/eligibility";
import { formatGermanDate } from "@/lib/time/berlin";
import { allowedChangeFields, displayFieldValue, storedFieldValue } from "./contact";
import { OWN_MESSAGES_SHOWN } from "./limits";
import { participantMessages as copy } from "./messages";
import { formatReleaseDates, isReleaseActive, isReleaseUnlocked, prefillAddress } from "@/lib/school-release/settings";
import type { ReleaseSettings, SchoolReleaseData } from "@/lib/school-release/types";

/**
 * Pure view builder for the participant page (specs/017-participant-page,
 * data-model.md). Whitelists what the page may show: own data, own amounts and
 * camp facts. Price tiers, notes, reminder pause, rooms and tent circles never
 * enter the result.
 */

export type PayState = "pay" | "paid" | "processing" | "refunded" | "cancelled" | "free";

export type ParticipantRow = { label: string; value: string };

/** A field the person may ask to change (specs/018-participant-messages). */
export type EditableField = {
  key: string;
  label: string;
  type: string;
  options: string[] | null;
  required: boolean;
  current: string | boolean | null;
  currentDisplay: string;
};

/** One own message or change request as the page lists it. */
export type OwnMessage = {
  id: string;
  kind: "message" | "change_request";
  createdAt: string;
  text: string;
  fieldLabel: string | null;
  proposed: string | null;
  status: "open" | "done";
};

export type OwnMessageInput = {
  id: string;
  kind: string;
  created_at: string;
  body: string;
  field_key: string | null;
  field_label: string | null;
  proposed_value: unknown;
  status: string;
};

/** School release card (specs/020-school-release); null when off or cancelled. */
export type ParticipantRelease = {
  dates: string;
  /** Not paid yet: the card shows the hint with the pay button instead of the form (FR-006a). */
  locked: boolean;
  participantName: string;
  data: SchoolReleaseData | null;
  prefillAddress: string;
};

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
  editableFields: EditableField[];
  messages: OwnMessage[];
  schoolRelease: ParticipantRelease | null;
  /** Bus ticket QR or a blocked hint; null when no bus person (specs/021-bus-ticket). */
  busTicket: ParticipantBusTicket | null;
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

function editableFields(
  registration: ParticipantRegistrationInput,
  campFields: ReadonlyArray<CampFormField>,
): EditableField[] {
  return allowedChangeFields(campFields).map((field) => {
    const current = storedFieldValue(registration, field.key);
    return {
      key: field.key,
      label: field.label,
      type: field.fieldType,
      options: Array.isArray(field.options) ? field.options.map(String) : null,
      required: field.required,
      current,
      currentDisplay: displayFieldValue(field, current),
    };
  });
}

function ownMessages(
  rows: ReadonlyArray<OwnMessageInput>,
  campFields: ReadonlyArray<CampFormField>,
): OwnMessage[] {
  const types = new Map(allowedChangeFields(campFields).map((field) => [field.key, field.fieldType]));
  return [...rows]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, OWN_MESSAGES_SHOWN)
    .map((row) => {
      const change = row.kind === "change_request";
      return {
        id: row.id,
        kind: change ? "change_request" : "message",
        createdAt: row.created_at,
        text: row.body,
        fieldLabel: change ? row.field_label : null,
        proposed: change
          ? displayFieldValue({ fieldType: types.get(row.field_key ?? "") ?? "text" }, row.proposed_value)
          : null,
        status: row.status === "done" ? "done" : "open",
      };
    });
}

export function buildParticipantView(input: {
  registration: ParticipantRegistrationInput;
  camp: ParticipantCampInput;
  fields: ReadonlyArray<ParticipantFieldInput>;
  calendar?: CalendarLinks | null;
  campFields?: ReadonlyArray<CampFormField>; // with options and required, for change requests
  messages?: ReadonlyArray<OwnMessageInput>;
  release?: { settings: ReleaseSettings; data: SchoolReleaseData | null } | null;
  busTicket?: ParticipantBusTicket | null;
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
    editableFields: editableFields(registration, input.campFields ?? []),
    messages: ownMessages(input.messages ?? [], input.campFields ?? []),
    schoolRelease: releaseCard(registration, input.release ?? null),
    busTicket: registration.status === "cancelled" ? null : (input.busTicket ?? null),
  };
}

function releaseCard(
  registration: ParticipantRegistrationInput,
  release: { settings: ReleaseSettings; data: SchoolReleaseData | null } | null,
): ParticipantRelease | null {
  if (!release || registration.status === "cancelled" || !isReleaseActive(release.settings)) return null;
  if (registration.payment_status === "refunded") return null;
  return {
    dates: formatReleaseDates(release.settings.dates),
    locked: !isReleaseUnlocked({
      paymentStatus: registration.payment_status,
      amountDue: registration.amount_due,
      amountPaid: registration.amount_paid,
    }),
    participantName: `${text(registration.first_name)} ${text(registration.last_name)}`.trim(),
    data: release.data,
    prefillAddress: prefillAddress(registration.form_data, release.settings.addressKeys),
  };
}
