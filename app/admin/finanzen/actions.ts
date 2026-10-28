"use server";

import { revalidatePath } from "next/cache";
import { setRegistrationFinance, setRemindersPaused, writeLog } from "@/lib/admin/data";
import { financeUpdateSchema, reminderPauseSchema } from "@/lib/admin/finance";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { de, PAYMENT_STATUS_LABELS } from "@/lib/admin/messages";
import type { ActionResult, AdminUser } from "@/lib/admin/types";
import { sendPaymentLinkEmail, type PaymentLinkOutcome } from "@/lib/email/send";
import { formatCurrency } from "@/lib/format";

const t = de.finances.toast;

// Finance writes need the `finances` permission, not `registrations`, so the
// accountant can reconcile payments without editing registrations.
async function runFinanceGuarded(
  fn: (admin: AdminUser) => Promise<ActionResult>,
): Promise<ActionResult> {
  let admin: AdminUser;
  try {
    admin = await requirePermission("finances");
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: t.unauthorized };
    console.error("[finances] auth check failed", error);
    return { ok: false, error: t.error };
  }
  try {
    return await fn(admin);
  } catch (error) {
    console.error("[finances] action failed", error);
    return { ok: false, error: t.error };
  }
}

function actorLabel(admin: AdminUser): string {
  return admin.name?.trim() || admin.email?.trim() || admin.id;
}

function revalidateFinanceViews(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/finanzen");
  revalidatePath("/admin/preise");
}

export async function updateRegistrationFinanceAction(input: {
  reference: string;
  amountPaid: number;
  payment: string;
}): Promise<ActionResult> {
  return runFinanceGuarded(async (admin) => {
    const parsed = financeUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: de.finances.editor.invalidAmount,
        fieldErrors: { amountPaid: de.finances.editor.invalidAmount },
      };
    }
    const { reference, amountPaid, payment } = parsed.data;

    const change = await setRegistrationFinance(reference, { amountPaid, payment });
    if (!change) return { ok: false, error: t.notFound };

    const describe = (v: typeof change.before) =>
      `${formatCurrency(v.amountPaid)} ${PAYMENT_STATUS_LABELS[v.payment]}`;
    await writeLog({
      actor: actorLabel(admin),
      action: "registration.finance",
      message: `${reference} ${change.name} · ${describe(change.before)} → ${describe(change.after)}`,
    });
    revalidateFinanceViews();
    return { ok: true };
  });
}

const PAYMENT_LINK_ERRORS: Record<Exclude<PaymentLinkOutcome, "sent">, string> = {
  failed: de.paymentLink.failed,
  not_eligible: de.paymentLink.notDue,
  no_email: de.paymentLink.noEmail,
  cooldown: de.paymentLink.cooldown,
};

// Same mail and rules as the registration dialog (specs/007-transactional-emails);
// the mail module writes the log entry.
export async function sendFinancePaymentLinkAction(reference: string): Promise<ActionResult> {
  return runFinanceGuarded(async (admin) => {
    const parsed = financeUpdateSchema.shape.reference.safeParse(reference);
    if (!parsed.success) return { ok: false, error: t.error };

    const outcome = await sendPaymentLinkEmail(parsed.data, {
      id: admin.id,
      label: actorLabel(admin),
    });
    if (outcome !== "sent") return { ok: false, error: PAYMENT_LINK_ERRORS[outcome] };
    revalidatePath("/admin/finanzen");
    return { ok: true };
  });
}

// Same pause as the registration dialog (specs/016-mail-settings, US1), gated
// by `finances` so the accountant can pause without editing registrations.
export async function setFinanceReminderPauseAction(
  reference: string,
  paused: boolean,
): Promise<ActionResult> {
  return runFinanceGuarded(async (admin) => {
    const parsed = reminderPauseSchema.safeParse({ reference, paused });
    if (!parsed.success) return { ok: false, error: t.error };

    const result = await setRemindersPaused(parsed.data.reference, parsed.data.paused);
    if (!result) return { ok: false, error: de.registrations.reminderPause.notFound };

    await writeLog({
      actor: actorLabel(admin),
      action: parsed.data.paused ? "registration.reminders_paused" : "registration.reminders_resumed",
      message: `${parsed.data.reference} ${result.name}`.trim(),
    });
    revalidateFinanceViews();
    return { ok: true };
  });
}
