import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { isUniqueViolation } from "@/lib/admin/data";
import { PAYMENT_LINK_COOLDOWN_MS, STALE_SENDING_MS, TEST_SEND_COOLDOWN_MS } from "./limits";
import type { SendError } from "./provider";
import { MAIL_HISTORY_LIMIT, toMailHistory, type MailHistoryEntry } from "./history";
import { isInfoKind, type InfoMailKind } from "./info-mails";
import type { ReminderKind } from "./templates";

/**
 * Delivery records in `email_deliveries` (research R4). A claim inserts a
 * `sending` row; the partial unique index rejects a second confirmation or
 * reminder of the same kind, which is how duplicates are prevented even when
 * runs overlap. No address or body is stored.
 */

export type EmailKind = "confirmation" | "payment_link" | ReminderKind | InfoMailKind;
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

/**
 * Claims an admin test send (specs/016-mail-settings, research R7): a row
 * without registration, so it counts against the daily quota but never shows
 * in a registration's mail history.
 */
export async function claimTestDelivery(actorId: string): Promise<{ id: string }> {
  const { data, error } = await getServiceClient()
    .from("email_deliveries")
    .insert({
      registration_id: null,
      kind: "test",
      status: "sending",
      trigger: "admin",
      actor: actorId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}

/**
 * Claims a team notification for a participant message (specs/018-participant-messages,
 * research R5). Team mails may repeat per registration, so no unique check applies.
 */
export async function claimTeamDelivery(registrationId: string): Promise<{ id: string }> {
  const { data, error } = await getServiceClient()
    .from("email_deliveries")
    .insert({
      registration_id: registrationId,
      kind: "team_message",
      status: "sending",
      trigger: "participant",
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}

/** Whether this admin sent a test within the cooldown. */
export async function testOnCooldown(actorId: string, now: Date = new Date()): Promise<boolean> {
  const since = new Date(now.getTime() - TEST_SEND_COOLDOWN_MS).toISOString();
  const { data, error } = await getServiceClient()
    .from("email_deliveries")
    .select("id")
    .eq("kind", "test")
    .eq("actor", actorId)
    .in("status", ["sending", "sent"])
    .gte("created_at", since)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
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
      if (!row.registration_id || !isReminderKind(row.kind)) continue;
      const entry = history.get(row.registration_id) ?? { kinds: [], lastSentAt: null };
      entry.kinds.push(row.kind);
      if (!entry.lastSentAt || row.updated_at > entry.lastSentAt) entry.lastSentAt = row.updated_at;
      history.set(row.registration_id, entry);
    }
  }
  return history;
}

export type InfoHistory = { kinds: InfoMailKind[]; lastSentAt: string | null };

/** Sent info mails per registration (specs/012-info-mails), chunked like `reminderHistory`. */
export async function infoHistory(
  registrationIds: readonly string[],
): Promise<Map<string, InfoHistory>> {
  const history = new Map<string, InfoHistory>();
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
      if (!row.registration_id || !isInfoKind(row.kind)) continue;
      const entry = history.get(row.registration_id) ?? { kinds: [], lastSentAt: null };
      entry.kinds.push(row.kind);
      if (!entry.lastSentAt || row.updated_at > entry.lastSentAt) entry.lastSentAt = row.updated_at;
      history.set(row.registration_id, entry);
    }
  }
  return history;
}

/** Mails of any kind sent or in flight since `isoStart`; counts against the daily quota. */
export async function countDeliveriesSince(isoStart: string): Promise<number> {
  const { count, error } = await getServiceClient()
    .from("email_deliveries")
    .select("id", { count: "exact", head: true })
    .in("status", ["sending", "sent"])
    .gte("created_at", isoStart);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Every delivery attempt of one registration for the admin dialog
 * (specs/013-registration-mail-history, research R2), newest first. Admin
 * names come from `profiles`: name first, then email.
 */
export async function getMailHistory(registrationId: string): Promise<MailHistoryEntry[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("email_deliveries")
    .select("id, kind, status, trigger, actor, error, created_at, updated_at")
    .eq("registration_id", registrationId)
    .neq("kind", "team_message") // mails to the team are not mails to the person
    .order("created_at", { ascending: false })
    .limit(MAIL_HISTORY_LIMIT);
  if (error) throw error;
  const rows = data ?? [];

  const actorIds = [...new Set(rows.map((row) => row.actor).filter((id): id is string => Boolean(id)))];
  const names = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", actorIds);
    if (profileError) throw profileError;
    for (const profile of profiles ?? []) {
      const label = profile.name?.trim() || profile.email?.trim();
      if (label) names.set(profile.id, label);
    }
  }
  return toMailHistory(rows, names);
}

/** History for a registration reference; null when no registration has it. */
export async function getMailHistoryByReference(
  reference: string,
): Promise<MailHistoryEntry[] | null> {
  const { data, error } = await getServiceClient()
    .from("registrations")
    .select("id")
    .eq("reference", reference)
    .maybeSingle();
  if (error) throw error;
  return data ? getMailHistory(data.id) : null;
}
