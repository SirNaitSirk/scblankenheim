import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ReleaseLetter } from "./letter";
import { releaseMessages } from "./messages";

/**
 * Renders the release letter as a one page A4 PDF with pdf-lib
 * (specs/020-school-release, research R1). The standard Helvetica font only
 * knows WinAnsi, so every text passes `toWinAnsi` first. Text is drawn as plain
 * text, never interpreted.
 */

export type SignatureImage = { bytes: Uint8Array; type: "png" | "jpg" };

// WinAnsi characters outside Latin 1, written as escapes to keep the source plain.
const WIN_ANSI_EXTRA = new Set(
  "\u20ac\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u017d\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u017e\u0178",
);

// Letters without a Unicode decomposition, mapped to their Latin base letter.
const LATIN_FALLBACK: Record<string, string> = {
  "\u0141": "L",
  "\u0142": "l",
  "\u0110": "D",
  "\u0111": "d",
  "\u0131": "i",
  "\u0127": "h",
  "\u0126": "H",
};

function isWinAnsi(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.has(char);
}

/** Keeps WinAnsi characters, strips accents the font lacks, replaces the rest with `?`. */
export function toWinAnsi(text: string): string {
  let result = "";
  for (const char of text.replace(/[\t\r\n]+/g, " ")) {
    if (isWinAnsi(char)) {
      result += char;
      continue;
    }
    const fallback = LATIN_FALLBACK[char];
    if (fallback) {
      result += fallback;
      continue;
    }
    const plain = char.normalize("NFKD").replace(/\p{M}/gu, "");
    result += plain !== "" && [...plain].every(isWinAnsi) ? plain : "?";
  }
  return result;
}

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = { left: 70, right: 60, top: 60 };
const BODY_SIZE = 11;
const SMALL_SIZE = 9;
const LINE = 15;
const SIGNATURE_BOX = { width: 160, height: 60 };
const TEXT_COLOR = rgb(0.1, 0.1, 0.1);
const MUTED_COLOR = rgb(0.4, 0.4, 0.4);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ").filter((part) => part !== "")) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderReleasePdf(
  letter: ReleaseLetter,
  signature: SignatureImage | null,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(toWinAnsi(letter.subject));
  pdf.setProducer("FCG Blankenheim Summercamp");
  const page: PDFPage = pdf.addPage([PAGE.width, PAGE.height]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const textWidth = PAGE.width - MARGIN.left - MARGIN.right;
  const right = PAGE.width - MARGIN.right;

  const draw = (text: string, x: number, y: number, font = regular, size = BODY_SIZE, color = TEXT_COLOR) =>
    page.drawText(toWinAnsi(text), { x, y, font, size, color });
  const drawRight = (text: string, y: number, font = regular, size = BODY_SIZE, color = TEXT_COLOR) => {
    const safe = toWinAnsi(text);
    draw(safe, right - font.widthOfTextAtSize(safe, size), y, font, size, color);
  };

  // Sender block, top right.
  let y = PAGE.height - MARGIN.top;
  letter.senderLines.forEach((line, index) => {
    drawRight(line, y, index === 0 ? bold : regular, SMALL_SIZE, index === 0 ? TEXT_COLOR : MUTED_COLOR);
    y -= 12;
  });

  // Recipient block.
  y = PAGE.height - 170;
  for (const line of letter.recipientLines) {
    draw(line, MARGIN.left, y);
    y -= LINE;
  }

  y -= 2 * LINE;
  drawRight(letter.placeDate, y);
  y -= 2 * LINE;
  draw(letter.subject, MARGIN.left, y, bold, 12);
  y -= 2 * LINE;
  draw(letter.salutation, MARGIN.left, y);
  y -= 1.6 * LINE;

  for (const paragraph of letter.paragraphs) {
    for (const rawLine of paragraph.split("\n")) {
      for (const line of wrap(toWinAnsi(rawLine), regular, BODY_SIZE, textWidth)) {
        draw(line, MARGIN.left, y);
        y -= LINE;
      }
    }
    y -= 0.6 * LINE;
  }

  y -= 0.4 * LINE;
  draw(letter.closing, MARGIN.left, y);
  y -= 0.6 * LINE;

  // Signature image scaled into the box, or a placeholder box.
  const boxTop = y;
  if (signature) {
    const image = signature.type === "png" ? await pdf.embedPng(signature.bytes) : await pdf.embedJpg(signature.bytes);
    const scale = Math.min(SIGNATURE_BOX.width / image.width, SIGNATURE_BOX.height / image.height, 1);
    const width = image.width * scale;
    const height = image.height * scale;
    page.drawImage(image, { x: MARGIN.left, y: boxTop - height, width, height });
  } else {
    page.drawRectangle({
      x: MARGIN.left,
      y: boxTop - SIGNATURE_BOX.height,
      width: SIGNATURE_BOX.width,
      height: SIGNATURE_BOX.height,
      borderColor: MUTED_COLOR,
      borderWidth: 0.8,
    });
    draw(releaseMessages.letter.signatureMissing, MARGIN.left + 12, boxTop - SIGNATURE_BOX.height / 2 - 3, regular, SMALL_SIZE, MUTED_COLOR);
  }
  y = boxTop - SIGNATURE_BOX.height - LINE;

  if (letter.signerName) {
    draw(letter.signerName, MARGIN.left, y);
    y -= LINE;
  }
  if (letter.signerRole) draw(letter.signerRole, MARGIN.left, y, regular, BODY_SIZE, MUTED_COLOR);

  return pdf.save();
}
