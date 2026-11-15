import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PDFDocument } from "pdf-lib";
import { buildLetter, formatCampPeriod, type ReleaseLetter } from "@/lib/school-release/letter";
import { renderReleasePdf, toWinAnsi, toWords } from "@/lib/school-release/pdf";
import { releaseSettingsInputSchema, schoolReleaseInputSchema } from "@/lib/school-release/schema";
import {
  EMPTY_RELEASE_SETTINGS,
  datesWithinCamp,
  formatReleaseDates,
  isReleaseActive,
  isReleaseUnlocked,
  missingForEnable,
  toReleaseSettings,
} from "@/lib/school-release/settings";
import { SCHOOL_LOCATION_MAX, SCHOOL_NAME_MAX } from "@/lib/school-release/limits";
import type { ReleaseLetterInput, ReleaseSettings } from "@/lib/school-release/types";

const complete: ReleaseSettings = {
  enabled: true,
  dates: ["2027-06-04"],
  signaturePath: "camp/signature-1.png",
};

const period = { start: "2027-06-03", end: "2027-06-06" };

const validInput = { schoolName: "  Gesamtschule   Eifel ", schoolLocation: " Nettersheim " };

describe("schoolReleaseInputSchema", () => {
  it("trims and collapses whitespace", () => {
    expect(schoolReleaseInputSchema.parse(validInput)).toEqual({
      schoolName: "Gesamtschule Eifel",
      schoolLocation: "Nettersheim",
    });
  });

  it("ignores fields that no longer exist", () => {
    const parsed = schoolReleaseInputSchema.parse({ ...validInput, teacherName: "Frau Becker" });
    expect(Object.keys(parsed).sort()).toEqual(["schoolLocation", "schoolName"]);
  });

  it("requires both fields and enforces the limits", () => {
    expect(schoolReleaseInputSchema.safeParse({ ...validInput, schoolName: "   " }).success).toBe(false);
    expect(schoolReleaseInputSchema.safeParse({ ...validInput, schoolLocation: "" }).success).toBe(false);
    expect(
      schoolReleaseInputSchema.safeParse({ ...validInput, schoolName: "x".repeat(SCHOOL_NAME_MAX + 1) }).success,
    ).toBe(false);
    expect(
      schoolReleaseInputSchema.safeParse({ ...validInput, schoolLocation: "x".repeat(SCHOOL_LOCATION_MAX + 1) }).success,
    ).toBe(false);
  });

  it("validates settings input", () => {
    const parsed = releaseSettingsInputSchema.parse({
      enabled: false,
      dates: ["2027-06-05", "2027-06-04", "2027-06-04"],
    });
    expect(parsed.dates).toEqual(["2027-06-04", "2027-06-05"]);
    expect(releaseSettingsInputSchema.safeParse({ enabled: true, dates: Array(6).fill("2027-06-04") }).success).toBe(
      false,
    );
  });
});

describe("settings", () => {
  it("lists what blocks the switch, including the camp period", () => {
    expect(missingForEnable(EMPTY_RELEASE_SETTINGS, { start: null, end: null })).toEqual([
      "signature",
      "dates",
      "campPeriod",
    ]);
    expect(missingForEnable(complete, { start: "2027-06-03", end: null })).toEqual(["campPeriod"]);
    expect(missingForEnable(complete, period)).toEqual([]);
    expect(isReleaseActive(complete)).toBe(true);
    expect(isReleaseActive({ ...complete, enabled: false })).toBe(false);
    expect(isReleaseActive({ ...complete, signaturePath: null })).toBe(false);
  });

  it("maps a missing row to empty settings", () => {
    expect(toReleaseSettings(null)).toEqual(EMPTY_RELEASE_SETTINGS);
  });

  it("checks dates against the camp period", () => {
    expect(datesWithinCamp(["2027-06-04"], "2027-06-03", "2027-06-06")).toBe(true);
    expect(datesWithinCamp(["2027-06-07"], "2027-06-03", "2027-06-06")).toBe(false);
    expect(datesWithinCamp(["2027-06-04"], null, "2027-06-06")).toBe(false);
  });

  it("formats release dates in German", () => {
    expect(formatReleaseDates(["2027-06-04"])).toBe("Freitag, 4. Juni 2027");
    expect(formatReleaseDates(["2027-06-07", "2027-06-04"])).toBe(
      "Freitag, 4. Juni 2027 und Montag, 7. Juni 2027",
    );
  });
});

/** The data of the church's template letter of 2026. */
const letterInput: ReleaseLetterInput = {
  data: { schoolName: "Gesamtschule Eifel", schoolLocation: "Nettersheim" },
  participantName: "John Hacatrian",
  gender: "male",
  campStart: "2026-06-03",
  campEnd: "2026-06-07",
  campLocation: "Nieuwpoort/Belgien",
  today: "2026-06-01",
};

function plainText(letter: ReleaseLetter): string {
  return [
    ...letter.recipientLines,
    letter.placeDate,
    letter.title,
    letter.subject,
    letter.salutation,
    ...letter.paragraphs.map((runs) => runs.map((run) => run.text).join("")),
    letter.closing,
    letter.organization,
  ].join("\n");
}

