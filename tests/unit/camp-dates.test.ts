import { describe, expect, it } from "vitest";
import { formatCampDateRange } from "@/lib/marketing/camp-dates";

describe("formatCampDateRange", () => {
  it("joins days within one month", () => {
    expect(formatCampDateRange("2027-05-24", "2027-05-28")).toBe("24. bis 28. Mai 2027");
  });

  it("names both months across a month boundary", () => {
    expect(formatCampDateRange("2027-05-30", "2027-06-02")).toBe("30. Mai bis 2. Juni 2027");
  });

  it("names both years across a year boundary", () => {
    expect(formatCampDateRange("2026-12-28", "2027-01-03")).toBe(
      "28. Dezember 2026 bis 3. Januar 2027",
    );
  });

  it("shows a single date when start equals end or the end is missing", () => {
    expect(formatCampDateRange("2027-05-28", "2027-05-28")).toBe("28. Mai 2027");
    expect(formatCampDateRange("2027-05-28", null)).toBe("28. Mai 2027");
  });

  it("returns null without a valid start", () => {
    expect(formatCampDateRange(null, "2027-05-28")).toBeNull();
    expect(formatCampDateRange("kein Datum", null)).toBeNull();
  });

  it("accepts timestamps by reading only the date part", () => {
    expect(formatCampDateRange("2027-03-01T00:00:00Z", "2027-03-05")).toBe(
      "1. bis 5. März 2027",
    );
  });
});
