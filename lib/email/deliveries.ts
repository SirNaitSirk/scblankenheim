import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { isUniqueViolation } from "@/lib/admin/data";
import { PAYMENT_LINK_COOLDOWN_MS, STALE_SENDING_MS } from "./limits";
import type { SendError } from "./provider";
import type { ReminderKind } from "./templates";

/**
 * Delivery records in `email_deliveries` (research R4). A claim inserts a
 * `sending` row; the partial unique index rejects a second confirmation or
 * reminder of the same kind, which is how duplicates are prevented even when
 * runs overlap. No address or body is stored.
 */

export type EmailKind = "confirmation" | "payment_link" | ReminderKind;
export type DeliveryTrigger = "registration" | "cron" | "admin";
export type DeliveryError = SendError | "stale";

export const REMINDER_KINDS: readonly ReminderKind[] = ["reminder_1", "reminder_2", "reminder_3"];

export function isReminderKind(kind: string): kind is ReminderKind {
  return (REMINDER_KINDS as readonly string[]).includes(kind);
}

/** Claims a send; null when this mail was already sent or is in flight. */
export async function claimDelivery(input: {
  registrationId: string;
  kind: EmailKind;
  trigger: DeliveryTrigger;
  actor?: string | null;
}): Promise<{ id: string } | null> {
  const { data, error } = await getServiceClient()
    .from("email_deliveries")
    .insert({
      registration_id: input.registrationId,
      kind: input.kind,
      status: "sending",
      trigger: input.trigger,
      actor: input.actor ?? null,
    })
    .select("id")
    .single();
  if (error) {
    if (isUniqueViolation(error)) return null;
    throw error;
  }
  return { id: data.id };
}

export async function markSent(id: string, providerMessageId: string | null): Promise<void> {
  await getServiceClient()
    .from("email_deliveries")
    .update({ status: "sent", provider_message_id: providerMessageId, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function markFailed(id: string, error: DeliveryError): Promise<void> {
  await getServiceClient()
    .from("email_deliveries")
    .update({ status: "failed", error, updated_at: new Date().toISOString() })
    .eq("id", id);
}

/** Rows stuck in `sending` (crash between claim and update) become retryable. */
export async function failStaleDeliveries(now: Date = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - STALE_SENDING_MS).toISOString();
  await getServiceClient()
    .from("email_deliveries")
    .update({ status: "failed", error: "stale", updated_at: now.toISOString() })
    .eq("status", "sending")
    .lt("created_at", cutoff);
}

/** Whether a payment link mail for this registration went out within the cooldown. */
export async function paymentLinkOnCooldown(
  registrationId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const since = new Date(now.getTime() - PAYMENT_LINK_COOLDOWN_MS).toISOString();
  const { data } = await getServiceClient()
    .from("email_deliveries")
    .select("id")
    .eq("registration_id", registrationId)
    .eq("kind", "payment_link")
    .in("status", ["sending", "sent"])
    .gte("created_at", since)
    .limit(1);
  return (data ?? []).length > 0;
}

export type ReminderHistory = { kinds: ReminderKind[]; lastSentAt: string | null };

/**
 * Sent reminders per registration. Rows are fetched by id and filtered in JS
 * (AGENTS.md: no filters on joined tables). Ids are chunked to keep URLs short.
 */
export async function reminderHistory(
  registrationIds: readonly string[],
): Promise<Map<string, ReminderHistory>> {
  const history = new Map<string, ReminderHistory>();
  const supabase = getServiceClient();
  const CHUNK = 100;

  for (let i = 0; i < registrationIds.length; i += CHUNK) {
    const ids = registrationIds.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("email_deliveries")
      .select("registration_id, kind, status, updated_at")
      .in("registration_id", ids)
      .eq("status", "sent");
    if (error) throw error;

    for (const row of data ?? []) {
      if (!isReminderKind(row.kind)) continue;
      const entry = history.get(row.registration_id) ?? { kinds: [], lastSentAt: null };
      entry.kinds.push(row.kind);
      if (!entry.lastSentAt || row.updated_at > entry.lastSentAt) entry.lastSentAt = row.updated_at;
      history.set(row.registration_id, entry);
    }
  }
  return history;
}
