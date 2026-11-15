/**
 * Letterhead of the Freie Christengemeinde Blankenheim for the school release
 * letter (specs/042-church-release-letter, research R4, contracts/letter-layout.md).
 * The only place these values live. They follow the church's own letter
 * (`specs/042-church-release-letter/template-2026.pdf`) in wording and format,
 * which differs slightly from the legal notice in `lib/legal/operator.ts`
 * (for example "Bahnhofstr. 18"). Spans and phone numbers are written without
 * dashes.
 */

export const letterhead = {
  /** Small line above the recipient, as in the template. */
  senderLine: "Freie Christengemeinde Blankenheim,  Bahnhofstr. 18 , 53945 Blankenheim",
  place: "Blankenheim",
  phone: "+49(0)2449 7945",
  /** Line under the closing, before the stamp. */
  organization: "FCG Blankenheim eV",
  /** Footer, four columns from left to right. */
  footer: [
    ["Freie Christengemeinde", "Blankenheim e.V.", "Bahnhofstr. 18", "53945 Blankenheim"],
    [
      "Büro Öffnungszeiten",
      "Mo. bis Fr. 9 bis 13 Uhr",
      "Tel.: 0 24 49 79 45",
      "Fax: 0 24 49 20 70 50",
      "olga.bormann@fcg-blankenheim.de",
    ],
    ["Gemeindeleiter:", "Johannes Neufeld", "Mobil: 0177 7994051"],
    [
      "Bankverbindung",
      "VR Bank Nordeifel eG",
      "BIC: GENODED1SLE",
      "IBAN: DE77 3706 9720 1002 2080 12",
      "Eingetr. AG Düren: VR30551",
    ],
  ],
} as const;
