/**
 * German copy of the participant page (specs/017-participant-page). The only
 * place this page's user facing wording lives.
 */
export const participantMessages = {
  title: "Meine Anmeldung · FCG Blankenheim Summercamp",
  eyebrow: "Meine Anmeldung",
  greeting: (firstName: string) => (firstName ? `Hallo ${firstName}` : "Hallo"),
  intro: (campName: string) => `Hier siehst du jederzeit den Stand deiner Anmeldung zum ${campName}.`,
  tabs: {
    label: "Bereiche deiner Anmeldung",
    overview: "Übersicht",
    details: "Meine Angaben",
    detailsShort: "Angaben",
    documents: "Dokumente",
  },
  strip: {
    outstanding: (amount: string) => `Noch ${amount} offen`,
    cancelled: "Deine Anmeldung ist storniert.",
  },
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
    calendarIcs: "In den Kalender",
    calendarGoogle: "Google Kalender",
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
    changeHint: "Etwas stimmt nicht? Frag unten eine Änderung an, wir übernehmen sie für dich.",
  },
  packing: {
    heading: "Packzettel",
    body: "Alles, was mit ins Camp muss, auf einer Liste.",
    button: "Packzettel ansehen",
  },
  contact: {
    heading: "Fragen oder Korrekturen",
    intro: "Schreib dem Team oder sag uns, wenn eine Angabe nicht stimmt. Wir melden uns per Mail.",
    modes: { message: "Nachricht", change: "Änderung anfragen" },
    messageLabel: "Deine Nachricht",
    messagePlaceholder: "Zum Beispiel: Kann sie einen Tag später anreisen?",
    counter: (used: number, max: number) => `${used} von ${max} Zeichen`,
    fieldLabel: "Welche Angabe?",
    fieldPlaceholder: "Bitte wählen",
    currentValue: (value: string) => `Bisher: ${value || "leer"}`,
    valueLabel: "Richtiger Wert",
    selectPlaceholder: "Bitte wählen",
    reasonLabel: "Begründung (freiwillig)",
    send: "Senden",
    sending: "Wird gesendet …",
    success: "Danke! Das Team meldet sich per Mail bei dir.",
    errors: {
      invalidLink:
        "Dieser Link ist ungültig oder nicht mehr aktuell. Bitte nutze den Link aus deiner neuesten Mail.",
      throttled: "Zu viele Versuche. Bitte warte ein paar Minuten.",
      dayLimit: "Du hast heute schon einige Anliegen geschickt. Bitte versuche es morgen wieder.",
      empty: "Bitte schreib eine Nachricht.",
      tooLong: (max: number) => `Bitte fasse dich kürzer, höchstens ${max} Zeichen.`,
      fieldUnavailable: "Diese Angabe kann nicht geändert werden.",
      unchanged: "Der Wert ist schon so eingetragen.",
      generic: "Das hat nicht geklappt. Bitte versuche es später noch einmal.",
    },
    list: {
      heading: "Deine Anliegen",
      kinds: { message: "Nachricht", change_request: "Änderungswunsch" },
      status: { open: "offen", done: "erledigt" },
      change: (label: string, value: string) => `${label}: ${value || "leer"}`,
    },
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
