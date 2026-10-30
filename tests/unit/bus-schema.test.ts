import { describe, expect, it } from "vitest";
import { boardingInputSchema, busSettingsInputSchema, scanInputSchema } from "@/lib/bus/schema";

const ID = "11111111-1111-1111-1111-111111111111";

describe("bus schemas", () => {
  it("accepts a valid scan and rejects bad codes or trips", () => {
    expect(scanInputSchema.safeParse({ code: "AbCdEfGhIjKlMnOpQr_-12", trip: "outbound" }).success).toBe(true);
    expect(scanInputSchema.safeParse({ code: "kurz", trip: "outbound" }).success).toBe(false);
    expect(scanInputSchema.safeParse({ code: "AbCdEfGhIjKlMnOpQr_-12", trip: "hin" }).success).toBe(false);
  });

  it("validates manual boarding input", () => {
    expect(boardingInputSchema.safeParse({ registrationId: ID, trip: "return" }).success).toBe(true);
    expect(boardingInputSchema.safeParse({ registrationId: "r1", trip: "return" }).success).toBe(false);
  });

  it("limits settings input", () => {
    const valid = { campId: ID, enabled: true, fieldKey: "anreise", answers: ["Mit dem Bus"] };
    expect(busSettingsInputSchema.safeParse(valid).success).toBe(true);
    expect(busSettingsInputSchema.safeParse({ ...valid, fieldKey: null }).success).toBe(true);
    expect(busSettingsInputSchema.safeParse({ ...valid, answers: Array(21).fill("x") }).success).toBe(false);
    expect(busSettingsInputSchema.safeParse({ ...valid, fieldKey: "x".repeat(65) }).success).toBe(false);
  });
});
