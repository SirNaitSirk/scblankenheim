"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import {
  countActiveRegistrationsForTier,
  createPriceTier,
  deletePriceTier,
  endPriceTier,
  getCurrentCampId,
  getPriceTierRef,
  setPriceTierToken,
  updatePriceTier,
  writeLog,
} from "@/lib/admin/data";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import { priceTierSchema } from "@/lib/admin/price-tiers";
import type { ActionResult, AdminUser, PriceTierFormValues } from "@/lib/admin/types";

// --- shared helpers ---------------------------------------------------------

// 24 random bytes → 32 URL safe characters; unguessable invitation secret.
function generateInvitationToken(): string {
  return randomBytes(24).toString("base64url");
}

function fieldErrorResult(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return { ok: false, error: de.pricing.toast.error, fieldErrors };
}

function revalidatePricing(): void {
  revalidatePath("/admin/preise");
  revalidatePath("/admin"); // dashboard shows payment figures
}

// Runs `fn` only after a successful permission check, mapping auth and
// unexpected failures to German error results instead of throwing to the client.
async function runGuarded(
  fn: (admin: AdminUser) => Promise<ActionResult>,
): Promise<ActionResult> {
  let admin: AdminUser;
  try {
    admin = await requirePermission("finances");
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: de.pricing.toast.unauthorized };
    }
    console.error("[pricing] auth check failed", error);
    return { ok: false, error: de.pricing.toast.error };
  }
  try {
    return await fn(admin);
  } catch (error) {
    console.error("[pricing] action failed", error);
    return { ok: false, error: de.pricing.toast.error };
  }
}

// Resolves a tier only when it belongs to the current camp; the admin UI never
// manages tiers of other camps.
async function loadScopedTier(id: string) {
  const [tier, currentCampId] = await Promise.all([
    getPriceTierRef(id),
    getCurrentCampId(),
  ]);
  if (!tier || !currentCampId || tier.campId !== currentCampId) return null;
  return tier;
}

function actorLabel(admin: AdminUser): string {
  return admin.name?.trim() || admin.email?.trim() || admin.id;
}

const notFound: ActionResult = { ok: false, error: de.pricing.errors.notFound };

// --- actions ----------------------------------------------------------------

export async function createPriceTierAction(
  values: PriceTierFormValues,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = priceTierSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);

    const campId = await getCurrentCampId();
    if (!campId) return { ok: false, error: de.pricing.errors.noCurrentCamp };

    const id = await createPriceTier(campId, parsed.data, generateInvitationToken());
    await writeLog({
      actor: actorLabel(admin),
      action: "price_tier.create",
      message: `${parsed.data.name} (${parsed.data.price} €)`,
    });
    revalidatePricing();
    return { ok: true, id };
  });
}

export async function updatePriceTierAction(
  id: string,
  values: PriceTierFormValues,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = priceTierSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);

    const tier = await loadScopedTier(id);
    if (!tier) return notFound;

    await updatePriceTier(id, parsed.data);
    await writeLog({
      actor: actorLabel(admin),
      action: "price_tier.update",
      message: `${parsed.data.name} (${parsed.data.price} €)`,
    });
    revalidatePricing();
    return { ok: true, id };
  });
}

export async function regeneratePriceTierLinkAction(id: string): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const tier = await loadScopedTier(id);
    if (!tier) return notFound;

    await setPriceTierToken(id, generateInvitationToken());
    await writeLog({
      actor: actorLabel(admin),
      action: "price_tier.regenerate_link",
      message: tier.name,
    });
    revalidatePricing();
    return { ok: true, id };
  });
}

export async function endPriceTierAction(id: string): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const tier = await loadScopedTier(id);
    if (!tier) return notFound;

    await endPriceTier(id, tier.validFrom);
    await writeLog({
      actor: actorLabel(admin),
      action: "price_tier.end",
      message: tier.name,
    });
    revalidatePricing();
    return { ok: true, id };
  });
}

export async function deletePriceTierAction(id: string): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const tier = await loadScopedTier(id);
    if (!tier) return notFound;

    if ((await countActiveRegistrationsForTier(id)) > 0) {
      return { ok: false, error: de.pricing.errors.hasRegistrations };
    }

    await deletePriceTier(id);
    await writeLog({
      level: "warning",
      actor: actorLabel(admin),
      action: "price_tier.delete",
      message: tier.name,
    });
    revalidatePricing();
    return { ok: true };
  });
}
