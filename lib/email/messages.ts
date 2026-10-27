/**
 * German copy for every transactional email (specs/007-transactional-emails,
 * contracts/email-templates.md). The only place mail wording lives. No dash
 * punctuation, no hyphenated words.
 */
export const emailMessages = {
  sender: "FCG Blankenheim Summercamp",
  footer: "FCG Blankenheim Summercamp · Antworten auf diese Mail erreichen unser Team.",
  greeting: (firstName: string | null) => (firstName ? `Hallo ${firstName},` : "Hallo,"),
  payButton: "Jetzt bezahlen",
  linkFallback: "Falls der Knopf nicht funktioniert, öffne diesen Link:",
  closing: "Viele Grüße\nDein Summercamp Team",

  labels: {
    camp: "Camp",
    dates: "Zeitraum",
    reference: "Referenznummer",
    amount: "Betrag",
    outstanding: "Offener Betrag",
    dueDate: "Zahlungsziel",
  },

  dateRange: (start: string, end: string) => `${start} bis ${end}`,

  confirmation: {
    subject: (camp: string) => `Deine Anmeldung zum ${camp}`,
    preheader: "Deine Anmeldung ist bei uns eingegangen.",
    title: "Anmeldung eingegangen",
    intro: (camp: string) =>
      `vielen Dank für deine Anmeldung zum ${camp}. Wir haben alles erhalten und freuen uns auf dich.`,
    payIntro: "Wenn du noch nicht bezahlt hast, kannst du das hier jederzeit erledigen:",
    alreadyPaid: "Hast du schon bezahlt? Dann ist alles erledigt.",
    free: "Für dich ist nichts zu zahlen.",
    keepReference: "Bitte bewahre deine Referenznummer auf. Mit ihr findest du deine Anmeldung jederzeit wieder.",
  },

  paymentLink: {
    subject: (camp: string) => `Dein Zahlungslink für das ${camp}`,
    preheader: "Hier kannst du deine Anmeldung bezahlen.",
    title: "Dein Zahlungslink",
    intro: (camp: string) =>
      `hier ist dein persönlicher Link, um deine Anmeldung zum ${camp} zu bezahlen.`,
  },

  reminder1: {
    subject: (camp: string) => `Erinnerung: Zahlung für das ${camp}`,
    preheader: "Deine Zahlung ist noch offen.",
    title: "Kleine Erinnerung",
    intro: (camp: string) =>
      `schön, dass du beim ${camp} dabei bist. Uns ist aufgefallen, dass deine Zahlung noch offen ist. Mit dem Knopf unten kannst du sie in wenigen Minuten erledigen.`,
  },

  reminder2: {
    subject: (dueDate: string) => `Zahlungsziel am ${dueDate}`,
    subjectWithoutDate: (camp: string) => `Erinnerung: Zahlung für das ${camp}`,
    preheader: "Das Zahlungsziel rückt näher.",
    title: "Das Zahlungsziel rückt näher",
    intro: (camp: string, dueDate: string) =>
      `deine Zahlung für das ${camp} ist noch offen. Bitte bezahle bis zum ${dueDate}, damit wir gut planen können.`,
  },

  reminder3: {
    subject: (camp: string) => `Deine Zahlung für das ${camp} ist noch offen`,
    preheader: "Dein Platz bleibt bestehen.",
    title: "Deine Zahlung ist noch offen",
    intro: (camp: string) =>
      `das Zahlungsziel für das ${camp} ist vorbei, und deine Zahlung ist bei uns noch nicht angekommen. Dein Platz bleibt bestehen. Bitte bezahle so bald wie möglich.`,
    help: "Gibt es einen Grund, warum es gerade nicht klappt? Antworte einfach auf diese Mail, dann finden wir gemeinsam eine Lösung.",
  },
} as const;
