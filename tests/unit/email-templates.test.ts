import { describe, expect, it } from "vitest";
import {
  confirmationEmail,
  paymentLinkEmail,
  reminderEmail,
  type EmailContext,
} from "@/lib/email/templates";

const ctx: EmailContext = {
  firstName: "Lena",
  campName: "Summercamp 2027",
  campStart: "2027-07-20",
  campEnd: "2027-07-27",
  reference: "REG-1A2B3C4D",
  amountDue: 250,
  outstanding: 250,
  paymentDueDate: "2027-06-15",
  payUrl: "https://camp.example/bezahlen?ref=REG-1A2B3C4D",
};

const DASHES = /[–—]/;

describe("confirmationEmail", () => {
  it("contains reference, amount, dates and pay link in html and text", () => {
    const mail = confirmationEmail(ctx);
    for (const part of [mail.html, mail.text]) {
      expect(part).toContain("REG-1A2B3C4D");
      expect(part).toContain("250");
      expect(part).toContain("20.07.2027 bis 27.07.2027");
      expect(part).toContain("15.06.2027");
      expect(part).toContain("Jetzt bezahlen");
    }
    expect(mail.html).toContain('href="https://camp.example/bezahlen?ref=REG-1A2B3C4D"');
    expect(mail.subject).toBe("Deine Anmeldung zum Summercamp 2027");
  });

  it("has no pay button and says nothing is due when free", () => {
    const mail = confirmationEmail({ ...ctx, amountDue: 0, outstanding: 0 });
    expect(mail.html).not.toContain("Jetzt bezahlen");
    expect(mail.text).toContain("Für dich ist nichts zu zahlen.");
    expect(mail.text).not.toContain("Zahlungsziel");
  });

  it("escapes values", () => {
    const mail = confirmationEmail({ ...ctx, firstName: "<script>x</script>" });
    expect(mail.html).not.toContain("<script>x</script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });

  it("falls back to a neutral greeting without first name", () => {
    expect(confirmationEmail({ ...ctx, firstName: null }).text.startsWith("Hallo,")).toBe(true);
  });
});

describe("payment mails", () => {
  it("show the remaining amount for partial payments", () => {
    const partial = { ...ctx, amountDue: 250, outstanding: 100 };
    for (const mail of [paymentLinkEmail(partial), reminderEmail("reminder_1", partial)]) {
      expect(mail.text).toContain("Offener Betrag: 100");
      expect(mail.text).not.toContain("250");
    }
  });

  it("omit the due date when none is set", () => {
    const mail = reminderEmail("reminder_1", { ...ctx, paymentDueDate: null });
    expect(mail.text).not.toContain("Zahlungsziel");
  });

  it("use the due date in the second reminder subject", () => {
    expect(reminderEmail("reminder_2", ctx).subject).toBe("Zahlungsziel am 15.06.2027");
  });

  it("never threaten cancellation in the last reminder", () => {
    const mail = reminderEmail("reminder_3", ctx);
    expect(mail.text.toLowerCase()).not.toMatch(/storn/);
    expect(mail.text).toContain("Dein Platz bleibt bestehen.");
  });

  it("contain no dash punctuation", () => {
    const mails = [
      confirmationEmail(ctx),
      confirmationEmail({ ...ctx, amountDue: 0, outstanding: 0 }),
      paymentLinkEmail(ctx),
      reminderEmail("reminder_1", ctx),
      reminderEmail("reminder_2", ctx),
      reminderEmail("reminder_3", ctx),
    ];
    for (const mail of mails) {
      expect(mail.subject).not.toMatch(DASHES);
      expect(mail.text).not.toMatch(DASHES);
    }
  });
});
