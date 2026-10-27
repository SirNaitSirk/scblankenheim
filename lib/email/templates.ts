import { formatCurrency } from "@/lib/format";
import { formatGermanDate } from "@/lib/time/berlin";
import {
  renderButton,
  renderFacts,
  renderLayout,
  renderParagraph,
  renderText,
} from "./layout";
import { emailMessages as m } from "./messages";

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
  const greeting = m.greeting(ctx.firstName);
  const bodyHtml = [
    renderParagraph(greeting),
    renderParagraph(copy.intro),
    renderFacts(facts),
    renderButton(m.payButton, ctx.payUrl),
    copy.extra ? renderParagraph(copy.extra) : "",
    renderParagraph(m.closing),
  ].join("\n");

  return {
    subject: copy.subject,
    html: renderLayout({ preheader: copy.preheader, campName: ctx.campName, title: copy.title, bodyHtml }),
    text: renderText([
      greeting,
      copy.intro,
      factsToText(facts),
      `${m.payButton}: ${ctx.payUrl}`,
      copy.extra ?? "",
      m.closing,
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

  const greeting = m.greeting(ctx.firstName);
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

  const bodyHtml = [
    renderParagraph(greeting),
    renderParagraph(intro),
    renderFacts(facts),
    payBlockHtml,
    renderParagraph(m.confirmation.keepReference),
    renderParagraph(m.closing),
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
      greeting,
      intro,
      factsToText(facts),
      ...payBlockText,
      m.confirmation.keepReference,
      m.closing,
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
