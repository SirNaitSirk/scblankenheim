import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { ReleaseLetter, TextRun, TextStyle } from "./letter";
import { letterhead } from "./letterhead";
import { releaseMessages } from "./messages";

/**
 * Renders the release letter as a one page A4 PDF on the church letterhead
 * with pdf-lib (specs/042-church-release-letter, contracts/letter-layout.md).
 * Positions follow the church's template. The standard Helvetica family only
 * knows WinAnsi, so every text passes `toWinAnsi` first. Text is drawn as
 * plain text, never interpreted.
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

// Positions in pt from the bottom left, measured on the template (A4).
const PAGE = { width: 595.28, height: 841.89 };
const LEFT = 70.92;
const RIGHT = 522;
const TEXT_WIDTH = RIGHT - LEFT;
const LOGO = { x: 0, y: 708.42, width: 596.75, height: 113.25 };
const SENDER = { y: 687.6, size: 6.96 };
const RECIPIENT = { y: 650.76, width: 300 };
const BODY_SIZE = 11.04;
const LINE = 14.2;
const PHONE_GAP = 22;
const TITLE = { y: 487.3, size: 14.04 };
const SUBJECT_GAP = 25.8;
const SALUTATION_GAP = 50;
const AFTER_SALUTATION = 29;
const PARAGRAPH_GAP = 8;
const CLOSING_GAP = 10;
const ORGANIZATION = { gap: 24, size: 10 };
const STAMP = { x: 80.5, width: 174, height: 137.4, aboveClosing: 13, minHeight: 80 };
const FOOTER = { columns: [39.12, 144.72, 267.72, 381.12], rows: [67.56, 56.52, 45.6, 34.56, 21.12], size: 8.5 };
const FOOTER_TOP = 85; // nothing of the body goes below this line
const TEXT_COLOR = rgb(0, 0, 0.039);
const MUTED_COLOR = rgb(0.4, 0.4, 0.4);

const LOGO_PATH = path.join(process.cwd(), "lib/school-release/assets/church-logo.png");
let logoBytes: Promise<Uint8Array> | null = null;

/** The logo file is read once per process. */
function loadLogo(): Promise<Uint8Array> {
  logoBytes ??= readFile(LOGO_PATH).then((buffer) => new Uint8Array(buffer));
  return logoBytes;
}

type Fonts = Record<TextStyle, PDFFont>;
type Segment = { text: string; style: TextStyle };
type Word = Segment[];

/**
 * Splits styled runs into unbreakable words. Pieces of neighbouring runs
 * without whitespace in between stay one word, so "2026)," never breaks.
 */
export function toWords(runs: readonly TextRun[]): Word[] {
  const words: Word[] = [];
  let current: Word = [];
  for (const run of runs) {
    for (const piece of toWinAnsi(run.text).split(/( +)/)) {
      if (piece === "") continue;
      if (piece.trim() === "") {
        if (current.length) words.push(current);
        current = [];
      } else {
        current.push({ text: piece, style: run.style });
      }
    }
  }
  if (current.length) words.push(current);
  return words;
}

function wordWidth(word: Word, fonts: Fonts, size: number): number {
  return word.reduce((sum, segment) => sum + fonts[segment.style].widthOfTextAtSize(segment.text, size), 0);
}

/** Greedy line breaking over styled words. */
function wrapWords(words: Word[], fonts: Fonts, size: number, maxWidth: number): Word[][] {
  const space = fonts.regular.widthOfTextAtSize(" ", size);
  const lines: Word[][] = [];
  let line: Word[] = [];
  let width = 0;
  for (const word of words) {
    const w = wordWidth(word, fonts, size);
    if (line.length && width + space + w > maxWidth) {
      lines.push(line);
      line = [];
      width = 0;
    }
    width += (line.length ? space : 0) + w;
    line.push(word);
  }
  if (line.length) lines.push(line);
  return lines;
}

