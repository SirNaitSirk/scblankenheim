import { describe, expect, it } from "vitest";
import { EMPTY_MAIL_INFO, type CampMailInfo } from "@/lib/admin/camp-mail-info";
import {
  arrivalInfoEmail,
  INFO_TEMPLATES,
  packingInfoEmail,
  teaserInfoEmail,
  thanksInfoEmail,
  type InfoMailContext,
} from "@/lib/email/info-templates";
import { featuredPackingItems } from "@/lib/marketing/packing-list";

const filled: CampMailInfo = {
  ...EMPTY_MAIL_INFO,
  highlights: "Lagerfeuer am See\nGeländespiel\n\n Lobpreisabend ",
  teamGreeting: "Wir freuen uns auf euch!",
  arrivalAddress: "Freizeitheim Blankenheim\nAm Wald 1",
  arrivalTime: "Sonntag ab 15 Uhr",
  pickupTime: "Samstag um 11 Uhr",
  firstDay: "Ankommen, Zimmer beziehen, Abendessen",
  emergencyPhone: "0170 1234567",
  phoneRules: "Handys bleiben tagsüber im Zimmer.",
  photosUrl: "https://fotos.example/camp",
  feedbackUrl: "https://feedback.example/camp",
  nextCampNote: "Nächstes Jahr: 18. bis 25. Juli 2028",
};

const ctx: InfoMailContext = {
  firstName: "Lena",
  campName: "Summercamp 2027",
  campStart: "2027-07-20",
  campEnd: "2027-07-27",
  reference: "REG-1A2B3C4D",
  amountDue: 250,
  outstanding: 0,
  paymentDueDate: "2027-06-15",
  payUrl: "https://camp.example/bezahlen?ref=REG-1A2B3C4D",
  participantUrl: `https://camp.example/meine-anmeldung/${"a".repeat(64)}`,
  calendar: {
    icsUrl: "https://camp.example/kalender/11111111-2222-3333-4444-555555555555",
    googleUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE",
  },
  texts: { greeting: null, closing: null, contactName: null, contactPhone: null },
  mailInfo: filled,
  motto: "Mutig glauben",
  packingUrl: "https://camp.example/packzettel",
};

const empty: InfoMailContext = { ...ctx, mailInfo: EMPTY_MAIL_INFO, motto: null };

const DASHES = /[–—]/;
const FORBIDDEN = [/Freunde/i, /Einladung/i, /Preisstufe/i, /invite/i];

function allMails(context: InfoMailContext) {
  return [teaserInfoEmail(context), packingInfoEmail(context), arrivalInfoEmail(context), thanksInfoEmail(context)];
}

describe("info mails in general", () => {
  it("greet by first name, have text versions and no dash punctuation", () => {
    for (const mail of allMails(ctx)) {
      expect(mail.html).toContain("Hallo Lena,");
      expect(mail.text).toContain("Hallo Lena,");
      expect(mail.text).not.toContain("<");
      expect(`${mail.subject}${mail.text}`).not.toMatch(DASHES);
    }
  });

  it("never invite friends or mention tiers or invitation links", () => {
    for (const mail of allMails(ctx)) {
      for (const pattern of FORBIDDEN) expect(mail.text).not.toMatch(pattern);
    }
    expect(teaserInfoEmail(ctx).html).not.toContain('href="https://camp.example/"');
  });

  it("escape admin text", () => {
    const mail = arrivalInfoEmail({ ...ctx, mailInfo: { ...filled, firstDay: "<script>x</script>" } });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });
});

