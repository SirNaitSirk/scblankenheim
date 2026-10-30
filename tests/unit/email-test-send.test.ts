import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getCurrentCamp: vi.fn(),
  writeLog: vi.fn(),
  getCampMailInfo: vi.fn(),
  testOnCooldown: vi.fn(),
  countDeliveriesSince: vi.fn(),
  claimTestDelivery: vi.fn(),
  markSent: vi.fn(),
  markFailed: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ getServiceClient: vi.fn() }));
vi.mock("@/lib/admin/data", () => ({ getCurrentCamp: mocks.getCurrentCamp, writeLog: mocks.writeLog }));
vi.mock("@/lib/admin/camp-mail-info-data", () => ({ getCampMailInfo: mocks.getCampMailInfo }));
vi.mock("@/lib/school-release/data", () => ({
  buildReleasePdf: vi.fn(),
  getReleaseSettings: vi.fn(async () => null),
}));
vi.mock("@/lib/email/deliveries", () => ({
  claimDelivery: vi.fn(),
  claimTestDelivery: mocks.claimTestDelivery,
  countDeliveriesSince: mocks.countDeliveriesSince,
  failStaleDeliveries: vi.fn(),
  markFailed: mocks.markFailed,
  markSent: mocks.markSent,
  paymentLinkOnCooldown: vi.fn(),
  reminderHistory: vi.fn(),
  testOnCooldown: mocks.testOnCooldown,
}));
vi.mock("@/lib/email/provider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/email/provider")>()),
  sendEmail: mocks.sendEmail,
}));

import { EMPTY_MAIL_INFO } from "@/lib/admin/camp-mail-info";
import { sendTestEmail } from "@/lib/email/send";

const admin = { id: "user_1", email: "admin@example.org", label: "Admin" };
const camp = {
  id: "c1",
  name: "Summercamp 2027",
  isCurrent: true,
  startDate: "2027-07-20",
  endDate: "2027-07-27",
  basePrice: 195,
  paymentDueDate: "2027-06-15",
  tagline: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentCamp.mockResolvedValue(camp);
  mocks.getCampMailInfo.mockResolvedValue({ ...EMPTY_MAIL_INFO, senderName: "Camp 2027", replyTo: "leitung@example.org" });
  mocks.testOnCooldown.mockResolvedValue(false);
  mocks.countDeliveriesSince.mockResolvedValue(10);
  mocks.claimTestDelivery.mockResolvedValue({ id: "d1" });
  mocks.sendEmail.mockResolvedValue({ ok: true, id: "msg_1" });
});

describe("sendTestEmail", () => {
  it("sends to the admin with a test subject and the camp sender", async () => {
    await expect(sendTestEmail("reminder_1", admin)).resolves.toBe("sent");
    const [email, key, sender] = mocks.sendEmail.mock.calls[0];
    expect(email.to).toBe("admin@example.org");
    expect(email.subject).toMatch(/^Test: /);
    expect(key).toBe("test/d1");
    expect(sender).toEqual({ name: "Camp 2027", replyTo: "leitung@example.org" });
    expect(mocks.markSent).toHaveBeenCalledWith("d1", "msg_1");
    expect(mocks.writeLog).toHaveBeenCalledWith(expect.objectContaining({ action: "email.test_sent", message: "reminder_1" }));
  });

  it("refuses within the cooldown", async () => {
    mocks.testOnCooldown.mockResolvedValue(true);
    await expect(sendTestEmail("confirmation", admin)).resolves.toBe("cooldown");
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("keeps the confirmation reserve free", async () => {
    mocks.countDeliveriesSince.mockResolvedValue(85);
    await expect(sendTestEmail("confirmation", admin)).resolves.toBe("quota");
    mocks.countDeliveriesSince.mockResolvedValue(84);
    await expect(sendTestEmail("confirmation", admin)).resolves.toBe("sent");
  });

  it("needs an address and a current camp", async () => {
    await expect(sendTestEmail("confirmation", { ...admin, email: " " })).resolves.toBe("no_email");
    mocks.getCurrentCamp.mockResolvedValue({ ...camp, isCurrent: false });
    await expect(sendTestEmail("confirmation", admin)).resolves.toBe("no_camp");
    expect(mocks.claimTestDelivery).not.toHaveBeenCalled();
  });

  it("marks a provider error as failed", async () => {
    mocks.sendEmail.mockResolvedValue({ ok: false, error: "not_configured" });
    await expect(sendTestEmail("info_arrival", admin)).resolves.toBe("not_configured");
    expect(mocks.markFailed).toHaveBeenCalledWith("d1", "not_configured");
    mocks.sendEmail.mockResolvedValue({ ok: false, error: "rejected" });
    await expect(sendTestEmail("info_arrival", admin)).resolves.toBe("failed");
  });
});
