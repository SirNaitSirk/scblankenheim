/**
 * German UI copy for the public registration area. Single source of truth for
 * the landing section, the form, the countdown and the register API, so browser
 * and server validation always produce identical wording (constitution IV, V).
 * Isomorphic on purpose: no `server-only`, imported by client and server code.
 * Strings follow the writing rules: no dash punctuation, no hyphenated words.
 */
export const registerMessages = {
  section: {
    open: {
      eyebrow: "Anmeldung",
      heading: "Sichere dir deinen Platz",
      intro:
        "Fülle das Formular aus und sei beim Summercamp dabei. Wir freuen uns auf dich.",
    },
    countdown: {
      eyebrow: "Bald geht's los",
      heading: "Die Anmeldung öffnet in Kürze",
      intro:
        "Merk dir den Termin vor. Ab dann kannst du dich hier anmelden.",
    },
    closed: {
      eyebrow: "Anmeldung",
      heading: "Die Anmeldung ist derzeit geschlossen",
      intro:
        "Aktuell nehmen wir keine Anmeldungen entgegen. Bei Fragen zum nächsten Camp melde dich gern bei uns.",
    },
    full: {
      eyebrow: "Anmeldung",
      heading: "Das Camp ist ausgebucht",
      intro:
        "Alle Plätze sind vergeben. Wenn du trotzdem Fragen hast oder auf einen frei werdenden Platz hoffst, schreib uns gern.",
    },
    contact: "Schreib uns",
    contactHref: "mailto:info@summercamp.fcg-blankenheim.de",
  },
  countdown: {
    reachedTitle: "Es geht los!",
    reachedBody: "Die Anmeldung wird gerade geöffnet. Einen Moment bitte.",
    opensAtTime: (time: string) => `ab ${time} Uhr`,
    remainingDays: (n: number) => (n === 1 ? "Noch 1 Tag" : `Noch ${n} Tage`),
    remainingHours: (n: number) => (n === 1 ? "Noch 1 Stunde" : `Noch ${n} Stunden`),
    remainingUnderHour: "In weniger als einer Stunde",
  },
  fields: {
    firstName: "Vorname",
    lastName: "Nachname",
    email: "Mail",
    gender: "Geschlecht",
    genderFemale: "Weiblich",
    genderMale: "Männlich",
    checkboxFallback: "Zustimmung",
    selectPlaceholder: "Bitte wählen",
  },
  validation: {
    required: "Pflichtfeld",
    email: "Bitte gib eine gültige Mailadresse ein",
    number: "Bitte gib eine Zahl ein",
    option: "Bitte wähle eine der Möglichkeiten",
    checkbox: "Bitte bestätige dieses Feld",
    optionFull: "Leider sind alle Plätze für diese Option belegt.",
  },
  seats: {
    soldOutOption: (option: string) => `${option} (ausgebucht)`,
    left: (remaining: number, limit: number, option: string) =>
      `„${option}“: noch ${remaining} von ${limit} Plätzen frei`,
    soldOut: (option: string) => `„${option}“: ausgebucht`,
  },
  form: {
    submit: "Anmeldung absenden",
    submitting: "Wird gesendet …",
    successTitle: "Anmeldung eingegangen!",
    successBody:
      "Wir haben deine Anmeldung erhalten. Mit deiner Referenznummer kannst du jederzeit online bezahlen.",
    successFree: "Für dich fällt kein Beitrag an. Du bist dabei!",
    referenceLabel: "Referenznummer",
    referenceMailHint: "Du findest sie auch in deiner Bestätigungsmail.",
    copy: "Kopieren",
    copied: "Kopiert",
    copiedStatus: "Referenznummer kopiert",
    copyFailed: "Kopieren nicht möglich",
    payNow: "Jetzt bezahlen",
    redirectingTitle: "Weiter zur Bezahlung …",
    redirectingBody:
      "Deine Anmeldung ist gespeichert. Du wirst gleich zur sicheren Bezahlseite weitergeleitet.",
    registerAnother: "Noch jemanden anmelden",
    toPayment: "Zur Bezahlseite",
    // Admin form test view only (specs/036-form-test-preview).
    testSuccessTitle: "Test erfolgreich",
    testSuccessBody:
      "So würde die Anmeldung angenommen. Es wurde nichts gespeichert und nichts verschickt.",
    testAgain: "Noch einmal testen",
  },
  steps: {
    coreTitle: "Deine Daten",
    autoTitle: "Weitere Angaben",
    reviewTitle: "Angaben prüfen",
    reviewIntro: "Schau kurz drüber, bevor du die Anmeldung abschickst.",
    next: "Weiter",
    back: "Zurück",
    backToReview: "Zurück zur Übersicht",
    edit: "Ändern",
    editStep: (title: string) => `${title} ändern`,
    submit: "Verbindlich anmelden",
    // Only what the system really does; no deadlines, fees or refunds (specs/031 FR-007).
    reassurance: {
      title: "So geht es weiter",
      items: [
        "Falls ein Beitrag anfällt, geht es direkt weiter zur sicheren Bezahlseite.",
        "Du bekommst eine Bestätigungsmail mit deinem persönlichen Link.",
        "Über diesen Link kannst du auch später bezahlen.",
      ],
      contactLead: "Falls du doch nicht kannst, schreib uns an",
      contactEmail: "info@summercamp.fcg-blankenheim.de",
    },
    progress: (n: number, total: number) => `Schritt ${n} von ${total}`,
    announce: (n: number, total: number, title: string) =>
      `Schritt ${n} von ${total}: ${title}`,
    // Screen reader notice when a conditional field appears (specs/037).
    fieldShown: (label: string) => `Neues Feld: ${label}`,
    yes: "Ja",
    no: "Nein",
    empty: "Keine Angabe",
  },
  invitationHint: "Du meldest dich über eine persönliche Einladung an.",
  cta: {
    open: "Jetzt anmelden",
    openShort: "Anmelden",
    countdown: (dayMonth: string) => `Anmeldung ab ${dayMonth}`,
    countdownShort: (numeric: string) => `Anmeldung ab ${numeric}`,
    countdownUndated: "Anmeldung bald",
    closed: "Anmeldung geschlossen",
    full: "Ausgebucht",
    neutralShort: "Anmeldung",
  },
  countdownHeading: (dayMonth: string | null) =>
    dayMonth ? `Die Anmeldung öffnet am ${dayMonth}` : "Die Anmeldung öffnet in Kürze",
  api: {
    badRequest: "Ungültige Anfrage.",
    invalid: "Bitte prüfe deine Angaben.",
    optionFull: "Für die gewählte Option sind keine Plätze mehr frei.",
    campFull: "Das Camp ist inzwischen ausgebucht.",
    closed: "Die Anmeldung ist derzeit geschlossen.",
    throttled: "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.",
    formExpired:
      "Das Formular war zu lange geöffnet. Bitte lade die Seite neu und sende es noch einmal ab.",
    busy: "Gerade gehen sehr viele Anmeldungen ein. Bitte versuche es in einer Stunde noch einmal.",
    generic: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
  },
} as const;
