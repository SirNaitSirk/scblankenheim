import "server-only";

import { headers } from "next/headers";
import { getServiceClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/lib/admin/types";
import type { PayableRegistration } from "@/lib/payment/eligibility";
import {
  PAYMENT_THROTTLE_MAX,
  PAYMENT_THROTTLE_WINDOW_MS,
  REFERENCE_MAX_LENGTH,
} from "@/lib/payment/limits";

/**
 * Public lookup by registration reference for the payment pages
 * (specs/006-stripe-payment, research R10). Returns only what those pages may
 * show: first name, camp name and amounts. Never last name, email or answers.
 */

export type PublicRegistration = PayableRegistration & {
  id: string;
  reference: string;
  firstName: string;
  campName: string;
};

/** Trimmed, uppercased reference, or null when it cannot be one. */
export function normalizeReference(value: string | string[] | undefined): string | null {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toUpperCase();
  if (!raw || raw.length > REFERENCE_MAX_LENGTH) return null;
  return raw;
}

export async function findRegistrationByReference(
  reference: string,
): Promise<PublicRegistration | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("registrations")
    .select(
      "id, reference, camp_id, first_name, amount_due, amount_paid, payment_status, status, deleted",
    )
    .eq("reference", reference)
    .maybeSingle();
  if (error || !data || data.deleted) return null;

  const { data: camp } = await supabase
    .from("camps")
    .select("name")
    .eq("id", data.camp_id)
    .maybeSingle();

  return {
    id: data.id,
    reference: data.reference,
    firstName: data.first_name ?? "",
    campName: camp?.name ?? "",
    amountDue: data.amount_due,
    amountPaid: data.amount_paid,
    paymentStatus: data.payment_status as PaymentStatus,
    status: data.status,
    deleted: data.deleted,
  };
}

/** First hop of `x-forwarded-for` for the current request, or null. */
export async function requestIp(): Promise<string | null> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0]!.trim() : null;
}

/**
 * Counts this ip's payment lookups and checkout posts within the window and
 * records the current one. Separate from the registration throttle (`kind`).
 */
export async function isPaymentThrottled(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const supabase = getServiceClient();
  const since = new Date(Date.now() - PAYMENT_THROTTLE_WINDOW_MS).toISOString();

  const { count } = await supabase
    .from("submission_attempts")
    .select("id", { count: "exact", head: true })
    .eq("kind", "payment")
    .eq("ip", ip)
    .gte("created_at", since);

  await supabase.from("submission_attempts").insert({ ip, kind: "payment" });

  return (count ?? 0) >= PAYMENT_THROTTLE_MAX;
}
