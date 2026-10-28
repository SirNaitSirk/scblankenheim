/**
 * German copy of the participant page (specs/017-participant-page). The only
 * place this page's user facing wording lives.
 */
export const participantMessages = {
  title: "Meine Anmeldung · FCG Blankenheim Summercamp",
  eyebrow: "Meine Anmeldung",
  greeting: (firstName: string) => (firstName ? `Hallo ${firstName}` : "Hallo"),
  intro: (campName: string) => `Hier siehst du jederzeit den Stand deiner Anmeldung zum ${campName}.`,
  status: {
    label: "Status",
    active: "Angemeldet",
    cancelled: "Storniert",
  },
  amounts: {
    total: "Gesamtbetrag",
    paid: "Bezahlt",
    outstanding: "Offen",
  },
  pay: {
    button: "Jetzt bezahlen",
    paid: "Alles bezahlt. Danke!",
    processing: "Deine Zahlung wird gerade geprüft. Das dauert meist nur wenige Minuten.",
    refunded: "Deine Zahlung wurde erstattet.",
    free: "Für deine Anmeldung ist keine Zahlung nötig.",
    cancelled:
      "Deine Anmeldung ist storniert. Wenn du schon bezahlt hast, melde dich wegen einer Erstattung beim Team.",
  },
  camp: {
    heading: "Camp",
    dates: "Zeitraum",
    location: "Ort",
    dateRange: (start: string, end: string) => `${start} bis ${end}`,
  },
  answers: {
    heading: "Deine Angaben",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "Mail",
    gender: "Geschlecht",
    genders: { female: "weiblich", male: "männlich" } as Record<string, string>,
    yes: "Ja",
    no: "Nein",
    changeHint: "Etwas stimmt nicht? Melde dich beim Team, wir ändern es für dich.",
  },
  packing: {
    heading: "Packzettel",
    body: "Alles, was mit ins Camp muss, auf einer Liste.",
    button: "Packzettel ansehen",
  },
  notFound: {
    title: "Link nicht gefunden",
    body: "Dieser Link ist ungültig oder nicht mehr aktuell. Bitte nutze den Link aus deiner neuesten Mail oder melde dich beim Team.",
  },
  throttled: {
    title: "Zu viele Versuche",
    body: "Bitte warte ein paar Minuten und öffne dann den Link aus deiner Mail erneut.",
  },
} as const;
