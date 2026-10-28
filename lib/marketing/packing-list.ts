import { formatGermanDate } from "@/lib/time/berlin";

/**
 * The packing list (specs/010-packing-list). One code defined list for every
 * camp: the `/packzettel` page and the landing page teaser both read from here,
 * so they can never drift apart. Item ids are stable keys for the ticks a
 * visitor saves on their device; change a label freely, change an id only for
 * a genuinely new item.
 */

export type PackingItem = {
  id: string;
  label: string;
  note?: string;
  /** Shown as a chip in the landing page teaser. */
  featured?: boolean;
};

export type PackingSection = {
  id: string;
  title: string;
  items: PackingItem[];
};

export const packingSections: PackingSection[] = [
  {
    id: "toiletries",
    title: "Waschzeug",
    items: [
      { id: "towel", label: "Handtuch", featured: true },
      { id: "toothbrush", label: "Zahnbürste", featured: true },
      { id: "toothpaste", label: "Zahnpasta", featured: true },
      { id: "comb", label: "Kamm oder Bürste" },
      { id: "shower-gel", label: "Duschzeug" },
    ],
  },
  {
    id: "essentials",
    title: "Das Wichtigste",
    items: [
      { id: "bible", label: "Die Bibel", featured: true },
      { id: "notebook", label: "Notizblock und Stift" },
    ],
  },
  {
    id: "sleeping",
    title: "Schlafsachen",
    items: [
      { id: "sleeping-bag", label: "Schlafsack", featured: true },
      { id: "pillow", label: "Kissen", featured: true },
      { id: "bed-sheet", label: "Laken", note: "für alle, die im Haus schlafen" },
      {
        id: "sleeping-mat",
        label: "Isomatte",
        note: "für alle, die im Zelt schlafen",
        featured: true,
      },
    ],
  },
  {
    id: "dishes",
    title: "Geschirr und Besteck",
    items: [
      { id: "plates", label: "Suppenteller und flacher Teller" },
      { id: "cutlery", label: "Suppenlöffel, Teelöffel und Gabel" },
      { id: "cup-glass", label: "Tasse und Glas" },
    ],
  },
  {
    id: "clothing",
    title: "Klamotten",
    items: [
      { id: "sportswear", label: "Etwas Sportliches", note: "empfohlen", featured: true },
      { id: "warm-clothes", label: "Warme Sachen", featured: true },
      { id: "swimwear", label: "Schwimmsachen" },
      { id: "rain-shoes", label: "Regenfeste Schuhe", featured: true },
      { id: "loose-clothes", label: "Lockere Kleidung", featured: true },
    ],
  },
  {
    id: "other",
    title: "Sonstiges",
    items: [
      { id: "sunscreen", label: "Sonnenmilch" },
      { id: "headwear", label: "Kopfbedeckung" },
      { id: "sunglasses", label: "Sonnenbrille" },
      { id: "board-games", label: "Gesellschaftsspiele" },
      { id: "pocket-money", label: "Taschengeld" },
    ],
  },
];

/** Teaser picks in list order. */
export function featuredPackingItems(): PackingItem[] {
  return packingSections.flatMap((section) => section.items.filter((item) => item.featured));
}

export function packingItemIds(): string[] {
  return packingSections.flatMap((section) => section.items.map((item) => item.id));
}

export function packingItemCount(): number {
  return packingItemIds().length;
}

/** `localStorage` key for the ticks; bump the version only if the format changes. */
export const PACKING_STORAGE_KEY = "packing-list:v1";

/**
 * Saved ticks from `localStorage`. Keeps only ids that still exist, so removed
 * items drop out; anything unreadable yields an empty selection.
 */
export function parseCheckedItems(raw: string | null): Set<string> {
  if (!raw) return new Set();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Set();
  }
  if (!Array.isArray(parsed)) return new Set();
  const known = new Set(packingItemIds());
  return new Set(
    parsed.filter((value): value is string => typeof value === "string" && known.has(value)),
  );
}

/** Camp period for the page header, or `null` without a start date. */
export function formatCampDates(startDate: string | null, endDate: string | null): string | null {
  if (!startDate) return null;
  const start = formatGermanDate(startDate);
  return endDate ? `${start} bis ${formatGermanDate(endDate)}` : `ab ${start}`;
}

export const packingListMessages = {
  meta: {
    title: "Packliste · FCG Blankenheim Summercamp",
    description:
      "Alles, was du fürs FCG Blankenheim Summercamp einpacken solltest: Schlafsachen, Waschzeug, Geschirr, Klamotten und mehr.",
  },
  home: "FCG Blankenheim Summercamp",
  title: "Packliste",
  intro: "Schau vor der Abfahrt nochmal rein, damit du nichts vergisst.",
  progress: (checked: number, total: number) => `${checked} von ${total} eingepackt`,
  complete: "Alles eingepackt",
  reset: "Zurücksetzen",
  print: "Drucken",
  closingTitle: "Noch nicht angemeldet?",
  register: "Jetzt anmelden",
  backHome: "Zur Startseite",
} as const;
