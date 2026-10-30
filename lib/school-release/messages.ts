/**
 * German copy of the school release letter (specs/020-school-release): the
 * participant card, the landing section and the PDF text. The only place this
 * wording lives; admin copy is in lib/admin/messages.ts, mail copy in
 * lib/email/messages.ts.
 */
export const releaseMessages = {
  card: {
    heading: "Schulbefreiung",
    intro: (dates: string) =>
      `Das Camp fällt auf ${dates}. Falls du an diesem Tag Schule hast, stellen wir dir eine Bitte um Unterrichtsbefreiung für deine Schule aus.`,
    steps: "Trag die Angaben zu deiner Schule ein. Den Brief bekommst du sofort als PDF und zusätzlich per Mail.",
    name: "Name",
    participantAddress: "Deine Adresse",
    participantAddressHint: "Straße und Hausnummer, darunter Postleitzahl und Ort",
    teacherName: "Name der Lehrkraft",
    teacherNameHint: "Zum Beispiel Frau Becker",
    schoolName: "Name der Schule",
    schoolAddress: "Adresse der Schule",
    schoolAddressHint: "Straße und Hausnummer, darunter Postleitzahl und Ort",
    className: "Klasse",
    optional: "optional",
    submit: "Befreiung erstellen",
    submitting: "Wird erstellt …",
    update: "Befreiung aktualisieren",
    saved: "Deine Befreiung ist fertig.",
    download: "PDF herunterladen",
    mailQueued: "Wir schicken sie dir zusätzlich per Mail.",
    mailSkipped: "Eine Mail konnten wir gerade nicht schicken. Lade das PDF einfach hier herunter.",
    edit: "Angaben ändern",
    cancel: "Abbrechen",
    savedFor: (school: string, teacher: string) => `Für ${teacher}, ${school}`,
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
    tooManyLines: (max: number) => `Höchstens ${max} Zeilen.`,
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
  letter: {
    subject: "Bitte um Unterrichtsbefreiung",
    salutation: (teacher: string) => `Guten Tag ${teacher},`,
    attendance: (name: string, campName: string, period: string) =>
      `${name} ist zu unserem ${campName} angemeldet, das ${period} stattfindet.`,
    attendanceNoPeriod: (name: string, campName: string) =>
      `${name} ist zu unserem ${campName} angemeldet.`,
    period: (start: string, end: string) => `vom ${start} bis ${end}`,
    address: (address: string) => `Anschrift: ${address}`,
    className: (className: string) => `Klasse: ${className}`,
    request: (name: string, dates: string) =>
      `Wir bitten Sie herzlich, ${name} für ${dates} vom Unterricht freizustellen. Das Programm des Camps beginnt bereits an diesem Tag.`,
    thanks: "Vielen Dank für Ihr Verständnis. Bei Rückfragen erreichen Sie uns gern unter den oben genannten Kontaktdaten.",
    closing: "Mit freundlichen Grüßen",
    placeDate: (date: string) => `Blankenheim, ${date}`,
    organizer: "FCG Blankenheim Summercamp",
    signatureMissing: "Unterschrift fehlt",
    phone: (phone: string) => `Telefon ${phone}`,
    email: (email: string) => `Mail ${email}`,
  },
  /** Sample data for the admin preview PDF. */
  sample: {
    participantName: "Lena Beispiel",
    data: {
      teacherName: "Frau Becker",
      schoolName: "Gesamtschule Musterstadt",
      schoolAddress: "Schulweg 1\n12345 Musterstadt",
      participantAddress: "Lindenstraße 5\n12345 Musterstadt",
      className: "8b",
    },
  },
  dateJoin: " und ",
  /** Reasons why the switch cannot be turned on yet. */
  missing: {
    signature: "Unterschriftsbild hochladen",
    dates: "Mindestens ein Tag für die Befreiung",
    signerName: "Name der unterzeichnenden Person",
  },
  fileName: (lastName: string) => `Schulbefreiung-${lastName || "Camp"}.pdf`,
} as const;
