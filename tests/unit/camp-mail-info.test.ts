import { describe, expect, it } from "vitest";
import {
  campMailInfoSchema,
  EMPTY_MAIL_INFO,
  mailInfoToFormValues,
} from "@/lib/admin/camp-mail-info";

describe("campMailInfoSchema reminders switch", () => {
  it("starts switched on for a camp without settings", () => {
    expect(mailInfoToFormValues(EMPTY_MAIL_INFO).remindersEnabled).toBe(true);
  });

  it("keeps the switch when it is turned off", () => {
    const values = { ...mailInfoToFormValues(EMPTY_MAIL_INFO), remindersEnabled: false };
    const parsed = campMailInfoSchema.safeParse(values);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.remindersEnabled).toBe(false);
  });

  it("rejects a missing switch", () => {
    const values: Record<string, unknown> = { ...mailInfoToFormValues(EMPTY_MAIL_INFO) };
    delete values.remindersEnabled;
    expect(campMailInfoSchema.safeParse(values).success).toBe(false);
  });
});

describe("campMailInfoSchema timing (specs/016-mail-settings)", () => {
  const base = mailInfoToFormValues(EMPTY_MAIL_INFO);
  const parse = (overrides: Partial<typeof base>) => campMailInfoSchema.safeParse({ ...base, ...overrides });
  const errorFor = (overrides: Partial<typeof base>, key: string) => {
    const result = parse(overrides);
    return result.success ? undefined : result.error.issues.find((issue) => issue.path[0] === key)?.message;
  };

  it("empty fields mean the default", () => {
    const result = parse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.packingDaysBefore).toBeNull();
  });

  it("stores whole numbers inside the bounds", () => {
    const result = parse({ packingDaysBefore: " 28 ", reminderMinGapDays: "5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.packingDaysBefore).toBe(28);
      expect(result.data.reminderMinGapDays).toBe(5);
    }
  });

  it.each([
    ["packingDaysBefore", "70"],
    ["packingDaysBefore", "6"],
    ["arrivalDaysBefore", "0"],
    ["thanksDaysAfter", "30"],
    ["reminderFirstAfterDays", "2"],
    ["reminderBeforeDueDays", "31"],
    ["reminderMinGapDays", "15"],
    ["teaserDaysBefore", "abc"],
    ["teaserDaysBefore", "21.5"],
  ])("rejects %s = %s", (key, value) => {
    expect(errorFor({ [key]: value }, key)).toMatch(/ganze Zahl/);
  });

  it("checks the order of the info mails after applying defaults", () => {
    expect(errorFor({ packingDaysBefore: "56" }, "packingDaysBefore")).toMatch(/Reihenfolge/);
    expect(errorFor({ arrivalDaysBefore: "21" }, "arrivalDaysBefore")).toMatch(/Reihenfolge/);
    expect(parse({ teaserDaysBefore: "60", packingDaysBefore: "50", arrivalDaysBefore: "10" }).success).toBe(true);
  });
});

describe("campMailInfoSchema sender (specs/016-mail-settings)", () => {
  const base = mailInfoToFormValues(EMPTY_MAIL_INFO);
  const parse = (overrides: Partial<typeof base>) => campMailInfoSchema.safeParse({ ...base, ...overrides });

  it("empty fields keep the defaults", () => {
    const result = parse({});
    expect(result.success && result.data.senderName).toBeNull();
    expect(result.success && result.data.replyTo).toBeNull();
  });

  it("accepts a name with umlauts and a valid address", () => {
    const result = parse({ senderName: " Sommerfreizeit Blankenheim 2027 ", replyTo: "leitung@example.org" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.senderName).toBe("Sommerfreizeit Blankenheim 2027");
      expect(result.data.replyTo).toBe("leitung@example.org");
    }
    expect(parse({ senderName: "Jörg & Söhne (Küche)" }).success).toBe(true);
  });

  it.each([
    ["senderName", "Camp <evil@example.com>"],
    ["senderName", 'Camp "Leitung"'],
    ["senderName", "Camp\nBcc: x@example.com"],
    ["senderName", "x".repeat(61)],
    ["replyTo", "keine adresse"],
    ["replyTo", "a@b"],
    ["replyTo", "Name <a@example.com>"],
  ])("rejects %s = %j", (key, value) => {
    const result = parse({ [key]: value });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === key)).toBe(true);
  });
});

describe("campMailInfoSchema text blocks (specs/016-mail-settings)", () => {
  const base = mailInfoToFormValues(EMPTY_MAIL_INFO);
  const parse = (overrides: Partial<typeof base>) => campMailInfoSchema.safeParse({ ...base, ...overrides });

  it("trims values and maps empty to null", () => {
    const result = parse({ textGreeting: "  Schön, dass du dabei bist!  ", contactPhone: "   " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.textGreeting).toBe("Schön, dass du dabei bist!");
      expect(result.data.contactPhone).toBeNull();
    }
  });

  it.each([
    ["textGreeting", 300],
    ["textClosing", 200],
    ["contactName", 80],
    ["contactPhone", 40],
  ])("limits %s to %i characters", (key, max) => {
    expect(parse({ [key]: "x".repeat(max) }).success).toBe(true);
    expect(parse({ [key]: "x".repeat(max + 1) }).success).toBe(false);
  });
});
