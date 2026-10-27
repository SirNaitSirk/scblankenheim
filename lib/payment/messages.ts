/**
 * German UI copy for the public payment pages and the Stripe checkout line
 * item (specs/006-stripe-payment). Isomorphic: imported by server pages and the
 * client refresher alike. No dash punctuation, no hyphenated words.
 */
export const paymentMessages = {
  productName: (camp: string) => `Teilnahme ${camp}`,

  page: {
    title: "Bezahlen",
    intro: "Gib deine Referenznummer ein, um deine Anmeldung zu bezahlen.",
    referenceLabel: "Referenznummer",
    referencePlaceholder: "REG-1A2B3C4D",
    lookup: "Weiter",
  },

  open: {
    greeting: (firstName: string) =>
      firstName ? `Hallo ${firstName}` : "Hallo",
    body: (camp: string) => `Deine Anmeldung für ${camp} ist gespeichert.`,
    amountLabel: "Offener Betrag",
    referenceLabel: "Referenznummer",
    pay: "Jetzt bezahlen",
    cancelledHint:
      "Die Zahlung wurde abgebrochen und ist noch offen. Du kannst sie hier jederzeit neu starten.",
  },

  notFound: {
    title: "Keine offene Anmeldung gefunden",
    body: "Wir haben keine offene Anmeldung zu dieser Nummer gefunden. Prüfe bitte deine Referenznummer.",
  },
  throttled: {
    title: "Zu viele Versuche",
    body: "Bitte warte ein paar Minuten und versuche es dann noch einmal.",
  },
  stripeError: {
    title: "Das hat gerade nicht geklappt",
    body: "Die Bezahlung konnte gerade nicht gestartet werden. Bitte versuche es gleich noch einmal.",
  },
  processing: {
    title: "Zahlung in Bearbeitung",
    body: "Deine Zahlung ist in Bearbeitung. Bei einer Lastschrift kann die Bestätigung einige Tage dauern. Du musst nichts weiter tun.",
  },
  paid: {
    title: "Bereits bezahlt",
    body: "Für diese Anmeldung ist alles bezahlt. Danke!",
  },
  blocked: {
    title: "Keine Zahlung möglich",
    body: "Für diese Anmeldung ist keine Zahlung möglich. Bitte melde dich bei uns.",
  },

  thanks: {
    title: "Danke, deine Zahlung ist eingegangen",
    body: (reference: string) =>
      `Wir freuen uns auf dich! Deine Referenznummer lautet ${reference}.`,
    confirmingTitle: "Wir bestätigen gerade deine Zahlung",
    confirmingBody: "Das dauert meist nur ein paar Sekunden. Bitte lass die Seite geöffnet.",
    stillOpenBody:
      "Wir haben noch keine Bestätigung erhalten. Falls du die Zahlung abgebrochen hast, kannst du sie hier neu starten.",
    backHome: "Zur Startseite",
  },
} as const;
