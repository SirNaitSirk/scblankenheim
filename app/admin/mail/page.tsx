import { EnvelopeSimple, Info } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { MailPreview, type MailPreviewItem } from "@/components/admin/mail-preview";
import { EmptyState } from "@/components/admin/states";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { getCurrentCamp } from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import { REMINDER_BEFORE_DUE_DAYS, REMINDER_FIRST_AFTER_DAYS } from "@/lib/email/limits";
import { buildMailPreviews, type PreviewId } from "@/lib/email/preview";

const t = de.mail;

const TRIGGERS: Record<PreviewId, string> = {
  confirmation: t.triggers.confirmation,
  confirmation_free: t.triggers.confirmation_free,
  payment_link: t.triggers.payment_link,
  reminder_1: t.triggers.reminder_1(REMINDER_FIRST_AFTER_DAYS),
  reminder_2: t.triggers.reminder_2(REMINDER_BEFORE_DUE_DAYS),
  reminder_3: t.triggers.reminder_3,
};

// Read only template preview (specs/007-transactional-emails, US4). No forms,
// no actions: the templates are code defined (constitution III).
export default async function MailPage() {
  await guardTab("/admin/mail");
  const camp = await getCurrentCamp();

  if (!camp?.isCurrent) {
    return (
      <PageBody>
        <PageHeader title={t.title} description={t.description} />
        <Card>
          <EmptyState icon={EnvelopeSimple} title={t.empty.title} description={t.empty.description} />
        </Card>
      </PageBody>
    );
  }

  const previews: MailPreviewItem[] = buildMailPreviews({
    name: camp.name,
    startDate: camp.startDate || null,
    endDate: camp.endDate || null,
    basePrice: camp.basePrice,
    paymentDueDate: camp.paymentDueDate,
  }).map((preview) => ({
    ...preview,
    name: t.templates[preview.id],
    trigger: TRIGGERS[preview.id],
  }));

  return (
    <PageBody>
      <PageHeader title={t.title} description={t.description} />
      {!camp.paymentDueDate && (
        <p className="flex items-start gap-2 rounded-input border border-border bg-ink-50 px-4 py-3 text-sm text-muted-foreground">
          <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
          {t.noDueDate}
        </p>
      )}
      <MailPreview previews={previews} />
    </PageBody>
  );
}
