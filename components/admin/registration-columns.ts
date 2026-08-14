import { de } from "@/lib/admin/messages";
import type { CampFormField } from "@/lib/admin/types";

/** Stable identifiers for the built-in (core) registrations-table columns. */
export type CoreColumnKey =
  | "name"
  | "contact"
  | "id"
  | "registeredAt"
  | "amount"
  | "payment"
  | "status";

export type ColumnKind = "core" | "field";

export type ColumnDef = {
  /** Core columns use their fixed key; field columns use `field:<fieldKey>`. */
  key: string;
  label: string;
  sortable: boolean;
  kind: ColumnKind;
  /** Reorderable but never hideable (the row's clickable anchor). */
  alwaysVisible?: boolean;
  /** Only set for `kind: "field"` — the camp form field this column renders. */
  field?: CampFormField;
};

/** Identity fields backed by dedicated columns — never surfaced as camp-field columns. */
export const CORE_FIELD_KEYS = new Set(["first_name", "last_name", "email"]);

/** Prefix that namespaces a camp-field column key away from the core keys. */
export const FIELD_COLUMN_PREFIX = "field:";

/**
 * The built-in columns in their fixed order. `name` is the always-visible anchor;
 * `name`, `registeredAt` and `amount` are sortable (unchanged from before).
 */
const CORE_COLUMNS: ColumnDef[] = [
  { key: "name", label: de.registrations.columns.name, sortable: true, kind: "core", alwaysVisible: true },
  { key: "contact", label: de.registrations.columns.contact, sortable: false, kind: "core" },
  { key: "id", label: de.registrations.columns.id, sortable: false, kind: "core" },
  { key: "registeredAt", label: de.registrations.columns.registeredAt, sortable: true, kind: "core" },
  { key: "amount", label: de.registrations.columns.amount, sortable: true, kind: "core" },
  { key: "payment", label: de.registrations.columns.payment, sortable: false, kind: "core" },
  { key: "status", label: de.registrations.columns.status, sortable: false, kind: "core" },
];

/** The camp fields that become their own columns (core-identity fields excluded). */
export function columnFields(formFields: CampFormField[]): CampFormField[] {
  return formFields
    .filter((f) => !CORE_FIELD_KEYS.has(f.key))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Full ordered column list for the current camp: the core columns followed by one
 * column per dynamic camp field. Single source of truth for the table, CSV export,
 * sort comparator, filter options and the "Spalten" dialog.
 */
export function buildColumns(formFields: CampFormField[]): ColumnDef[] {
  const fieldColumns: ColumnDef[] = columnFields(formFields).map((field) => ({
    key: `${FIELD_COLUMN_PREFIX}${field.key}`,
    label: field.label,
    sortable: true,
    kind: "field",
    field,
  }));
  return [...CORE_COLUMNS, ...fieldColumns];
}

/**
 * Displayed string for a camp-field answer. The one formatter shared by the cell,
 * the CSV export, the text-sort path and the filter so they never disagree.
 */
export function formatFieldValue(field: CampFormField, value: unknown): string {
  if (field.fieldType === "checkbox") {
    return value === true ? de.common.yes : de.common.no;
  }
  return value == null ? "" : String(value);
}
