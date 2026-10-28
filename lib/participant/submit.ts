import "server-only";

import type { Json } from "@/lib/database.types";
import { getServiceClient } from "@/lib/supabase/server";
import { berlinDayStartIso } from "@/lib/time/berlin";
import {
  MESSAGE_DAY_MAX,
  MESSAGE_DUPLICATE_MS,
  MESSAGE_IP_MAX,
  MESSAGE_IP_WINDOW_MS,
} from "./limits";

/**
 * Server only storage and throttles for messages and change requests from the
 * participant page (specs/018-participant-messages, research R3).
 */

export type TokenRegistration = {
  id: string;
  camp_id: string;
  reference: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  gender: string | null;
  form_data: Json;
};

export async function findRegistrationForToken(token: string): Promise<TokenRegistration | null> {
  const { data, error } = await getServiceClient()
    .from("registrations")
    .select("id, camp_id, reference, first_name, last_name, email, gender, form_data, deleted")
    .eq("access_token", token)
    .maybeSingle();
  if (error || !data || data.deleted) return null;
  return data;
}

/** Counts this ip's send attempts within the window and records the current one. */
export async function isMessageThrottled(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const supabase = getServiceClient();
  const since = new Date(Date.now() - MESSAGE_IP_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("submission_attempts")
    .select("id", { count: "exact", head: true })
    .eq("kind", "participant_message")
    .eq("ip", ip)
    .gte("created_at", since);
  await supabase.from("submission_attempts").insert({ ip, kind: "participant_message" });
  return (count ?? 0) >= MESSAGE_IP_MAX;
}

/** Whether this registration already sent the daily maximum (Berlin day). */
export async function reachedDayLimit(registrationId: string, now: Date = new Date()): Promise<boolean> {
  const { count, error } = await getServiceClient()
    .from("participant_messages")
    .select("id", { count: "exact", head: true })
    .eq("registration_id", registrationId)
    .gte("created_at", berlinDayStartIso(now));
  if (error) throw error;
  return (count ?? 0) >= MESSAGE_DAY_MAX;
}

export type NewParticipantMessage = {
  registration_id: string;
  camp_id: string;
  kind: "message" | "change_request";
  body: string;
  field_key: string | null;
  field_label: string | null;
  previous_value: Json | null;
  proposed_value: Json | null;
};

/** Same kind, text and field within the duplicate window counts as a double click. */
export async function isDuplicate(item: NewParticipantMessage): Promise<boolean> {
  const since = new Date(Date.now() - MESSAGE_DUPLICATE_MS).toISOString();
  const { data, error } = await getServiceClient()
    .from("participant_messages")
    .select("body, field_key, proposed_value")
    .eq("registration_id", item.registration_id)
    .eq("kind", item.kind)
    .gte("created_at", since);
  if (error) throw error;
  return (data ?? []).some(
    (row) =>
      row.body === item.body &&
      row.field_key === item.field_key &&
      JSON.stringify(row.proposed_value) === JSON.stringify(item.proposed_value),
  );
}

export async function insertParticipantMessage(item: NewParticipantMessage): Promise<string> {
  const { data, error } = await getServiceClient()
    .from("participant_messages")
    .insert(item)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
