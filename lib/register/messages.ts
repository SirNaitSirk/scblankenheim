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
        "Merk dir den Termin vor. Sobald der Countdown abgelaufen ist, kannst du dich hier anmelden.",
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
    contactHref: "mailto:info@fcg-blankenheim.de",
  },
  countdown: {
    reopenHint: "Anmeldung öffnet am",
    reachedTitle: "Es geht los!",
    reachedBody: "Die Anmeldung wird gerade geöffnet. Einen Moment bitte.",
    units: {
      days: "Tage",
      hours: "Std.",
      minutes: "Min.",
      seconds: "Sek.",
    },
  },
  fields: {
    firstName: "Vorname",
    lastName: "Nachname",
    email: "Mail",
    checkboxFallback: "Zustimmung",
    selectPlaceholder: "Bitte wählen",
  },
  validation: {
    required: "Pflichtfeld",
    email: "Bitte gib eine gültige Mailadresse ein",
    number: "Bitte gib eine Zahl ein",
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
    successBody: (reference: string) =>
      `Wir haben deine Anmeldung erhalten. Deine Referenznummer lautet ${reference}. Bewahre sie gut auf. Zur Bezahlung melden wir uns in Kürze bei dir.`,
    registerAnother: "Noch jemanden anmelden",
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
    progress: (n: number, total: number) => `Schritt ${n} von ${total}`,
    announce: (n: number, total: number, title: string) =>
      `Schritt ${n} von ${total}: ${title}`,
    yes: "Ja",
    no: "Nein",
    empty: "Keine Angabe",
  },
  invitationHint: "Du meldest dich über eine persönliche Einladung an.",
  api: {
    badRequest: "Ungültige Anfrage.",
    invalid: "Bitte prüfe deine Angaben.",
    optionFull: "Für die gewählte Option sind keine Plätze mehr frei.",
    campFull: "Das Camp ist inzwischen ausgebucht.",
    closed: "Die Anmeldung ist derzeit geschlossen.",
    throttled: "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.",
    generic: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
  },
} as const;
