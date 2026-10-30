import type { OperatorField } from "./operator";
import { SUBMISSION_ATTEMPT_RETENTION_DAYS } from "./limits";

/**
 * German copy of the imprint and the privacy policy (specs/025-legal-pages,
 * research R10). Operator values are referenced by field, never copied, so the
 * pages stay in sync with `lib/legal/operator.ts`. Every statement about data
 * flows follows research R1 and R2; change the text when the code changes.
 * Strings follow the writing rules: no dash punctuation, no hyphenated words.
 */

/** Text, an operator value (optionally as mail or phone link), or an outside link. */
export type Inline =
  | string
  | { field: OperatorField; link?: "mailto" | "tel" }
  | { href: string; label: string };

export type LegalBlock =
  | { kind: "p"; parts: Inline[]; onlyIf?: OperatorField }
  | { kind: "list"; items: Inline[][] }
  | { kind: "address" }
  | { kind: "sub"; heading: string };

export type LegalSection = { id: string; heading: string; blocks: LegalBlock[] };

const p = (...parts: Inline[]): LegalBlock => ({ kind: "p", parts });
const list = (...items: Inline[][]): LegalBlock => ({ kind: "list", items });
const sub = (heading: string): LegalBlock => ({ kind: "sub", heading });

const email: Inline = { field: "email", link: "mailto" };

const imprintSections: LegalSection[] = [
  {
    id: "angaben",
    heading: "Angaben gemäß § 5 DDG",
    blocks: [
      { kind: "address" },
      p("Eingetragener Verein und Veranstalter des FCG Blankenheim Summercamp."),
    ],
  },
  {
    id: "vertretung",
    heading: "Vertreten durch",
    blocks: [p("Vorstand: ", { field: "board" })],
  },
  {
    id: "register",
    heading: "Registereintrag",
    blocks: [
      list(
        ["Registergericht: ", { field: "registerCourt" }],
        ["Registernummer: ", { field: "registerNumber" }],
      ),
    ],
  },
  {
    id: "kontakt",
    heading: "Kontakt",
    blocks: [
      list(["Telefon: ", { field: "phone", link: "tel" }], ["Mail: ", email]),
    ],
  },
  {
    id: "verantwortlich",
    heading: "Verantwortlich für den Inhalt",
    blocks: [
      p("Verantwortlich nach § 18 Abs. 2 MStV: ", { field: "contentResponsible" }),
    ],
  },
  {
    id: "streitbeilegung",
    heading: "Verbraucherstreitbeilegung",
    blocks: [
      p(
        "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
      ),
    ],
  },
  {
    id: "haftung",
    heading: "Haftung",
    blocks: [
      sub("Haftung für Inhalte"),
      p(
        "Wir erstellen die Inhalte dieser Website mit Sorgfalt. Für Richtigkeit, Vollständigkeit und Aktualität können wir trotzdem keine Gewähr übernehmen. Als Diensteanbieter sind wir für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich. Sobald wir von einer Rechtsverletzung erfahren, entfernen wir den betroffenen Inhalt umgehend.",
      ),
      sub("Haftung für Links"),
      p(
        "Diese Website enthält Links zu Websites anderer Anbieter, auf deren Inhalte wir keinen Einfluss haben. Für diese Inhalte ist immer der jeweilige Anbieter verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar. Werden uns Rechtsverletzungen bekannt, entfernen wir den Link umgehend.",
      ),
    ],
  },
];

const retentionDays = `${SUBMISSION_ATTEMPT_RETENTION_DAYS} Tage`;

