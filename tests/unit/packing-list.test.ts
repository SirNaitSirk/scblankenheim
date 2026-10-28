import { describe, expect, it } from "vitest";
import {
  featuredPackingItems,
  formatCampDates,
  packingItemCount,
  packingItemIds,
  packingListMessages,
  packingSections,
  parseCheckedItems,
} from "@/lib/marketing/packing-list";

describe("packing list content", () => {
  it("has unique item ids across all sections", () => {
    const ids = packingItemIds();
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique section ids and no empty section", () => {
    const ids = packingSections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of packingSections) expect(section.items.length).toBeGreaterThan(0);
  });

  it("holds the 24 entries of the former packing list", () => {
    expect(packingSections).toHaveLength(6);
    expect(packingItemCount()).toBe(24);
  });

  it("feeds the teaser only from items on the list", () => {
    const featured = featuredPackingItems();
    const ids = new Set(packingItemIds());
    expect(featured.length).toBeGreaterThan(0);
    for (const item of featured) expect(ids.has(item.id)).toBe(true);
  });

  it("uses no dashes in visible copy", () => {
    const texts = [
      ...packingSections.flatMap((section) => [
        section.title,
        ...section.items.flatMap((item) => [item.label, item.note ?? ""]),
      ]),
      ...Object.values(packingListMessages).flatMap((value) =>
        typeof value === "string"
          ? [value]
          : typeof value === "function"
            ? [value(3, 24)]
            : Object.values(value),
      ),
    ];
    for (const text of texts) expect(text).not.toMatch(/[–—]|\p{L}-\p{L}/u);
  });
});

describe("formatCampDates", () => {
  it("shows a range with start and end", () => {
    expect(formatCampDates("2027-07-12", "2027-07-18")).toBe("12.07.2027 bis 18.07.2027");
  });

  it("shows only the start without an end", () => {
    expect(formatCampDates("2027-07-12", null)).toBe("ab 12.07.2027");
  });

  it("returns null without a start", () => {
    expect(formatCampDates(null, "2027-07-18")).toBeNull();
  });
});

describe("parseCheckedItems", () => {
  it("returns an empty set for missing or broken values", () => {
    expect(parseCheckedItems(null).size).toBe(0);
    expect(parseCheckedItems("{oops").size).toBe(0);
    expect(parseCheckedItems('{"towel":true}').size).toBe(0);
  });

  it("keeps known ids and drops unknown or non string entries", () => {
    const result = parseCheckedItems(JSON.stringify(["towel", "gone-item", 42, "pillow"]));
    expect([...result].sort()).toEqual(["pillow", "towel"]);
  });
});
