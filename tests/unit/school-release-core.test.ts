import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PDFDocument } from "pdf-lib";
import { buildLetter } from "@/lib/school-release/letter";
import { renderReleasePdf, toWinAnsi } from "@/lib/school-release/pdf";
import { releaseSettingsInputSchema, schoolReleaseInputSchema } from "@/lib/school-release/schema";
import {
  EMPTY_RELEASE_SETTINGS,
  datesWithinCamp,
  formatReleaseDates,
  isReleaseActive,
  isReleaseUnlocked,
  missingForEnable,
  prefillAddress,
  toReleaseSettings,
} from "@/lib/school-release/settings";
import type { ReleaseLetterInput, ReleaseSettings } from "@/lib/school-release/types";

const complete: ReleaseSettings = {
  enabled: true,
  dates: ["2027-06-04"],
  signerName: "Maria Schulz",
  signerRole: "Campleitung",
  signaturePath: "camp/signature-1.png",
  addressKeys: ["street", "zip", "city"],
};

const validInput = {
  teacherName: "  Frau   Becker ",
  schoolName: "Gesamtschule Musterstadt",
  schoolAddress: "Schulweg 1\r\n\r\n 12345 Musterstadt ",
  participantAddress: "Lindenstraße 5\n12345 Musterstadt",
  className: "  ",
};

describe("schoolReleaseInputSchema", () => {
  it("trims, normalizes lines and turns an empty class into null", () => {
    const parsed = schoolReleaseInputSchema.parse(validInput);
    expect(parsed.teacherName).toBe("Frau Becker");
    expect(parsed.schoolAddress).toBe("Schulweg 1\n12345 Musterstadt");
    expect(parsed.className).toBeNull();
  });

  it("enforces the limits", () => {
    expect(schoolReleaseInputSchema.safeParse({ ...validInput, teacherName: "x".repeat(121) }).success).toBe(false);
    expect(schoolReleaseInputSchema.safeParse({ ...validInput, schoolName: "x".repeat(161) }).success).toBe(false);
    expect(schoolReleaseInputSchema.safeParse({ ...validInput, schoolAddress: "x".repeat(301) }).success).toBe(false);
    expect(schoolReleaseInputSchema.safeParse({ ...validInput, schoolAddress: "a\nb\nc\nd\ne" }).success).toBe(false);
    expect(schoolReleaseInputSchema.safeParse({ ...validInput, className: "x".repeat(41) }).success).toBe(false);
    expect(schoolReleaseInputSchema.safeParse({ ...validInput, schoolName: "   " }).success).toBe(false);
  });

  it("validates settings input", () => {
    const parsed = releaseSettingsInputSchema.parse({
      enabled: false,
      dates: ["2027-06-05", "2027-06-04", "2027-06-04"],
      signerName: " ",
      signerRole: "Campleitung",
      addressKeys: ["street", "street"],
    });
    expect(parsed.dates).toEqual(["2027-06-04", "2027-06-05"]);
    expect(parsed.signerName).toBeNull();
    expect(parsed.addressKeys).toEqual(["street"]);
    expect(
      releaseSettingsInputSchema.safeParse({ enabled: true, dates: Array(6).fill("2027-06-04"), addressKeys: [] }).success,
    ).toBe(false);
  });
});

describe("settings", () => {
  it("lists what blocks the switch", () => {
    expect(missingForEnable(EMPTY_RELEASE_SETTINGS)).toEqual(["signature", "dates", "signerName"]);
    expect(missingForEnable(complete)).toEqual([]);
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

  it("prefills the address and skips missing answers", () => {
    expect(prefillAddress({ street: "Lindenstraße 5", zip: "12345", city: "Musterstadt" }, complete.addressKeys)).toBe(
      "Lindenstraße 5\n12345 Musterstadt",
    );
    expect(prefillAddress({ street: "Lindenstraße 5", city: "Musterstadt" }, complete.addressKeys)).toBe(
      "Lindenstraße 5\nMusterstadt",
    );
    expect(prefillAddress({}, complete.addressKeys)).toBe("");
    expect(prefillAddress(null, [])).toBe("");
  });

  it("formats release dates in German", () => {
    expect(formatReleaseDates(["2027-06-04"])).toBe("Freitag, 4. Juni 2027");
    expect(formatReleaseDates(["2027-06-07", "2027-06-04"])).toBe(
      "Freitag, 4. Juni 2027 und Montag, 7. Juni 2027",
    );
  });
});

const letterInput: ReleaseLetterInput = {
  settings: complete,
  data: schoolReleaseInputSchema.parse({ ...validInput, className: "8b" }),
  participantName: "Lena Weiß",
  campName: "Summercamp 2027",
  campStart: "2027-06-03",
  campEnd: "2027-06-06",
  senderLines: ["FCG Blankenheim Summercamp", "Maria Schulz", ""],
  today: "2027-05-01",
};

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

describe("buildLetter", () => {
  it("contains name, school, class and dates but no prices", () => {
    const letter = buildLetter(letterInput);
    const all = [...letter.senderLines, ...letter.recipientLines, letter.salutation, ...letter.paragraphs].join("\n");
    expect(all).toContain("Lena Weiß");
    expect(all).toContain("Gesamtschule Musterstadt");
    expect(all).toContain("Klasse: 8b");
    expect(all).toContain("Freitag, 4. Juni 2027");
    expect(all).toContain("03.06.2027");
    expect(all).not.toMatch(/€|EUR|Preis/);
    expect(letter.senderLines).toHaveLength(2);
    expect(letter.placeDate).toBe("Blankenheim, 01.05.2027");
  });
});

describe("pdf", () => {
  it("keeps umlauts and replaces emoji", () => {
    expect(toWinAnsi("Größe Übung äöü ß")).toBe("Größe Übung äöü ß");
    expect(toWinAnsi("Hi 😀")).toBe("Hi ?");
    expect(toWinAnsi("Łódź")).toBe("Lódz");
  });

  it("renders a loadable PDF with and without signature", async () => {
    const letter = buildLetter(letterInput);
    const bytes = await renderReleasePdf(letter, null);
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("%PDF");
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBe(1);

    const png = await (await PDFDocument.create()).embedPng(
      Uint8Array.from(
        atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
        (c) => c.charCodeAt(0),
      ),
    );
    expect(png.width).toBe(1);
    const withSignature = await renderReleasePdf(letter, {
      bytes: Uint8Array.from(
        atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
        (c) => c.charCodeAt(0),
      ),
      type: "png",
    });
    expect((await PDFDocument.load(withSignature)).getPageCount()).toBe(1);
  });
});
