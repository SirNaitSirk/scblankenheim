"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createRegistration,
  getCurrentCamp,
  setRegistrationDeleted,
  setRegistrationPayment,
  updateRegistration,
  writeLog,
} from "@/lib/admin/data";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import type {
  ActionResult,
  AdminUser,
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
    priceTierId: z.string(),
    status: z.enum(["confirmed", "pending", "cancelled"]),
    payment: z.enum(["paid", "partial", "unpaid"]),
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
  revalidatePath("/admin/finanzen");
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
    await writeLog({
      actor: actorLabel(admin),
      action: "registration.update",
      message: `${nameLabel(parsed.data)} (${reference})`,
    });
    revalidateRegistrations();
    return { ok: true, id: reference };
  });
}

const paymentSchema = z.enum(["paid", "partial", "unpaid"]);

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
