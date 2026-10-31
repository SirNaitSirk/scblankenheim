import { formatCurrency } from "@/lib/format";

/**
 * German copy of the landing page structure (specs/024-landing-structure): nav,
 * footer, the youth group band, the „Gut zu wissen“ blocks and the share image.
 * Isomorphic on purpose, imported by server and client components.
 * Strings follow the writing rules: no dash punctuation, no hyphenated words.
 */

/** Payment methods shown in the price line and the payment block. */
export const paymentMethods = [
  "Karte",
  "Apple Pay",
  "Google Pay",
  "PayPal",
  "SEPA Lastschrift",
  "Klarna",
] as const;

export const marketingMessages = {
  brand: {
    short: "FCG Summercamp",
    full: "FCG Blankenheim Summercamp",
    /** Footer line; the year comes from the current camp's start date. */
    season: (year: number | null) =>
      year ? `Sommer ${year} in Belgien` : "Im Sommer in Belgien",
    /** Vertical tag in the hero. */
    heroTag: (year: number | null) => (year ? `Sommer ${year} · Belgien` : "Sommer · Belgien"),
    /** Page title of the landing page. */
    pageTitle: (year: number | null) =>
      year ? `FCG Blankenheim Summercamp · Sommer ${year}` : "FCG Blankenheim Summercamp",
  },
  nav: {
    camp: "Camp",
    goodToKnow: "Gut zu wissen",
    schoolRelease: "Schulbefreiung",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
    home: "Zum Seitenanfang",
  },
  /** Hero with the recap video (specs/026-hero-video). */
  hero: {
    eyebrow: "FCG Blankenheim Summercamp",
    headlineLead: "Strand, Scheune,",
    headlineAccent: "Gemeinschaft",
    lead: "Eine Woche Gemeinschaft, Abenteuer und Glaube an der belgischen Küste. Sichere dir jetzt deinen Platz beim Summercamp.",
    more: "Mehr erfahren",
    scrollCue: "Weiter zum Camp",
    posterAlt:
      "Szenen vom letzten Summercamp: Spiele vor den Bussen, Volleyball, Saltos am Strand und in den Dünen, Worship und Party in der Scheune.",
    pauseVideo: "Video anhalten",
    playVideo: "Video abspielen",
  },
  footer: {
    camp: "Camp",
    goodToKnow: "Gut zu wissen",
    schoolRelease: "Schulbefreiung",
    register: "Anmelden",
    packingList: "Packliste",
  },
  community: {
    heading: "Jugenden aus der ganzen Region",
    text: "Beim Summercamp treffen sich Jugendgruppen aus mehreren Städten. Neue Leute, echte Gemeinschaft, eine gemeinsame Woche.",
    photoAlt: "Jugendliche gemeinsam draußen im Sonnenlicht",
    groups: ["Blankenheim", "Euskirchen", "C3", "Kall", "Lüdenscheid", "Ludwigshafen"],
  },
  goodToKnow: {
    heading: "Gut zu wissen",
    intro: "Anreise, Bezahlen, Packliste und alles, was du vor dem Camp brauchst.",
    arrival: {
      heading: "So kommst du ins Camp",
      busDepartureLabel: "Busabfahrt",
      busDepartureValue: "16 Uhr, FCG Blankenheim, Bahnhofstraße 18",
      campSiteLabel: "Campgelände",
      campSiteValue: "Pannenhoeve Bivak, Groenestraat 76, 8691 Belgien",
      carpoolLabel: "Fahrgemeinschaft",
      carpoolValue: "Gemeinsam anreisen? Bei der Anmeldung möglich.",
      mapsLink: "Campgelände in Google Maps",
      /** Full camp site address for the maps search. */
      mapsQuery: "Pannenhoeve Bivak, Groenestraat 76, 8691 Belgium",
    },
    payment: {
      heading: "Sicher bezahlen",
      text: "Die Bezahlung läuft sicher online direkt bei der Anmeldung. Im Teilnahmebeitrag sind Übernachtung und Verpflegung für die ganze Woche enthalten.",
    },
    packing: {
      heading: "Was du mitbringst",
      text: "Das Wichtigste auf einen Blick. Die vollständige Liste kannst du abhaken und ausdrucken.",
      link: "Zur vollständigen Packliste",
    },
  },
  share: {
    alt: "FCG Blankenheim Summercamp: Name und Termin des Camps",
    fallbackName: "FCG Blankenheim Summercamp",
    eyebrow: "Summercamp",
  },
} as const;

/** Price and payment line under the registration heading (research R6). */
export function priceLine(basePrice: number): string {
  return `${formatCurrency(basePrice)} inklusive Übernachtung und Verpflegung · Bezahlen per Karte, PayPal, SEPA Lastschrift und mehr`;
}
