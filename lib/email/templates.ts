import type { CalendarLinks } from "@/lib/calendar/ics";
import { formatCurrency } from "@/lib/format";
import { formatGermanDate } from "@/lib/time/berlin";
import {
  renderButton,
  renderFacts,
  renderHeading,
  renderImage,
  renderLayout,
  renderLinkPair,
  renderParagraph,
  renderText,
  renderTextLink,
} from "./layout";
import { emailMessages as m } from "./messages";
import type { MailTexts } from "./settings";

/**
 * Code defined mail templates (specs/007-transactional-emails,
 * contracts/email-templates.md). Pure functions: same input, same output, used
 * by the sender and by the admin preview alike. Only the recipient's own data
 * appears; price tier names, other prices and form answers never do.
 */

export type EmailContext = {
  firstName: string | null;
  campName: string;
  campStart: string | null; // ISO date
  campEnd: string | null; // ISO date
  reference: string;
  amountDue: number; // whole euros, own price
  outstanding: number; // whole euros still to pay
  paymentDueDate: string | null; // ISO date
  payUrl: string;
  participantUrl: string; // private participant page (specs/017-participant-page)
  calendar: CalendarLinks | null; // camp calendar links, null without dates (specs/019-calendar-file)
  texts: MailTexts; // per camp text blocks (specs/016-mail-settings)
  // Release letter hint with a deep link, null or missing when off (specs/020-school-release).
  /** `afterPayment`: nothing paid yet, the letter is ready after the first payment (FR-006a). */
  schoolRelease?: { dates: string; url: string; afterPayment: boolean } | null;
  // Bus ticket QR image and page link, null or missing for non bus persons (specs/021-bus-ticket).
  busTicket?: { imageUrl: string; pageUrl: string } | null;
};

export type ReminderKind = "reminder_1" | "reminder_2" | "reminder_3";

export type RenderedEmail = { subject: string; html: string; text: string };

type Fact = readonly [string, string];

function campDates(ctx: EmailContext): string | null {
  if (!ctx.campStart || !ctx.campEnd) return null;
  return m.dateRange(formatGermanDate(ctx.campStart), formatGermanDate(ctx.campEnd));
}

function dueDate(ctx: EmailContext): string | null {
  return ctx.paymentDueDate ? formatGermanDate(ctx.paymentDueDate) : null;
}

/** Greeting line plus the camp's own opening sentence, if set (specs/016-mail-settings, research R6). */
function openingBlocks(ctx: EmailContext): string[] {
  const blocks = [m.greeting(ctx.firstName)];
  if (ctx.texts.greeting) blocks.push(ctx.texts.greeting);
  return blocks;
}

/** Optional contact line, then the camp's closing or the default closing. */
function closingBlocks(ctx: EmailContext): string[] {
  const { contactName, contactPhone, closing } = ctx.texts;
  const blocks: string[] = [];
  if (contactName || contactPhone) blocks.push(m.contactLine(contactName, contactPhone));
  blocks.push(closing ?? m.closing);
  return blocks;
}

/** Calendar links of the camp, or null when the camp has no valid dates. */
export function calendarBlock(ctx: EmailContext): { html: string; text: string } | null {
  if (!ctx.calendar) return null;
  const copy = m.calendar;
  return {
    html: renderLinkPair(copy.intro, [
      { label: copy.ics, href: ctx.calendar.icsUrl },
      { label: copy.google, href: ctx.calendar.googleUrl },
    ]),
    text: `${copy.intro}\n${copy.ics}: ${ctx.calendar.icsUrl}\n${copy.google}: ${ctx.calendar.googleUrl}`,
  };
}

/** Hint on the school release letter, or null when the release is off for the camp. */
export function schoolReleaseBlock(ctx: EmailContext): { html: string; text: string } | null {
  if (!ctx.schoolRelease) return null;
  const copy = m.releaseHint;
  const intro = ctx.schoolRelease.afterPayment
    ? `${copy.intro(ctx.schoolRelease.dates)} ${m.releaseAfterPayment}`
    : copy.intro(ctx.schoolRelease.dates);
  return {
    html: [renderHeading(copy.title), renderParagraph(intro), renderButton(copy.button, ctx.schoolRelease.url)].join("\n"),
    text: `${copy.title.toUpperCase()}\n${intro}\n${copy.button}: ${ctx.schoolRelease.url}`,
  };
}

const BUS_QR_WIDTH = 220;

