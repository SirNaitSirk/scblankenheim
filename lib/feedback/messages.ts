import { FEEDBACK_TEXT_MAX } from "./limits";

/**
 * German copy of the public feedback page (specs/038-camp-feedback). The only
 * place this page's user facing wording lives. No dash punctuation, no
 * hyphenated words.
 */
export const feedbackMessages = {
  metaTitle: "Feedback · FCG Blankenheim Summercamp",
  eyebrow: "Feedback",
  title: (campName: string) => `Wie war das ${campName}?`,
  intro: "Dein Feedback hilft uns, das nächste Camp noch besser zu machen.",
  anonymous:
    "Deine Antworten sind anonym. Wir speichern weder deinen Namen noch deine Mail, noch wann du geantwortet hast. Bitte nenne in deinen Texten auch keine Namen.",
  required: "Pflicht",
  optional: "freiwillig",
  ratingLow: "gar nicht gut",
  ratingHigh: "sehr gut",
  ratingValue: (value: number) => `${value} von 5`,
  multiHint: "Mehrere Antworten möglich",
  commentLabel: "Magst du etwas dazu schreiben?",
  counter: (length: number) => `${length} von ${FEEDBACK_TEXT_MAX} Zeichen`,
  submit: "Feedback absenden",
  sending: "Wird gesendet",
  trapLabel: "Dieses Feld bitte leer lassen",
  thanks: {
    title: "Danke für dein Feedback!",
    body: "Deine Antworten sind angekommen. Wir lesen alles und nehmen es mit in die Planung für das nächste Camp.",
  },
  already: {
    title: "Schon erledigt",
    body: "Von diesem Gerät aus wurde schon Feedback gegeben. Danke dir!",
  },
  unavailable: {
    title: "Gerade kein Feedback möglich",
    body: "Das Feedback ist im Moment geschlossen oder dieser Link gilt nicht mehr. Frag am besten im Team nach dem aktuellen QR Code.",
  },
  expired: "Die Seite war zu lange offen. Bitte lade sie neu und schicke dein Feedback noch einmal ab.",
  throttled: "Gerade kommen sehr viele Antworten an. Bitte versuch es in ein paar Minuten noch einmal.",
  failed: "Das hat leider nicht geklappt. Bitte versuch es gleich noch einmal.",
  questionsChanged: "Die Fragen wurden gerade geändert. Bitte schau sie dir noch einmal an.",
  formErrors: "Bitte beantworte die markierten Fragen.",
  errors: {
    required: "Bitte beantworte diese Frage.",
    rating: "Bitte wähle eine Zahl von 1 bis 5.",
    option: "Bitte wähle eine der Antworten.",
    textTooLong: `Bitte höchstens ${FEEDBACK_TEXT_MAX} Zeichen.`,
    commentTooLong: `Bitte schreib im Kommentar höchstens ${FEEDBACK_TEXT_MAX} Zeichen.`,
    empty: "Bitte beantworte mindestens eine Frage.",
  },
} as const;

/** CSV header of the comment column next to a question (US6). */
export function feedbackCsvCommentHeader(label: string): string {
  return `${label} · Kommentar`;
}
