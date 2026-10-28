import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { resolveMailSettings } from "@/lib/admin/camp-mail-info";
import { getCampMailInfo } from "@/lib/admin/camp-mail-info-data";
import { getCurrentCamp, writeLog } from "@/lib/admin/data";
import { outstandingAmount, type PayableRegistration } from "@/lib/payment/eligibility";
import type { PaymentStatus } from "@/lib/admin/types";
import { berlinDate, berlinDayStartIso } from "@/lib/time/berlin";
import { checkoutEligibility } from "@/lib/payment/eligibility";
import {
  claimDelivery,
  claimTestDelivery,
  countDeliveriesSince,
  testOnCooldown,
  failStaleDeliveries,
  paymentLinkOnCooldown,
  markFailed,
  markSent,
  reminderHistory,
  type DeliveryTrigger,
  type EmailKind,
} from "./deliveries";
import {
  CONFIRMATION_RESERVE,
  DAILY_EMAIL_BUDGET,
  REMINDER_RUN_CAP,
  SEND_SPACING_MS,
} from "./limits";
import { emailMessages } from "./messages";
import { renderTemplate, type TemplateId } from "./preview";
import { nextReminder } from "./reminders";
import { toCampEvent } from "@/lib/calendar/ics";
import { appBaseUrl, calendarLinks, participantUrl, paymentUrl } from "./links";
import { sendEmail } from "./provider";
import type { CampMailSettings } from "./settings";
import {
  confirmationEmail,
  paymentLinkEmail,
  reminderEmail,
  type EmailContext,
  type RenderedEmail,
} from "./templates";

/**
 * Sending entry points (specs/007-transactional-emails). Every function here
 * swallows its own failures and logs them: a mail problem must never break
 * registration, payment or the cron run (FR-006). Logs carry kind and
 * reference only, never the address or the body (FR-007).
 */

export type DeliveryOutcome = "sent" | "failed" | "skipped";

/** Registration plus camp data needed to address and render a mail. */
export type MailTarget = {
  registrationId: string;
  email: string | null;
  payable: PayableRegistration;
  context: EmailContext | null; // null when APP_URL is missing
  reference: string;
  settings: CampMailSettings; // per camp mail settings (specs/016-mail-settings)
};

export const REGISTRATION_COLUMNS =
  "id, reference, camp_id, first_name, email, status, payment_status, amount_due, amount_paid, deleted, registered_at, reminders_paused, access_token";

export type RegistrationRow = {
  id: string;
  reference: string;
  camp_id: string;
  first_name: string | null;
  email: string | null;
  status: string;
  payment_status: string;
  amount_due: number;
  amount_paid: number;
  deleted: boolean;
  registered_at: string;
  reminders_paused: boolean;
  access_token: string;
};

export type CampRow = {
  id: string;
  name: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  payment_due_date: string | null;
};

export function buildMailTarget(
  registration: RegistrationRow,
  camp: CampRow,
  settings: CampMailSettings,
): MailTarget {
  const payable: PayableRegistration = {
    amountDue: registration.amount_due,
    amountPaid: registration.amount_paid,
    paymentStatus: registration.payment_status as PaymentStatus,
    status: registration.status,
    deleted: registration.deleted,
  };
  const payUrl = paymentUrl(registration.reference);
  const ownPageUrl = participantUrl(registration.access_token);
  const base = appBaseUrl();
  const calendar = calendarLinks(base ? toCampEvent(camp, base) : null);
  const email = registration.email?.trim() || null;

  return {
    registrationId: registration.id,
    email,
    payable,
    reference: registration.reference,
    settings,
    context:
      payUrl && ownPageUrl
        ? {
            firstName: registration.first_name?.trim() || null,
            campName: camp.name,
            campStart: camp.start_date,
            campEnd: camp.end_date,
            reference: registration.reference,
            amountDue: registration.amount_due,
            outstanding: outstandingAmount(payable),
            paymentDueDate: camp.payment_due_date,
            payUrl,
            participantUrl: ownPageUrl,
            calendar,
            texts: settings.texts,
          }
        : null,
  };
}

/** Loads one registration with its camp; null when either is missing. */
export async function loadMailTarget(registrationId: string): Promise<MailTarget | null> {
  const supabase = getServiceClient();
  const { data: registration } = await supabase
    .from("registrations")
    .select(REGISTRATION_COLUMNS)
    .eq("id", registrationId)
    .maybeSingle();
  if (!registration) return null;

  const { data: camp } = await supabase
    .from("camps")
    .select("id, name, start_date, end_date, payment_due_date, location")
    .eq("id", registration.camp_id)
    .maybeSingle();
  if (!camp) return null;

  const mailInfo = await getCampMailInfo(registration.camp_id);
  return buildMailTarget(registration, camp, resolveMailSettings(mailInfo));
}

