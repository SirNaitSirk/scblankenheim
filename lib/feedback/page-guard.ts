import "server-only";

import { redirect } from "next/navigation";
import { canUseSection } from "@/lib/admin/access";
import { guardTab } from "@/lib/admin/guard";
import type { AdminUser } from "@/lib/admin/types";

/**
 * Feedback pages show free texts, so seeing the tab is not enough: reading needs
 * the `feedback` permission as well (research R10).
 */
export async function guardFeedbackPage(): Promise<AdminUser> {
  const profile = await guardTab("/admin/feedback");
  if (!canUseSection(profile, "feedback")) redirect("/admin");
  return profile;
}
