import "server-only";

import { toCampEvent } from "@/lib/calendar/ics";
import { appBaseUrl, calendarLinks } from "@/lib/email/links";
import { getServiceClient } from "@/lib/supabase/server";
import { OWN_MESSAGES_SHOWN, PARTICIPANT_THROTTLE_MAX, PARTICIPANT_THROTTLE_WINDOW_MS } from "./limits";
import { toCampFormField } from "./contact";
import { buildParticipantView, type ParticipantView } from "./view";

/**
 * Server only lookup for the participant page (specs/017-participant-page,
 * contracts/page-actions-mail.md). Selects only the columns the view whitelists.
 */

const REGISTRATION_COLUMNS =
  "id, reference, camp_id, first_name, last_name, email, gender, form_data, status, payment_status, amount_due, amount_paid, deleted";

export async function findParticipantByToken(token: string): Promise<ParticipantView | null> {
  const supabase = getServiceClient();
  const { data: registration, error } = await supabase
    .from("registrations")
    .select(REGISTRATION_COLUMNS)
    .eq("access_token", token)
    .maybeSingle();
  if (error || !registration || registration.deleted) return null;

  const [{ data: camp }, { data: fields }, { data: messages }] = await Promise.all([
    supabase
      .from("camps")
      .select("id, name, start_date, end_date, location")
      .eq("id", registration.camp_id)
      .maybeSingle(),
    supabase
      .from("camp_form_fields")
      .select("id, camp_id, key, label, field_type, required, options, sort_order")
      .eq("camp_id", registration.camp_id),
    supabase
      .from("participant_messages")
      .select("id, kind, created_at, body, field_key, field_label, proposed_value, status")
      .eq("registration_id", registration.id)
      .order("created_at", { ascending: false })
      .limit(OWN_MESSAGES_SHOWN),
  ]);
  if (!camp) return null;

  const base = appBaseUrl();
  const calendar = calendarLinks(base ? toCampEvent(camp, base) : null);
  return buildParticipantView({
    registration,
    camp,
    fields: fields ?? [],
    calendar,
    campFields: (fields ?? []).map(toCampFormField),
    messages: messages ?? [],
  });
}

/** Whether this ip reached the miss limit within the window. Does not record. */
export async function isParticipantThrottled(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const since = new Date(Date.now() - PARTICIPANT_THROTTLE_WINDOW_MS).toISOString();
  const { count } = await getServiceClient()
    .from("submission_attempts")
    .select("id", { count: "exact", head: true })
    .eq("kind", "participant")
    .eq("ip", ip)
    .gte("created_at", since);
  return (count ?? 0) >= PARTICIPANT_THROTTLE_MAX;
}

/** Records one lookup of an unknown token for this ip. */
export async function recordParticipantMiss(ip: string | null): Promise<void> {
  if (!ip) return;
  await getServiceClient().from("submission_attempts").insert({ ip, kind: "participant" });
}
