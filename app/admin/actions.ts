"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createRegistration,
  getAccessToken,
  getCurrentCamp,
  renewAccessToken,
  setRegistrationDeleted,
  setRegistrationPayment,
  setRemindersPaused,
  updateRegistration,
  writeLog,
} from "@/lib/admin/data";
import { reminderPauseSchema } from "@/lib/admin/finance";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { syncRoomAssignment } from "@/lib/admin/rooms-data";
import { syncTentCircle } from "@/lib/admin/tent-circles-data";
import { getMailHistoryByReference } from "@/lib/email/deliveries";
import type { MailHistoryResult } from "@/lib/email/history";
import { participantPath, participantUrl } from "@/lib/email/links";
import { sendPaymentLinkEmail, type PaymentLinkOutcome } from "@/lib/email/send";
import { de } from "@/lib/admin/messages";
import type {
  ActionResult,
  AdminUser,
  ParticipantLinkResult,
  RegistrationFormValues,
  RegistrationInput,
} from "@/lib/admin/types";

// --- validation -------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function nullify(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

// Coerces a euro amount string to a non-negative whole number, or null when the
// value is not a valid integer (surfaced as a per-field error).
function parseAmount(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return 0;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
}

// Raw dialog values in → validated `RegistrationInput` out. Cross-field checks
// run in `superRefine` (each issue carries a field path); `transform` builds the
// row-ready shape only once validation passed. Dynamic camp answers pass through
// `formData` (their required/type rules are enforced in the client dialog).
const registrationSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    gender: z.enum(["female", "male", ""]),
    priceTierId: z.string(),
    status: z.enum(["active", "cancelled"]),
    payment: z.enum(["unpaid", "processing", "partial", "paid", "refunded"]),
    amountDue: z.string(),
    amountPaid: z.string(),
    formData: z.record(z.string(), z.union([z.string(), z.boolean()])),
  })
  .superRefine((values, ctx) => {
    if (values.firstName.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["firstName"], message: de.registrations.errors.firstNameRequired });
    }
    if (values.lastName.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["lastName"], message: de.registrations.errors.lastNameRequired });
    }
    const email = values.email.trim();
    if (email === "") {
      ctx.addIssue({ code: "custom", path: ["email"], message: de.registrations.errors.emailRequired });
    } else if (!EMAIL_RE.test(email)) {
      ctx.addIssue({ code: "custom", path: ["email"], message: de.registrations.errors.emailInvalid });
    }
    if (parseAmount(values.amountDue) === null) {
      ctx.addIssue({ code: "custom", path: ["amountDue"], message: de.registrations.errors.amountInvalid });
    }
    if (parseAmount(values.amountPaid) === null) {
      ctx.addIssue({ code: "custom", path: ["amountPaid"], message: de.registrations.errors.amountInvalid });
    }
  })
  .transform(
    (values): RegistrationInput => ({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      gender: values.gender === "" ? null : values.gender,
      priceTierId: nullify(values.priceTierId),
      status: values.status,
      payment: values.payment,
      amountDue: parseAmount(values.amountDue) ?? 0,
      amountPaid: parseAmount(values.amountPaid) ?? 0,
      // Trim string answers; keep booleans as-is. Core fields never land here.
      formData: Object.fromEntries(
        Object.entries(values.formData).map(([key, value]) => [
          key,
          typeof value === "string" ? value.trim() : value,
        ]),
      ),
    }),
  );

// --- shared helpers ---------------------------------------------------------

function fieldErrorResult(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return { ok: false, error: de.registrations.toast.error, fieldErrors };
}

// The dashboard and finance view both read registrations.
function revalidateRegistrations(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/preise");
  revalidatePath("/admin/zimmerplanung");
  revalidatePath("/admin/zeltkreise");
}

// Runs `fn` only after a successful `registrations` permission check, mapping
// auth and unexpected failures to German error results instead of throwing.
async function runGuarded(
  fn: (admin: AdminUser) => Promise<ActionResult>,
): Promise<ActionResult> {
  let admin: AdminUser;
  try {
    admin = await requirePermission("registrations");
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: de.registrations.toast.unauthorized };
    }
    console.error("[registrations] auth check failed", error);
    return { ok: false, error: de.registrations.toast.error };
  }
  try {
    return await fn(admin);
  } catch (error) {
    console.error("[registrations] action failed", error);
    return { ok: false, error: de.registrations.toast.error };
  }
}

function actorLabel(admin: AdminUser): string {
  return admin.name?.trim() || admin.email?.trim() || admin.id;
}

function nameLabel(input: RegistrationInput): string {
  return `${input.firstName} ${input.lastName}`.trim() || input.email;
}

// --- actions ----------------------------------------------------------------

export async function createRegistrationAction(
  values: RegistrationFormValues,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = registrationSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);

    const camp = await getCurrentCamp();
    if (!camp) {
      return { ok: false, error: de.registrations.errors.noCurrentCamp };
    }

    const reference = await createRegistration(camp.id, parsed.data);
    await writeLog({
      actor: actorLabel(admin),
      action: "registration.create",
      message: `${nameLabel(parsed.data)} (${reference})`,
    });
    revalidateRegistrations();
    return { ok: true, id: reference };
  });
}

export async function updateRegistrationAction(
  reference: string,
  values: RegistrationFormValues,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = registrationSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);

    await updateRegistration(reference, parsed.data);
    // Cancelled or gender changed: the room may no longer fit (specs/008), a
    // changed gender may no longer fit the tent circle (specs/011).
    await syncRoomAssignment({ reference });
    await syncTentCircle({ reference });
    await writeLog({
      actor: actorLabel(admin),
      action: "registration.update",
      message: `${nameLabel(parsed.data)} (${reference})`,
    });
    revalidateRegistrations();
    return { ok: true, id: reference };
  });
}