/** QR code of the bus ticket with the boarding hint and a fallback link (specs/021-bus-ticket). */
export function busTicketBlock(ctx: EmailContext): { html: string; text: string } | null {
  if (!ctx.busTicket) return null;
  const copy = m.busTicket;
  return {
    html: [
      renderHeading(copy.heading),
      renderParagraph(copy.show),
      renderImage(ctx.busTicket.imageUrl, copy.alt, BUS_QR_WIDTH),
      renderTextLink(copy.noImage, copy.button, ctx.busTicket.pageUrl),
    ].join("\n"),
    text: `${copy.heading.toUpperCase()}\n${copy.show}\n${copy.button}: ${ctx.busTicket.pageUrl}`,
  };
}

/** Link to the participant page, shared by every mail to a registration. */
export function participantBlock(ctx: EmailContext): { html: string; text: string } {
  const copy = m.participant;
  return {
    html: renderTextLink(copy.intro, copy.link, ctx.participantUrl),
    text: `${copy.intro}\n${copy.link}: ${ctx.participantUrl}`,
  };
}

function factsToText(facts: ReadonlyArray<Fact>): string {
  return facts.map(([label, value]) => `${label}: ${value}`).join("\n");
}

/** Facts for mails that ask for payment: reference, outstanding amount, due date. */
function paymentFacts(ctx: EmailContext): Fact[] {
  const facts: Fact[] = [
    [m.labels.reference, ctx.reference],
    [m.labels.outstanding, formatCurrency(ctx.outstanding)],
  ];
  const due = dueDate(ctx);
  if (due) facts.push([m.labels.dueDate, due]);
  return facts;
}

/** Shared body for payment link and reminders. */
function paymentMail(
  ctx: EmailContext,
  copy: { subject: string; preheader: string; title: string; intro: string; extra?: string },
): RenderedEmail {
  const facts = paymentFacts(ctx);
  const opening = openingBlocks(ctx);
  const closing = closingBlocks(ctx);
  const participant = participantBlock(ctx);
  const bodyHtml = [
    ...opening.map(renderParagraph),
    renderParagraph(copy.intro),
    renderFacts(facts),
    renderButton(m.payButton, ctx.payUrl),
    copy.extra ? renderParagraph(copy.extra) : "",
    participant.html,
    ...closing.map(renderParagraph),
  ].join("\n");

  return {
    subject: copy.subject,
    html: renderLayout({ preheader: copy.preheader, campName: ctx.campName, title: copy.title, bodyHtml }),
    text: renderText([
      ...opening,
      copy.intro,
      factsToText(facts),
      `${m.payButton}: ${ctx.payUrl}`,
      copy.extra ?? "",
      participant.text,
      ...closing,
    ]),
  };
}

export function confirmationEmail(ctx: EmailContext): RenderedEmail {
  const free = ctx.amountDue <= 0;
  const facts: Fact[] = [[m.labels.camp, ctx.campName]];
  const dates = campDates(ctx);
  if (dates) facts.push([m.labels.dates, dates]);
  facts.push([m.labels.reference, ctx.reference]);
  facts.push([m.labels.amount, formatCurrency(ctx.amountDue)]);
  const due = dueDate(ctx);
  if (!free && due) facts.push([m.labels.dueDate, due]);

  const opening = openingBlocks(ctx);
  const closing = closingBlocks(ctx);
  const intro = m.confirmation.intro(ctx.campName);
  const payBlockHtml = free
    ? renderParagraph(m.confirmation.free)
    : [
        renderParagraph(m.confirmation.payIntro),
        renderButton(m.payButton, ctx.payUrl),
        renderParagraph(m.confirmation.alreadyPaid),
      ].join("\n");
  const payBlockText = free
    ? [m.confirmation.free]
    : [m.confirmation.payIntro, `${m.payButton}: ${ctx.payUrl}`, m.confirmation.alreadyPaid];

  const participant = participantBlock(ctx);
  const calendar = calendarBlock(ctx);
  const release = schoolReleaseBlock(ctx);
  const bodyHtml = [
    ...opening.map(renderParagraph),
    renderParagraph(intro),
    renderFacts(facts),
    calendar?.html ?? "",
    release?.html ?? "",
    payBlockHtml,
    renderParagraph(m.confirmation.keepReference),
    participant.html,
    ...closing.map(renderParagraph),
  ].join("\n");

  return {
    subject: m.confirmation.subject(ctx.campName),
    html: renderLayout({
      preheader: m.confirmation.preheader,
      campName: ctx.campName,
      title: m.confirmation.title,
      bodyHtml,
    }),
    text: renderText([
      ...opening,
      intro,
      factsToText(facts),
      calendar?.text ?? "",
      release?.text ?? "",
      ...payBlockText,
      m.confirmation.keepReference,
      participant.text,
      ...closing,
    ]),
  };
}

