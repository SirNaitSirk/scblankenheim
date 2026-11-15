/**
 * German copy of the school release letter (specs/020-school-release,
 * specs/042-church-release-letter): the
 * participant card, the landing section and the PDF text. The only place this
 * wording lives; admin copy is in lib/admin/messages.ts, mail copy in
 * lib/email/messages.ts.
 */
export const releaseMessages = {
  card: {
    heading: "Schulbefreiung",
    intro: (dates: string) =>
      `Das Camp fällt auf ${dates}. Falls du an diesem Tag Schule hast, stellen wir dir eine Bitte um Unterrichtsbefreiung für deine Schule aus.`,
    steps: "Trag Name und Ort deiner Schule ein. Die Bescheinigung bekommst du sofort als PDF und zusätzlich per Mail.",
    name: "Name",
    schoolName: "Name der Schule",
    schoolNameHint: "Zum Beispiel Gesamtschule Eifel",
    schoolLocation: "Ort der Schule",
    schoolLocationHint: "Zum Beispiel Nettersheim",
    submit: "Befreiung erstellen",
    submitting: "Wird erstellt …",
    update: "Befreiung aktualisieren",
    saved: "Deine Befreiung ist fertig.",
    download: "PDF herunterladen",
    mailQueued: "Wir schicken sie dir zusätzlich per Mail.",
    mailSkipped: "Eine Mail konnten wir gerade nicht schicken. Lade das PDF einfach hier herunter.",
    edit: "Angaben ändern",
    cancel: "Abbrechen",
    savedFor: (school: string, location: string) => `Für ${school}, ${location}`,
    lockedTitle: "Nach der Zahlung verfügbar",
    locked:
      "Sobald deine erste Zahlung bei uns eingegangen ist, kannst du hier deine Befreiung erstellen. Eine Teilzahlung reicht.",
    pay: "Jetzt bezahlen",
  },
  errors: {
    generic: "Das hat leider nicht geklappt. Bitte versuche es später noch einmal.",
    invalidLink: "Dieser Link ist ungültig oder abgelaufen.",
    unavailable: "Die Schulbefreiung ist für diese Anmeldung gerade nicht verfügbar.",
    locked: "Die Schulbefreiung ist verfügbar, sobald deine erste Zahlung eingegangen ist.",
    throttled: "Zu viele Versuche. Bitte warte ein paar Minuten.",
    check: "Bitte prüfe die markierten Felder.",
    required: "Bitte ausfüllen.",
    tooLong: (max: number) => `Höchstens ${max} Zeichen.`,
  },
  landing: {
    eyebrow: "Schulbefreiung",
    heading: "Schule am Brückentag?",
    intro: (dates: string) =>
      `Das Camp fällt auf ${dates}. Wer an diesem Tag Schule hat, bekommt von uns eine Bitte um Unterrichtsbefreiung als PDF.`,
    how: "Gib die Mailadresse deiner Anmeldung ein. Wir schicken dir den Link zu deiner Anmeldung, dort erstellst du die Befreiung selbst.",
    email: "Mailadresse der Anmeldung",
    submit: "Link zur Befreiung senden",
    submitting: "Wird gesendet …",
    done: "Danke! Wenn es zu dieser Adresse eine Anmeldung gibt, ist der Link gleich in deinem Postfach.",
    invalidEmail: "Bitte gib eine gültige Mailadresse ein.",
    throttled: "Zu viele Anfragen. Bitte versuche es später erneut.",
  },
  /**
   * Text of the church's "Teilnehmer Bescheinigung", taken word for word from
   * specs/042-church-release-letter/template-2026.pdf.
   */
  letter: {
    title: "Teilnehmer Bescheinigung",
    subject: (period: string, location: string | null) =>
      location ? `Summercamp vom ${period} in ${location}` : `Summercamp vom ${period}`,
    subjectNoPeriod: (location: string | null) => (location ? `Summercamp in ${location}` : "Summercamp"),
    period: (start: string, end: string) => `${start} bis ${end}`,
    salutation: "Sehr geehrte Damen und Herren,",
    legal:
      "laut AV Schulpflicht zu §128 Schulgesetz wird bestimmt, dass Schülerinnen und Schüler die Teilnahme an den Kirchentagen ihres Glaubens eine Beurlaubung vom Besuch des Unterrichts für die Dauer des Kirchentages gewährt werden können, soweit nicht vorrangige schulische Belange (z.B. Klausuren, Abschlussprüfung) dem entgegenstehen.",
    legalSource: "(AV Schulpflicht Nr. 2 Abs. 7)",
    reasonBefore: "Da die Teilnahme aus religiösen Gründen bedingt ist (Zeitraum ",
    reasonAfter: (person: string, name: string) => `), bitten wir ${person} ${name}, vom Unterricht zu befreien.`,
    reasonNoPeriod: (person: string, name: string) =>
      `Da die Teilnahme aus religiösen Gründen bedingt ist, bitten wir ${person} ${name}, vom Unterricht zu befreien.`,
    person: { male: "den Teilnehmer", female: "die Teilnehmerin", unknown: "die teilnehmende Person" },
    understanding: "Wir bitten um Ihr Verständnis.",
    questions: "Für Fragen oder Erläuterungen stehe ich Ihnen selbstverständlich gerne zur Verfügung.",
    closing: "Mit freundlichen Segensgrüßen",
    placeDate: (place: string, date: string) => `${place}, ${date}`,
    signatureMissing: "Stempel und Unterschrift fehlen",
  },
  /** Sample data for the admin preview PDF, as in the template. */
  sample: {
    participantName: "John Hacatrian",
    gender: "male",
    data: {
      schoolName: "Gesamtschule Eifel",
      schoolLocation: "Nettersheim",
    },
  },
  dateJoin: " und ",
  /** Reasons why the switch cannot be turned on yet. */
  missing: {
    signature: "Unterschriftsbild hochladen",
    dates: "Mindestens ein Tag für die Befreiung",
    campPeriod: "Start und Ende des Camps",
  },
  fileName: (lastName: string) => `Schulbefreiung-${lastName || "Camp"}.pdf`,
} as const;