/**
 * Claims, sends and records one mail. Skips without an address or without
 * `APP_URL`; skips silently when the same mail was already sent.
 */
export async function deliver(input: {
  target: MailTarget;
  kind: EmailKind;
  trigger: DeliveryTrigger;
  actor?: { id: string; label: string } | null;
  render: (context: EmailContext) => RenderedEmail;
}): Promise<DeliveryOutcome> {
  const { target, kind, trigger } = input;
  const label = `${kind} ${target.reference}`;
  const logActor = input.actor?.label ?? null;

  if (!target.email || !target.context) {
    await writeLog({
      level: "warning",
      actor: logActor,
      action: "email.skipped",
      message: `${label}: ${target.email ? "APP_URL fehlt" : "keine Mailadresse"}`,
    });
    return "skipped";
  }

  try {
    const claim = await claimDelivery({
      registrationId: target.registrationId,
      kind,
      trigger,
      actor: input.actor?.id ?? null,
    });
    if (!claim) return "skipped";

    const rendered = input.render(target.context);
    const idempotencyKey =
      kind === "payment_link" ? `payment_link/${claim.id}` : `${kind}/${target.registrationId}`;
    const result = await sendEmail(
      { to: target.email, ...rendered },
      idempotencyKey,
      target.settings.sender,
    );

    if (result.ok) {
      await markSent(claim.id, result.id);
      await writeLog({ actor: logActor, action: "email.sent", message: label });
      return "sent";
    }

    await markFailed(claim.id, result.error);
    await writeLog({
      level: "warning",
      actor: logActor,
      action: "email.failed",
      message: `${label}: ${result.error}`,
    });
    return "failed";
  } catch {
    await writeLog({
      level: "warning",
      actor: logActor,
      action: "email.failed",
      message: `${label}: database`,
    });
    return "failed";
  }
}

/** Registration confirmation (US1). Runs after the register response via `after()`. */
export async function sendConfirmationEmail(registrationId: string): Promise<void> {
  try {
    const target = await loadMailTarget(registrationId);
    if (!target) {
      await writeLog({ level: "warning", action: "email.skipped", message: `confirmation ${registrationId}: nicht gefunden` });
      return;
    }
    await deliver({ target, kind: "confirmation", trigger: "registration", render: confirmationEmail });
  } catch {
    await writeLog({ level: "warning", action: "email.failed", message: `confirmation ${registrationId}` });
  }
}

