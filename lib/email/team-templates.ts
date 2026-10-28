import { renderButton, renderFacts, renderLayout, renderParagraph, renderText } from "./layout";
import { emailMessages } from "./messages";
import type { RenderedEmail } from "./templates";

/**
 * Internal mail to the team for a message or change request from the
 * participant page (specs/018-participant-messages, contracts/actions-and-mail.md).
 * Pure; every value is escaped by the layout helpers.
 */

export type TeamMessageContext = {
  kind: "message" | "change_request";
  campName: string;
  name: string;
  reference: string;
  replyTo: string | null;
  text: string; // message text, or the reason of a change request
  fieldLabel: string | null;
  previous: string | null; // display strings
  proposed: string | null;
  adminUrl: string | null;
};

type Fact = readonly [string, string];

const t = emailMessages.team;

export function teamMessageEmail(ctx: TeamMessageContext): RenderedEmail {
  const name = ctx.name.trim() || t.unnamed;
  const change = ctx.kind === "change_request";
  const facts: Fact[] = [
    [t.labels.name, name],
    [t.labels.reference, ctx.reference],
    [t.labels.camp, ctx.campName],
  ];
  if (change) {
    facts.push([t.labels.field, ctx.fieldLabel ?? ""]);
    facts.push([t.labels.previous, ctx.previous || t.empty]);
    facts.push([t.labels.proposed, ctx.proposed || t.empty]);
    if (ctx.text) facts.push([t.labels.reason, ctx.text]);
  }

  const reply = ctx.replyTo ? t.replyHint(ctx.replyTo) : t.noReply;
  const blocks: Array<{ html: string; text: string }> = [
    { html: renderParagraph(t.greeting), text: t.greeting },
    { html: renderParagraph(t.intro), text: t.intro },
    { html: renderFacts(facts), text: facts.map(([label, value]) => `${label}: ${value}`).join("\n") },
    ...(change ? [] : [{ html: renderParagraph(ctx.text), text: ctx.text }]),
    ...(change ? [{ html: renderParagraph(t.changeHint), text: t.changeHint }] : []),
    { html: renderParagraph(reply), text: reply },
    ...(ctx.adminUrl
      ? [{ html: renderButton(t.adminLink, ctx.adminUrl), text: `${t.adminLink}: ${ctx.adminUrl}` }]
      : []),
  ];

  const title = change ? t.titleChange : t.titleMessage;
  return {
    subject: change ? t.subjectChange(name, ctx.reference) : t.subjectMessage(name, ctx.reference),
    html: renderLayout({
      preheader: t.preheader,
      campName: ctx.campName,
      title,
      bodyHtml: blocks.map((block) => block.html).join("\n"),
      footer: t.footer,
    }),
    text: renderText(
      blocks.map((block) => block.text),
      t.footer,
    ),
  };
}
