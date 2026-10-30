import { EnvelopeSimple, Info } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { MailPreview, type InfoMailPanel, type MailPreviewItem } from "@/components/admin/mail-preview";
import { EmptyState } from "@/components/admin/states";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import {
  ARRIVAL_REQUIRED,
  resolveMailSettings,
  type CampMailInfo,
  type CampMailTextKey,
} from "@/lib/admin/camp-mail-info";
import { getCampMailInfo } from "@/lib/admin/camp-mail-info-data";
import { getCurrentCamp } from "@/lib/admin/data";
import { canUseSection } from "@/lib/admin/access";
import { guardTab } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import type { InfoMailKind } from "@/lib/email/info-mails";
import { infoMailCounts, type InfoMailCounts } from "@/lib/email/info-run";
import type { MailTiming } from "@/lib/email/settings";
import { buildInfoMailPreviews, buildMailPreviews, type PreviewId } from "@/lib/email/preview";
import { getReleaseSettings } from "@/lib/school-release/data";

const t = de.mail;

// Send moments use the current camp's timing (specs/016-mail-settings, US3).
function triggers(timing: MailTiming): Record<PreviewId, string> {
  return {
    confirmation: t.triggers.confirmation,
    confirmation_free: t.triggers.confirmation_free,
    payment_link: t.triggers.payment_link,
    reminder_1: t.triggers.reminder_1(timing.reminderFirstAfterDays),
    reminder_2: t.triggers.reminder_2(timing.reminderBeforeDueDays),
    reminder_3: t.triggers.reminder_3,
    school_release: t.triggers.school_release,
    participant_link: t.triggers.participant_link,
    bus_ticket: t.triggers.bus_ticket,
  };
}

// Templates the per camp reminder switch turns off (specs/016-mail-settings, US2).
const REMINDER_PREVIEWS: ReadonlySet<PreviewId> = new Set(["reminder_1", "reminder_2", "reminder_3"]);

function infoTriggers(timing: MailTiming): Record<InfoMailKind, string> {
  return {
    info_teaser: t.triggers.info_teaser(timing.teaserDaysBefore),
    info_packing: t.triggers.info_packing(timing.packingDaysBefore),
    info_arrival: t.triggers.info_arrival(timing.arrivalDaysBefore),
    info_thanks: t.triggers.info_thanks(timing.thanksDaysAfter),
  };
}

const ENABLED_KEY = {
  info_teaser: "teaserEnabled",
  info_packing: "packingEnabled",
  info_arrival: "arrivalEnabled",
  info_thanks: "thanksEnabled",
} as const satisfies Record<InfoMailKind, keyof CampMailInfo>;

// Optional fields per mail; a missing one only drops its section.
const OPTIONAL_FIELDS: Record<InfoMailKind, CampMailTextKey[]> = {
  info_teaser: ["highlights", "teamGreeting"],
  info_packing: [],
  info_arrival: ["pickupTime", "firstDay", "phoneRules"],
  info_thanks: ["photosUrl", "feedbackUrl", "nextCampNote"],
};

const fieldLabel = (key: CampMailTextKey) => de.campMailInfo.fields[key];

function infoHints(
  kind: InfoMailKind,
  info: CampMailInfo,
  camp: { startDate: string | null; endDate: string | null; tagline: string | null },
): string[] {
  const hints: string[] = [];
  const hasDate = kind === "info_thanks" ? camp.endDate : camp.startDate;
  if (!hasDate) hints.push(t.infoMissingDate);
  if (kind === "info_arrival") {
    for (const key of ARRIVAL_REQUIRED) if (!info[key]) hints.push(t.infoMissingRequired(fieldLabel(key)));
  }
  if (kind === "info_teaser" && !camp.tagline?.trim()) {
    hints.push(t.infoMissing(de.campMailInfo.fields.motto));
  }
  for (const key of OPTIONAL_FIELDS[kind]) if (!info[key]) hints.push(t.infoMissing(fieldLabel(key)));
  return hints;
}

function infoPanel(
  kind: InfoMailKind,
  info: CampMailInfo,
  counts: InfoMailCounts,
  camp: { id: string; startDate: string | null; endDate: string | null; tagline: string | null },
): InfoMailPanel {
  return {
    enabled: info[ENABLED_KEY[kind]],
    counts: counts[kind],
    hints: infoHints(kind, info, camp),
    settingsHref: `/admin/camps/${camp.id}/infomails`,
  };
}

// Template preview (specs/007-transactional-emails, US4). The templates are code
// defined (constitution III); the only action is the test send to the admin's
// own address (specs/016-mail-settings, US6).
export default async function MailPage() {
  const profile = await guardTab("/admin/mail");
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

  const previewCamp = {
    id: camp.id,
    location: camp.location || null,
    name: camp.name,
    startDate: camp.startDate || null,
    endDate: camp.endDate || null,
    basePrice: camp.basePrice,
    paymentDueDate: camp.paymentDueDate,
    tagline: camp.tagline,
  };
  const [mailInfo, counts, release] = await Promise.all([
    getCampMailInfo(camp.id),
    infoMailCounts(camp.id),
    getReleaseSettings(camp.id),
  ]);
  const panelCamp = { ...previewCamp, id: camp.id };

  const settingsHref = `/admin/camps/${camp.id}/infomails`;
  const { timing, texts } = resolveMailSettings(mailInfo);
  const mailTriggers = triggers(timing);
  const infoMailTriggers = infoTriggers(timing);
  const remindersOff = mailInfo.remindersEnabled
    ? undefined
    : { text: t.remindersOff, settingsHref };

  const previews: MailPreviewItem[] = [
    ...buildMailPreviews(previewCamp, texts, release).map((preview) => ({
      ...preview,
      name: t.templates[preview.id],
      trigger: mailTriggers[preview.id],
      off: REMINDER_PREVIEWS.has(preview.id) ? remindersOff : undefined,
    })),
    ...buildInfoMailPreviews(previewCamp, mailInfo, release).map((preview) => ({
      ...preview,
      name: t.templates[preview.id],
      trigger: infoMailTriggers[preview.id],
      info: infoPanel(preview.id, mailInfo, counts, panelCamp),
    })),
  ];

  return (
    <PageBody>
      <PageHeader title={t.title} description={t.description} />
      {!camp.paymentDueDate && (
        <p className="flex items-start gap-2 rounded-input border border-border bg-ink-50 px-4 py-3 text-sm text-muted-foreground">
          <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
          {t.noDueDate}
        </p>
      )}
      <MailPreview
        previews={previews}
        test={canUseSection(profile, "camps") ? { email: profile.email.trim() || null } : null}
      />
    </PageBody>
  );
}