const paymentSchema = z.enum(["unpaid", "processing", "partial", "paid", "refunded"]);

export async function setRegistrationPaymentAction(
  reference: string,
  payment: string,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = paymentSchema.safeParse(payment);
    if (!parsed.success) return { ok: false, error: de.registrations.toast.error };

    await setRegistrationPayment(reference, parsed.data);
    await writeLog({
      actor: actorLabel(admin),
      action: "registration.payment",
      message: `${reference} → ${parsed.data}`,
    });
    revalidateRegistrations();
    return { ok: true };
  });
}

export async function setRegistrationDeletedAction(
  reference: string,
  deleted: boolean,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    await setRegistrationDeleted(reference, deleted);
    await syncRoomAssignment({ reference });
    await writeLog({
      level: deleted ? "warning" : "info",
      actor: actorLabel(admin),
      action: deleted ? "registration.delete" : "registration.restore",
      message: reference,
    });
    revalidateRegistrations();
    return { ok: true };
  });
}

const referenceSchema = z.string().trim().min(1).max(32);

const PAYMENT_LINK_ERRORS: Record<Exclude<PaymentLinkOutcome, "sent">, string> = {
  failed: de.paymentLink.failed,
  not_eligible: de.paymentLink.notDue,
  no_email: de.paymentLink.noEmail,
  cooldown: de.paymentLink.cooldown,
};

// Sends the payment link mail for one registration (specs/007-transactional-emails, US3).
// The mail module writes the log entry with the admin as actor.
export async function sendPaymentLinkAction(reference: string): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = referenceSchema.safeParse(reference);
    if (!parsed.success) return { ok: false, error: de.registrations.toast.error };

    const outcome = await sendPaymentLinkEmail(parsed.data, {
      id: admin.id,
      label: actorLabel(admin),
    });
    if (outcome !== "sent") return { ok: false, error: PAYMENT_LINK_ERRORS[outcome] };
    return { ok: true };
  });
}

// Pauses or resumes automatic payment reminders of one registration
// (specs/016-mail-settings, US1, contracts/actions-and-mail.md).
export async function setReminderPauseAction(
  reference: string,
  paused: boolean,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = reminderPauseSchema.safeParse({ reference, paused });
    if (!parsed.success) return { ok: false, error: de.registrations.toast.error };

    const result = await setRemindersPaused(parsed.data.reference, parsed.data.paused);
    if (!result) return { ok: false, error: de.registrations.reminderPause.notFound };

    await writeLog({
      actor: actorLabel(admin),
      action: parsed.data.paused ? "registration.reminders_paused" : "registration.reminders_resumed",
      message: `${parsed.data.reference} ${result.name}`.trim(),
    });
    revalidateRegistrations();
    revalidatePath("/admin/finanzen");
    return { ok: true };
  });
}

// Read only mail history of one registration for the dialog
// (specs/013-registration-mail-history, contracts/server-action.md). Returns
// only mapped entries: no address, subject, body, provider id or error code.
export async function getRegistrationMailsAction(reference: string): Promise<MailHistoryResult> {
  const t = de.registrations.mails;
  try {
    await requirePermission("registrations");
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: de.registrations.toast.unauthorized };
    console.error("[registrations] auth check failed", error);
    return { ok: false, error: t.loadFailed };
  }

  try {
    const parsed = referenceSchema.safeParse(reference);
    if (!parsed.success) return { ok: false, error: t.notFound };

    const mails = await getMailHistoryByReference(parsed.data);
    return mails ? { ok: true, mails } : { ok: false, error: t.notFound };
  } catch (error) {
    console.error("[registrations] mail history failed", error);
    return { ok: false, error: t.loadFailed };
  }
}

// --- participant page link (specs/017-participant-page) ----------------------

function participantLink(token: string): string {
  return participantUrl(token) ?? participantPath(token);
}

// Same guard as `runGuarded`, typed for the link result.
async function runLinkGuarded(
  fn: (admin: AdminUser) => Promise<ParticipantLinkResult>,
  failure: string,
): Promise<ParticipantLinkResult> {
  let admin: AdminUser;
  try {
    admin = await requirePermission("registrations");
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: de.registrations.toast.unauthorized };
    console.error("[registrations] auth check failed", error);
    return { ok: false, error: failure };
  }
  try {
    return await fn(admin);
  } catch (error) {
    console.error("[registrations] participant link failed", error);
    return { ok: false, error: failure };
  }
}

// Fetches the link on demand for the dialog, so tokens never travel with the table data.
export async function getParticipantLinkAction(reference: string): Promise<ParticipantLinkResult> {
  const t = de.participantLink;
  return runLinkGuarded(async () => {
    const parsed = referenceSchema.safeParse(reference);
    if (!parsed.success) return { ok: false, error: t.notFound };

    const result = await getAccessToken(parsed.data);
    return result ? { ok: true, url: participantLink(result.token) } : { ok: false, error: t.notFound };
  }, t.copyFailed);
}

// Replaces the token; the old link shows the neutral notice from now on (US6).
export async function renewParticipantLinkAction(reference: string): Promise<ParticipantLinkResult> {
  const t = de.participantLink;
  return runLinkGuarded(async (admin) => {
    const parsed = referenceSchema.safeParse(reference);
    if (!parsed.success) return { ok: false, error: t.notFound };

    const result = await renewAccessToken(parsed.data);
    if (!result) return { ok: false, error: t.notFound };

    await writeLog({
      actor: actorLabel(admin),
      action: "registration.access_renewed",
      message: `${parsed.data} ${result.name}`.trim(),
    });
    return { ok: true, url: participantLink(result.token) };
  }, t.renewFailed);
}
