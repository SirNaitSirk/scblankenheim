import "server-only";

import { getServiceClient } from "@/lib/supabase/server";

/**
 * Whether the Clerk user has an admin profile (research R3). Same rule as
 * `getCurrentProfile`, but read only and without touching `last_active_at`.
 * Any error counts as not admin, so the gate fails closed.
 */
export async function isAdminUserId(userId: string): Promise<boolean> {
  try {
    const { data, error } = await getServiceClient()
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    return !error && data !== null;
  } catch {
    return false;
  }
}
