import "server-only";

import { countDeliveriesToday, lastDeliveryAt } from "@/lib/email/deliveries";
import { getServiceClient } from "@/lib/supabase/server";
import { getReleaseSettings } from "./data";
import { LINK_IP_MAX, LINK_IP_WINDOW_MS } from "./limits";
import { mayReceiveLinkMail, normalizeEmail } from "./link-rules";
import { isReleaseActive } from "./settings";

/**
 * Server only lookups of the participant link request (specs/020-school-release,
 * US2, research R6). Nothing here reaches the response: the landing action
 * answers the same for a match and for no match.
 */

/** Counts this ip's link requests within the window and records the current one. */
export async function isLinkThrottled(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const supabase = getServiceClient();
  const since = new Date(Date.now() - LINK_IP_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("submission_attempts")
    .select("id", { count: "exact", head: true })
    .eq("kind", "participant_link")
    .eq("ip", ip)
    .gte("created_at", since);
  await supabase.from("submission_attempts").insert({ ip, kind: "participant_link" });
  return (count ?? 0) >= LINK_IP_MAX;
}

/**
 * Active, not deleted registrations of the current camp with this address.
 * Empty when there is no current camp or the release is off for it. Rows are
 * matched in JS so case and spaces in stored addresses do not matter.
 */
export async function findLinkTargets(email: string): Promise<string[]> {
  const wanted = normalizeEmail(email);
  if (!wanted) return [];
  const supabase = getServiceClient();
  const { data: settings, error: settingsError } = await supabase
    .from("camp_settings")
    .select("current_camp_id")
    .maybeSingle();
  if (settingsError) throw settingsError;
  const campId = settings?.current_camp_id ?? null;
  if (!campId || !isReleaseActive(await getReleaseSettings(campId))) return [];

  const { data, error } = await supabase
    .from("registrations")
    .select("id, email, status")
    .eq("camp_id", campId)
    .eq("deleted", false)
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []).filter((row) => normalizeEmail(row.email) === wanted).map((row) => row.id);
}

/** Cooldown and day limit per registration. */
export async function mayReceiveLink(registrationId: string): Promise<boolean> {
  const [last, today] = await Promise.all([
    lastDeliveryAt(registrationId, "participant_link"),
    countDeliveriesToday(registrationId, "participant_link"),
  ]);
  return mayReceiveLinkMail(last, today);
}
