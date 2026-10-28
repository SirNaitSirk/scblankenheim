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
  participantUrl: `https://camp.example/meine-anmeldung/${"a".repeat(64)}`,
  calendar: {
    icsUrl: "https://camp.example/kalender/11111111-2222-3333-4444-555555555555",
    googleUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE",
  },
  texts: { greeting: null, closing: null, contactName: null, contactPhone: null },
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

describe("participant link", () => {
  const mails = [
    confirmationEmail(ctx),
    confirmationEmail({ ...ctx, amountDue: 0, outstanding: 0 }),
    paymentLinkEmail(ctx),
    reminderEmail("reminder_1", ctx),
    reminderEmail("reminder_2", ctx),
    reminderEmail("reminder_3", ctx),
  ];

  it("appears in html and text of every payment related mail", () => {
    for (const mail of mails) {
      expect(mail.html).toContain(`href="${ctx.participantUrl}"`);
      expect(mail.text).toContain(`Meine Anmeldung ansehen: ${ctx.participantUrl}`);
    }
  });
});

describe("camp text blocks (specs/016-mail-settings)", () => {
  const texts = {
    greeting: "Schön, dass du dabei bist!",
    closing: "Herzliche Grüße\nDein Leitungsteam",
    contactName: "Anna Becker",
    contactPhone: "0170 1234567",
  };
  const withTexts = { ...ctx, texts };
  const mails = [
    ["confirmation", confirmationEmail(withTexts)],
    ["payment link", paymentLinkEmail(withTexts)],
    ["reminder 1", reminderEmail("reminder_1", withTexts)],
    ["reminder 3", reminderEmail("reminder_3", withTexts)],
  ] as const;

  it.each(mails)("%s shows every block once in html and text", (_name, mail) => {
    for (const value of ["Schön, dass du dabei bist!", "Bei Fragen erreichst du Anna Becker unter 0170 1234567."]) {
      expect(mail.html.split(value)).toHaveLength(2);
      expect(mail.text.split(value)).toHaveLength(2);
    }
    expect(mail.html).toContain("Herzliche Grüße<br>Dein Leitungsteam");
    expect(mail.text).toContain("Herzliche Grüße\nDein Leitungsteam");
    expect(mail.text).not.toContain("Dein Summercamp Team");
  });

  it("puts the greeting line right after the salutation and the contact before the closing", () => {
    const text = confirmationEmail(withTexts).text;
    expect(text.indexOf("Hallo Lena,")).toBeLessThan(text.indexOf("Schön, dass du dabei bist!"));
    expect(text.indexOf("Schön, dass du dabei bist!")).toBeLessThan(text.indexOf("vielen Dank"));
    expect(text.indexOf("Bei Fragen erreichst du")).toBeLessThan(text.indexOf("Herzliche Grüße"));
  });

  it("shows only the given contact part", () => {
    const nameOnly = confirmationEmail({ ...ctx, texts: { ...texts, contactPhone: null } }).text;
    expect(nameOnly).toContain("Bei Fragen erreichst du Anna Becker, antworte einfach auf diese Mail.");
    const phoneOnly = confirmationEmail({ ...ctx, texts: { ...texts, contactName: null } }).text;
    expect(phoneOnly).toContain("Bei Fragen erreichst du uns unter 0170 1234567.");
  });

  it("escapes markup typed by admins", () => {
    const mail = paymentLinkEmail({ ...ctx, texts: { ...texts, greeting: "<b>Hallo</b> & <script>x</script>" } });
    expect(mail.html).not.toContain("<b>Hallo</b>");
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;b&gt;Hallo&lt;/b&gt; &amp;");
  });

  it("without blocks the mail matches the default text", () => {
    const plain = confirmationEmail(ctx).text;
    expect(plain).toContain("Viele Grüße\nDein Summercamp Team");
    expect(plain).not.toContain("Bei Fragen erreichst du");
  });
});

describe("calendar block", () => {
  it("appears in both confirmation variants", () => {
    for (const mail of [confirmationEmail(ctx), confirmationEmail({ ...ctx, amountDue: 0, outstanding: 0 })]) {
      expect(mail.html).toContain(`href="${ctx.calendar!.icsUrl}"`);
      expect(mail.text).toContain(`Apple oder Outlook: ${ctx.calendar!.icsUrl}`);
      expect(mail.text).toContain("Google Kalender: ");
    }
  });

  it("is left out without calendar links and in payment mails", () => {
    expect(confirmationEmail({ ...ctx, calendar: null }).text).not.toContain("Kalender");
    expect(paymentLinkEmail(ctx).text).not.toContain("Apple oder Outlook");
  });
});