export type ReminderRunSummary = {
  sent: number;
  failed: number;
  skipped: number;
  capped: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Daily reminder run (US2). Loads the current camp's registrations, oldest
 * first, asks `nextReminder` for each and sends at most `REMINDER_RUN_CAP`
 * mails. Never changes a registration (FR-017). Throws only when the camp or
 * registrations cannot be loaded; the route logs that.
 */
export async function runPaymentReminders(
  today: string = berlinDate(new Date()),
): Promise<ReminderRunSummary> {
  const summary: ReminderRunSummary = { sent: 0, failed: 0, skipped: 0, capped: false };
  const supabase = getServiceClient();

  await failStaleDeliveries();

  const { data: settings, error: settingsError } = await supabase
    .from("camp_settings")
    .select("current_camp_id")
    .maybeSingle();
  if (settingsError) throw settingsError;
  const campId = settings?.current_camp_id ?? null;

  const { data: camp, error: campError } = campId
    ? await supabase
        .from("camps")
        .select("id, name, start_date, end_date, payment_due_date, location")
        .eq("id", campId)
        .maybeSingle()
    : { data: null, error: null };
  if (campError) throw campError;

  if (!campId || !camp) {
    await writeLog({ action: "reminders.run", message: "Kein aktuelles Camp, nichts verschickt" });
    return summary;
  }

  const { data: registrations, error } = await supabase
    .from("registrations")
    .select(REGISTRATION_COLUMNS)
    .eq("camp_id", campId)
    .eq("deleted", false)
    .order("registered_at", { ascending: true });
  if (error) throw error;

  const rows = registrations ?? [];
  const history = await reminderHistory(rows.map((row) => row.id));
  const mailSettings = resolveMailSettings(await getCampMailInfo(campId));

  for (const row of rows) {
    const target = buildMailTarget(row, camp, mailSettings);
    const past = history.get(row.id);
    const kind = nextReminder(
      {
        paymentStatus: row.payment_status,
        outstanding: target.context?.outstanding ?? 0,
        deleted: row.deleted,
        status: row.status,
        hasEmail: target.email !== null,
        registeredDate: berlinDate(new Date(row.registered_at)),
        campStartDate: camp.start_date,
        paymentDueDate: camp.payment_due_date,
        sentKinds: past?.kinds ?? [],
        lastReminderDate: past?.lastSentAt ? berlinDate(new Date(past.lastSentAt)) : null,
        paused: row.reminders_paused,
        campEnabled: mailSettings.remindersEnabled,
        timing: mailSettings.timing,
      },
      today,
    );
    if (!kind) continue;

    if (summary.sent + summary.failed >= REMINDER_RUN_CAP) {
      summary.capped = true;
      break;
    }
    if (summary.sent + summary.failed > 0) await sleep(SEND_SPACING_MS);

    const outcome = await deliver({
      target,
      kind,
      trigger: "cron",
      render: (context) => reminderEmail(kind, context),
    });
    summary[outcome] += 1;
  }

  await writeLog({
    action: "reminders.run",
    message: `Verschickt ${summary.sent}, fehlgeschlagen ${summary.failed}, übersprungen ${summary.skipped}${summary.capped ? ", Tageslimit erreicht" : ""}`,
  });
  return summary;
}

export type PaymentLinkOutcome = "sent" | "failed" | "not_eligible" | "no_email" | "cooldown";

/**
 * Admin triggered payment link mail (US3). Only for registrations with money
 * still due; at most one mail per registration within the cooldown.
 */
export async function sendPaymentLinkEmail(
  reference: string,
  actor: { id: string; label: string },
): Promise<PaymentLinkOutcome> {
  const { data: row } = await getServiceClient()
    .from("registrations")
    .select("id")
    .eq("reference", reference)
    .maybeSingle();
  if (!row) return "not_eligible";

  const target = await loadMailTarget(row.id);
  if (!target || checkoutEligibility(target.payable) !== "ok") return "not_eligible";
  if (!target.email) return "no_email";
  if (await paymentLinkOnCooldown(target.registrationId)) return "cooldown";

  const outcome = await deliver({
    target,
    kind: "payment_link",
    trigger: "admin",
    actor,
    render: paymentLinkEmail,
  });
  return outcome === "sent" ? "sent" : "failed";
}

export type TestSendOutcome =
  | "sent"
  | "failed"
  | "not_configured"
  | "no_email"
  | "no_camp"
  | "cooldown"
  | "quota";

/**
 * Sends one template with sample data and the current camp's settings to the
 * admin's own address (specs/016-mail-settings, US6, research R7). Counts
 * against the daily quota, keeps the confirmation reserve free and allows one
 * test per admin within the cooldown. Logs carry the template id only.
 */
export async function sendTestEmail(
  templateId: TemplateId,
  admin: { id: string; email: string; label: string },
  now: Date = new Date(),
): Promise<TestSendOutcome> {
  const to = admin.email.trim();
  if (!to) return "no_email";

  const camp = await getCurrentCamp();
  if (!camp?.isCurrent) return "no_camp";
  if (await testOnCooldown(admin.id, now)) return "cooldown";
  const sentToday = await countDeliveriesSince(berlinDayStartIso(now));
  if (sentToday >= DAILY_EMAIL_BUDGET - CONFIRMATION_RESERVE) return "quota";

  const mailInfo = await getCampMailInfo(camp.id);
  const rendered = renderTemplate(
    templateId,
    {
      id: camp.id,
      location: camp.location || null,
      name: camp.name,
      startDate: camp.startDate || null,
      endDate: camp.endDate || null,
      basePrice: camp.basePrice,
      paymentDueDate: camp.paymentDueDate,
      tagline: camp.tagline,
    },
    mailInfo,
  );

  const claim = await claimTestDelivery(admin.id);
  const result = await sendEmail(
    { to, ...rendered, subject: `${emailMessages.testSubjectPrefix}${rendered.subject}` },
    `test/${claim.id}`,
    resolveMailSettings(mailInfo).sender,
  );

  if (result.ok) {
    await markSent(claim.id, result.id);
    await writeLog({ actor: admin.label, action: "email.test_sent", message: templateId });
    return "sent";
  }
  await markFailed(claim.id, result.error);
  await writeLog({
    level: "warning",
    actor: admin.label,
    action: "email.test_failed",
    message: `${templateId}: ${result.error}`,
  });
  return result.error === "not_configured" ? "not_configured" : "failed";
}
