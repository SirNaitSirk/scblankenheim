import "server-only";

import { resolveMailSettings } from "@/lib/admin/camp-mail-info";
import { getCampMailInfo } from "@/lib/admin/camp-mail-info-data";
import { writeLog } from "@/lib/admin/data";
import { getServiceClient } from "@/lib/supabase/server";
import { berlinDayStartIso } from "@/lib/time/berlin";
import { claimTeamDelivery, countDeliveriesSince, markFailed, markSent } from "./deliveries";
import { CONFIRMATION_RESERVE, DAILY_EMAIL_BUDGET } from "./limits";
import { appBaseUrl } from "./links";
import { describeSendError, sendEmail } from "./provider";
import { teamMessageEmail, type TeamMessageContext } from "./team-templates";

/**
 * Forwards a participant message to the camp's team address
 * (specs/018-participant-messages, research R4 and R5). The item is already
 * stored; a skipped or failed mail only logs, the admin badge still shows it.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type TeamNotification = Omit<TeamMessageContext, "campName" | "replyTo" | "adminUrl"> & {
  registrationId: string;
  campId: string;
  email: string | null;
};

export async function sendTeamNotification(input: TeamNotification, now: Date = new Date()): Promise<void> {
  const label = `team_message ${input.reference}`;
  try {
    const [mailInfo, { data: camp }] = await Promise.all([
      getCampMailInfo(input.campId),
      getServiceClient().from("camps").select("name").eq("id", input.campId).maybeSingle(),
    ]);
    const { sender } = resolveMailSettings(mailInfo);
    const teamAddress = sender.replyTo?.trim() || process.env.EMAIL_REPLY_TO?.trim() || "";
    if (!teamAddress) {
      await writeLog({ level: "warning", action: "email.skipped", message: `${label}: keine Teamadresse` });
      return;
    }

    const sentToday = await countDeliveriesSince(berlinDayStartIso(now));
    if (sentToday >= DAILY_EMAIL_BUDGET - CONFIRMATION_RESERVE) {
      await writeLog({ level: "warning", action: "email.skipped", message: `${label}: Tageskontingent` });
      return;
    }

    const replyTo = input.email?.trim() && EMAIL_RE.test(input.email.trim()) ? input.email.trim() : null;
    const base = appBaseUrl();
    const rendered = teamMessageEmail({
      ...input,
      campName: camp?.name ?? "",
      replyTo,
      adminUrl: base ? `${base}/admin` : null,
    });

    const claim = await claimTeamDelivery(input.registrationId);
    const result = await sendEmail(
      { to: teamAddress, ...rendered },
      `team_message/${claim.id}`,
      { name: sender.name, replyTo },
    );
    if (result.ok) {
      await markSent(claim.id, result.id);
      await writeLog({ action: "email.sent", message: label });
      return;
    }
    await markFailed(claim.id, result.error);
    await writeLog({ level: "warning", action: "email.failed", message: `${label}: ${describeSendError(result)}` });
  } catch (error) {
    console.error("[participant] team notification failed", error);
    await writeLog({ level: "warning", action: "email.failed", message: `${label}: database` });
  }
}
