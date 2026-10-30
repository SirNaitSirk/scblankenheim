import { emailMessages } from "./messages";

/**
 * HTML shell and helpers for transactional email (research R2). Mail clients
 * need tables and inline styles, so the markup is deliberately old fashioned.
 * Every interpolated value must pass through `escapeHtml`. Pure, no server
 * imports, so the admin preview can reuse it.
 */

const COLORS = {
  page: "#f4f1ea",
  card: "#ffffff",
  text: "#1f2a24",
  muted: "#5b665f",
  accent: "#2f5d46",
  border: "#e4ded2",
} as const;

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** A paragraph of escaped text; line breaks become `<br>`. */
export function renderParagraph(text: string): string {
  const html = escapeHtml(text).replace(/\n/g, "<br>");
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${COLORS.text};">${html}</p>`;
}

/** A small section heading inside the mail body. */
export function renderHeading(text: string): string {
  return `<h2 style="margin:24px 0 8px;font-size:17px;line-height:1.4;color:${COLORS.text};">${escapeHtml(text)}</h2>`;
}

/** A bulleted list of escaped items. */
export function renderList(items: ReadonlyArray<string>): string {
  const rows = items
    .map((item) => `<li style="margin:0 0 6px;">${escapeHtml(item)}</li>`)
    .join("");
  return `<ul style="margin:0 0 16px;padding-left:20px;font-size:16px;line-height:1.6;color:${COLORS.text};">${rows}</ul>`;
}

/** Label and value rows (reference, amount, ...); line breaks in a value become `<br>`. */
export function renderFacts(rows: ReadonlyArray<readonly [string, string]>): string {
  const cells = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;font-size:14px;color:${COLORS.muted};width:45%;">${escapeHtml(label)}</td>` +
        `<td style="padding:6px 0;font-size:16px;color:${COLORS.text};font-weight:600;">${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border-top:1px solid ${COLORS.border};border-bottom:1px solid ${COLORS.border};">${cells}</table>`;
}

/** Bulletproof button plus a readable fallback link. */
export function renderButton(label: string, href: string): string {
  const url = escapeHtml(href);
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;"><tr>` +
    `<td style="border-radius:8px;background:${COLORS.accent};">` +
    `<a href="${url}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>` +
    `</td></tr></table>` +
    `<p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:${COLORS.muted};">${escapeHtml(emailMessages.linkFallback)}<br>` +
    `<a href="${url}" style="color:${COLORS.accent};word-break:break-all;">${url}</a></p>`
  );
}

/** Centered image with a fixed width, e.g. the bus ticket QR code (specs/021-bus-ticket). */
export function renderImage(src: string, alt: string, width: number): string {
  return (
    `<p style="margin:8px 0 16px;text-align:center;">` +
    `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="${width}" height="${width}" ` +
    `style="display:inline-block;width:${width}px;max-width:100%;height:auto;border:1px solid ${COLORS.border};border-radius:8px;background:#ffffff;">` +
    `</p>`
  );
}

/** Quiet secondary link: one sentence plus a bold link line, lighter than a button. */
export function renderTextLink(intro: string, label: string, href: string): string {
  const url = escapeHtml(href);
  return (
    `<p style="margin:8px 0 16px;padding:16px;border:1px solid ${COLORS.border};border-radius:8px;font-size:15px;line-height:1.6;color:${COLORS.text};">` +
    `${escapeHtml(intro)}<br>` +
    `<a href="${url}" style="font-weight:600;color:${COLORS.accent};">${escapeHtml(label)}</a></p>`
  );
}

/** Quiet block with one sentence and several links side by side (specs/019-calendar-file). */
export function renderLinkPair(
  intro: string,
  links: ReadonlyArray<{ label: string; href: string }>,
): string {
  const anchors = links
    .map(
      (link) =>
        `<a href="${escapeHtml(link.href)}" style="font-weight:600;color:${COLORS.accent};margin-right:16px;">${escapeHtml(link.label)}</a>`,
    )
    .join("");
  return (
    `<p style="margin:8px 0 16px;padding:16px;border:1px solid ${COLORS.border};border-radius:8px;font-size:15px;line-height:1.6;color:${COLORS.text};">` +
    `${escapeHtml(intro)}<br>${anchors}</p>`
  );
}

export function renderLayout(input: {
  preheader: string;
  campName: string;
  title: string;
  bodyHtml: string;
  footer?: string; // internal team mails replace the public footer
}): string {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(input.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td style="padding:0 8px 16px;font-size:14px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${COLORS.accent};">${escapeHtml(input.campName)}</td></tr>
<tr><td style="background:${COLORS.card};border-radius:12px;padding:32px 28px;border:1px solid ${COLORS.border};">
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;color:${COLORS.text};">${escapeHtml(input.title)}</h1>
${input.bodyHtml}
</td></tr>
<tr><td style="padding:20px 8px 0;font-size:12px;line-height:1.5;color:${COLORS.muted};">${escapeHtml(input.footer ?? emailMessages.footer)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Plain text version: blocks separated by blank lines. */
export function renderText(
  blocks: ReadonlyArray<string>,
  footer: string = emailMessages.footer,
): string {
  return `${blocks.filter((block) => block.trim() !== "").join("\n\n")}\n\n${footer}\n`;
}
