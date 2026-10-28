import type { CampMailInfo } from "@/lib/admin/camp-mail-info";
import { formatCurrency } from "@/lib/format";
import { featuredPackingItems } from "@/lib/marketing/packing-list";
import { formatGermanDate } from "@/lib/time/berlin";
import type { InfoMailKind } from "./info-mails";
import {
  renderButton,
  renderFacts,
  renderHeading,
  renderLayout,
  renderList,
  renderParagraph,
  renderText,
} from "./layout";
import { emailMessages } from "./messages";
import { calendarBlock, participantBlock, type EmailContext, type RenderedEmail } from "./templates";

/**
 * Code defined info mails (specs/012-info-mails, contracts/http-and-actions.md).
 * Pure functions shared by the cron run and the admin preview. Admin texts are
 * escaped by the layout helpers; a section whose text is empty is left out
 * entirely (FR-016). No price tier names, invitation links or calls to invite
 * friends ever appear (FR-012).
 */

export type InfoMailContext = EmailContext & {
  mailInfo: CampMailInfo;
  motto: string | null;
  packingUrl: string;
};

type Fact = readonly [string, string];

const m = emailMessages;
const t = emailMessages.info;

/** One block of a mail, rendered once as HTML and once as text. */
type Block = { html: string; text: string };

const paragraph = (text: string): Block => ({ html: renderParagraph(text), text });
const heading = (text: string): Block => ({ html: renderHeading(text), text: text.toUpperCase() });
const button = (label: string, href: string): Block => ({
  html: renderButton(label, href),
  text: `${label}: ${href}`,
});
const list = (items: string[]): Block => ({
  html: renderList(items),
  text: items.map((item) => `* ${item}`).join("\n"),
});
const facts = (rows: Fact[]): Block => ({
  html: renderFacts(rows),
  text: rows.map(([label, value]) => `${label}: ${value}`).join("\n"),
});

function lines(text: string | null): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

function campDates(ctx: InfoMailContext): string | null {
  if (!ctx.campStart || !ctx.campEnd) return null;
  return m.dateRange(formatGermanDate(ctx.campStart), formatGermanDate(ctx.campEnd));
}

function compose(
  ctx: InfoMailContext,
  copy: { subject: string; preheader: string; title: string },
  blocks: ReadonlyArray<Block | null>,
): RenderedEmail {
  const all = [
    paragraph(m.greeting(ctx.firstName)),
    ...blocks.filter((block): block is Block => block !== null),
    participantBlock(ctx),
    paragraph(m.closing),
  ];
  return {
    subject: copy.subject,
    html: renderLayout({
      preheader: copy.preheader,
      campName: ctx.campName,
      title: copy.title,
      bodyHtml: all.map((block) => block.html).join("\n"),
    }),
    text: renderText(all.map((block) => block.text)),
  };
}

export function teaserInfoEmail(ctx: InfoMailContext): RenderedEmail {
  const highlights = lines(ctx.mailInfo.highlights);
  const dates = campDates(ctx);
  const factRows: Fact[] = [[m.labels.camp, ctx.campName]];
  if (dates) factRows.push([m.labels.dates, dates]);

  return compose(
    ctx,
    { subject: t.teaser.subject(ctx.campName), preheader: t.teaser.preheader, title: t.teaser.title },
    [
      paragraph(t.teaser.intro(ctx.campName)),
      facts(factRows),
      calendarBlock(ctx),
      ctx.motto ? paragraph(t.teaser.motto(ctx.motto)) : null,
      highlights.length > 0 ? heading(t.teaser.highlightsTitle) : null,
      highlights.length > 0 ? list(highlights) : null,
      ctx.mailInfo.teamGreeting ? heading(t.teaser.greetingTitle) : null,
      ctx.mailInfo.teamGreeting ? paragraph(ctx.mailInfo.teamGreeting) : null,
    ],
  );
}

export function packingInfoEmail(ctx: InfoMailContext): RenderedEmail {
  return compose(
    ctx,
    { subject: t.packing.subject(ctx.campName), preheader: t.packing.preheader, title: t.packing.title },
    [
      paragraph(t.packing.intro(ctx.campName)),
      list(featuredPackingItems().map((item) => item.label)),
      paragraph(t.packing.more),
      button(t.packingButton, ctx.packingUrl),
      paragraph(t.packing.health),
    ],
  );
}

export function arrivalInfoEmail(ctx: InfoMailContext): RenderedEmail {
  const info = ctx.mailInfo;
  const factRows: Fact[] = [];
  if (info.arrivalAddress) factRows.push([t.labels.address, info.arrivalAddress]);
  if (info.arrivalTime) factRows.push([t.labels.arrival, info.arrivalTime]);
  if (info.pickupTime) factRows.push([t.labels.pickup, info.pickupTime]);
  if (info.emergencyPhone) factRows.push([t.labels.emergency, info.emergencyPhone]);
  const owes = ctx.outstanding > 0;

  return compose(
    ctx,
    { subject: t.arrival.subject, preheader: t.arrival.preheader, title: t.arrival.title },
    [
      paragraph(t.arrival.intro(ctx.campName)),
      factRows.length > 0 ? facts(factRows) : null,
      info.emergencyPhone ? paragraph(t.arrival.emergencyNote) : null,
      info.firstDay ? heading(t.arrival.firstDayTitle) : null,
      info.firstDay ? paragraph(info.firstDay) : null,
      info.phoneRules ? heading(t.arrival.phoneTitle) : null,
      info.phoneRules ? paragraph(info.phoneRules) : null,
      paragraph(t.arrival.packing),
      button(t.packingButton, ctx.packingUrl),
      owes ? paragraph(t.arrival.payNote(formatCurrency(ctx.outstanding))) : null,
      owes ? button(m.payButton, ctx.payUrl) : null,
    ],
  );
}

export function thanksInfoEmail(ctx: InfoMailContext): RenderedEmail {
  const info = ctx.mailInfo;
  return compose(
    ctx,
    { subject: t.thanks.subject(ctx.campName), preheader: t.thanks.preheader, title: t.thanks.title },
    [
      paragraph(t.thanks.intro(ctx.campName)),
      info.photosUrl ? paragraph(t.thanks.photos) : null,
      info.photosUrl ? button(t.thanks.photosButton, info.photosUrl) : null,
      info.feedbackUrl ? paragraph(t.thanks.feedback) : null,
      info.feedbackUrl ? button(t.thanks.feedbackButton, info.feedbackUrl) : null,
      info.nextCampNote ? paragraph(info.nextCampNote) : null,
    ],
  );
}

export const INFO_TEMPLATES: Record<InfoMailKind, (ctx: InfoMailContext) => RenderedEmail> = {
  info_teaser: teaserInfoEmail,
  info_packing: packingInfoEmail,
  info_arrival: arrivalInfoEmail,
  info_thanks: thanksInfoEmail,
};
