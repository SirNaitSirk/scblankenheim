import { notFound } from "next/navigation";
import { CampMailInfoForm } from "@/components/admin/camp-mail-info-form";
import { PageBody } from "@/components/admin/page-header";
import { canUseSection } from "@/lib/admin/access";
import { mailInfoToFormValues } from "@/lib/admin/camp-mail-info";
import { getCampMailInfo } from "@/lib/admin/camp-mail-info-data";
import { getCampById } from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";
import { emailMessages } from "@/lib/email/messages";

// Address and name parts of `EMAIL_FROM` (`Name <addr>` or `addr`) for the
// sender hints; no secret, the address appears in every sent mail.
function envSender(): { address: string | null; name: string } {
  const from = process.env.EMAIL_FROM?.trim() ?? "";
  const match = from.match(/^(.*?)\s*<([^<>]+)>$/);
  if (match) return { address: match[2].trim(), name: match[1].replace(/"/g, "").trim() || emailMessages.sender };
  return { address: from || null, name: emailMessages.sender };
}

// Info mail content and switches per camp (specs/012-info-mails, US5). Lives
// under the Camps section like the form fields, so gate it by the same tab.
export default async function CampMailInfoPage({
  params,
}: {
  params: Promise<{ campId: string }>;
}) {
  const profile = await guardTab("/admin/camps");

  const { campId } = await params;
  const camp = await getCampById(campId);
  if (!camp) notFound();

  const info = await getCampMailInfo(campId);

  return (
    <PageBody>
      <CampMailInfoForm
        campId={campId}
        campName={camp.name}
        startDate={camp.startDate || null}
        endDate={camp.endDate || null}
        initial={mailInfoToFormValues(info)}
        senderDefaults={{ ...envSender(), replyTo: process.env.EMAIL_REPLY_TO?.trim() || null }}
        canWrite={canUseSection(profile, "camps")}
      />
    </PageBody>
  );
}
