import { describe, expect, it } from "vitest";
import { attemptRetentionCutoff } from "@/lib/legal/limits";
import { legalMessages } from "@/lib/legal/messages";
import {
  legalOperator,
  missingOperatorFields,
  operatorAddressLines,
  type LegalOperator,
} from "@/lib/legal/operator";

const filled: LegalOperator = {
  associationName: "Beispielverein e. V.",
  street: "Musterweg 1",
  postalCity: "12345 Musterstadt",
  board: ["Erika Beispiel", "Max Beispiel"],
  registerCourt: "Amtsgericht Musterstadt",
  registerNumber: "VR 1234",
  email: "kontakt@example.org",
  phone: "+49 123 456789",
  contentResponsible: "Erika Beispiel",
  dataProtectionOfficer: null,
  supervisoryAuthority: "Beispielbehörde",
  hostingRegion: "Frankfurt, Deutschland",
  updatedAt: "1. Januar 2027",
};

/** Every string inside a value, recursively. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

describe("operator data", () => {
  it("lists every missing required field and ignores the optional officer", () => {
    expect(missingOperatorFields(filled)).toEqual([]);
    const gaps = missingOperatorFields({ ...filled, street: null, board: [] });
    expect(gaps).toEqual(["Straße und Hausnummer", "vertretungsberechtigter Vorstand"]);
  });

  it("keeps gaps in the address lines", () => {
    expect(operatorAddressLines({ ...filled, street: null })).toEqual([
      { field: "associationName", value: "Beispielverein e. V." },
      { field: "street", value: null },
      { field: "postalCity", value: "12345 Musterstadt" },
    ]);
  });

  it("reports the current gaps for the association", () => {
    const gaps = missingOperatorFields(legalOperator);
    console.info(`Offene Betreiberangaben (${gaps.length}): ${gaps.join(", ") || "keine"}`);
    expect(Array.isArray(gaps)).toBe(true);
  });
});

describe("retention", () => {
  it("cuts off exactly seven days earlier", () => {
    expect(attemptRetentionCutoff(new Date("2026-10-30T12:00:00.000Z"))).toBe(
      "2026-10-23T12:00:00.000Z",
    );
  });
});

describe("legal copy", () => {
  it("has the 15 privacy sections of the contract in order", () => {
    expect(legalMessages.privacy.sections.map((section) => section.id)).toEqual([
      "verantwortlicher",
      "ueberblick",
      "website",
      "anmeldung",
      "bezahlung",
      "mails",
      "teilnehmerseite",
      "schulbefreiung",
      "busticket",
      "organisation",
      "team",
      "dienstleister",
      "speicherdauer",
      "rechte",
      "stand",
    ]);
  });

  it("follows the writing rules", () => {
    for (const text of strings(legalMessages)) {
      const withoutUrls = text.replace(/https?:\/\/\S+/g, "");
      expect(withoutUrls, text).not.toMatch(/[–—]/);
      expect(withoutUrls, text).not.toMatch(/\p{L}-\p{L}/u);
    }
  });
});
