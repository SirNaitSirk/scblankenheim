import type { CampFormField } from "./types";

export type SplitCampFields = {
  inputs: CampFormField[];
  toggles: CampFormField[];
};

/**
 * Separates checkbox fields (rendered as a compact toggle grid) from all other
 * camp fields. Both groups keep the configured order.
 */
export function splitCampFields(fields: CampFormField[]): SplitCampFields {
  const inputs: CampFormField[] = [];
  const toggles: CampFormField[] = [];
  for (const field of fields) {
    (field.fieldType === "checkbox" ? toggles : inputs).push(field);
  }
  return { inputs, toggles };
}
