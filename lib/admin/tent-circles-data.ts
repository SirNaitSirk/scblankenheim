import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import { asRecord, loadActiveRegistrations, loadPlanningCamp } from "./planning-data";
import { findBirthdateKey, isGender } from "./room-planning";
import { fitsCircle, isKind } from "./tent-circles";
import { retryTransient } from "./transient";
import type { CirclePerson, TentCircle, TentCircleKind, TentCirclePlan } from "./types";

/**
 * Tent circle data access (specs/011-tent-circles). Service role only; every
 * caller is a guarded Server Action or a page behind `guardTab`. Leader and
 * participant rules live in the database functions called here.
 */

/** Reads `{ status, id?, count? }` from a tent circle function's jsonb answer. */
function readStatus(data: Json): { status: string; id: string | null; count: number } {
  const record = asRecord(data);
  return {
    status: typeof record.status === "string" ? record.status : "",
    id: typeof record.id === "string" ? record.id : null,
    count: typeof record.count === "number" ? record.count : 0,
  };
}

// --- read ------------------------------------------------------------------------

async function loadCircles(campId: string): Promise<TentCircle[]> {
  const { data, error } = await getServiceClient()
    .from("tent_circles")
    .select("*")
    .eq("camp_id", campId)
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    kind: isKind(row.kind) ? row.kind : "mixed",
    leaderId: row.leader_registration_id,
    sortOrder: row.sort_order,
  }));
}

async function loadPeople(campId: string, circles: TentCircle[]): Promise<CirclePerson[]> {
  const [people, membersRes] = await Promise.all([
    loadActiveRegistrations(campId),
    getServiceClient()
      .from("tent_circle_members")
      .select("registration_id, tent_circle_id")
      .eq("camp_id", campId),
  ]);
  if (membersRes.error) throw membersRes.error;

  const circleByMember = new Map(
    (membersRes.data ?? []).map((row) => [row.registration_id, row.tent_circle_id]),
  );
  const circleByLeader = new Map(
    circles.filter((c) => c.leaderId).map((c) => [c.leaderId as string, c.id]),
  );
  return people.map((person) => {
    const leads = circleByLeader.get(person.id) ?? null;
    return {
      ...person,
      leads,
      circleId: leads ? null : (circleByMember.get(person.id) ?? null),
    };
  });
}

/** Everything the tent circle tab and its print view need for one camp. */
export async function getTentCirclePlan(campId: string | null): Promise<TentCirclePlan> {
  return retryTransient(async () => {
    if (!campId) {
      return {
        campId: null,
        campName: null,
        campStart: null,
        birthdateKey: null,
        circles: [],
        people: [],
        fields: [],
      };
    }
    const [circles, camp] = await Promise.all([loadCircles(campId), loadPlanningCamp(campId)]);
    const people = await loadPeople(campId, circles);
    return {
      campId,
      campName: camp.name,
      campStart: camp.startDate,
      birthdateKey: findBirthdateKey(camp.fields),
      circles,
      people,
      fields: camp.fields,
    };
  });
}

/** Name of a circle in `campId`, or null. */
export async function getTentCircleName(campId: string, id: string): Promise<string | null> {
  const { data, error } = await getServiceClient()
    .from("tent_circles")
    .select("name")
    .eq("id", id)
    .eq("camp_id", campId)
    .maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}

/** Name of the current leader of a circle, or null. */
export async function getTentCircleLeaderName(campId: string, id: string): Promise<string | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("tent_circles")
    .select("leader_registration_id")
    .eq("id", id)
    .eq("camp_id", campId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.leader_registration_id) return null;
  return getRegistrationName(data.leader_registration_id);
}

export async function getRegistrationName(id: string): Promise<string | null> {
  const { data, error } = await getServiceClient()
    .from("registrations")
    .select("first_name, last_name")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() : null;
}

/** Number of participants of a circle (active or not), for the delete confirmation. */
export async function countTentCircleMembers(campId: string, id: string): Promise<number> {
  const { count, error } = await getServiceClient()
    .from("tent_circle_members")
    .select("registration_id", { count: "exact", head: true })
    .eq("camp_id", campId)
    .eq("tent_circle_id", id);
  if (error) throw error;
  return count ?? 0;
}

