import { NextResponse } from "next/server";
import { writeLog } from "@/lib/admin/data";
import { isAuthorizedCronRequest } from "@/lib/email/cron-auth";
import { runPaymentReminders } from "@/lib/email/send";

export const runtime = "nodejs";
export const maxDuration = 60;

// Daily payment reminder run, triggered by Vercel Cron (vercel.json). Not Clerk
// authenticated: the bearer CRON_SECRET is the gate (constitution II). The
// response carries counts only, never personal data
// (specs/007-transactional-emails, contracts/http-and-actions.md).

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runPaymentReminders();
    return NextResponse.json(summary, { status: 200 });
  } catch {
    await writeLog({ level: "error", action: "reminders.failed", message: "Erinnerungslauf abgebrochen" });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