export async function renderReleasePdf(
  letter: ReleaseLetter,
  signature: SignatureImage | null,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(toWinAnsi(letter.title));
  pdf.setProducer("FCG Blankenheim Summercamp");
  const page: PDFPage = pdf.addPage([PAGE.width, PAGE.height]);
  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
  };

  const draw = (text: string, x: number, y: number, style: TextStyle = "regular", size = BODY_SIZE, color = TEXT_COLOR) =>
    page.drawText(toWinAnsi(text), { x, y, font: fonts[style], size, color });
  const drawRight = (text: string, y: number) => {
    const safe = toWinAnsi(text);
    draw(safe, RIGHT - fonts.regular.widthOfTextAtSize(safe, BODY_SIZE), y);
  };
  const drawParagraph = (runs: readonly TextRun[], y: number, size = BODY_SIZE): number => {
    const space = fonts.regular.widthOfTextAtSize(" ", size);
    for (const line of wrapWords(toWords(runs), fonts, size, TEXT_WIDTH)) {
      let x = LEFT;
      line.forEach((word, index) => {
        if (index > 0) x += space;
        for (const segment of word) {
          page.drawText(segment.text, { x, y, font: fonts[segment.style], size, color: TEXT_COLOR });
          x += fonts[segment.style].widthOfTextAtSize(segment.text, size);
        }
      });
      y -= LINE;
    }
    return y;
  };

  // Letterhead: logo with the green line and the small sender line.
  const logo = await pdf.embedPng(await loadLogo());
  page.drawImage(logo, LOGO);
  draw(letterhead.senderLine, LEFT, SENDER.y, "regular", SENDER.size, MUTED_COLOR);

  // Recipient on the left, place, date and phone on the right.
  let y = RECIPIENT.y;
  const recipientWords = (line: string) => wrapWords(toWords([{ text: line, style: "regular" }]), fonts, BODY_SIZE, RECIPIENT.width);
  for (const line of letter.recipientLines.flatMap(recipientWords)) {
    draw(line.map((word) => word.map((segment) => segment.text).join("")).join(" "), LEFT, y);
    y -= LINE;
  }
  const dateY = RECIPIENT.y - LINE;
  drawRight(letter.placeDate, dateY);
  drawRight(letter.phone, dateY - PHONE_GAP);

  // Title and subject; the title keeps its place unless a long recipient pushes it.
  y = Math.min(TITLE.y, y - LINE);
  draw(letter.title, LEFT, y, "regular", TITLE.size);
  y -= SUBJECT_GAP;
  y = drawParagraph([{ text: letter.subject, style: "bold" }], y);
  y -= SALUTATION_GAP - LINE;
  draw(letter.salutation, LEFT, y);
  y -= AFTER_SALUTATION;

  for (const paragraph of letter.paragraphs) {
    y = drawParagraph(paragraph, y);
    y -= PARAGRAPH_GAP;
  }

  y -= CLOSING_GAP;
  const closingY = y;
  const organizationY = closingY - ORGANIZATION.gap;

  // Stamp with signature, drawn before the closing so the text lies on top as
  // in the template; shrinks when long text would push it into the footer.
  const stampTop = closingY + STAMP.aboveClosing;
  const room = stampTop - FOOTER_TOP;
  if (signature) {
    const image: PDFImage =
      signature.type === "png" ? await pdf.embedPng(signature.bytes) : await pdf.embedJpg(signature.bytes);
    const scale = Math.min(STAMP.width / image.width, Math.max(Math.min(STAMP.height, room), STAMP.minHeight) / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    page.drawImage(image, { x: STAMP.x, y: stampTop - height, width, height });
  } else {
    const height = Math.max(Math.min(STAMP.height, room), STAMP.minHeight);
    page.drawRectangle({
      x: STAMP.x,
      y: stampTop - height,
      width: STAMP.width,
      height,
      borderColor: MUTED_COLOR,
      borderWidth: 0.8,
    });
    draw(releaseMessages.letter.signatureMissing, STAMP.x + 12, stampTop - height / 2, "regular", 9, MUTED_COLOR);
  }

  draw(letter.closing, LEFT, closingY);
  draw(letter.organization, LEFT, organizationY, "regular", ORGANIZATION.size);

  // Footer in four columns.
  letterhead.footer.forEach((column, columnIndex) => {
    column.forEach((line, rowIndex) => {
      const rowY = FOOTER.rows[rowIndex];
      if (rowY !== undefined) draw(line, FOOTER.columns[columnIndex]!, rowY, "regular", FOOTER.size, MUTED_COLOR);
    });
  });

  return pdf.save();
}