// --- write -----------------------------------------------------------------------

/** Creates (`circleId` null) or updates a circle through `save_tent_circle`. */
export async function saveTentCircle(
  campId: string,
  circleId: string | null,
  values: { name: string; kind: TentCircleKind; leaderId: string },
): Promise<{ status: string; id: string | null; count: number }> {
  const { data, error } = await getServiceClient().rpc("save_tent_circle", {
    p_camp_id: campId,
    p_circle_id: circleId,
    p_name: values.name,
    p_kind: values.kind,
    p_leader_id: values.leaderId,
  });
  if (error) throw error;
  return readStatus(data);
}

export async function deleteTentCircle(campId: string, id: string): Promise<void> {
  const { error } = await getServiceClient()
    .from("tent_circles")
    .delete()
    .eq("id", id)
    .eq("camp_id", campId);
  if (error) throw error;
}

/** Applies a new order. False when the ids are not exactly the circles of the camp. */
export async function reorderTentCircles(campId: string, orderedIds: string[]): Promise<boolean> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("tent_circles").select("id").eq("camp_id", campId);
  if (error) throw error;
  const existing = new Set((data ?? []).map((row) => row.id));
  if (existing.size !== orderedIds.length || !orderedIds.every((id) => existing.has(id))) {
    return false;
  }
  for (const [index, id] of orderedIds.entries()) {
    const { error: updateError } = await supabase
      .from("tent_circles")
      .update({ sort_order: index })
      .eq("id", id);
    if (updateError) throw updateError;
  }
  return true;
}

export async function assignTentCircle(
  campId: string,
  registrationId: string,
  circleId: string,
): Promise<string> {
  const { data, error } = await getServiceClient().rpc("assign_tent_circle", {
    p_camp_id: campId,
    p_registration_id: registrationId,
    p_circle_id: circleId,
  });
  if (error) throw error;
  return readStatus(data).status;
}

export async function unassignTentCircle(campId: string, registrationId: string): Promise<void> {
  const { error } = await getServiceClient()
    .from("tent_circle_members")
    .delete()
    .eq("registration_id", registrationId)
    .eq("camp_id", campId);
  if (error) throw error;
}

/**
 * After a gender change: drops the participation, or clears the leadership,
 * when the registration's gender no longer fits the circle kind (research R3).
 * Cancel and delete keep the rows; reads ignore inactive registrations.
 */
export async function syncTentCircle(
  target: { id: string } | { reference: string },
): Promise<void> {
  const supabase = getServiceClient();
  const base = supabase.from("registrations").select("id, gender");
  const { data: reg, error } = await ("id" in target
    ? base.eq("id", target.id)
    : base.eq("reference", target.reference)
  ).maybeSingle();
  if (error) throw error;
  if (!reg) return;
  const gender = isGender(reg.gender) ? reg.gender : null;

  const [memberRes, ledRes] = await Promise.all([
    supabase.from("tent_circle_members").select("tent_circle_id").eq("registration_id", reg.id).maybeSingle(),
    supabase.from("tent_circles").select("id, kind").eq("leader_registration_id", reg.id).maybeSingle(),
  ]);
  if (memberRes.error) throw memberRes.error;
  if (ledRes.error) throw ledRes.error;

  if (ledRes.data && isKind(ledRes.data.kind) && !fitsCircle(ledRes.data.kind, gender)) {
    const { error: clearError } = await supabase
      .from("tent_circles")
      .update({ leader_registration_id: null })
      .eq("id", ledRes.data.id);
    if (clearError) throw clearError;
  }

  if (memberRes.data) {
    const { data: circle, error: circleError } = await supabase
      .from("tent_circles")
      .select("kind")
      .eq("id", memberRes.data.tent_circle_id)
      .maybeSingle();
    if (circleError) throw circleError;
    if (circle && isKind(circle.kind) && !fitsCircle(circle.kind, gender)) {
      const { error: deleteError } = await supabase
        .from("tent_circle_members")
        .delete()
        .eq("registration_id", reg.id);
      if (deleteError) throw deleteError;
    }
  }
}