export function paymentLinkEmail(ctx: EmailContext): RenderedEmail {
  return paymentMail(ctx, {
    subject: m.paymentLink.subject(ctx.campName),
    preheader: m.paymentLink.preheader,
    title: m.paymentLink.title,
    intro: m.paymentLink.intro(ctx.campName),
  });
}

export function reminderEmail(kind: ReminderKind, ctx: EmailContext): RenderedEmail {
  switch (kind) {
    case "reminder_1":
      return paymentMail(ctx, {
        subject: m.reminder1.subject(ctx.campName),
        preheader: m.reminder1.preheader,
        title: m.reminder1.title,
        intro: m.reminder1.intro(ctx.campName),
      });
    case "reminder_2": {
      const due = dueDate(ctx);
      return paymentMail(ctx, {
        subject: due ? m.reminder2.subject(due) : m.reminder2.subjectWithoutDate(ctx.campName),
        preheader: m.reminder2.preheader,
        title: m.reminder2.title,
        intro: due ? m.reminder2.intro(ctx.campName, due) : m.reminder1.intro(ctx.campName),
      });
    }
    case "reminder_3":
      return paymentMail(ctx, {
        subject: m.reminder3.subject(ctx.campName),
        preheader: m.reminder3.preheader,
        title: m.reminder3.title,
        intro: m.reminder3.intro(ctx.campName),
        extra: m.reminder3.help,
      });
  }
}

/** Release letter mail with the PDF attached by the sender (specs/020-school-release, US1). */
export function schoolReleaseEmail(
  ctx: EmailContext,
  release: { dates: string; url: string },
): RenderedEmail {
  const copy = m.schoolRelease;
  const opening = openingBlocks(ctx);
  const closing = closingBlocks(ctx);
  const intro = copy.intro(ctx.campName);
  const dates = release.dates ? copy.dates(release.dates) : "";
  const bodyHtml = [
    ...opening.map(renderParagraph),
    renderParagraph(intro),
    dates ? renderParagraph(dates) : "",
    renderParagraph(copy.attachment),
    renderParagraph(copy.change),
    renderButton(copy.button, release.url),
    ...closing.map(renderParagraph),
  ].join("\n");

  return {
    subject: copy.subject(ctx.campName),
    html: renderLayout({ preheader: copy.preheader, campName: ctx.campName, title: copy.title, bodyHtml }),
    text: renderText([
      ...opening,
      intro,
      dates,
      copy.attachment,
      copy.change,
      `${copy.button}: ${release.url}`,
      ...closing,
    ]),
  };
}

/** Bus ticket sent from the registration dialog (specs/021-bus-ticket, US4). */
export function busTicketEmail(ctx: EmailContext): RenderedEmail {
  const copy = m.busTicket;
  const opening = openingBlocks(ctx);
  const closing = closingBlocks(ctx);
  const intro = copy.intro(ctx.campName);
  const ticket = busTicketBlock(ctx);
  const bodyHtml = [
    ...opening.map(renderParagraph),
    renderParagraph(intro),
    ticket?.html ?? "",
    ...closing.map(renderParagraph),
  ].join("\n");

  return {
    subject: copy.subject(ctx.campName),
    html: renderLayout({ preheader: copy.preheader, campName: ctx.campName, title: copy.title, bodyHtml }),
    text: renderText([...opening, intro, ticket?.text ?? "", ...closing]),
  };
}

/** Link to the participant page requested on the landing page (specs/020-school-release, US2). */
export function participantLinkEmail(ctx: EmailContext, url: string): RenderedEmail {
  const copy = m.participantLink;
  const opening = openingBlocks(ctx);
  const closing = closingBlocks(ctx);
  const intro = ctx.schoolRelease?.afterPayment
    ? `${copy.intro(ctx.campName)} ${m.releaseAfterPayment}`
    : copy.intro(ctx.campName);
  const bodyHtml = [
    ...opening.map(renderParagraph),
    renderParagraph(intro),
    renderButton(copy.button, url),
    renderParagraph(copy.notYou),
    ...closing.map(renderParagraph),
  ].join("\n");

  return {
    subject: copy.subject(ctx.campName),
    html: renderLayout({ preheader: copy.preheader, campName: ctx.campName, title: copy.title, bodyHtml }),
    text: renderText([...opening, intro, `${copy.button}: ${url}`, copy.notYou, ...closing]),
  };
}
