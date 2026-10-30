import type { Trip } from "./types";

/**
 * German copy of the scan page, the boarding list and the participant section
 * (specs/021-bus-ticket). Admin settings and dialog copy live in
 * `lib/admin/messages.ts`, mail copy in `lib/email/messages.ts`.
 */
export const busMessages = {
  title: "Bus",
  intro: (campName: string) => `Einstieg für ${campName}`,
  trips: { outbound: "Hinfahrt", return: "Rückfahrt" } satisfies Record<Trip, string>,
  chooseTrip: "Welche Fahrt?",
  chooseTripHint: "Wähle zuerst die Fahrt, dann startet die Kamera.",
  count: (boarded: number, total: number) => `${boarded} von ${total} eingestiegen`,
  tabs: { scan: "Scannen", list: "Liste" },
  outcome: {
    boarded: "Eingestiegen",
    already: (time: string) => `Schon eingestiegen um ${time}`,
    no_ticket: "Kein Busticket",
    cancelled: "Storniert",
    invalid: "Ticket ungültig",
    other_camp: "Ticket für ein anderes Camp",
    disabled: "Busticket ist für dieses Camp ausgeschaltet",
    unknown: "Unbekannter Code",
    paymentOpen: "Zahlung offen",
    offline: "Keine Verbindung, bitte erneut versuchen",
    next: "Tippen für den nächsten Scan",
  },
  camera: {
    starting: "Kamera startet …",
    prompt: "Bitte erlaube den Zugriff auf die Kamera, damit du Tickets scannen kannst.",
    denied:
      "Die Kamera ist nicht freigegeben. Erlaube den Zugriff in den Einstellungen deines Browsers und lade die Seite neu. Bis dahin kannst du Personen in der Liste von Hand abhaken.",
    missing: "Auf diesem Gerät gibt es keine Kamera. Nutze die Liste, um Personen von Hand abzuhaken.",
    insecure:
      "Die Kamera funktioniert nur, wenn die Seite über https geöffnet ist. Öffne die Scanseite über die richtige Adresse der Website. Bis dahin kannst du Personen in der Liste von Hand abhaken.",
    retry: "Erneut versuchen",
  },
  list: {
    missing: "Fehlen noch",
    boarded: "Eingestiegen",
    manual: "von Hand",
    markBoarded: "Eingestiegen",
    undo: "Zurücknehmen",
    undoConfirm: (name: string) => `Einstieg von ${name} zurücknehmen?`,
    undoConfirmYes: "Ja, zurücknehmen",
    cancel: "Abbrechen",
    search: "Name oder Nummer suchen",
    noneMissing: "Alle sind eingestiegen.",
    noneBoarded: "Noch niemand eingestiegen.",
    noMatch: "Keine Treffer.",
    empty: "Für dieses Camp gibt es keine Buspersonen.",
    loading: "Liste lädt …",
    loadFailed: "Die Liste konnte nicht geladen werden.",
    actionFailed: "Das hat nicht geklappt. Bitte versuche es erneut.",
  },
  state: {
    noCamp: "Es ist kein aktuelles Camp eingestellt.",
    disabled: "Das Busticket ist für das aktuelle Camp ausgeschaltet.",
    mappingBroken:
      "Die Busfrage passt nicht mehr zum Anmeldeformular. Bitte wähle Frage und Antwort in den Einstellungen neu.",
    toSettings: "Zu den Einstellungen",
    noPermission: "Dir fehlt die Berechtigung „Bus“. Bitte wende dich an eine Admin.",
  },
  participant: {
    title: "Busticket",
    intro: "Zeig diesen Code beim Einstieg in den Bus, auf der Hinfahrt und auf der Rückfahrt.",
    brightness: "Dreh dafür die Helligkeit deines Bildschirms hoch.",
    alt: (name: string) => `QR Code des Bustickets von ${name}`,
    blocked: "Dein Busticket ist gerade gesperrt. Bitte melde dich beim Team.",
  },
} as const;
