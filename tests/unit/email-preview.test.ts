import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMailPreviews, sampleContext, type PreviewCamp } from "@/lib/email/preview";
import { confirmationEmail, reminderEmail } from "@/lib/email/templates";

const camp: PreviewCamp = {
  name: "Summercamp 2027",
  startDate: "2027-07-20",
  endDate: "2027-07-27",
  basePrice: 250,
  paymentDueDate: "2027-06-15",
};

afterEach(() => vi.unstubAllEnvs());

describe("buildMailPreviews", () => {
  it("returns the six templates in order", () => {
    expect(buildMailPreviews(camp).map((p) => p.id)).toEqual([
      "confirmation",
      "confirmation_free",
      "payment_link",
      "reminder_1",
      "reminder_2",
      "reminder_3",
    ]);
  });

  it("renders exactly what the templates send", () => {
    vi.stubEnv("APP_URL", "https://camp.example/");
    const [confirmation, , , , reminder2] = buildMailPreviews(camp);
    const ctx = sampleContext(camp);
    expect(ctx.payUrl).toBe("https://camp.example/bezahlen?ref=REG-BEISPIEL");
    expect(confirmation).toMatchObject(confirmationEmail(ctx));
    expect(reminder2).toMatchObject(reminderEmail("reminder_2", ctx));
  });

  it("uses a relative link without APP_URL", () => {
    vi.stubEnv("APP_URL", "");
    expect(sampleContext(camp).payUrl).toBe("/bezahlen?ref=REG-BEISPIEL");
  });

  it("shows no pay button in the free variant", () => {
    const free = buildMailPreviews(camp)[1]!;
    expect(free.html).not.toContain("Jetzt bezahlen");
  });

  it("omits the date without a due date", () => {
    const previews = buildMailPreviews({ ...camp, paymentDueDate: null });
    for (const preview of previews) expect(preview.text).not.toContain("Zahlungsziel:");
  });
});