describe("isReleaseUnlocked", () => {
  const payment = (paymentStatus: string, amountPaid = 0, amountDue = 195) => ({ paymentStatus, amountPaid, amountDue });

  it("unlocks paid and partly paid registrations", () => {
    expect(isReleaseUnlocked(payment("paid", 195))).toBe(true);
    expect(isReleaseUnlocked(payment("partial", 50))).toBe(true);
    expect(isReleaseUnlocked(payment("unpaid", 50))).toBe(true);
  });

  it("unlocks registrations that owe nothing", () => {
    expect(isReleaseUnlocked(payment("unpaid", 0, 0))).toBe(true);
  });

  it("keeps unpaid and processing registrations locked", () => {
    expect(isReleaseUnlocked(payment("unpaid"))).toBe(false);
    expect(isReleaseUnlocked(payment("processing"))).toBe(false);
  });

  it("never unlocks refunded registrations", () => {
    expect(isReleaseUnlocked(payment("refunded", 195))).toBe(false);
    expect(isReleaseUnlocked(payment("refunded", 0, 0))).toBe(false);
  });
});

describe("formatCampPeriod", () => {
  it("writes the year only at the end within one year", () => {
    expect(formatCampPeriod("2026-06-03", "2026-06-07")).toBe("03.06. bis 07.06.2026");
  });

  it("writes both years across New Year", () => {
    expect(formatCampPeriod("2026-12-30", "2027-01-02")).toBe("30.12.2026 bis 02.01.2027");
  });

  it("is null without a full period", () => {
    expect(formatCampPeriod(null, "2026-06-07")).toBeNull();
  });
});

describe("buildLetter", () => {
  it("matches the wording of the template", () => {
    const letter = buildLetter(letterInput);
    expect(letter.recipientLines).toEqual(["Gesamtschule Eifel", "Nettersheim"]);
    expect(letter.placeDate).toBe("Blankenheim, 01.06.2026");
    expect(letter.title).toBe("Teilnehmer Bescheinigung");
    expect(letter.subject).toBe("Summercamp vom 03.06. bis 07.06.2026 in Nieuwpoort/Belgien");
    expect(letter.salutation).toBe("Sehr geehrte Damen und Herren,");
    const text = plainText(letter);
    expect(text).toContain("laut AV Schulpflicht zu §128 Schulgesetz");
    expect(text).toContain("dem entgegenstehen. (AV Schulpflicht Nr. 2 Abs. 7)");
    expect(text).toContain(
      "Da die Teilnahme aus religiösen Gründen bedingt ist (Zeitraum 03.06. bis 07.06.2026), bitten wir den Teilnehmer John Hacatrian, vom Unterricht zu befreien.",
    );
    expect(text).toContain("Wir bitten um Ihr Verständnis.");
    expect(text).toContain("Mit freundlichen Segensgrüßen");
    expect(letter.organization).toBe("FCG Blankenheim eV");
    expect(text).not.toMatch(/€|EUR|Preis/);
  });

  it("styles the period bold and the source note italic", () => {
    const [legal, reason] = buildLetter(letterInput).paragraphs;
    expect(legal!.at(-1)).toEqual({ text: " (AV Schulpflicht Nr. 2 Abs. 7)", style: "italic" });
    expect(reason!.find((run) => run.style === "bold")?.text).toBe("03.06. bis 07.06.2026");
  });

  it("words the request by gender", () => {
    expect(plainText(buildLetter({ ...letterInput, gender: "female" }))).toContain(
      "bitten wir die Teilnehmerin John Hacatrian,",
    );
    expect(plainText(buildLetter({ ...letterInput, gender: null }))).toContain(
      "bitten wir die teilnehmende Person John Hacatrian,",
    );
  });

  it("drops the location and the period when missing", () => {
    expect(buildLetter({ ...letterInput, campLocation: " " }).subject).toBe("Summercamp vom 03.06. bis 07.06.2026");
    const noPeriod = buildLetter({ ...letterInput, campEnd: null });
    expect(noPeriod.subject).toBe("Summercamp in Nieuwpoort/Belgien");
    expect(plainText(noPeriod)).toContain(
      "Da die Teilnahme aus religiösen Gründen bedingt ist, bitten wir den Teilnehmer John Hacatrian,",
    );
  });

  it("contains no dashes", () => {
    expect(plainText(buildLetter(letterInput))).not.toMatch(/[\u2010-\u2015]| - /);
  });
});

const PNG_1PX = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
  (c) => c.charCodeAt(0),
);

describe("pdf", () => {
  it("keeps umlauts and replaces emoji", () => {
    expect(toWinAnsi("Größe Übung äöü ß")).toBe("Größe Übung äöü ß");
    expect(toWinAnsi("Hi 😀")).toBe("Hi ?");
    expect(toWinAnsi("Łódź")).toBe("Lódz");
  });

  it("keeps neighbouring runs without a space as one word", () => {
    const words = toWords([
      { text: "(Zeitraum ", style: "regular" },
      { text: "03.06. bis 07.06.2026", style: "bold" },
      { text: "), bitten", style: "regular" },
    ]);
    expect(words.map((word) => word.map((segment) => segment.text).join(""))).toEqual([
      "(Zeitraum",
      "03.06.",
      "bis",
      "07.06.2026),",
      "bitten",
    ]);
  });

  it("renders one page with and without stamp", async () => {
    const letter = buildLetter(letterInput);
    const bytes = await renderReleasePdf(letter, null);
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("%PDF");
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    const withStamp = await renderReleasePdf(letter, { bytes: PNG_1PX, type: "png" });
    expect((await PDFDocument.load(withStamp)).getPageCount()).toBe(1);
  });

  it("stays one page at the maximum field lengths", async () => {
    const letter = buildLetter({
      ...letterInput,
      participantName: "Maximilian Alexander Konstantin von und zu Langenachnamenhausen",
      data: { schoolName: "Schule ".repeat(22).slice(0, SCHOOL_NAME_MAX), schoolLocation: "Ort ".repeat(20).slice(0, SCHOOL_LOCATION_MAX) },
    });
    const bytes = await renderReleasePdf(letter, { bytes: PNG_1PX, type: "png" });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });
});
