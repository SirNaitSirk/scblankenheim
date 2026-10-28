import { afterEach, describe, expect, it, vi } from "vitest";
import { nextReminder, type ReminderInput } from "@/lib/email/reminders";
import { DEFAULT_TIMING } from "@/lib/email/settings";
import { isAuthorizedCronRequest } from "@/lib/email/cron-auth";

const base: ReminderInput = {
  paymentStatus: "unpaid",
  outstanding: 250,
  deleted: false,
  status: "active",
  hasEmail: true,
  registeredDate: "2027-03-01",
  campStartDate: "2027-07-20",
  paymentDueDate: "2027-06-15",
  sentKinds: [],
  lastReminderDate: null,
  paused: false,
  campEnabled: true,
  timing: DEFAULT_TIMING,
};

describe("nextReminder", () => {
  const cases: Array<[string, Partial<ReminderInput>, string, string | null]> = [
    ["nothing on day 6", {}, "2027-03-07", null],
    ["first reminder on day 7", {}, "2027-03-08", "reminder_1"],
    ["first reminder only once", { sentKinds: ["reminder_1"], lastReminderDate: "2027-03-08" }, "2027-03-20", null],
    ["second reminder in the window before the due date", { sentKinds: ["reminder_1"], lastReminderDate: "2027-03-08" }, "2027-06-08", "reminder_2"],
    ["nothing before the second window", { sentKinds: ["reminder_1"], lastReminderDate: "2027-03-08" }, "2027-06-07", null],
    ["second reminder still on the due date", { sentKinds: ["reminder_1"], lastReminderDate: "2027-03-08" }, "2027-06-15", "reminder_2"],
    ["third reminder the day after the due date", { sentKinds: ["reminder_1", "reminder_2"], lastReminderDate: "2027-06-08" }, "2027-06-16", "reminder_3"],
    ["third reminder only once", { sentKinds: ["reminder_1", "reminder_2", "reminder_3"], lastReminderDate: "2027-06-16" }, "2027-06-30", null],
    ["late registration skips the first reminder", { registeredDate: "2027-06-01" }, "2027-06-08", "reminder_2"],
    ["first reminder overtaken is never sent late", { registeredDate: "2027-06-01", sentKinds: ["reminder_2"], lastReminderDate: "2027-06-08" }, "2027-06-12", null],
    ["registration after the due date waits three days", { registeredDate: "2027-06-20" }, "2027-06-22", null],
    ["registration after the due date gets the third reminder", { registeredDate: "2027-06-20" }, "2027-06-23", "reminder_3"],
    ["minimum gap between reminders", { sentKinds: ["reminder_1"], lastReminderDate: "2027-06-07" }, "2027-06-09", null],
    ["without due date only the first reminder", { paymentDueDate: null, sentKinds: ["reminder_1"], lastReminderDate: "2027-03-08" }, "2027-07-01", null],
    ["without due date first reminder works", { paymentDueDate: null }, "2027-03-08", "reminder_1"],
    ["nothing from camp start", { sentKinds: ["reminder_1", "reminder_2"], lastReminderDate: "2027-06-08" }, "2027-07-20", null],
    ["paid", { paymentStatus: "paid" }, "2027-03-08", null],
    ["processing", { paymentStatus: "processing" }, "2027-03-08", null],
    ["refunded", { paymentStatus: "refunded" }, "2027-03-08", null],
    ["cancelled", { status: "cancelled" }, "2027-03-08", null],
    ["deleted", { deleted: true }, "2027-03-08", null],
    ["free", { outstanding: 0 }, "2027-03-08", null],
    ["no email", { hasEmail: false }, "2027-03-08", null],
    ["partial with remainder", { paymentStatus: "partial", outstanding: 50 }, "2027-03-08", "reminder_1"],
    ["camp switched off gets no first reminder", { campEnabled: false }, "2027-03-08", null],
    ["camp switched off gets no third reminder", { campEnabled: false, sentKinds: ["reminder_1", "reminder_2"], lastReminderDate: "2027-06-08" }, "2027-06-16", null],
    ["paused gets no first reminder", { paused: true }, "2027-03-08", null],
    ["paused gets no second reminder", { paused: true, sentKinds: ["reminder_1"], lastReminderDate: "2027-03-08" }, "2027-06-08", null],
    ["paused gets no third reminder", { paused: true, sentKinds: ["reminder_1", "reminder_2"], lastReminderDate: "2027-06-08" }, "2027-06-16", null],
    ["resumed after the due date gets the open third stage, not the missed second", { sentKinds: ["reminder_1"], lastReminderDate: "2027-03-08" }, "2027-06-20", "reminder_3"],
  ];

  it.each(cases)("%s", (_name, overrides, today, expected) => {
    expect(nextReminder({ ...base, ...overrides }, today)).toBe(expected);
  });
});

describe("nextReminder with custom timing (specs/016-mail-settings)", () => {
  const timing = { ...DEFAULT_TIMING, reminderFirstAfterDays: 10, reminderBeforeDueDays: 14, reminderMinGapDays: 5 };
  const cases: Array<[string, Partial<ReminderInput>, string, string | null]> = [
    ["no first reminder on day 9", {}, "2027-03-10", null],
    ["first reminder on day 10", {}, "2027-03-11", "reminder_1"],
    ["second reminder 14 days before the due date", { sentKinds: ["reminder_1"], lastReminderDate: "2027-03-11" }, "2027-06-01", "reminder_2"],
    ["nothing 15 days before the due date", { sentKinds: ["reminder_1"], lastReminderDate: "2027-03-11" }, "2027-05-31", null],
    ["gap of five days", { sentKinds: ["reminder_1"], lastReminderDate: "2027-05-29" }, "2027-06-02", null],
    ["after the gap", { sentKinds: ["reminder_1"], lastReminderDate: "2027-05-29" }, "2027-06-03", "reminder_2"],
  ];

  it.each(cases)("%s", (_name, overrides, today, expected) => {
    expect(nextReminder({ ...base, timing, ...overrides }, today)).toBe(expected);
  });
});

describe("isAuthorizedCronRequest", () => {
  afterEach(() => vi.unstubAllEnvs());

  const request = (header?: string) =>
    new Request("https://camp.example/api/cron/payment-reminders", {
      headers: header ? { authorization: header } : {},
    });

  it("accepts the matching bearer secret", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isAuthorizedCronRequest(request("Bearer s3cret"))).toBe(true);
  });

  it("rejects a wrong or missing header", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isAuthorizedCronRequest(request("Bearer nope"))).toBe(false);
    expect(isAuthorizedCronRequest(request())).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(isAuthorizedCronRequest(request("Bearer "))).toBe(false);
  });
});
