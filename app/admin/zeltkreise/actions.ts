"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentCampId, writeLog } from "@/lib/admin/data";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { GENDER_ADJECTIVES, de } from "@/lib/admin/messages";
import { genderSchema } from "@/lib/admin/room-planning";
import { getPlanningRegistration, setRegistrationGender } from "@/lib/admin/rooms-data";
import { kindText, tentCircleSchema } from "@/lib/admin/tent-circles";
import {
  assignTentCircle,
  countTentCircleMembers,
  deleteTentCircle,
  getRegistrationName,
  getTentCircleLeaderName,
  getTentCircleName,
  reorderTentCircles,
  saveTentCircle,
  unassignTentCircle,
} from "@/lib/admin/tent-circles-data";
import type { ActionResult, AdminUser, Gender, TentCircleKind } from "@/lib/admin/types";

const t = de.tentCircles;

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

function revalidateCircles(): void {
  revalidatePath("/admin/zeltkreise");
}

// Runs `fn` for the current camp, only after a successful `tentCircles`
// permission check; auth and unexpected failures become German error results.
async function withCurrentCamp(
  fn: (campId: string, admin: AdminUser) => Promise<ActionResult>,
): Promise<ActionResult> {
  let admin: AdminUser;
  try {
    admin = await requirePermission("tentCircles");
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: t.toast.unauthorized };
    console.error("[tent-circles] auth check failed", error);
    return { ok: false, error: t.toast.error };
  }
  try {
    const campId = await getCurrentCampId();
    if (!campId) return { ok: false, error: t.errors.noCurrentCamp };
    return await fn(campId, admin);
  } catch (error) {
    console.error("[tent-circles] action failed", error);
    return { ok: false, error: t.toast.error };
  }
}

function actorLabel(admin: AdminUser): string {
  return admin.name?.trim() || admin.email?.trim() || admin.id;
}

const notFound: ActionResult = { ok: false, error: t.errors.notFound };

// --- circles ------------------------------------------------------------------

type CircleInput = { name: string; kind: string; leaderId: string };

const SAVE_ERRORS: Record<string, { field: "leaderId" | "kind"; message: string }> = {
  leader_taken: { field: "leaderId", message: t.errors.leaderTaken },
  leader_mismatch: { field: "leaderId", message: t.errors.leaderMismatch },
  leader_inactive: { field: "leaderId", message: t.errors.leaderInactive },
};

async function save(
  campId: string,
  admin: AdminUser,
  circleId: string | null,
  values: CircleInput,
): Promise<ActionResult> {
  const parsed = tentCircleSchema.safeParse(values);
  if (!parsed.success) return fieldErrorResult(parsed.error);

  const previousLeader = circleId ? await getTentCircleLeaderName(campId, circleId) : null;
  const result = await saveTentCircle(campId, circleId, parsed.data);

  if (result.status === "kind_conflict") {
    const message = t.errors.kindConflict(result.count);
    return { ok: false, error: message, fieldErrors: { kind: message } };
  }
  const mapped = SAVE_ERRORS[result.status];
  if (mapped) return { ok: false, error: mapped.message, fieldErrors: { [mapped.field]: mapped.message } };
  if ((result.status !== "ok" && result.status !== "ok_leader_moved") || !result.id) return notFound;

  const leader = (await getRegistrationName(parsed.data.leaderId)) ?? "";
  const leaderChange =
    circleId && previousLeader !== leader ? ` · Leitung ${previousLeader ?? "?"} → ${leader}` : "";
  await writeLog({
    actor: actorLabel(admin),
    action: circleId ? "tent_circle.update" : "tent_circle.create",
    message: `${parsed.data.name} (${kindText(parsed.data.kind as TentCircleKind)}, ${leader})${leaderChange}`,
  });
  revalidateCircles();
  return { ok: true, id: result.id, leaderMoved: result.status === "ok_leader_moved" };
}

export async function createTentCircleAction(values: CircleInput): Promise<ActionResult> {
  return withCurrentCamp((campId, admin) => save(campId, admin, null, values));
}

export async function updateTentCircleAction(
  id: string,
  values: CircleInput,
): Promise<ActionResult> {
  return withCurrentCamp(async (campId, admin) => {
    if (!idSchema.safeParse(id).success) return notFound;
    return save(campId, admin, id, values);
  });
}

export async function deleteTentCircleAction(id: string): Promise<ActionResult> {
  return withCurrentCamp(async (campId, admin) => {
    if (!idSchema.safeParse(id).success) return notFound;
    const name = await getTentCircleName(campId, id);
    if (!name) return notFound;
    await deleteTentCircle(campId, id);
    await writeLog({
      level: "warning",
      actor: actorLabel(admin),
      action: "tent_circle.delete",
      message: name,
    });
    revalidateCircles();
    return { ok: true };
  });
}

export async function reorderTentCirclesAction(orderedIds: string[]): Promise<ActionResult> {
  return withCurrentCamp(async (campId) => {
    const parsed = idListSchema.safeParse(orderedIds);
    if (!parsed.success || !(await reorderTentCircles(campId, parsed.data))) return notFound;
    revalidateCircles();
    return { ok: true };
  });
}

/** Participants a delete would release; for the confirm text. */
export async function getTentCircleDeleteImpactAction(id: string): Promise<number | null> {
  const result = await withCurrentCamp(async (campId) => {
    if (!idSchema.safeParse(id).success) return notFound;
    return { ok: true, id: String(await countTentCircleMembers(campId, id)) };
  });
  return result.ok ? Number(result.id) : null;
}

// --- participants -------------------------------------------------------------

export async function assignTentCircleAction(
  registrationId: string,
  circleId: string,
): Promise<ActionResult> {
  return withCurrentCamp(async (campId) => {
    if (!idSchema.safeParse(registrationId).success || !idSchema.safeParse(circleId).success) {
      return notFound;
    }
    const status = await assignTentCircle(campId, registrationId, circleId);
    switch (status) {
      case "ok":
        revalidateCircles();
        return { ok: true, id: circleId };
      case "is_leader":
        return { ok: false, error: t.errors.isLeader };
      case "kind_mismatch":
        return { ok: false, error: t.errors.notFitting };
      case "inactive":
        return { ok: false, error: t.errors.inactive };
      default:
        return notFound;
    }
  });
}

export async function unassignTentCircleAction(registrationId: string): Promise<ActionResult> {
  return withCurrentCamp(async (campId) => {
    if (!idSchema.safeParse(registrationId).success) return notFound;
    await unassignTentCircle(campId, registrationId);
    revalidateCircles();
    return { ok: true };
  });
}

/** Sets a missing gender from the „Geschlecht fehlt“ group (same rules as room planning). */
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
    revalidateCircles();
    revalidatePath("/admin");
    revalidatePath("/admin/zimmerplanung");
    return { ok: true };
  });
}
