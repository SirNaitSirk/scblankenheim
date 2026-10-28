import { describe, expect, it } from "vitest";
import { getTierStatus, priceTierSchema } from "@/lib/admin/price-tiers";

const NOW = new Date("2026-06-01T12:00:00Z").getTime();

describe("getTierStatus", () => {
  it("is active without a validity window", () => {
    expect(getTierStatus(null, null, NOW)).toBe("active");
  });

  it("is active inside the window", () => {
    expect(
      getTierStatus("2026-05-01T00:00:00Z", "2026-07-01T00:00:00Z", NOW),
    ).toBe("active");
  });

  it("is scheduled before the start", () => {
    expect(getTierStatus("2026-06-02T00:00:00Z", null, NOW)).toBe("scheduled");
  });

  it("is expired after the end", () => {
    expect(getTierStatus(null, "2026-06-01T11:59:00Z", NOW)).toBe("expired");
  });
});

describe("priceTierSchema", () => {
  const valid = { name: " Mitarbeitende ", price: "120", validFrom: "", validUntil: "" };

  it("trims and converts valid input", () => {
    const result = priceTierSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      name: "Mitarbeitende",
      price: 120,
      validFrom: null,
      validUntil: null,
    });
  });

  it("accepts a price of zero", () => {
    expect(priceTierSchema.safeParse({ ...valid, price: "0" }).success).toBe(true);
  });

  it.each(["", "abc", "12.5", "-5", "10000"])("rejects price %j", (price) => {
    const result = priceTierSchema.safeParse({ ...valid, price });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["price"]);
  });

  it("rejects an empty or too long name", () => {
    expect(priceTierSchema.safeParse({ ...valid, name: "  " }).success).toBe(false);
    expect(priceTierSchema.safeParse({ ...valid, name: "x".repeat(81) }).success).toBe(false);
  });

  it("rejects an end before the start", () => {
    const result = priceTierSchema.safeParse({
      ...valid,
      validFrom: "2026-06-10T10:00:00.000Z",
      validUntil: "2026-06-09T10:00:00.000Z",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["validUntil"]);
  });

  it("normalises validity to ISO strings", () => {
    const result = priceTierSchema.safeParse({
      ...valid,
      validFrom: "2026-06-10T10:00:00.000Z",
    });
    expect(result.data?.validFrom).toBe("2026-06-10T10:00:00.000Z");
  });
});
