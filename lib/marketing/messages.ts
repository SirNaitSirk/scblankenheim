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
      year ? `${year} in Belgien` : "In Belgien",
    /** Page title of the landing page. */
    pageTitle: (year: number | null) =>
      year ? `FCG Blankenheim Summercamp ${year}` : "FCG Blankenheim Summercamp",
  },
  nav: {
    camp: "Camp",
    goodToKnow: "Gut zu wissen",
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
  /** Intro section with the facts card (`#camp`). */
  intro: {
    headingLead: "Eine Woche, die du",
    headingAccent: "nicht vergisst",
    lead: "Ein Camp voller Gemeinschaft, Abenteuer und Glaube. Zusammen mit Jugendlichen aus der ganzen Region erlebst du eine unvergessliche Woche voller Spaß, echter Begegnungen und Zeit mit Gott. Wir freuen uns auf dich und deine Gruppe.",
    when: { label: "Wann", fallback: "Termin folgt", note: "Eine Woche in den Ferien" },
    where: { label: "Wo", value: "Belgien", note: "Pannenhoeve Bivak, Groenestraat 76" },
    fee: { label: "Beitrag", note: "Übernachtung und Verpflegung inklusive" },
  },
  /** Program bento (three highlights). */
  program: {
    heading: "Glaube, Spaß und Gemeinschaft",
    worship: {
      kicker: "Worship Sessions",
      title: "Gemeinsam Gott begegnen",
      text: "Abende voller Musik, Anbetung und Momente, die bleiben. Zeit, um durchzuatmen und Gott ganz neu zu erleben.",
    },
    inputs: {
      title: "Inspirierende Inputs",
      text: "Ehrliche Predigten und interaktive Workshops, die zum Nachdenken anregen und dich weiterbringen.",
    },
    sport: {
      title: "Sport, Lagerfeuer und Geländespiel bei Nacht",
      text: "Turniere am Tag, Lagerfeuer am Abend und ein Geländespiel, das dich die Komfortzone verlassen lässt.",
    },
  },
  footer: {
    camp: "Camp",
    goodToKnow: "Gut zu wissen",
    schoolRelease: "Schulbefreiung",
    register: "Anmelden",
    packingList: "Packliste",
  },
  community: {
    eyebrow: "Wer dabei ist",
    heading: "Jugenden aus der ganzen Region",
    text: "Beim Summercamp treffen sich Jugendgruppen aus mehreren Städten. Neue Leute, echte Gemeinschaft, eine gemeinsame Woche.",
    groups: ["Blankenheim", "Euskirchen", "C3", "Kall", "Lüdenscheid", "Ludwigshafen"],
  },
  /** Alt texts of the camp photos, keys match `CAMP_PHOTOS` (specs/027-camp-photos). */
  photos: {
    worship: "Jugendlicher von hinten mit erhobenen Händen beim Lobpreis in der Scheune",
    inputs: "Gemütlicher Gebetsraum mit Sofas und einer Girlande mit einem Bibelvers",
    sport: "Volleyball fliegt über das Netz vor einem großen Wolkenhimmel",
    teamwork: "Jugendliche stehen Arm in Arm im Kreis am Volleyballnetz",
    beach: "Zwei Jugendliche von hinten am Strand mit Blick aufs Meer",
    campfire: "Lagerfeuer bei Nacht, Jugendliche sitzen im Kreis darum",
  },
  /** Campfire band right before the registration (specs/028-community-section). */
  closing: {
    heading: "Ein Kreis ums Feuer. Und du gehörst dazu.",
    questions: "Bei Fragen schreib uns",
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
      text: "Du bezahlst sicher online, direkt nach der Anmeldung oder später über den persönlichen Link aus deiner Bestätigungsmail. Im Teilnahmebeitrag sind Übernachtung und Verpflegung für die ganze Woche enthalten.",
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
    /** Link preview text (WhatsApp, Signal, search results), written for participants. */
    description:
      "Eine unvergessliche Woche voller Gemeinschaft, Abenteuer und Glaube. Melde dich jetzt für das FCG Blankenheim Summercamp an.",
  },
} as const;

/** Price and payment line under the registration heading (research R6). */
export function priceLine(basePrice: number): string {
  return `${formatCurrency(basePrice)} inklusive Übernachtung und Verpflegung · Bezahlen per Karte, PayPal, SEPA Lastschrift und mehr`;
}
