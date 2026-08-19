import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import type { CampFormField, FieldCapacity } from "@/lib/admin/types";

/**
 * Server-only seat counter for capacity-limited form options. Kept out of the
 * anon `getLandingCamp` path: counting registrations needs the service-role
 * client, and only the derived integer counts (never rows) are returned to the
 * caller. The register service re-checks on submit — this is display only.
 */

/** Remaining seats for one capacity-limited field, keyed by field `key`. */
export type FieldAvailability = {
  option: string;
  limit: number;
  remaining: number;
};

/** Reads a field's `config.capacity` defensively, or null when not configured. */
export function readFieldCapacity(field: CampFormField): FieldCapacity | null {
  const capacity = field.config.capacity;
  if (capacity && typeof capacity === "object" && !Array.isArray(capacity)) {
    const record = capacity as Record<string, unknown>;
    if (
      typeof record.option === "string" &&
      record.option !== "" &&
      typeof record.limit === "number" &&
      Number.isInteger(record.limit) &&
      record.limit >= 1
    ) {
      return { option: record.option, limit: record.limit };
    }
  }
  return null;
}

/**
 * For each capacity-limited field, counts non-deleted registrations of the camp
 * holding the limited option and returns the remaining seats (clamped at 0).
 * Registrations are tallied in JS to avoid brittle `form_data->>key` filters.
 */
export async function getCampAvailability(
  campId: string,
  fields: CampFormField[],
): Promise<Record<string, FieldAvailability>> {
  const limited = fields
    .map((field) => ({ field, capacity: readFieldCapacity(field) }))
    .filter(
      (entry): entry is { field: CampFormField; capacity: FieldCapacity } =>
        entry.capacity !== null,
    );

  if (limited.length === 0) return {};

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("form_data")
    .eq("camp_id", campId)
    .eq("deleted", false);

  if (error || !data) return {};

  const rows = data as unknown as {
    form_data: Record<string, unknown> | null;
  }[];
  const result: Record<string, FieldAvailability> = {};

  for (const { field, capacity } of limited) {
    const taken = rows.reduce((count, row) => {
      const value = row.form_data?.[field.key];
      return value === capacity.option ? count + 1 : count;
    }, 0);
    result[field.key] = {
      option: capacity.option,
      limit: capacity.limit,
      remaining: Math.max(0, capacity.limit - taken),
    };
  }

  return result;
}