describe("teaserInfoEmail", () => {
  it("shows motto, highlights as a list and the greeting", () => {
    const mail = teaserInfoEmail(ctx);
    expect(mail.subject).toBe("Noch 8 Wochen bis zum Summercamp 2027");
    expect(mail.text).toContain("Unser Motto in diesem Jahr: Mutig glauben");
    expect(mail.html).toContain("<li style=\"margin:0 0 6px;\">Lobpreisabend</li>");
    expect(mail.html.match(/<li /g)).toHaveLength(3);
    expect(mail.text).toContain("Wir freuen uns auf euch!");
  });

  it("leaves out empty sections without headings", () => {
    const mail = teaserInfoEmail(empty);
    expect(mail.text).not.toContain("Motto");
    expect(mail.text).not.toContain("DARAUF KANNST DU DICH FREUEN");
    expect(mail.text).not.toContain("EIN GRUSS VOM TEAM");
    expect(mail.html).not.toContain("<h2");
  });
});

describe("packingInfoEmail", () => {
  it("lists the featured packing items and links to the packing list", () => {
    const mail = packingInfoEmail(ctx);
    for (const item of featuredPackingItems()) expect(mail.text).toContain(item.label);
    expect(mail.html).toContain('href="https://camp.example/packzettel"');
    expect(mail.text).toContain("Medikamente");
  });
});

describe("arrivalInfoEmail", () => {
  it("contains address, times, emergency phone and the packing link", () => {
    const mail = arrivalInfoEmail(ctx);
    for (const value of ["Am Wald 1", "Sonntag ab 15 Uhr", "Samstag um 11 Uhr", "0170 1234567"]) {
      expect(mail.text).toContain(value);
    }
    expect(mail.html).toContain('href="https://camp.example/packzettel"');
    expect(mail.text).toContain("SO LÄUFT DER ERSTE TAG");
  });

  it("adds the payment note only with an outstanding amount", () => {
    expect(arrivalInfoEmail(ctx).text).not.toContain("Jetzt bezahlen");
    const owing = arrivalInfoEmail({ ...ctx, outstanding: 120 });
    expect(owing.text).toContain("120");
    expect(owing.html).toContain('href="https://camp.example/bezahlen?ref=REG-1A2B3C4D"');
  });

  it("leaves out optional sections", () => {
    const mail = arrivalInfoEmail({
      ...ctx,
      mailInfo: { ...filled, pickupTime: null, firstDay: null, phoneRules: null },
    });
    expect(mail.text).not.toContain("Abholung");
    expect(mail.text).not.toContain("SO LÄUFT DER ERSTE TAG");
    expect(mail.text).not.toContain("HANDY IM CAMP");
  });
});

describe("thanksInfoEmail", () => {
  it("links photos and feedback and shows the next camp note", () => {
    const mail = thanksInfoEmail(ctx);
    expect(mail.html).toContain('href="https://fotos.example/camp"');
    expect(mail.html).toContain('href="https://feedback.example/camp"');
    expect(mail.text).toContain("Nächstes Jahr: 18. bis 25. Juli 2028");
  });

  it("leaves out missing links", () => {
    const mail = thanksInfoEmail(empty);
    expect(mail.text).not.toContain("Fotos ansehen");
    expect(mail.text).not.toContain("Feedback geben");
  });
});

describe("arrival address", () => {
  it("keeps line breaks of the address in html and text", () => {
    const mail = arrivalInfoEmail(ctx);
    expect(mail.html).toContain("Freizeitheim Blankenheim<br>Am Wald 1");
    expect(mail.text).toContain("Freizeitheim Blankenheim\nAm Wald 1");
  });
});

describe("participant link in info mails", () => {
  it("appears in every info mail", () => {
    for (const render of Object.values(INFO_TEMPLATES)) {
      const mail = render(ctx);
      expect(mail.html).toContain(`href="${ctx.participantUrl}"`);
      expect(mail.text).toContain(`Meine Anmeldung ansehen: ${ctx.participantUrl}`);
    }
  });
});

describe("calendar block in info mails", () => {
  it("appears only in the teaser", () => {
    expect(teaserInfoEmail(ctx).text).toContain(`Apple oder Outlook: ${ctx.calendar!.icsUrl}`);
    expect(teaserInfoEmail({ ...ctx, calendar: null }).text).not.toContain("Apple oder Outlook");
    expect(packingInfoEmail(ctx).text).not.toContain("Apple oder Outlook");
  });
});
