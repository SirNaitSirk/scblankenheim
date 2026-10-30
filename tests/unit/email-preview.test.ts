import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_MAIL_INFO } from "@/lib/admin/camp-mail-info";
import { arrivalInfoEmail } from "@/lib/email/info-templates";
import {
  buildInfoMailPreviews,
  buildMailPreviews,
  renderTemplate,
  sampleContext,
  TEMPLATE_IDS,
  sampleInfoContext,
  type PreviewCamp,
} from "@/lib/email/preview";
import { confirmationEmail, reminderEmail } from "@/lib/email/templates";
import { EMPTY_RELEASE_SETTINGS } from "@/lib/school-release/settings";

const camp: PreviewCamp = {
  name: "Summercamp 2027",
  startDate: "2027-07-20",
  endDate: "2027-07-27",
  basePrice: 250,
  paymentDueDate: "2027-06-15",
};

afterEach(() => vi.unstubAllEnvs());

describe("buildMailPreviews", () => {
  it("returns the eight templates in order", () => {
    expect(buildMailPreviews(camp).map((p) => p.id)).toEqual([
      "confirmation",
      "confirmation_free",
      "payment_link",
      "reminder_1",
      "reminder_2",
      "reminder_3",
      "school_release",
      "participant_link",
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

  it("links every preview to the sample participant page", () => {
    vi.stubEnv("APP_URL", "https://camp.example");
    const url = `https://camp.example/meine-anmeldung/${"0".repeat(64)}`;
    expect(sampleContext(camp).participantUrl).toBe(url);
    for (const preview of buildMailPreviews(camp)) expect(preview.text).toContain(url);
  });

  it("adds sample calendar links when the camp has an id", () => {
    vi.stubEnv("APP_URL", "https://camp.example");
    const id = "11111111-2222-3333-4444-555555555555";
    expect(sampleContext({ ...camp, id }).calendar?.icsUrl).toBe(`https://camp.example/kalender/${id}`);
    expect(sampleContext(camp).calendar).toBeNull();
  });

  it("shows no pay button in the free variant", () => {
    const free = buildMailPreviews(camp)[1]!;
    expect(free.html).not.toContain("Jetzt bezahlen");
  });

  it("names the configured release dates, else the first camp day", () => {
    const release = {
      ...EMPTY_RELEASE_SETTINGS,
      enabled: true,
      dates: ["2027-07-24"],
      signerName: "Campleitung",
      signaturePath: "camp/signature.png",
    };
    const configured = buildMailPreviews(camp, undefined, release).find((p) => p.id === "school_release")!;
    expect(configured.text).toContain("Samstag, 24. Juli 2027");
    const [paid, free] = buildMailPreviews(camp, undefined, release);
    expect(paid!.text).toContain("sobald deine erste Zahlung");
    expect(free!.text).not.toContain("sobald deine erste Zahlung");
    const fallback = buildMailPreviews(camp).find((p) => p.id === "school_release")!;
    expect(fallback.text).toContain("Dienstag, 20. Juli 2027");
  });

  it("omits the date without a due date", () => {
    const previews = buildMailPreviews({ ...camp, paymentDueDate: null });
    for (const preview of previews) expect(preview.text).not.toContain("Zahlungsziel:");
  });
});

describe("buildInfoMailPreviews", () => {
  const infoCamp = { ...camp, tagline: "Mutig glauben" };
  const info = {
    ...EMPTY_MAIL_INFO,
    arrivalAddress: "Am Wald 1",
    arrivalTime: "Sonntag ab 15 Uhr",
    emergencyPhone: "0170 1234567",
  };

  it("returns the four info mails in timeline order", () => {
    expect(buildInfoMailPreviews(infoCamp, info).map((p) => p.id)).toEqual([
      "info_teaser",
      "info_packing",
      "info_arrival",
      "info_thanks",
    ]);
  });

  it("renders exactly what the arrival mail sends, with the payment note", () => {
    vi.stubEnv("APP_URL", "https://camp.example");
    const arrival = buildInfoMailPreviews(infoCamp, info)[2]!;
    expect(arrival).toMatchObject(arrivalInfoEmail(sampleInfoContext(infoCamp, info)));
    expect(arrival.text).toContain("Jetzt bezahlen");
    expect(arrival.html).toContain('href="https://camp.example/packzettel"');
  });

  it("uses a relative packing link without APP_URL", () => {
    vi.stubEnv("APP_URL", "");
    expect(sampleInfoContext(infoCamp, info).packingUrl).toBe("/packzettel");
  });

  it("shows no empty sections with empty mail info", () => {
    for (const preview of buildInfoMailPreviews({ ...camp, tagline: null }, EMPTY_MAIL_INFO)) {
      expect(preview.text).not.toContain("undefined");
      expect(preview.text).not.toContain("null");
    }
  });
});

describe("renderTemplate (specs/016-mail-settings)", () => {
  const infoCamp = { ...camp, tagline: "Mutig voran" };

  it("renders every template id exactly like the preview", () => {
    const all = [...buildMailPreviews(camp), ...buildInfoMailPreviews(infoCamp, EMPTY_MAIL_INFO)];
    expect(TEMPLATE_IDS).toHaveLength(all.length);
    for (const id of TEMPLATE_IDS) {
      const expected = all.find((p) => p.id === id)!;
      expect(renderTemplate(id, infoCamp, EMPTY_MAIL_INFO)).toEqual({
        subject: expected.subject,
        html: expected.html,
        text: expected.text,
      });
    }
  });

  it("uses the camp's text blocks", () => {
    const info = { ...EMPTY_MAIL_INFO, contactName: "Anna Becker", contactPhone: "0170 1234567" };
    expect(renderTemplate("reminder_2", infoCamp, info).text).toContain(
      "Bei Fragen erreichst du Anna Becker unter 0170 1234567.",
    );
  });
});
