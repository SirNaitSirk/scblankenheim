import { formatGermanDate } from "@/lib/time/berlin";
import { releaseMessages } from "./messages";
import { formatReleaseDates } from "./settings";
import type { ReleaseLetterInput } from "./types";

/**
 * Pure content of the release letter (specs/020-school-release, contracts
 * section "PDF layout"). No prices, no guardian, no school mail address.
 * `lib/school-release/pdf.ts` only lays these lines out.
 */

export type ReleaseLetter = {
  senderLines: string[];
  recipientLines: string[];
  placeDate: string;
  subject: string;
  salutation: string;
  paragraphs: string[]; // `\n` inside a paragraph is a line break
  closing: string;
  signerName: string;
  signerRole: string | null;
};

const m = releaseMessages.letter;

export function buildLetter(input: ReleaseLetterInput): ReleaseLetter {
  const { data, settings } = input;
  const name = input.participantName.trim();
  const period =
    input.campStart && input.campEnd
      ? m.period(formatGermanDate(input.campStart), formatGermanDate(input.campEnd))
      : null;

  const facts = [m.address(data.participantAddress.split("\n").join(", "))];
  if (data.className) facts.push(m.className(data.className));

  return {
    senderLines: input.senderLines.filter((line) => line.trim() !== ""),
    recipientLines: [data.teacherName, data.schoolName, ...data.schoolAddress.split("\n")],
    placeDate: m.placeDate(formatGermanDate(input.today)),
    subject: m.subject,
    salutation: m.salutation(data.teacherName),
    paragraphs: [
      period ? m.attendance(name, input.campName, period) : m.attendanceNoPeriod(name, input.campName),
      facts.join("\n"),
      m.request(name, formatReleaseDates(settings.dates)),
      m.thanks,
    ],
    closing: m.closing,
    signerName: settings.signerName ?? "",
    signerRole: settings.signerRole,
  };
}
