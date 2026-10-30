import { NextResponse } from "next/server";
import { writeLog } from "@/lib/admin/data";
import { isAuthorizedCronRequest } from "@/lib/email/cron-auth";
import { runInfoMails } from "@/lib/email/info-run";
import { purgeOldSubmissionAttempts } from "@/lib/legal/retention";

export const runtime = "nodejs";
export const maxDuration = 60;

// Daily info mail run, triggered by Vercel Cron (vercel.json) 30 minutes after
// the payment reminders. Not Clerk authenticated: the bearer CRON_SECRET is the
// gate (constitution II). The response carries counts only, never personal
// data (specs/012-info-mails, contracts/http-and-actions.md).

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Daily retention of throttling data (specs/025-legal-pages); never blocks the mails.
  try {
    await purgeOldSubmissionAttempts();
  } catch {
    await writeLog({
      level: "error",
      action: "submission_attempts.purge_failed",
      message: "Alte Drosselungsdaten konnten nicht gelöscht werden",
    });
  }

  try {
    const summary = await runInfoMails();
    return NextResponse.json(summary, { status: 200 });
  } catch {
    await writeLog({ level: "error", action: "info_mails.failed", message: "Infomaillauf abgebrochen" });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
