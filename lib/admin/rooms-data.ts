import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import { asRecord, loadActiveRegistrations, loadPlanningCamp } from "./planning-data";
import { findBirthdateKey, isGender } from "./room-planning";
import { syncTentCircle } from "./tent-circles-data";
import { retryTransient } from "./transient";
import type {
  Gender,
  House,
  PlanningPerson,
  RoomPlan,
} from "./types";

/**
 * Room planning data access (specs/008-room-planning). Service role only; every
 * caller is a guarded Server Action or a page behind `guardTab`. Capacity and
 * gender rules live in the database functions called here, never in this file.
 */

/** Reads `{ status, gender? }` from a room function's jsonb answer. */
function readStatus(data: Json): { status: string; gender: Gender | null } {
  const record = asRecord(data);
  return {
    status: typeof record.status === "string" ? record.status : "",
    gender: isGender(record.gender) ? record.gender : null,
  };
}

// --- read ------------------------------------------------------------------------

async function loadHouses(campId: string | null): Promise<House[]> {
  const supabase = getServiceClient();
  const [housesRes, roomsRes, campRoomsRes] = await Promise.all([
    supabase.from("houses").select("*").order("sort_order").order("created_at"),
    supabase.from("rooms").select("*").order("sort_order").order("created_at"),
    campId
      ? supabase.from("camp_rooms").select("room_id, gender").eq("camp_id", campId)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (housesRes.error) throw housesRes.error;
  if (roomsRes.error) throw roomsRes.error;
  if (campRoomsRes.error) throw campRoomsRes.error;

  const genderByRoom = new Map<string, Gender>();
  for (const row of campRoomsRes.data ?? []) {
    if (isGender(row.gender)) genderByRoom.set(row.room_id, row.gender);
  }

  const houses: House[] = (housesRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    rooms: [],
  }));
  const byId = new Map(houses.map((house) => [house.id, house]));
  for (const row of roomsRes.data ?? []) {
    byId.get(row.house_id)?.rooms.push({
      id: row.id,
      houseId: row.house_id,
      name: row.name,
      beds: row.beds,
      sortOrder: row.sort_order,
      gender: genderByRoom.get(row.id) ?? null,
    });
  }
  return houses;
}

async function loadPeople(campId: string): Promise<PlanningPerson[]> {
  const [people, assignmentsRes] = await Promise.all([
    loadActiveRegistrations(campId),
    getServiceClient().from("room_assignments").select("registration_id, room_id").eq("camp_id", campId),
  ]);
  if (assignmentsRes.error) throw assignmentsRes.error;

  const roomByRegistration = new Map(
    (assignmentsRes.data ?? []).map((row) => [row.registration_id, row.room_id]),
  );
  return people.map((person) => ({ ...person, roomId: roomByRegistration.get(person.id) ?? null }));
}

/** Everything the room planning tab and its print view need for one camp. */
export async function getRoomPlan(campId: string | null): Promise<RoomPlan> {
  return retryTransient(async () => {
    const [houses, people, camp] = await Promise.all([
      loadHouses(campId),
      campId ? loadPeople(campId) : Promise.resolve([]),
      campId ? loadPlanningCamp(campId) : Promise.resolve(null),
    ]);
    return {
      campId,
      campName: camp?.name ?? null,
      campStart: camp?.startDate ?? null,
      birthdateKey: camp ? findBirthdateKey(camp.fields) : null,
      houses,
      people,
      fields: camp?.fields ?? [],
    };
  });
}

// --- houses and rooms --------------------------------------------------------------

// Appends last. Two admins racing could collide on order, not on data.
async function nextSortOrder(houseId?: string): Promise<number> {
  const supabase = getServiceClient();
  const { data, error } = await (houseId
    ? supabase.from("rooms").select("sort_order").eq("house_id", houseId)
    : supabase.from("houses").select("sort_order")
  )
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.sort_order ?? -1) + 1;
}

export async function getHouseName(id: string): Promise<string | null> {
  const { data, error } = await getServiceClient()
    .from("houses")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}

export async function getRoomRef(
  id: string,
): Promise<{ id: string; houseId: string; name: string; beds: number } | null> {
  const { data, error } = await getServiceClient()
    .from("rooms")
    .select("id, house_id, name, beds")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, houseId: data.house_id, name: data.name, beds: data.beds } : null;
}

