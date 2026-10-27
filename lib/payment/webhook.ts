import "server-only";

import type Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/server";
import { writeLog } from "@/lib/admin/data";
import { mapEventToPaymentUpdate, type PaymentUpdate } from "@/lib/payment/events";
import {
  derivePaymentState,
  isStripePaymentStatus,
  nextRowStatus,
  type StripePaymentRow,
} from "@/lib/payment/status";

/**
 * Applies a verified Stripe event (specs/006-stripe-payment, research R4 to R7).
 * The event id is recorded first so a repeated delivery is a no op; the payment
 * row is updated; the registration's status and amount are then recomputed
 * from all of its payment rows.
 */

export type WebhookOutcome = "processed" | "duplicate" | "ignored";

const UNIQUE_VIOLATION = "23505";

type PaymentRowRecord = {
  registration_id: string;
  status: string;
  refunded_cents: number;
};

async function findPaymentRow(paymentIntentId: string): Promise<PaymentRowRecord | null> {
  const { data, error } = await getServiceClient()
    .from("stripe_payments")
    .select("registration_id, status, refunded_cents")
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function registrationExists(registrationId: string): Promise<boolean> {
  const { data, error } = await getServiceClient()
    .from("registrations")
    .select("id")
    .eq("id", registrationId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

/** Writes the payment row; returns the affected registration id, or null if unknown. */
async function applyUpdate(update: PaymentUpdate): Promise<string | null> {
  const supabase = getServiceClient();
  const existing = await findPaymentRow(update.paymentIntentId);
  const now = new Date().toISOString();

  if (update.kind === "refund") {
    if (!existing) return null;
    const { error } = await supabase
      .from("stripe_payments")
      .update({
        refunded_cents: Math.max(existing.refunded_cents, update.refundedCents),
        updated_at: now,
      })
      .eq("payment_intent_id", update.paymentIntentId);
    if (error) throw error;
    return existing.registration_id;
  }

  const registrationId = existing?.registration_id ?? update.registrationId;
  if (!registrationId || !(await registrationExists(registrationId))) return null;

  const current =
    existing && isStripePaymentStatus(existing.status) ? existing.status : null;
  const { error } = await supabase.from("stripe_payments").upsert(
    {
      registration_id: registrationId,
      payment_intent_id: update.paymentIntentId,
      checkout_session_id: update.checkoutSessionId,
      status: nextRowStatus(current, update.status),
      amount_cents: update.amountCents,
      updated_at: now,
    },
    { onConflict: "payment_intent_id" },
  );
  if (error) throw error;
  return registrationId;
}

/** Recomputes payment_status and amount_paid from all payment rows. */
async function recomputeRegistration(registrationId: string): Promise<void> {
  const supabase = getServiceClient();

  const [registrationRes, rowsRes] = await Promise.all([
    supabase
      .from("registrations")
      .select("reference, amount_due")
      .eq("id", registrationId)
      .single(),
    supabase
      .from("stripe_payments")
      .select("status, amount_cents, refunded_cents")
      .eq("registration_id", registrationId),
  ]);
  if (registrationRes.error) throw registrationRes.error;
  if (rowsRes.error) throw rowsRes.error;

  const rows: StripePaymentRow[] = (rowsRes.data ?? []).flatMap((row) =>
    isStripePaymentStatus(row.status)
      ? [{ status: row.status, amountCents: row.amount_cents, refundedCents: row.refunded_cents }]
      : [],
  );
  const state = derivePaymentState(registrationRes.data.amount_due, rows);

  const { error } = await supabase
    .from("registrations")
    .update({
      payment_status: state.paymentStatus,
      amount_paid: state.amountPaid,
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId);
  if (error) throw error;

  await writeLog({
    action: `payment.${state.paymentStatus}`,
    message: `${registrationRes.data.reference} · ${state.amountPaid} €`,
  });
}

export async function handleStripeEvent(event: Stripe.Event): Promise<WebhookOutcome> {
  const update = mapEventToPaymentUpdate(event);
  if (!update) return "ignored";

  const supabase = getServiceClient();
  const { error: insertError } = await supabase
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (insertError) {
    if (insertError.code === UNIQUE_VIOLATION) return "duplicate";
    throw insertError;
  }

  try {
    const registrationId = await applyUpdate(update);
    if (!registrationId) {
      await writeLog({
        level: "warning",
        action: "payment.unknown_registration",
        message: `${event.type} · ${update.paymentIntentId}`,
      });
      return "processed";
    }
    await recomputeRegistration(registrationId);
    return "processed";
  } catch (err) {
    // Forget the event so Stripe's retry processes it again.
    await supabase.from("stripe_events").delete().eq("id", event.id);
    throw err;
  }
}
