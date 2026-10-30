import { fieldOptions } from "@/lib/admin/room-planning";
import type { CampFormField } from "@/lib/admin/types";
import { CHECKBOX_FALSE, CHECKBOX_TRUE } from "./limits";
import type {
  BoardingInfo,
  BoardingListEntry,
  BusRegistration,
  BusSettings,
  MappingProblem,
  ScanOutcome,
} from "./types";

/**
 * Pure bus ticket rules (specs/021-bus-ticket, research R7). Shared by the scan
 * actions, the list, the participant page, the mails and the tests.
 */

const BUS_FIELD_TYPES = ["select", "checkbox"] as const;

function formDataOf(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/** Stored answer as a comparable string; booleans become "true" / "false"; null when empty. */
export function answerValueOf(formData: unknown, fieldKey: string): string | null {
  const value = formDataOf(formData)[fieldKey];
  if (typeof value === "boolean") return value ? CHECKBOX_TRUE : CHECKBOX_FALSE;
  if (typeof value === "string") return value.trim() || null;
  return null;
}

/** Answer values a bus question can have: select options, or true / false for a checkbox. */
export function answerOptionsOf(field: CampFormField): string[] {
  return field.fieldType === "checkbox" ? [CHECKBOX_TRUE, CHECKBOX_FALSE] : fieldOptions(field);
}

/** Fields a camp can map the bus to, in form order. */
export function busQuestionFields(fields: ReadonlyArray<CampFormField>): CampFormField[] {
  return fields.filter((field) => (BUS_FIELD_TYPES as readonly string[]).includes(field.fieldType));
}

/** Why the mapping does not fit the camp's form; null when it fits. */
export function mappingProblem(
  settings: Pick<BusSettings, "fieldKey" | "answers">,
  fields: ReadonlyArray<CampFormField>,
): MappingProblem | null {
  if (!settings.fieldKey) return "no_field";
  const field = fields.find((candidate) => candidate.key === settings.fieldKey);
  if (!field) return "field_missing";
  if (!(BUS_FIELD_TYPES as readonly string[]).includes(field.fieldType)) return "wrong_type";
  if (settings.answers.length === 0) return "no_answers";
  const options = answerOptionsOf(field);
  if (settings.answers.some((answer) => !options.includes(answer))) return "answers_missing";
  return null;
}

/** Switched on and the mapping still fits. */
export function isBusActive(settings: BusSettings, fields: ReadonlyArray<CampFormField>): boolean {
  return settings.enabled && mappingProblem(settings, fields) === null;
}

/** Whether the stored answer matches one of the bus answers (ignores status). */
export function answersBus(formData: unknown, settings: BusSettings): boolean {
  if (!settings.fieldKey) return false;
  const value = answerValueOf(formData, settings.fieldKey);
  return value !== null && settings.answers.includes(value);
}

/** Bus person: active, not deleted, bus active for the camp and a bus answer (FR-005). */
export function isBusRegistration(
  registration: Pick<BusRegistration, "status" | "deleted" | "form_data">,
  settings: BusSettings,
  fields: ReadonlyArray<CampFormField>,
): boolean {
  if (registration.deleted || registration.status !== "active") return false;
  return isBusActive(settings, fields) && answersBus(registration.form_data, settings);
}

export function fullName(registration: Pick<BusRegistration, "first_name" | "last_name">): string {
  return `${registration.first_name ?? ""} ${registration.last_name ?? ""}`.trim();
}

/** Something is still to pay; a hint only, never blocking (FR-021). */
export function isPaymentOpen(registration: Pick<BusRegistration, "amount_due" | "amount_paid">): boolean {
  return registration.amount_due - registration.amount_paid > 0;
}

export type ScanInput = {
  ticket: { campId: string; revoked: boolean } | null;
  currentCampId: string;
  settings: BusSettings;
  fields: ReadonlyArray<CampFormField>;
  registration: BusRegistration | null;
};

export type ScanDecision =
  | ScanOutcome
  | { kind: "board"; name: string; reference: string; paymentOpen: boolean };

/**
 * Scan outcome before the boarding insert (research R7): unknown, invalid,
 * other camp, disabled, cancelled, no ticket; otherwise `board`. The caller
 * turns `board` into `boarded` or `already` after the insert.
 */
export function decideScan(input: ScanInput): ScanDecision {
  const { ticket, registration } = input;
  if (!ticket || !registration) return { kind: "unknown" };
  if (ticket.revoked) return { kind: "invalid" };
  if (ticket.campId !== input.currentCampId || registration.camp_id !== input.currentCampId) {
    return { kind: "other_camp" };
  }
  if (!isBusActive(input.settings, input.fields)) return { kind: "disabled" };
  const name = fullName(registration);
  const reference = registration.reference;
  if (registration.deleted || registration.status !== "active") return { kind: "cancelled", name, reference };
  if (!answersBus(registration.form_data, input.settings)) return { kind: "no_ticket", name, reference };
  return { kind: "board", name, reference, paymentOpen: isPaymentOpen(registration) };
}

const collator = new Intl.Collator("de", { sensitivity: "base" });

function byName(
  a: Pick<BusRegistration, "first_name" | "last_name">,
  b: Pick<BusRegistration, "first_name" | "last_name">,
): number {
  return (
    collator.compare(a.last_name ?? "", b.last_name ?? "") || collator.compare(a.first_name ?? "", b.first_name ?? "")
  );
}

/** Missing first, then boarded; each by last then first name (FR-022). */
export function buildBoardingList(
  registrations: ReadonlyArray<BusRegistration>,
  boardings: ReadonlyMap<string, BoardingInfo>,
): { total: number; boarded: number; entries: BoardingListEntry[] } {
  const sorted = [...registrations].sort(byName);
  const toEntry = (registration: BusRegistration): BoardingListEntry => {
    const boarding = boardings.get(registration.id) ?? null;
    return {
      registrationId: registration.id,
      name: fullName(registration),
      reference: registration.reference,
      boardedAt: boarding?.at ?? null,
      method: boarding?.method ?? null,
    };
  };
  const entries = sorted.map(toEntry);
  const missing = entries.filter((entry) => entry.boardedAt === null);
  const boarded = entries.filter((entry) => entry.boardedAt !== null);
  return { total: entries.length, boarded: boarded.length, entries: [...missing, ...boarded] };
}
