"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentCampId, writeLog } from "@/lib/admin/data";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { GENDER_ADJECTIVES, de } from "@/lib/admin/messages";
import { genderSchema, houseSchema, roomSchema } from "@/lib/admin/room-planning";
import {
  assignRoom,
  countAssignments,
  createHouse,
  createRoom,
  deleteHouse,
  deleteRoom,
  getHouseName,
  getHouseRoomIds,
  getPlanningRegistration,
  getRoomRef,
  renameHouse,
  renameRoom,
  reorder,
  setRegistrationGender,
  setRoomGender,
  unassignRoom,
  updateRoomBeds,
} from "@/lib/admin/rooms-data";
import type { ActionResult, AdminUser, Gender } from "@/lib/admin/types";

const t = de.rooms;

// --- shared helpers ---------------------------------------------------------

// Lenient on purpose: seed data uses ids outside the RFC versions
const idSchema = z.guid();
const idListSchema = z.array(idSchema).max(200);

function fieldErrorResult(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, error: t.toast.error, fieldErrors };
}

function revalidateRooms(): void {
  revalidatePath("/admin/zimmerplanung");
}

// Runs `fn` only after a successful `rooms` permission check, mapping auth and
// unexpected failures to German error results instead of throwing to the client.
async function runGuarded(
  fn: (admin: AdminUser) => Promise<ActionResult>,
): Promise<ActionResult> {
  let admin: AdminUser;
  try {
    admin = await requirePermission("rooms");
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: t.toast.unauthorized };
    console.error("[rooms] auth check failed", error);
    return { ok: false, error: t.toast.error };
  }
  try {
    return await fn(admin);
  } catch (error) {
    console.error("[rooms] action failed", error);
    return { ok: false, error: t.toast.error };
  }
}

// Camp scoped actions always work on the current camp, resolved here.
async function withCurrentCamp(
  fn: (campId: string, admin: AdminUser) => Promise<ActionResult>,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const campId = await getCurrentCampId();
    if (!campId) return { ok: false, error: t.errors.noCurrentCamp };
    return fn(campId, admin);
  });
}

function actorLabel(admin: AdminUser): string {
  return admin.name?.trim() || admin.email?.trim() || admin.id;
}

const notFound: ActionResult = { ok: false, error: t.errors.notFound };

// --- houses -----------------------------------------------------------------

export async function createHouseAction(values: { name: string }): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = houseSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);
    const id = await createHouse(parsed.data.name);
    await writeLog({ actor: actorLabel(admin), action: "house.create", message: parsed.data.name });
    revalidateRooms();
    return { ok: true, id };
  });
}

export async function updateHouseAction(
  id: string,
  values: { name: string },
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = houseSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);
    if (!idSchema.safeParse(id).success || !(await getHouseName(id))) return notFound;
    await renameHouse(id, parsed.data.name);
    await writeLog({ actor: actorLabel(admin), action: "house.update", message: parsed.data.name });
    revalidateRooms();
    return { ok: true, id };
  });
}

export async function deleteHouseAction(id: string): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    if (!idSchema.safeParse(id).success) return notFound;
    const name = await getHouseName(id);
    if (!name) return notFound;
    await deleteHouse(id);
    await writeLog({
      level: "warning",
      actor: actorLabel(admin),
      action: "house.delete",
      message: name,
    });
    revalidateRooms();
    return { ok: true };
  });
}

export async function reorderHousesAction(orderedIds: string[]): Promise<ActionResult> {
  return runGuarded(async () => {
    const parsed = idListSchema.safeParse(orderedIds);
    if (!parsed.success || !(await reorder("houses", parsed.data))) return notFound;
    revalidateRooms();
    return { ok: true };
  });
}

// --- rooms ------------------------------------------------------------------

export async function createRoomAction(
  houseId: string,
  values: { name: string; beds: string },
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = roomSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);
    if (!idSchema.safeParse(houseId).success) return notFound;
    const houseName = await getHouseName(houseId);
    if (!houseName) return notFound;
    const id = await createRoom(houseId, parsed.data.name, parsed.data.beds);
    await writeLog({
      actor: actorLabel(admin),
      action: "room.create",
      message: `${houseName} · ${parsed.data.name} (${parsed.data.beds})`,
    });
    revalidateRooms();
    return { ok: true, id };
  });
}

export async function updateRoomAction(
  id: string,
  values: { name: string; beds: string },
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = roomSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);
    if (!idSchema.safeParse(id).success) return notFound;
    const room = await getRoomRef(id);
    if (!room) return notFound;

    if (parsed.data.beds !== room.beds) {
      const status = await updateRoomBeds(id, parsed.data.beds, await getCurrentCampId());
      if (status === "below_occupancy") {
        return {
          ok: false,
          error: t.errors.bedsBelowOccupancy,
          fieldErrors: { beds: t.errors.bedsBelowOccupancy },
        };
      }
      if (status !== "ok") return notFound;
    }
    if (parsed.data.name !== room.name) await renameRoom(id, parsed.data.name);

    await writeLog({
      actor: actorLabel(admin),
      action: "room.update",
      message: `${parsed.data.name} (${parsed.data.beds})`,
    });
    revalidateRooms();
    return { ok: true, id };
  });
}