export async function createHouse(name: string): Promise<string> {
  const sortOrder = await nextSortOrder();
  const { data, error } = await getServiceClient()
    .from("houses")
    .insert({ name, sort_order: sortOrder })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function renameHouse(id: string, name: string): Promise<void> {
  const { error } = await getServiceClient().from("houses").update({ name }).eq("id", id);
  if (error) throw error;
}

// Cascades rooms, camp genders and assignments (FK on delete cascade).
export async function deleteHouse(id: string): Promise<void> {
  const { error } = await getServiceClient().from("houses").delete().eq("id", id);
  if (error) throw error;
}

export async function createRoom(houseId: string, name: string, beds: number): Promise<string> {
  const sortOrder = await nextSortOrder(houseId);
  const { data, error } = await getServiceClient()
    .from("rooms")
    .insert({ house_id: houseId, name, beds, sort_order: sortOrder })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function renameRoom(id: string, name: string): Promise<void> {
  const { error } = await getServiceClient().from("rooms").update({ name }).eq("id", id);
  if (error) throw error;
}

/** `ok`, `below_occupancy` or `not_found` (checked under the room lock). */
export async function updateRoomBeds(
  id: string,
  beds: number,
  campId: string | null,
): Promise<string> {
  const { data, error } = await getServiceClient().rpc("update_room_beds", {
    p_room_id: id,
    p_beds: beds,
    p_camp_id: campId,
  });
  if (error) throw error;
  return readStatus(data).status;
}

export async function deleteRoom(id: string): Promise<void> {
  const { error } = await getServiceClient().from("rooms").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Persists `sort_order` = array index. The ids must be exactly the current set
 * (all houses, or all rooms of one house), so a tampered payload cannot touch
 * other rows.
 */
export async function reorder(
  table: "houses" | "rooms",
  orderedIds: string[],
  houseId?: string,
): Promise<boolean> {
  const supabase = getServiceClient();
  const { data, error } = await (table === "rooms"
    ? supabase.from("rooms").select("id").eq("house_id", houseId ?? "")
    : supabase.from("houses").select("id"));
  if (error) throw error;

  const owned = new Set((data ?? []).map((row) => row.id));
  if (orderedIds.length !== owned.size || !orderedIds.every((id) => owned.has(id))) {
    return false;
  }
  await Promise.all(
    orderedIds.map(async (id, index) => {
      const { error: updateError } = await supabase
        .from(table)
        .update({ sort_order: index })
        .eq("id", id);
      if (updateError) throw updateError;
    }),
  );
  return true;
}

/** Assignments (all camps) that a delete of the room or house would remove. */
export async function countAssignments(target: { roomId: string } | { houseId: string }): Promise<number> {
  const supabase = getServiceClient();
  let roomIds: string[];
  if ("roomId" in target) {
    roomIds = [target.roomId];
  } else {
    const { data, error } = await supabase.from("rooms").select("id").eq("house_id", target.houseId);
    if (error) throw error;
    roomIds = (data ?? []).map((row) => row.id);
  }
  if (roomIds.length === 0) return 0;
  const { count, error } = await supabase
    .from("room_assignments")
    .select("registration_id", { count: "exact", head: true })
    .in("room_id", roomIds);
  if (error) throw error;
  return count ?? 0;
}

// --- per camp gender and assignment ------------------------------------------------

/** `ok`, `not_empty` or `not_found`. `gender` null clears it. */
export async function setRoomGender(
  campId: string,
  roomId: string,
  gender: Gender | null,
): Promise<string> {
  const { data, error } = await getServiceClient().rpc("set_room_gender", {
    p_camp_id: campId,
    p_room_id: roomId,
    p_gender: gender,
  });
  if (error) throw error;
  return readStatus(data).status;
}

export async function getHouseRoomIds(houseId: string): Promise<string[]> {
  const { data, error } = await getServiceClient()
    .from("rooms")
    .select("id")
    .eq("house_id", houseId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((row) => row.id);
}

export async function assignRoom(
  campId: string,
  registrationId: string,
  roomId: string,
): Promise<{ status: string; gender: Gender | null }> {
  const { data, error } = await getServiceClient().rpc("assign_room", {
    p_camp_id: campId,
    p_registration_id: registrationId,
    p_room_id: roomId,
  });
  if (error) throw error;
  return readStatus(data);
}

export async function unassignRoom(campId: string, registrationId: string): Promise<void> {
  const { error } = await getServiceClient()
    .from("room_assignments")
    .delete()
    .eq("registration_id", registrationId)
    .eq("camp_id", campId);
  if (error) throw error;
}

/** Name and gender of an active registration of `campId`, or null. */
export async function getPlanningRegistration(
  campId: string,
  registrationId: string,
): Promise<{ name: string; gender: Gender | null } | null> {
  const { data, error } = await getServiceClient()
    .from("registrations")
    .select("first_name, last_name, gender")
    .eq("id", registrationId)
    .eq("camp_id", campId)
    .eq("deleted", false)
    .neq("status", "cancelled")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
    gender: isGender(data.gender) ? data.gender : null,
  };
}

export async function setRegistrationGender(registrationId: string, gender: Gender): Promise<void> {
  const { error } = await getServiceClient()
    .from("registrations")
    .update({ gender, updated_at: new Date().toISOString() })
    .eq("id", registrationId);
  if (error) throw error;
  await syncRoomAssignment({ id: registrationId });
  await syncTentCircle({ id: registrationId });
}

/**
 * Removes a registration's room assignment when it no longer holds: the
 * registration is cancelled or deleted, or its gender differs from the room's
 * gender in that camp (research R4). Called after every registration change.
 */
export async function syncRoomAssignment(
  target: { id: string } | { reference: string },
): Promise<void> {
  const supabase = getServiceClient();
  const base = supabase.from("registrations").select("id, gender, status, deleted");
  const { data: reg, error } = await ("id" in target
    ? base.eq("id", target.id)
    : base.eq("reference", target.reference)
  ).maybeSingle();
  if (error) throw error;
  if (!reg) return;

  const { data: assignment, error: assignmentError } = await supabase
    .from("room_assignments")
    .select("camp_id, room_id")
    .eq("registration_id", reg.id)
    .maybeSingle();
  if (assignmentError) throw assignmentError;
  if (!assignment) return;

  let keep = !reg.deleted && reg.status !== "cancelled" && isGender(reg.gender);
  if (keep) {
    const { data: campRoom, error: campRoomError } = await supabase
      .from("camp_rooms")
      .select("gender")
      .eq("camp_id", assignment.camp_id)
      .eq("room_id", assignment.room_id)
      .maybeSingle();
    if (campRoomError) throw campRoomError;
    keep = campRoom?.gender === reg.gender;
  }
  if (!keep) {
    const { error: deleteError } = await supabase
      .from("room_assignments")
      .delete()
      .eq("registration_id", reg.id);
    if (deleteError) throw deleteError;
  }
}
