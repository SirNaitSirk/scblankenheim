import { describe, expect, it } from "vitest";
import { priceLine } from "@/lib/marketing/messages";

describe("priceLine", () => {
  it("formats a whole euro base price in German", () => {
    expect(priceLine(195)).toBe(
      "195 € inklusive Übernachtung und Verpflegung · Bezahlen per Karte, PayPal, SEPA Lastschrift und mehr",
    );
  });

  it("rounds to whole euros like the rest of the landing page", () => {
    expect(priceLine(1249.5)).toMatch(/^1\.250 € /);
  });

  it("contains no dash punctuation", () => {
    expect(priceLine(195)).not.toMatch(/[–—-]/);
  });
});
