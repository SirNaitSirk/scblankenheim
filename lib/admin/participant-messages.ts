import "server-only";

import type { AdminParticipantMessage } from "@/lib/admin/types";
import type { Json } from "@/lib/database.types";
import {
  allowedChangeFields,
  changePatch,
  checkChangeRequest,
  displayFieldValue,
  sameFieldValue,
  storedFieldValue,
  toCampFormField,
} from "@/lib/participant/contact";
import type { FieldValue } from "@/lib/register/validation";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * Admin side of participant messages (specs/018-participant-messages,
 * contracts/actions-and-mail.md). Callers must have passed the
 * `registrations` permission.
 */


function asFieldValue(value: Json | null): FieldValue | null {
  if (typeof value === "boolean" || typeof value === "string") return value;
  return value == null ? null : String(value);
}

function toResolution(value: string | null): AdminParticipantMessage["resolution"] {
  return value === "done" || value === "applied" || value === "dismissed" ? value : null;
}

async function campFields(campId: string) {
  const { data, error } = await getServiceClient()
    .from("camp_form_fields")
    .select("id, camp_id, key, label, field_type, required, options, sort_order")
    .eq("camp_id", campId);
  if (error) throw error;
  return allowedChangeFields((data ?? []).map(toCampFormField));
}

/** All items of a registration, newest first; null when the reference is unknown. */
export async function listParticipantMessages(
  reference: string,
): Promise<AdminParticipantMessage[] | null> {
  const supabase = getServiceClient();
  const { data: registration, error } = await supabase
    .from("registrations")
    .select("id, camp_id")
    .eq("reference", reference)
    .maybeSingle();
  if (error) throw error;
  if (!registration) return null;

  const [{ data: rows, error: rowsError }, fields] = await Promise.all([
    supabase
      .from("participant_messages")
      .select("*")
      .eq("registration_id", registration.id)
      .order("created_at", { ascending: false }),
    campFields(registration.camp_id),
  ]);
  if (rowsError) throw rowsError;

  const resolverIds = [...new Set((rows ?? []).map((row) => row.resolved_by).filter((id): id is string => !!id))];
  const names = new Map<string, string>();
  if (resolverIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", resolverIds);
    for (const profile of profiles ?? []) names.set(profile.id, profile.name?.trim() || profile.email || "");
  }
  const types = new Map(fields.map((field) => [field.key, field.fieldType]));

  return (rows ?? []).map((row) => {
    const fieldType = { fieldType: types.get(row.field_key ?? "") ?? "text" };
    const change = row.kind === "change_request";
    return {
      id: row.id,
      kind: change ? "change_request" : "message",
      createdAt: row.created_at,
      text: row.body,
      fieldKey: row.field_key,
      fieldLabel: row.field_label,
      previous: change ? displayFieldValue(fieldType, row.previous_value) : null,
      proposed: change ? displayFieldValue(fieldType, row.proposed_value) : null,
      status: row.status === "done" ? "done" : "open",
      resolution: toResolution(row.resolution),
      resolvedByName: row.resolved_by ? (names.get(row.resolved_by) ?? null) : null,
      resolvedAt: row.resolved_at,
    };
  });
}

export type ResolveOutcome =
  | { ok: true; reference: string; fieldKey: string | null }
  | { ok: false; reason: "not_found" | "not_open" | "wrong_kind" | "field_gone" }
  | { ok: false; reason: "invalid"; message: string }
  | { ok: false; reason: "conflict"; current: string };

async function loadOpen(id: string) {
  const { data, error } = await getServiceClient()
    .from("participant_messages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function finish(id: string, adminId: string, resolution: "done" | "applied" | "dismissed") {
  const { error } = await getServiceClient()
    .from("participant_messages")
    .update({ status: "done", resolution, resolved_by: adminId, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "open");
  if (error) throw error;
}

async function referenceOf(registrationId: string): Promise<string> {
  const { data } = await getServiceClient()
    .from("registrations")
    .select("reference")
    .eq("id", registrationId)
    .maybeSingle();
  return data?.reference ?? "";
}

/** Marks a message done, or dismisses a change request. */
export async function closeParticipantMessage(
  id: string,
  adminId: string,
  action: "done" | "dismiss",
): Promise<ResolveOutcome> {
  const row = await loadOpen(id);
  if (!row) return { ok: false, reason: "not_found" };
  if (row.status !== "open") return { ok: false, reason: "not_open" };
  if (action === "dismiss" && row.kind !== "change_request") return { ok: false, reason: "wrong_kind" };
  await finish(id, adminId, action === "done" ? "done" : "dismissed");
  return { ok: true, reference: await referenceOf(row.registration_id), fieldKey: row.field_key };
}

/**
 * Writes the requested value into the registration (research R6 and R7):
 * the field must still exist, the value must pass today's form rules and the
 * stored value must still be the one seen at submit time unless confirmed.
 */
export async function applyParticipantChange(
  id: string,
  adminId: string,
  confirmOverwrite: boolean,
): Promise<ResolveOutcome> {
  const row = await loadOpen(id);
  if (!row) return { ok: false, reason: "not_found" };
  if (row.status !== "open") return { ok: false, reason: "not_open" };
  if (row.kind !== "change_request" || !row.field_key) return { ok: false, reason: "wrong_kind" };

  const supabase = getServiceClient();
  const { data: registration, error } = await supabase
    .from("registrations")
    .select("reference, camp_id, first_name, last_name, email, gender, form_data, deleted")
    .eq("id", row.registration_id)
    .maybeSingle();
  if (error) throw error;
  if (!registration || registration.deleted) return { ok: false, reason: "not_found" };

  const field = (await campFields(registration.camp_id)).find((candidate) => candidate.key === row.field_key);
  if (!field) return { ok: false, reason: "field_gone" };

  const proposed = asFieldValue(row.proposed_value);
  if (proposed === null) return { ok: false, reason: "invalid", message: "" };
  const stored = storedFieldValue(registration, field.key);
  const check = checkChangeRequest(field, null, proposed);
  if (!check.ok && check.reason === "invalid") return check;

  if (!confirmOverwrite && !sameFieldValue(stored, asFieldValue(row.previous_value))) {
    return { ok: false, reason: "conflict", current: displayFieldValue(field, stored) };
  }

  const { error: updateError } = await supabase
    .from("registrations")
    .update({ ...changePatch(registration, field.key, proposed), updated_at: new Date().toISOString() })
    .eq("id", row.registration_id);
  if (updateError) throw updateError;

  await finish(id, adminId, "applied");
  return { ok: true, reference: registration.reference, fieldKey: field.key };
}
