import { notFound } from "next/navigation";
import { CampMailInfoForm } from "@/components/admin/camp-mail-info-form";
import { PageBody } from "@/components/admin/page-header";
import { canUseSection } from "@/lib/admin/access";
import { mailInfoToFormValues } from "@/lib/admin/camp-mail-info";
import { getCampMailInfo } from "@/lib/admin/camp-mail-info-data";
import { getCampById, getCampFormFields } from "@/lib/admin/data";
import { ReleaseSettingsCard } from "@/components/admin/release-settings-card";
import { getReleaseSettings, signatureSignedUrl } from "@/lib/school-release/data";
import { addressFieldOptions } from "@/lib/school-release/settings";
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

  const [info, release, fields] = await Promise.all([
    getCampMailInfo(campId),
    getReleaseSettings(campId),
    getCampFormFields(campId),
  ]);
  const signatureUrl = await signatureSignedUrl(release.signaturePath);
  const canWrite = canUseSection(profile, "camps");

  return (
    <PageBody>
      <CampMailInfoForm
        campId={campId}
        campName={camp.name}
        startDate={camp.startDate || null}
        endDate={camp.endDate || null}
        initial={mailInfoToFormValues(info)}
        senderDefaults={{ ...envSender(), replyTo: process.env.EMAIL_REPLY_TO?.trim() || null }}
        canWrite={canWrite}
      />
      <ReleaseSettingsCard
        campId={campId}
        startDate={camp.startDate || null}
        endDate={camp.endDate || null}
        initial={release}
        signatureUrl={signatureUrl}
        addressOptions={addressFieldOptions(fields)}
        canWrite={canWrite}
      />
    </PageBody>
  );
}