export async function deleteRoomAction(id: string): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    if (!idSchema.safeParse(id).success) return notFound;
    const room = await getRoomRef(id);
    if (!room) return notFound;
    await deleteRoom(id);
    await writeLog({
      level: "warning",
      actor: actorLabel(admin),
      action: "room.delete",
      message: room.name,
    });
    revalidateRooms();
    return { ok: true };
  });
}

export async function reorderRoomsAction(
  houseId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  return runGuarded(async () => {
    const parsed = idListSchema.safeParse(orderedIds);
    if (!parsed.success || !idSchema.safeParse(houseId).success) return notFound;
    if (!(await reorder("rooms", parsed.data, houseId))) return notFound;
    revalidateRooms();
    return { ok: true };
  });
}

/** How many assignments (all camps) a delete would remove; for the confirm text. */
export async function getDeleteImpactAction(
  target: { roomId: string } | { houseId: string },
): Promise<number | null> {
  const result = await runGuarded(async () => {
    const id = "roomId" in target ? target.roomId : target.houseId;
    if (!idSchema.safeParse(id).success) return notFound;
    return { ok: true, id: String(await countAssignments(target)) };
  });
  return result.ok ? Number(result.id) : null;
}

// --- per camp gender ----------------------------------------------------------

export async function setRoomGenderAction(
  roomId: string,
  gender: Gender | null,
): Promise<ActionResult> {
  return withCurrentCamp(async (campId) => {
    if (!idSchema.safeParse(roomId).success) return notFound;
    if (gender !== null && !genderSchema.safeParse(gender).success) return notFound;
    const status = await setRoomGender(campId, roomId, gender);
    if (status === "not_empty") return { ok: false, error: t.errors.roomNotEmpty };
    if (status !== "ok") return notFound;
    revalidateRooms();
    return { ok: true };
  });
}

/** Sets every empty room of a house that has another (or no) gender. */
export async function setHouseGenderAction(
  houseId: string,
  gender: Gender,
): Promise<ActionResult> {
  return withCurrentCamp(async (campId) => {
    if (!idSchema.safeParse(houseId).success) return notFound;
    if (!genderSchema.safeParse(gender).success) return notFound;
    let changed = 0;
    for (const roomId of await getHouseRoomIds(houseId)) {
      // Occupied rooms answer `not_empty` and stay as they are.
      if ((await setRoomGender(campId, roomId, gender)) === "ok") changed += 1;
    }
    revalidateRooms();
    return { ok: true, id: String(changed) };
  });
}

// --- assignment ---------------------------------------------------------------

const ASSIGN_ERRORS: Record<string, string> = {
  full: t.errors.full,
  no_gender: t.errors.noGender,
  inactive: t.errors.inactive,
  not_found: t.errors.notFound,
};

export async function assignRoomAction(
  registrationId: string,
  roomId: string,
): Promise<ActionResult> {
  return withCurrentCamp(async (campId) => {
    if (!idSchema.safeParse(registrationId).success || !idSchema.safeParse(roomId).success) {
      return notFound;
    }
    const result = await assignRoom(campId, registrationId, roomId);
    if (result.status === "ok" || result.status === "ok_gender_set") {
      revalidateRooms();
      return {
        ok: true,
        id: roomId,
        roomGender: result.status === "ok_gender_set" ? (result.gender ?? undefined) : undefined,
      };
    }
    if (result.status === "gender_mismatch") {
      const person = await getPlanningRegistration(campId, registrationId);
      const other: Gender = person?.gender === "female" ? "male" : "female";
      return { ok: false, error: t.errors.genderMismatch(t.shortageGender[other]) };
    }
    return { ok: false, error: ASSIGN_ERRORS[result.status] ?? t.toast.error };
  });
}

export async function unassignRoomAction(registrationId: string): Promise<ActionResult> {
  return withCurrentCamp(async (campId) => {
    if (!idSchema.safeParse(registrationId).success) return notFound;
    await unassignRoom(campId, registrationId);
    revalidateRooms();
    return { ok: true };
  });
}

export async function setRegistrationGenderAction(
  registrationId: string,
  gender: Gender,
): Promise<ActionResult> {
  return withCurrentCamp(async (campId, admin) => {
    if (!idSchema.safeParse(registrationId).success) return notFound;
    if (!genderSchema.safeParse(gender).success) return notFound;
    const person = await getPlanningRegistration(campId, registrationId);
    if (!person) return notFound;
    await setRegistrationGender(registrationId, gender);
    await writeLog({
      actor: actorLabel(admin),
      action: "registration.gender",
      message: `${person.name} → ${GENDER_ADJECTIVES[gender]}`,
    });
    revalidateRooms();
    revalidatePath("/admin");
    revalidatePath("/admin/zeltkreise");
    return { ok: true };
  });
}
