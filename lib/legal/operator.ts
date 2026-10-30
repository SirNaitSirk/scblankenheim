/**
 * Operator data of the website, the only place that holds them (specs/025-legal-pages,
 * research R3). `null` means not yet provided by the association and renders as a
 * marked gap on both legal pages. Fill every `null` before go live.
 */

export type LegalOperator = {
  associationName: string | null;
  street: string | null;
  postalCity: string | null;
  /** Board members entitled to represent the association. */
  board: string[] | null;
  registerCourt: string | null;
  registerNumber: string | null;
  email: string | null;
  phone: string | null;
  /** Person responsible for the content, with address if it differs. */
  contentResponsible: string | null;
  /** Optional: only shown when the association has appointed one. */
  dataProtectionOfficer: string | null;
  supervisoryAuthority: string | null;
  /** Server location of hosting and database as configured in the projects. */
  hostingRegion: string | null;
  /** Date of the current version, shown as „Stand“. */
  updatedAt: string;
};

export type OperatorField = Exclude<keyof LegalOperator, "updatedAt">;

export const legalOperator: LegalOperator = {
  associationName: "Freie Christengemeinde Blankenheim e. V.",
  street: "Bahnhofstraße 18",
  postalCity: "53945 Blankenheim",
  board: ["Olga Bormann"],
  registerCourt: "Amtsgericht Düren",
  registerNumber: "VR 30551",
  email: "olga.bormann@fcg-blankenheim.de",
  phone: "+49 2449 7945",
  contentResponsible: "Kristian Epp, Anschrift wie oben",
  dataProtectionOfficer: null,
  supervisoryAuthority:
    "Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein Westfalen",
  hostingRegion: "Stockholm, Schweden",
  updatedAt: "30. Oktober 2026",
};

/** German labels of the operator fields, used by the gap marker. */
export const operatorFieldLabels: Record<OperatorField, string> = {
  associationName: "Name des Vereins",
  street: "Straße und Hausnummer",
  postalCity: "Postleitzahl und Ort",
  board: "vertretungsberechtigter Vorstand",
  registerCourt: "Registergericht",
  registerNumber: "Registernummer",
  email: "Mailadresse",
  phone: "Telefonnummer",
  contentResponsible: "inhaltlich verantwortliche Person",
  dataProtectionOfficer: "Datenschutzbeauftragter",
  supervisoryAuthority: "zuständige Aufsichtsbehörde",
  hostingRegion: "Serverstandort",
};

/** Fields that may stay empty without blocking go live. */
const OPTIONAL_FIELDS: readonly OperatorField[] = ["dataProtectionOfficer"];

/** German labels of every missing required field; empty means ready for go live. */
export function missingOperatorFields(operator: LegalOperator): string[] {
  return (Object.keys(operatorFieldLabels) as OperatorField[])
    .filter((field) => !OPTIONAL_FIELDS.includes(field))
    .filter((field) => {
      const value = operator[field];
      return value === null || (Array.isArray(value) && value.length === 0);
    })
    .map((field) => operatorFieldLabels[field]);
}

export type AddressLine = { field: OperatorField; value: string | null };

/** Name, street and postal city as lines; gaps stay `null` for the marker. */
export function operatorAddressLines(operator: LegalOperator): AddressLine[] {
  return (["associationName", "street", "postalCity"] as const).map((field) => ({
    field,
    value: operator[field],
  }));
}
