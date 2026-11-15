import { formatGermanDate } from "@/lib/time/berlin";
import { letterhead } from "./letterhead";
import { releaseMessages } from "./messages";
import type { ReleaseGender, ReleaseLetterInput } from "./types";

/**
 * Pure content of the church's "Teilnehmer Bescheinigung"
 * (specs/042-church-release-letter, contracts/letter-layout.md). No prices, no
 * addresses of the person. `lib/school-release/pdf.ts` only lays it out.
 */

export type TextStyle = "regular" | "bold" | "italic";

/** A piece of a paragraph in one style; a paragraph wraps across its runs. */
export type TextRun = { text: string; style: TextStyle };

export type ReleaseLetter = {
  recipientLines: string[];
  placeDate: string;
  phone: string;
  title: string;
  subject: string;
  salutation: string;
  paragraphs: TextRun[][];
  closing: string;
  organization: string;
};

const m = releaseMessages.letter;

/** `03.06. bis 07.06.2026`; both dates with year when the camp spans New Year. */
export function formatCampPeriod(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const from = formatGermanDate(start);
  const to = formatGermanDate(end);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return m.period(sameYear ? from.slice(0, 6) : from, to);
}

function personFor(gender: ReleaseGender): string {
  if (gender === "male") return m.person.male;
  if (gender === "female") return m.person.female;
  return m.person.unknown;
}

const run = (text: string, style: TextStyle = "regular"): TextRun => ({ text, style });

export function buildLetter(input: ReleaseLetterInput): ReleaseLetter {
  const name = input.participantName.trim();
  const person = personFor(input.gender);
  const period = formatCampPeriod(input.campStart, input.campEnd);
  const location = input.campLocation?.trim() || null;

  const reason: TextRun[] = period
    ? [run(m.reasonBefore), run(period, "bold"), run(m.reasonAfter(person, name))]
    : [run(m.reasonNoPeriod(person, name))];

  return {
    recipientLines: [input.data.schoolName, input.data.schoolLocation],
    placeDate: m.placeDate(letterhead.place, formatGermanDate(input.today)),
    phone: letterhead.phone,
    title: m.title,
    subject: period ? m.subject(period, location) : m.subjectNoPeriod(location),
    salutation: m.salutation,
    paragraphs: [
      [run(m.legal), run(` ${m.legalSource}`, "italic")],
      reason,
      [run(m.understanding)],
      [run(m.questions)],
    ],
    closing: m.closing,
    organization: letterhead.organization,
  };
}
