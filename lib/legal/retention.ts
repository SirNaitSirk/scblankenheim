import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { attemptRetentionCutoff } from "./limits";

/**
 * Deletes throttling rows (IP address, time) older than the stated retention, so the
 * privacy policy's „7 Tage“ holds (specs/025-legal-pages, research R6).
 */
export async function purgeOldSubmissionAttempts(now: Date = new Date()): Promise<void> {
  const { error } = await getServiceClient()
    .from("submission_attempts")
    .delete()
    .lt("created_at", attemptRetentionCutoff(now));
  if (error) throw error;
}
