import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { isGender } from "./room-planning";
import type { CampFormField, PlanningPersonBase } from "./types";

/**
 * Reads shared by room planning (specs/008-room-planning) and tent circles
 * (specs/011-tent-circles). Service role only; callers are guarded pages and
 * Server Actions.
 */

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Active registrations (neither deleted nor cancelled) of a camp. */
export async function loadActiveRegistrations(campId: string): Promise<PlanningPersonBase[]> {
  const { data, error } = await getServiceClient()
    .from("registrations")
    .select("id, first_name, last_name, gender, form_data")
    .eq("camp_id", campId)
    .eq("deleted", false)
    .neq("status", "cancelled");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    gender: isGender(row.gender) ? row.gender : null,
    formData: asRecord(row.form_data),
  }));
}

/** Name, start date and question fields (for filters) of a camp. */
export async function loadPlanningCamp(
  campId: string,
): Promise<{ name: string; startDate: string | null; fields: CampFormField[] }> {
  const supabase = getServiceClient();
  const [campRes, fieldsRes] = await Promise.all([
    supabase.from("camps").select("name, start_date").eq("id", campId).maybeSingle(),
    supabase.from("camp_form_fields").select("*").eq("camp_id", campId).order("sort_order"),
  ]);
  if (campRes.error) throw campRes.error;
  if (fieldsRes.error) throw fieldsRes.error;
  return {
    name: campRes.data?.name ?? "",
    startDate: campRes.data?.start_date ?? null,
    fields: (fieldsRes.data ?? [])
      .filter((row) => row.field_type !== "step")
      .map((row) => ({
        id: row.id,
        campId: row.camp_id,
        key: row.key,
        label: row.label,
        fieldType: row.field_type,
        required: row.required,
        options: row.options,
        sortOrder: row.sort_order,
        config: asRecord(row.config),
      })),
  };
}
