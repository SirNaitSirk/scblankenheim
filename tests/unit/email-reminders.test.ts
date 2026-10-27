import { afterEach, describe, expect, it, vi } from "vitest";
import { nextReminder, type ReminderInput } from "@/lib/email/reminders";
import { isAuthorizedCronRequest } from "@/lib/email/cron-auth";

const base: ReminderInput = {
  paymentStatus: "unpaid",
  outstanding: 250,
  deleted: false,
  status: "pending",
  hasEmail: true,
  registeredDate: "2027-03-01",
  campStartDate: "2027-07-20",
  paymentDueDate: "2027-06-15",
  sentKinds: [],
  lastReminderDate: null,
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
  ];

  it.each(cases)("%s", (_name, overrides, today, expected) => {
    expect(nextReminder({ ...base, ...overrides }, today)).toBe(expected);
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
