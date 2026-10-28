import { toCampEvent, type CalendarLinks } from "@/lib/calendar/ics";
import { resolveMailSettings, type CampMailInfo } from "@/lib/admin/camp-mail-info";
import { INFO_KINDS, type InfoMailKind } from "./info-mails";
import { INFO_TEMPLATES, type InfoMailContext } from "./info-templates";
import { appBaseUrl, calendarLinks, packingUrl, participantPath, participantUrl, paymentPath, paymentUrl } from "./links";
import { DEFAULT_MAIL_SETTINGS, type MailTexts } from "./settings";
import {
  confirmationEmail,
  paymentLinkEmail,
  reminderEmail,
  type EmailContext,
  type RenderedEmail,
} from "./templates";

/**
 * Sample data for the read only admin tab "Mail" (specs/007-transactional-emails,
 * US4, research R12). Previews come from the real template functions, so they
 * always match what is sent. Only a fixed sample person and the current camp's
 * public data appear; never a real registration or a hidden price.
 */

export type PreviewId =
  | "confirmation"
  | "confirmation_free"
  | "payment_link"
  | "reminder_1"
  | "reminder_2"
  | "reminder_3";

export type MailPreview = RenderedEmail & { id: PreviewId };

export type InfoMailPreview = RenderedEmail & { id: InfoMailKind };

export type PreviewCamp = {
  name: string;
  startDate: string | null;
  endDate: string | null;
  basePrice: number;
  paymentDueDate: string | null;
  id?: string; // camp id for the sample calendar links (specs/019-calendar-file)
  location?: string | null;
};

export const SAMPLE_FIRST_NAME = "Lena";
export const SAMPLE_REFERENCE = "REG-BEISPIEL";
export const SAMPLE_ACCESS_TOKEN = "0".repeat(64);

/** Calendar links of the previewed camp; null without id, dates or `APP_URL`. */
function sampleCalendar(camp: PreviewCamp): CalendarLinks | null {
  const base = appBaseUrl();
  if (!camp.id || !base) return null;
  return calendarLinks(
    toCampEvent(
      { id: camp.id, name: camp.name, start_date: camp.startDate, end_date: camp.endDate, location: camp.location ?? null },
      base,
    ),
  );
}

/** Sample person with the camp's own text blocks (specs/016-mail-settings, US5). */
export function sampleContext(camp: PreviewCamp, texts: MailTexts = DEFAULT_MAIL_SETTINGS.texts): EmailContext {
  return {
    firstName: SAMPLE_FIRST_NAME,
    campName: camp.name,
    campStart: camp.startDate,
    campEnd: camp.endDate,
    reference: SAMPLE_REFERENCE,
    amountDue: camp.basePrice,
    outstanding: camp.basePrice,
    paymentDueDate: camp.paymentDueDate,
    payUrl: paymentUrl(SAMPLE_REFERENCE) ?? paymentPath(SAMPLE_REFERENCE),
    participantUrl: participantUrl(SAMPLE_ACCESS_TOKEN) ?? participantPath(SAMPLE_ACCESS_TOKEN),
    calendar: sampleCalendar(camp),
    texts,
  };
}

export function buildMailPreviews(
  camp: PreviewCamp,
  texts: MailTexts = DEFAULT_MAIL_SETTINGS.texts,
): MailPreview[] {
  const ctx = sampleContext(camp, texts);
  const free = { ...ctx, amountDue: 0, outstanding: 0 };
  return [
    { id: "confirmation", ...confirmationEmail(ctx) },
    { id: "confirmation_free", ...confirmationEmail(free) },
    { id: "payment_link", ...paymentLinkEmail(ctx) },
    { id: "reminder_1", ...reminderEmail("reminder_1", ctx) },
    { id: "reminder_2", ...reminderEmail("reminder_2", ctx) },
    { id: "reminder_3", ...reminderEmail("reminder_3", ctx) },
  ];
}

/** Sample person with the arrival preview owing the base price (specs/012-info-mails, US5). */
export function sampleInfoContext(
  camp: PreviewCamp & { tagline: string | null },
  mailInfo: CampMailInfo,
): InfoMailContext {
  return {
    ...sampleContext(camp),
    mailInfo,
    motto: camp.tagline?.trim() || null,
    packingUrl: packingUrl() ?? "/packzettel",
  };
}

export function buildInfoMailPreviews(
  camp: PreviewCamp & { tagline: string | null },
  mailInfo: CampMailInfo,
): InfoMailPreview[] {
  const ctx = sampleInfoContext(camp, mailInfo);
  return INFO_KINDS.map((kind) => ({ id: kind, ...INFO_TEMPLATES[kind](ctx) }));
}

/** Every template the Mail tab lists and can send as a test (specs/016-mail-settings, US6). */
export type TemplateId = PreviewId | InfoMailKind;

export const TEMPLATE_IDS = [
  "confirmation",
  "confirmation_free",
  "payment_link",
  "reminder_1",
  "reminder_2",
  "reminder_3",
  ...INFO_KINDS,
] as const satisfies readonly TemplateId[];

/** One template with sample data and the camp's settings, exactly as the preview shows it. */
export function renderTemplate(
  id: TemplateId,
  camp: PreviewCamp & { tagline: string | null },
  mailInfo: CampMailInfo,
): RenderedEmail {
  const { texts } = resolveMailSettings(mailInfo);
  const previews: Array<RenderedEmail & { id: TemplateId }> = [
    ...buildMailPreviews(camp, texts),
    ...buildInfoMailPreviews(camp, mailInfo),
  ];
  const { subject, html, text } = previews.find((preview) => preview.id === id)!;
  return { subject, html, text };
}