const privacySections: LegalSection[] = [
  {
    id: "verantwortlicher",
    heading: "Verantwortlicher",
    blocks: [
      p("Verantwortlich für die Verarbeitung personenbezogener Daten auf dieser Website ist:"),
      { kind: "address" },
      p("Mail: ", email),
      {
        kind: "p",
        parts: ["Unseren Datenschutzbeauftragten erreichst du so: ", { field: "dataProtectionOfficer" }],
        onlyIf: "dataProtectionOfficer",
      },
    ],
  },
  {
    id: "ueberblick",
    heading: "Überblick",
    blocks: [
      p(
        "Diese Website dient dazu, dich über das Summercamp zu informieren, die Anmeldung entgegenzunehmen, die Bezahlung abzuwickeln und das Camp zu organisieren. Wir verarbeiten deine Daten nur, soweit das dafür nötig ist oder du eingewilligt hast.",
      ),
      p(
        "Wir verwenden keine Analysewerkzeuge, keine Werbung, kein Tracking und keine Social Media Plugins. Deine Daten verkaufen wir nicht.",
      ),
      p(
        "In dieser Erklärung sprechen wir dich direkt an. Meldest du ein Kind an, gilt alles, was die Anmeldung betrifft, sinngemäß für dich als Elternteil und für dein Kind.",
      ),
    ],
  },
  {
    id: "website",
    heading: "Besuch der Website",
    blocks: [
      sub("Hosting und Server Protokolle"),
      p(
        "Die Website läuft bei Vercel. Bei jedem Aufruf verarbeitet der Server technisch nötige Daten: IP Adresse, Zeitpunkt, aufgerufene Adresse, Browser und Betriebssystem. Das dient dem sicheren und stabilen Betrieb. Rechtsgrundlage ist unser berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO. Vercel speichert diese Protokolle nur kurz.",
      ),
      sub("Cookies und lokaler Speicher"),
      p(
        "Besucherinnen und Besuchern der öffentlichen Seiten setzen wir keine Cookies. Nur im Adminbereich und auf den Anmeldeseiten des Teams ist der Anmeldedienst Clerk eingebunden. Er setzt dort technisch notwendige Cookies, die eine Anmeldung des Teams erkennen und absichern. Die Packliste merkt sich deine Häkchen nur im Speicher deines Browsers, sie werden nicht an uns übertragen.",
      ),
      p(
        "Für technisch notwendige Cookies und Speicher brauchen wir keine Einwilligung (§ 25 Abs. 2 Nr. 2 TDDDG). Deshalb gibt es kein Cookie Banner.",
      ),
      sub("Schriften und Bilder"),
      p(
        "Schriften und Bilder werden von unserem eigenen Server ausgeliefert. Dein Browser baut dafür keine Verbindung zu anderen Anbietern auf.",
      ),
    ],
  },
  {
    id: "anmeldung",
    heading: "Anmeldung zum Camp",
    blocks: [
      p(
        "Bei der Anmeldung erheben wir Vorname, Nachname, Mailadresse, Wohnort und Geschlecht sowie die Antworten auf die Fragen des Anmeldeformulars des jeweiligen Camps. Je nach Camp sind das zum Beispiel Geburtsdatum, Telefonnummer, Kontakt der Erziehungsberechtigten, Anreise mit dem Bus und Hinweise zu Ernährung oder Gesundheit. Dazu kommen die Preisstufe, der Zahlungsstand und eine Anmeldenummer.",
      ),
      p(
        "Wir nutzen diese Daten, um deine Teilnahme durchzuführen: Planung, Bezahlung, Kommunikation, Unterbringung und Betreuung vor Ort. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.",
      ),
      sub("Minderjährige"),
      p(
        "Viele Teilnehmende sind minderjährig. Ist die angemeldete Person jünger als 16 Jahre, muss ein Elternteil oder eine andere erziehungsberechtigte Person die Anmeldung ausfüllen oder ihr zustimmen.",
      ),
      sub("Angaben zur Gesundheit"),
      p(
        "Angaben zu Allergien, Medikamenten oder Erkrankungen sind freiwillig. Sie helfen uns, im Camp gut aufzupassen. Wir verarbeiten sie nur mit deiner Einwilligung nach Art. 9 Abs. 2 lit. a DSGVO und geben sie nur an die Personen im Team weiter, die sie für die Betreuung brauchen. Du kannst die Einwilligung jederzeit für die Zukunft widerrufen.",
      ),
      sub("Schutz vor Missbrauch"),
      p(
        `Um massenhafte oder automatisierte Eingaben zu verhindern, speichern wir bei Formularen und Abfragen die IP Adresse und den Zeitpunkt. Diese Einträge löschen wir automatisch nach ${retentionDays}. Rechtsgrundlage ist unser berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO.`,
      ),
      sub("Persönliche Preislinks"),
      p(
        "Manche Preise gibt es nur über einen persönlichen Link. Meldest du dich über so einen Link an, speichern wir die zugehörige Preisstufe bei deiner Anmeldung.",
      ),
    ],
  },
  {
    id: "bezahlung",
    heading: "Bezahlung",
    blocks: [
      p(
        "Die Bezahlung läuft über Stripe (Stripe Payments Europe, Ltd., Dublin, Irland). Je nach Wahl bietet Stripe Karte, Apple Pay, Google Pay, PayPal, SEPA Lastschrift und Klarna an. Deine Zahlungsdaten gibst du direkt bei Stripe ein; vollständige Karten oder Kontodaten sehen wir nie.",
      ),
      p(
        "An Stripe übermitteln wir Name, Mailadresse, Betrag und Anmeldenummer. Stripe meldet uns zurück, ob und wie viel bezahlt wurde. Stripe ist für die Zahlungsabwicklung selbst verantwortlich und kann Daten an die Stripe, Inc. in den USA übermitteln. Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b DSGVO und für die Aufbewahrung von Zahlungsbelegen Art. 6 Abs. 1 lit. c DSGVO.",
      ),
      p("Mehr dazu: ", { href: "https://stripe.com/de/privacy", label: "Datenschutzerklärung von Stripe" }),
    ],
  },
  {
    id: "mails",
    heading: "Mails an Teilnehmende",
    blocks: [
      p(
        "Nach der Anmeldung schicken wir dir eine Bestätigung. Je nach Stand folgen ein Zahlungslink, Erinnerungen an offene Beträge und Infomails vor und nach dem Camp, zum Beispiel zur Packliste und zur Anreise. Alle Mails betreffen deine Anmeldung; Werbung an Personen ohne Anmeldung verschicken wir nicht.",
      ),
      p(
        "Für den Versand nutzen wir Resend (Plus Five Five, Inc., San Francisco, USA). Resend erhält deine Mailadresse und den Inhalt der Mail. Wir speichern, welche Mail wann an deine Anmeldung ging und ob sie zugestellt wurde. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.",
      ),
    ],
  },
  {
    id: "teilnehmerseite",
    heading: "Teilnehmerseite und Nachrichten",
    blocks: [
      p(
        "Jede Anmeldung hat eine eigene Teilnehmerseite mit Status, Beträgen und deinen Angaben. Sie ist nur über einen geheimen Link erreichbar, der in jeder Mail an dich steht. Wer den Link kennt, kann die Seite sehen; gib ihn deshalb nicht weiter. Das Team kann den Link erneuern, dann wird der alte ungültig.",
      ),
      p(
        "Über die Teilnehmerseite kannst du dem Team eine Nachricht schicken oder die Änderung einer Angabe erbitten. Wir speichern die Nachricht bei deiner Anmeldung und leiten sie per Mail an das Team weiter. Auf der Startseite kannst du dir außerdem den Link zu deiner Teilnehmerseite erneut zuschicken lassen.",
      ),
    ],
  },
  {
    id: "schulbefreiung",
    heading: "Schulbefreiung",
    blocks: [
      p(
        "Fällt das Camp in die Schulzeit, kannst du auf der Teilnehmerseite ein Schreiben zur Befreiung vom Unterricht anfordern. Dafür erheben wir Name der Lehrkraft, Name und Anschrift der Schule, deine Anschrift und auf Wunsch die Klasse.",
      ),
      p(
        "Das Schreiben erstellen wir bei Bedarf neu und schicken es nur an die Mailadresse deiner Anmeldung. An Schulen senden wir nichts. Das Schreiben selbst speichern wir nicht; die Angaben löschen wir mit deiner Anmeldung.",
      ),
    ],
  },
  {
    id: "busticket",
    heading: "Busticket",
    blocks: [
      p(
        "Fährst du mit dem Bus, bekommst du ein Ticket mit einem zufälligen Code als QR Code. Beim Einsteigen scannt das Team den Code. Wir speichern, auf welcher Fahrt du wann eingestiegen bist und wer gescannt hat. Das Kamerabild wird nur auf dem Gerät des Teams ausgewertet und nicht gespeichert.",
      ),
    ],
  },
  {
    id: "organisation",
    heading: "Organisation vor Ort",
    blocks: [
      p(
        "Für Zimmer und Zeltkreise ordnet das Team die Anmeldungen intern zu. Diese Zuordnung sehen nur Teammitglieder; sie wird mit der Anmeldung gelöscht.",
      ),
    ],
  },
  {
    id: "team",
    heading: "Konten des Teams",
    blocks: [
      p(
        "Mitglieder des Teams melden sich über Clerk (Clerk, Inc., San Francisco, USA) an. Dabei werden Name, Mailadresse, Anmeldedaten und Sitzungen verarbeitet. Bei uns gespeichert sind die Rolle und die Berechtigungen. Wichtige Aktionen im Adminbereich protokollieren wir, um Fehler und Missbrauch nachvollziehen zu können. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.",
      ),
    ],
  },
  {
    id: "dienstleister",
    heading: "Dienstleister",
    blocks: [
      p("Wir arbeiten mit diesen Dienstleistern zusammen:"),
      list(
        ["Vercel Inc., San Francisco, USA: Hosting der Website und geplante Abläufe."],
        ["Supabase, Inc., San Francisco, USA: Datenbank und Dateispeicher. Serverstandort: ", { field: "hostingRegion" }],
        ["Clerk, Inc., San Francisco, USA: Anmeldung des Teams."],
        ["Stripe Payments Europe, Ltd., Dublin, Irland: Zahlungsabwicklung."],
        ["Plus Five Five, Inc. (Resend), San Francisco, USA: Mailversand."],
      ),
      p(
        "Vercel, Supabase, Clerk und Resend verarbeiten Daten in unserem Auftrag auf Grundlage von Verträgen nach Art. 28 DSGVO. Bei Anbietern in den USA kann es zu einer Übermittlung in ein Drittland kommen. Sie stützt sich auf den Angemessenheitsbeschluss zum EU US Data Privacy Framework, soweit der Anbieter zertifiziert ist, und sonst auf Standardvertragsklauseln der EU Kommission.",
      ),
    ],
  },
  {
    id: "speicherdauer",
    heading: "Speicherdauer",
    blocks: [
      list(
        ["Anmeldedaten bewahren wir für das Camp und seine Nachbereitung auf und löschen sie mit dem Camp, spätestens zum Ende des Jahres nach dem Camp, soweit keine Aufbewahrungspflicht besteht."],
        ["Löscht das Team eine Anmeldung, entfernen wir Schulbefreiung und Busticket sofort; die übrigen Daten folgen mit dem Camp."],
        ["Zahlungsbelege bewahren wir nach den steuerlichen Vorschriften bis zu zehn Jahre auf."],
        [`Daten zum Schutz vor Missbrauch löschen wir nach ${retentionDays}.`],
        ["Konten des Teams löschen wir, wenn jemand das Team verlässt."],
      ),
    ],
  },
  {
    id: "rechte",
    heading: "Deine Rechte",
    blocks: [
      p("Du hast nach der DSGVO das Recht auf:"),
      list(
        ["Auskunft über deine gespeicherten Daten (Art. 15)"],
        ["Berichtigung falscher Daten (Art. 16)"],
        ["Löschung (Art. 17)"],
        ["Einschränkung der Verarbeitung (Art. 18)"],
        ["Datenübertragbarkeit (Art. 20)"],
        ["Widerspruch gegen Verarbeitungen aus berechtigtem Interesse (Art. 21)"],
        ["Widerruf einer Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3)"],
      ),
      p("Schreib uns dafür einfach eine Mail an ", email, "."),
      p(
        "Außerdem kannst du dich bei einer Datenschutzaufsichtsbehörde beschweren. Für uns zuständig ist: ",
        { field: "supervisoryAuthority" },
        ".",
      ),
    ],
  },
  {
    id: "stand",
    heading: "Stand dieser Erklärung",
    blocks: [
      p(
        "Wir passen diese Erklärung an, wenn sich die Website oder die genutzten Dienste ändern. Es gilt die jeweils hier veröffentlichte Fassung.",
      ),
    ],
  },
];

export const legalMessages = {
  links: {
    imprint: "Impressum",
    privacy: "Datenschutz",
    home: "Zur Startseite",
    contents: "Inhalt",
    updated: "Stand",
    gap: "noch einzutragen",
    legalNav: "Rechtliches",
  },
  imprint: {
    title: "Impressum",
    metaTitle: "Impressum · FCG Summercamp",
    sections: imprintSections,
  },
  privacy: {
    title: "Datenschutz",
    metaTitle: "Datenschutz · FCG Summercamp",
    intro:
      "Hier erfährst du, welche Daten wir beim Besuch dieser Website und bei der Anmeldung zum Summercamp verarbeiten, wofür und welche Rechte du hast.",
    sections: privacySections,
  },
} as const;

/** „© 2026 FCG Blankenheim Summercamp“ */
export function copyrightLine(year: number, name: string): string {
  return `© ${year} ${name}`;
}
