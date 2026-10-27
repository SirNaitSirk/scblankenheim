import "server-only";

import { getServiceClient } from "@/lib/supabase/server";

/**
 * Hidden price tiers reached through a personal invitation link
 * (`/?einladung=<token>`). Server only: hidden tiers are invisible to the anon
 * client, and the price must never reach the public page (research R4).
 */

export type ValidTier = { id: string; price: number };

/**
 * The tier behind a token, or null. Valid means: the token exists, the tier
 * belongs to the given camp, and now lies inside its validity window.
 */
export async function findValidTier(
  campId: string,
  token: string,
): Promise<ValidTier | null> {
  const supabase = getServiceClient();
  const { data: tier } = await supabase
    .from("price_tiers")
    .select("id, price, camp_id, valid_from, valid_until")
    .eq("invitation_token", token)
    .maybeSingle();

  if (!tier || tier.camp_id !== campId) return null;

  const now = Date.now();
  if (tier.valid_from && new Date(tier.valid_from).getTime() > now) return null;
  if (tier.valid_until && new Date(tier.valid_until).getTime() < now) return null;

  return { id: tier.id, price: tier.price };
}

/** Whether a token is usable for the camp. Never exposes the price. */
export async function resolveInvitation(
  campId: string,
  token: string,
): Promise<{ valid: boolean }> {
  try {
    return { valid: (await findValidTier(campId, token)) !== null };
  } catch {
    return { valid: false };
  }
}
