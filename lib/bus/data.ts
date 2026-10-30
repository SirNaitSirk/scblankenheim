import "server-only";

import { getCampFormFields } from "@/lib/admin/data";
import type { CampFormField } from "@/lib/admin/types";
import { getServiceClient } from "@/lib/supabase/server";
import { generateTicketCode } from "./code-server";
import {
  answerOptionsOf,
  answerValueOf,
  busQuestionFields,
  isBusActive,
  isBusRegistration,
  mappingProblem,
} from "./rules";
import type { BoardingInfo, BoardingMethod, BusRegistration, BusSettings, BusSettingsView, Trip } from "./types";

/**
 * Server data access of the bus ticket (specs/021-bus-ticket). Service role
 * only; callers check the Clerk session and permissions first.
 */

export const EMPTY_BUS_SETTINGS: BusSettings = { enabled: false, fieldKey: null, answers: [] };

const REGISTRATION_COLUMNS =
  "id, camp_id, reference, first_name, last_name, email, form_data, status, deleted, amount_due, amount_paid";

export type BusTicketRow = {
  id: string;
  code: string;
  registration_id: string;
  camp_id: string;
  created_at: string;
  revoked_at: string | null;
};

const TICKET_COLUMNS = "id, code, registration_id, camp_id, created_at, revoked_at";

