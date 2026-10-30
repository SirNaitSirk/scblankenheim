import { describe, expect, it } from "vitest";
import { teamMessageEmail, type TeamMessageContext } from "@/lib/email/team-templates";

const base: TeamMessageContext = {
  kind: "message",
  campName: "Summercamp 2027",
  name: "Lena Muster",
  reference: "REG-ABC123",
  replyTo: "eltern@example.org",
  text: "Kann sie einen Tag später anreisen?",
  fieldLabel: null,
  previous: null,
  proposed: null,
  adminUrl: "https://camp.example/admin",
};

const DASHES = /[–—]/;

describe("teamMessageEmail", () => {
  it("builds a message mail with reply hint and admin link", () => {
    const mail = teamMessageEmail(base);
    expect(mail.subject).toBe("Nachricht von Lena Muster (REG-ABC123)");
    for (const part of [mail.html, mail.text]) {
      expect(part).toContain("Kann sie einen Tag später anreisen?");
      expect(part).toContain("eltern@example.org");
      expect(part).toContain("REG-ABC123");
    }
    expect(mail.html).toContain('href="https://camp.example/admin"');
    expect(mail.text).toContain("Interne Mail aus dem Adminbereich");
    expect(mail.text).not.toContain("Antworten auf diese Mail erreichen unser Team");
  });

  it("builds a change mail with old and new value and reason", () => {
    const mail = teamMessageEmail({
      ...base,
      kind: "change_request",
      text: "Hat sich geändert",
      fieldLabel: "Allergien",
      previous: "Nüsse",
      proposed: "Nüsse und Erdbeeren",
    });
    expect(mail.subject).toBe("Änderungswunsch von Lena Muster (REG-ABC123)");
    expect(mail.text).toContain("Angabe: Allergien");
    expect(mail.text).toContain("Bisher: Nüsse");
    expect(mail.text).toContain("Neu: Nüsse und Erdbeeren");
    expect(mail.text).toContain("Begründung: Hat sich geändert");
  });

  it("shows leer for an empty previous value", () => {
    const mail = teamMessageEmail({ ...base, kind: "change_request", text: "", fieldLabel: "Ort", previous: "", proposed: "Köln" });
    expect(mail.text).toContain("Bisher: leer");
    expect(mail.text).not.toContain("Begründung");
  });

  it("escapes user text", () => {
    const mail = teamMessageEmail({ ...base, text: "<script>alert(1)</script>" });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });

  it("says when no reply address exists and leaves out the admin link without APP_URL", () => {
    const mail = teamMessageEmail({ ...base, replyTo: null, adminUrl: null, name: " " });
    expect(mail.text).toContain("keine Mailadresse hinterlegt");
    expect(mail.subject).toBe("Nachricht von Ohne Namen (REG-ABC123)");
    expect(mail.text).not.toContain("Im Admin Bereich öffnen");
  });

  it("contains no dash punctuation", () => {
    expect(teamMessageEmail(base).text).not.toMatch(DASHES);
  });
});
