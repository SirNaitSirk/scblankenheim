"use server";

import { revalidatePath } from "next/cache";
import {
  buildMetricCatalog,
  dashboardMetricsSchema,
  sanitizeSelection,
} from "@/lib/admin/dashboard-metrics";
import {
  getCampFormFields,
  getCurrentCamp,
  updateProfileDashboardMetrics,
} from "@/lib/admin/data";
import { AuthError, requireAdmin } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import type { ActionResult } from "@/lib/admin/types";

/**
 * Self-service: persists the caller's own dashboard metric selection. Any admin
 * may edit their own preference (guarded by `requireAdmin`, not a permission).
 * The write is scoped strictly to the Clerk session id — never a client value.
 */
export async function updateDashboardMetrics(
  metrics: unknown,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const parsed = dashboardMetricsSchema.safeParse(metrics);
    if (!parsed.success) {
      return { ok: false, error: de.dashboard.customize.error };
    }

    // Validate against the current camp's catalog so stale/unknown references
    // are dropped and the selection is capped before it is stored.
    const camp = await getCurrentCamp();
    const fields = camp ? await getCampFormFields(camp.id) : [];
    const sanitized = sanitizeSelection(parsed.data, buildMetricCatalog(fields));

    await updateProfileDashboardMetrics(admin.id, sanitized);
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: de.dashboard.customize.error };
    }
    throw error;
  }
}