export async function getBusSettings(campId: string): Promise<BusSettings> {
  const { data, error } = await getServiceClient()
    .from("camp_bus_settings")
    .select("enabled, field_key, answers")
    .eq("camp_id", campId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return EMPTY_BUS_SETTINGS;
  return { enabled: data.enabled, fieldKey: data.field_key, answers: data.answers ?? [] };
}

export async function saveBusSettings(campId: string, settings: BusSettings, actor: string): Promise<void> {
  const { error } = await getServiceClient().from("camp_bus_settings").upsert(
    {
      camp_id: campId,
      enabled: settings.enabled,
      field_key: settings.fieldKey,
      answers: settings.answers,
      updated_by: actor,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "camp_id" },
  );
  if (error) throw error;
}

export type BusContext = { settings: BusSettings; fields: CampFormField[]; active: boolean };

/** Settings plus the camp's form fields, read together. */
export async function busContext(campId: string): Promise<BusContext> {
  const [settings, fields] = await Promise.all([getBusSettings(campId), getCampFormFields(campId)]);
  return { settings, fields, active: isBusActive(settings, fields) };
}

export async function registrationForBus(registrationId: string): Promise<BusRegistration | null> {
  const { data, error } = await getServiceClient()
    .from("registrations")
    .select(REGISTRATION_COLUMNS)
    .eq("id", registrationId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function registrationForBusByReference(reference: string): Promise<BusRegistration | null> {
  const { data, error } = await getServiceClient()
    .from("registrations")
    .select(REGISTRATION_COLUMNS)
    .eq("reference", reference)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function campRegistrations(campId: string): Promise<BusRegistration[]> {
  const { data, error } = await getServiceClient()
    .from("registrations")
    .select(REGISTRATION_COLUMNS)
    .eq("camp_id", campId)
    .eq("deleted", false)
    .eq("status", "active");
  if (error) throw error;
  return data ?? [];
}

/** Active bus persons of a camp (FR-005). */
export async function busRegistrations(campId: string, context: BusContext): Promise<BusRegistration[]> {
  if (!context.active) return [];
  const rows = await campRegistrations(campId);
  return rows.filter((row) => isBusRegistration(row, context.settings, context.fields));
}

/** Counts for the settings card: bus persons and active registrations without an answer. */
export async function busCounts(
  campId: string,
  settings: BusSettings,
  fields: ReadonlyArray<CampFormField>,
): Promise<{ busPersons: number; withoutAnswer: number }> {
  if (!settings.fieldKey) return { busPersons: 0, withoutAnswer: 0 };
  const rows = await campRegistrations(campId);
  const asActive: BusSettings = { ...settings, enabled: true };
  const fieldKey = settings.fieldKey;
  return {
    busPersons: rows.filter((row) => isBusRegistration(row, asActive, fields)).length,
    withoutAnswer: rows.filter((row) => answerValueOf(row.form_data, fieldKey) === null).length,
  };
}

export async function activeTicket(registrationId: string): Promise<BusTicketRow | null> {
  const { data, error } = await getServiceClient()
    .from("bus_tickets")
    .select(TICKET_COLUMNS)
    .eq("registration_id", registrationId)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Whether any code was ever issued for the registration (blocked when none is active). */
export async function hasAnyTicket(registrationId: string): Promise<boolean> {
  const { count, error } = await getServiceClient()
    .from("bus_tickets")
    .select("id", { count: "exact", head: true })
    .eq("registration_id", registrationId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function findTicketByCode(code: string): Promise<BusTicketRow | null> {
  const { data, error } = await getServiceClient()
    .from("bus_tickets")
    .select(TICKET_COLUMNS)
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function insertTicket(registrationId: string, campId: string, actor: string | null): Promise<void> {
  const { error } = await getServiceClient().from("bus_tickets").insert({
    code: generateTicketCode(),
    registration_id: registrationId,
    camp_id: campId,
    created_by: actor,
  });
  // 23505: another request created the active ticket first; that one wins.
  if (error && error.code !== "23505") throw error;
}

/**
 * The active ticket, created on first need (research R6). Returns null for a
 * blocked ticket: once a code was issued and revoked without a new one, only an
 * admin reissue creates the next.
 */
export async function ensureTicket(registrationId: string, campId: string): Promise<BusTicketRow | null> {
  const existing = await activeTicket(registrationId);
  if (existing) return existing;
  if (await hasAnyTicket(registrationId)) return null;
  await insertTicket(registrationId, campId, null);
  return activeTicket(registrationId);
}

export async function revokeActiveTicket(registrationId: string, actor: string): Promise<void> {
  const { error } = await getServiceClient()
    .from("bus_tickets")
    .update({ revoked_at: new Date().toISOString(), revoked_by: actor })
    .eq("registration_id", registrationId)
    .is("revoked_at", null);
  if (error) throw error;
}

/** Revokes the current code and issues a new one; boardings stay (US5.4). */
export async function reissueTicket(registrationId: string, campId: string, actor: string): Promise<void> {
  await revokeActiveTicket(registrationId, actor);
  await insertTicket(registrationId, campId, actor);
}

export type BoardingResult = { at: string; already: boolean };

/** At most one boarding per registration and trip; a second insert reports the first (research R7). */
export async function insertBoarding(input: {
  registrationId: string;
  campId: string;
  trip: Trip;
  actor: string;
  method: BoardingMethod;
}): Promise<BoardingResult> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("bus_boardings")
    .upsert(
      {
        registration_id: input.registrationId,
        trip: input.trip,
        camp_id: input.campId,
        boarded_by: input.actor,
        method: input.method,
      },
      { onConflict: "registration_id,trip", ignoreDuplicates: true },
    )
    .select("boarded_at");
  if (error) throw error;
  const inserted = data?.[0];
  if (inserted) return { at: inserted.boarded_at, already: false };

  const { data: existing, error: readError } = await supabase
    .from("bus_boardings")
    .select("boarded_at")
    .eq("registration_id", input.registrationId)
    .eq("trip", input.trip)
    .single();
  if (readError) throw readError;
  return { at: existing.boarded_at, already: true };
}

export async function deleteBoarding(registrationId: string, trip: Trip): Promise<boolean> {
  const { data, error } = await getServiceClient()
    .from("bus_boardings")
    .delete()
    .eq("registration_id", registrationId)
    .eq("trip", trip)
    .select("registration_id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

function toBoardingInfo(row: { boarded_at: string; method: string }): BoardingInfo {
  return { at: row.boarded_at, method: row.method === "manual" ? "manual" : "scan" };
}

export async function boardingsFor(campId: string, trip: Trip): Promise<Map<string, BoardingInfo>> {
  const { data, error } = await getServiceClient()
    .from("bus_boardings")
    .select("registration_id, boarded_at, method")
    .eq("camp_id", campId)
    .eq("trip", trip);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.registration_id, toBoardingInfo(row)]));
}

export async function boardingsOfRegistration(registrationId: string): Promise<Record<Trip, BoardingInfo | null>> {
  const { data, error } = await getServiceClient()
    .from("bus_boardings")
    .select("trip, boarded_at, method")
    .eq("registration_id", registrationId);
  if (error) throw error;
  const find = (trip: Trip) => {
    const row = (data ?? []).find((candidate) => candidate.trip === trip);
    return row ? toBoardingInfo(row) : null;
  };
  return { outbound: find("outbound"), return: find("return") };
}

/** Tickets and boardings go with a soft deleted registration (data-model.md). */
export async function deleteBusDataByReference(reference: string): Promise<void> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("registrations").select("id").eq("reference", reference).maybeSingle();
  if (error) throw error;
  if (!data) return;
  const [tickets, boardings] = await Promise.all([
    supabase.from("bus_tickets").delete().eq("registration_id", data.id),
    supabase.from("bus_boardings").delete().eq("registration_id", data.id),
  ]);
  if (tickets.error) throw tickets.error;
  if (boardings.error) throw boardings.error;
}

/** Data of the settings card on the camp's form fields page (US1). */
export async function busSettingsView(campId: string, fields: CampFormField[]): Promise<BusSettingsView> {
  const settings = await getBusSettings(campId);
  const counts = await busCounts(campId, settings, fields);
  return {
    settings,
    questions: busQuestionFields(fields).map((field) => ({
      key: field.key,
      label: field.label,
      fieldType: field.fieldType === "checkbox" ? "checkbox" : "select",
      options: answerOptionsOf(field),
    })),
    problem: mappingProblem(settings, fields),
    ...counts,
  };
}
