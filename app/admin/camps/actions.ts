"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createCamp,
  deleteCamp,
  setCurrentCamp,
  updateCamp,
  writeLog,
} from "@/lib/admin/data";
import { AuthError, requireAdmin } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import type { ActionResult, AdminUser, CampFormValues, CampInput } from "@/lib/admin/types";

// --- validation -------------------------------------------------------------

function nullify(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function numberOrNull(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

const INTEGER_KEYS = ["capacity", "basePrice", "roomCapacity"] as const;

// Raw string/boolean values in → validated `CampInput` out. Cross-field and
// numeric checks run in `superRefine` so each issue carries a field path;
// `transform` produces the row-ready shape only once validation passed.
const campSchema = z
  .object({
    name: z.string(),
    location: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    capacity: z.string(),
    basePrice: z.string(),
    roomCapacity: z.string(),
    registrationOpen: z.boolean(),
    registrationOpensAt: z.string(),
    registrationClosesAt: z.string(),
    paymentDueDate: z.string(),
    tagline: z.string(),
    description: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.name.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: de.camps.errors.nameRequired,
      });
    }
    for (const key of INTEGER_KEYS) {
      const raw = values[key].trim();
      if (raw !== "" && !/^\d+$/.test(raw)) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: de.camps.errors.invalidNumber,
        });
      }
    }
    if (
      values.startDate.trim() !== "" &&
      values.endDate.trim() !== "" &&
      values.endDate < values.startDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: de.camps.errors.endBeforeStart,
      });
    }
  })
  .transform(
    (values): CampInput => ({
      name: values.name.trim(),
      location: nullify(values.location),
      startDate: nullify(values.startDate),
      endDate: nullify(values.endDate),
      capacity: numberOrNull(values.capacity),
      basePrice: numberOrNull(values.basePrice) ?? 0,
      roomCapacity: numberOrNull(values.roomCapacity),
      registrationOpen: values.registrationOpen,
      registrationOpensAt: nullify(values.registrationOpensAt),
      registrationClosesAt: nullify(values.registrationClosesAt),
      paymentDueDate: nullify(values.paymentDueDate),
      tagline: nullify(values.tagline),
      description: nullify(values.description),
    }),
  );

// --- shared helpers ---------------------------------------------------------

function fieldErrorResult(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return { ok: false, error: de.camps.toast.error, fieldErrors };
}

function revalidateCamps(): void {
  revalidatePath("/admin/camps");
  revalidatePath("/admin"); // dashboard reads the current camp
  revalidatePath("/"); // landing page reads the current camp
}

// Runs `fn` only after a successful admin check, mapping auth and unexpected
// failures to German error results instead of throwing to the client.
async function runGuarded(
  fn: (admin: AdminUser) => Promise<ActionResult>,
): Promise<ActionResult> {
  let admin: AdminUser;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: de.camps.toast.unauthorized };
    }
    console.error("[camps] auth check failed", error);
    return { ok: false, error: de.camps.toast.error };
  }
  try {
    return await fn(admin);
  } catch (error) {
    console.error("[camps] action failed", error);
    return { ok: false, error: de.camps.toast.error };
  }
}

function actorLabel(admin: AdminUser): string {
  return admin.name?.trim() || admin.email?.trim() || admin.id;
}

// --- actions ----------------------------------------------------------------

export async function createCampAction(
  values: CampFormValues,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = campSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);

    const id = await createCamp(parsed.data);
    await writeLog({
      actor: actorLabel(admin),
      action: "camp.create",
      message: parsed.data.name,
    });
    revalidateCamps();
    return { ok: true, id };
  });
}

export async function updateCampAction(
  id: string,
  values: CampFormValues,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = campSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);

    await updateCamp(id, parsed.data);
    await writeLog({
      actor: actorLabel(admin),
      action: "camp.update",
      message: parsed.data.name,
    });
    revalidateCamps();
    return { ok: true, id };
  });
}

export async function deleteCampAction(id: string): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    await deleteCamp(id);
    await writeLog({
      level: "warning",
      actor: actorLabel(admin),
      action: "camp.delete",
      message: id,
    });
    revalidateCamps();
    return { ok: true };
  });
}

export async function setCurrentCampAction(id: string): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    await setCurrentCamp(id);
    await writeLog({
      actor: actorLabel(admin),
      action: "camp.set_current",
      message: id,
    });
    revalidateCamps();
    return { ok: true };
  });
}
