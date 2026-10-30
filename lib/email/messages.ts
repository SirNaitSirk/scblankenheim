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
  /** Subject prefix of admin test sends (specs/016-mail-settings, US6). */
  testSubjectPrefix: "Test: ",
  /** Contact line from the camp's text blocks (specs/016-mail-settings, US5). */
  contactLine: (name: string | null, phone: string | null) =>
    name && phone
      ? `Bei Fragen erreichst du ${name} unter ${phone}.`
      : name
        ? `Bei Fragen erreichst du ${name}, antworte einfach auf diese Mail.`
        : `Bei Fragen erreichst du uns unter ${phone}.`,

  team: {
    subjectMessage: (name: string, reference: string) => `Nachricht von ${name} (${reference})`,
    subjectChange: (name: string, reference: string) => `Änderungswunsch von ${name} (${reference})`,
    preheader: "Neues Anliegen von der Teilnehmerseite",
    titleMessage: "Neue Nachricht",
    titleChange: "Neuer Änderungswunsch",
    intro: "über die Teilnehmerseite ist ein neues Anliegen eingegangen.",
    greeting: "Hallo Team,",
    labels: {
      name: "Name",
      reference: "Referenznummer",
      camp: "Camp",
      field: "Angabe",
      previous: "Bisher",
      proposed: "Neu",
      reason: "Begründung",
    },
    empty: "leer",
    replyHint: (email: string) => `Antworte einfach auf diese Mail, die Antwort geht an ${email}.`,
    noReply: "Für diese Anmeldung ist keine Mailadresse hinterlegt.",
    changeHint: "Im Anmeldedialog kannst du die Änderung mit einem Klick übernehmen oder ablehnen.",
    adminLink: "Im Admin Bereich öffnen",
    unnamed: "Ohne Namen",
    footer: "FCG Blankenheim Summercamp · Interne Mail aus CampConnect",
  },

  calendar: {
    intro: "Trag dir das Camp gleich in den Kalender ein:",
    ics: "Apple oder Outlook",
    google: "Google Kalender",
  },

  participant: {
    intro: "Deinen Anmeldestand, Zahlungen und Daten findest du jederzeit hier:",
    link: "Meine Anmeldung ansehen",
  },

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

  schoolRelease: {
    subject: (camp: string) => `Deine Schulbefreiung für das ${camp}`,
    preheader: "Dein Brief an die Schule liegt als PDF bei.",
    title: "Deine Schulbefreiung",
    intro: (camp: string) =>
      `im Anhang findest du deinen Brief an die Schule mit der Bitte um Unterrichtsbefreiung für das ${camp}.`,
    dates: (dates: string) => `Er gilt für ${dates}.`,
    attachment: "Druck ihn aus oder leite ihn an deine Lehrkraft weiter. Den Brief hat die Campleitung bereits unterschrieben.",
    change: "Stimmt etwas nicht? Auf deiner Seite zur Anmeldung kannst du die Angaben ändern und den Brief neu erstellen:",
    button: "Zur Schulbefreiung",
  },

  releaseHint: {
    title: "Schulbefreiung",
    intro: (dates: string) =>
      `Das Camp fällt auf ${dates}. Wenn du an diesem Tag Schule hast, erstellst du dir auf deiner Seite zur Anmeldung in zwei Minuten einen Brief an deine Schule.`,
    button: "Schulbefreiung erstellen",
  },

  busTicket: {
    subject: (camp: string) => `Dein Busticket für das ${camp}`,
    preheader: "Zeig den QR Code beim Einstieg in den Bus.",
    title: "Dein Busticket",
    heading: "Dein Busticket",
    intro: (camp: string) => `hier ist dein Busticket für das ${camp}.`,
    show: "Zeig diesen QR Code beim Einstieg in den Bus, auf der Hinfahrt und auf der Rückfahrt. Dreh dafür die Helligkeit deines Bildschirms hoch.",
    alt: "QR Code deines Bustickets",
    noImage: "Wird kein Bild angezeigt? Auf deiner Seite zur Anmeldung findest du den Code jederzeit:",
    button: "Busticket öffnen",
  },

  releaseAfterPayment: "Die Befreiung steht bereit, sobald deine erste Zahlung bei uns eingegangen ist.",

  participantLink: {
    subject: (camp: string) => `Dein Link zur Anmeldung für das ${camp}`,
    preheader: "Hier geht es zu deiner Anmeldung und zur Schulbefreiung.",
    title: "Dein Link zur Anmeldung",
    intro: (camp: string) =>
      `du hast auf unserer Website den Link zu deiner Anmeldung zum ${camp} angefordert. Dort kannst du auch deine Schulbefreiung erstellen.`,
    button: "Zur Schulbefreiung",
    notYou: "Du hast nichts angefordert? Dann kannst du diese Mail einfach ignorieren.",
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
  info: {
    packingButton: "Zur Packliste",
    labels: {
      address: "Adresse",
      arrival: "Ankunft",
      pickup: "Abholung",
      emergency: "Notfallnummer",
    },

    teaser: {
      subject: (camp: string) => `Noch 8 Wochen bis zum ${camp}`,
      preheader: "Bald ist es so weit.",
      title: "Die Vorfreude steigt",
      intro: (camp: string) =>
        `in acht Wochen beginnt das ${camp}, und wir freuen uns schon sehr auf dich.`,
      motto: (motto: string) => `Unser Motto in diesem Jahr: ${motto}`,
      highlightsTitle: "Darauf kannst du dich freuen",
      greetingTitle: "Ein Gruß vom Team",
    },

    packing: {
      subject: (camp: string) => `Deine Packliste für das ${camp}`,
      preheader: "Damit du an alles denkst.",
      title: "Deine Packliste",
      intro: (camp: string) =>
        `in drei Wochen geht es los mit dem ${camp}. Damit du nichts vergisst, haben wir eine Packliste vorbereitet. Das Wichtigste vorab:`,
      more: "Die ganze Liste findest du hier. Dort kannst du abhaken, was schon im Koffer ist.",
      health:
        "Brauchst du Medikamente, oder gibt es Besonderheiten beim Essen, zum Beispiel eine Allergie? Dann antworte einfach auf diese Mail, damit wir Bescheid wissen.",
    },

    arrival: {
      subject: "Bald geht es los: alles zur Anreise",
      preheader: "Adresse, Zeiten und Notfallnummer.",
      title: "Alles zur Anreise",
      intro: (camp: string) =>
        `in wenigen Tagen beginnt das ${camp}. Hier findest du alles, was du für die Anreise brauchst.`,
      emergencyNote: "Im Notfall erreichst du die Campleitung unter der Notfallnummer.",
      firstDayTitle: "So läuft der erste Tag",
      phoneTitle: "Handy im Camp",
      packing: "Hast du schon alles eingepackt? Hier ist noch einmal deine Packliste:",
      payNote: (amount: string) =>
        `Bei uns ist noch ein Betrag von ${amount} offen. Wenn du ihn vor dem Camp bezahlst, ist bei der Ankunft alles erledigt.`,
    },

    thanks: {
      subject: (camp: string) => `Danke für das ${camp}`,
      preheader: "Schön, dass du dabei warst.",
      title: "Danke, dass du dabei warst",
      intro: (camp: string) =>
        `das ${camp} ist vorbei. Wir sind dankbar für die gemeinsame Zeit und dafür, dass du dabei warst.`,
      photos: "Die Fotos vom Camp findest du hier:",
      photosButton: "Fotos ansehen",
      feedback: "Was hat dir gefallen, und was können wir besser machen? Wir freuen uns über deine Rückmeldung.",
      feedbackButton: "Feedback geben",
    },
  },
} as const;
