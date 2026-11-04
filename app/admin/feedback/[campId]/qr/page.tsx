import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { FullscreenButton } from "@/components/admin/fullscreen-button";
import { PageBody } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";
import { PrintButton } from "@/components/ui/print-button";
import { de } from "@/lib/admin/messages";
import { qrSvg } from "@/lib/bus/qr";
import { feedbackUrl } from "@/lib/feedback/code-server";
import { ensureFeedbackSettings } from "@/lib/feedback/data";
import { uuidSchema } from "@/lib/feedback/schema";
import { guardFeedbackPage } from "@/lib/feedback/page-guard";
import { getServiceClient } from "@/lib/supabase/server";

const t = de.feedback;

/** Big QR code of a camp's feedback page for beamer and print (specs/038-camp-feedback, research R8). */
export default async function FeedbackQrPage({ params }: { params: Promise<{ campId: string }> }) {
  const profile = await guardFeedbackPage();
  const { campId } = await params;
  if (!uuidSchema.safeParse(campId).success) notFound();
  const { data: camp, error } = await getServiceClient().from("camps").select("id, name").eq("id", campId).maybeSingle();
  if (error) throw error;
  if (!camp) notFound();

  const settings = await ensureFeedbackSettings(campId, profile.id);
  const url = feedbackUrl(settings.linkCode);
  const svg = url ? await qrSvg(url) : null;

  return (
    <PageBody className="max-w-[1100px]">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <ButtonLink href={`/admin/feedback/${campId}`} variant="ghost" size="sm" className="-ml-3">
          <ArrowLeft size={16} weight="bold" />
          {t.qr.close}
        </ButtonLink>
        <div className="flex gap-2">
          <FullscreenButton targetId="feedback-qr-sheet" label={t.access.showQr} />
          <PrintButton label={t.qr.print} />
        </div>
      </div>

      {url && svg ? (
        <div
          id="feedback-qr-sheet"
          className="print-sheet flex flex-col items-center justify-center gap-6 rounded-card bg-white p-8 text-center text-[#0a0a0b]"
        >
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">{t.qr.title(camp.name)}</h1>
          <p className="text-lg sm:text-2xl">{t.qr.lead}</p>
          <div
            className="aspect-square w-[min(70vh,80vw)] max-w-full [&>svg]:h-full [&>svg]:w-full"
            role="img"
            aria-label={url}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="break-all font-mono text-base sm:text-xl">{url}</p>
        </div>
      ) : (
        <p className="text-sm text-danger">{t.access.noBaseUrl}</p>
      )}
    </PageBody>
  );
}
