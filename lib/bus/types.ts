import type { TRIPS } from "./limits";

/** Types of the bus ticket (specs/021-bus-ticket, data-model.md). */

export type Trip = (typeof TRIPS)[number];

export type BoardingMethod = "scan" | "manual";

export type BusSettings = {
  enabled: boolean;
  fieldKey: string | null;
  answers: string[];
};

export type MappingProblem = "no_field" | "field_missing" | "wrong_type" | "no_answers" | "answers_missing";

export type ScanOutcome =
  | { kind: "boarded"; name: string; reference: string; at: string; paymentOpen: boolean }
  | { kind: "already"; name: string; reference: string; at: string }
  | { kind: "no_ticket" | "cancelled"; name: string; reference: string }
  | { kind: "invalid" | "other_camp" | "disabled" | "unknown" };

export type BoardingListEntry = {
  registrationId: string;
  name: string;
  reference: string;
  boardedAt: string | null;
  method: BoardingMethod | null;
};

export type BoardingListState =
  | { state: "ready"; total: number; boarded: number; entries: BoardingListEntry[] }
  | { state: "disabled" | "mapping_broken" | "no_camp" };

export type BoardingInfo = { at: string; method: BoardingMethod };

export type AdminBusTicket = {
  isBusPerson: boolean;
  state: "active" | "blocked" | "none";
  issuedAt: string | null;
  hasEmail: boolean;
  boardings: Record<Trip, BoardingInfo | null>;
};

export type AdminBusTicketResult = { ok: true; ticket: AdminBusTicket } | { ok: false; error: string };

/** Registration columns the bus rules read. */
export type BusRegistration = {
  id: string;
  camp_id: string;
  reference: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  form_data: unknown;
  status: string;
  deleted: boolean;
  amount_due: number;
  amount_paid: number;
};

/** Ticket on the participant page: QR as SVG, or the blocked hint. */
export type ParticipantBusTicket = { blocked: false; svg: string } | { blocked: true };

/** Settings card data for the form fields page. */
export type BusSettingsView = {
  settings: BusSettings;
  questions: { key: string; label: string; fieldType: "select" | "checkbox"; options: string[] }[];
  problem: MappingProblem | null;
  busPersons: number;
  withoutAnswer: number;
};
