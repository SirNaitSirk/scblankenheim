"use server";

import { z } from "zod";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import type { ActionResult, AdminUser } from "@/lib/admin/types";
import { TEMPLATE_IDS } from "@/lib/email/preview";
import { sendTestEmail, type TestSendOutcome } from "@/lib/email/send";

const t = de.mail.test;

const templateIdSchema = z.enum(TEMPLATE_IDS);

const ERRORS: Record<Exclude<TestSendOutcome, "sent">, string> = {
  failed: t.failed,
  not_configured: t.notConfigured,
  no_email: t.noEmail,
  no_camp: t.noCamp,
  cooldown: t.cooldown,
  quota: t.quota,
};

// Sends one template as a test to the admin's own address
// (specs/016-mail-settings, US6, contracts/actions-and-mail.md). Only the
// template id comes from the client; the recipient is always the caller.
export async function sendTestMailAction(templateId: string): Promise<ActionResult> {
  let admin: AdminUser;
  try {
    admin = await requirePermission("camps");
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: t.unauthorized };
    console.error("[mail test] auth check failed", error);
    return { ok: false, error: t.failed };
  }

  const parsed = templateIdSchema.safeParse(templateId);
  if (!parsed.success) return { ok: false, error: t.failed };

  try {
    const outcome = await sendTestEmail(parsed.data, {
      id: admin.id,
      email: admin.email,
      label: admin.name?.trim() || admin.email?.trim() || admin.id,
    });
    return outcome === "sent" ? { ok: true } : { ok: false, error: ERRORS[outcome] };
  } catch (error) {
    console.error("[mail test] send failed", error);
    return { ok: false, error: t.failed };
  }
}
