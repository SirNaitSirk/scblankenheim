import { getPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/lib/database.types";
import type { CampFormField } from "@/lib/admin/types";
import type { RegistrationWindow } from "@/lib/register/registration-state";

/**
 * Public (anon) read layer for the landing page. Uses the anon Supabase client
 * — RLS grants anon `select` on `camp_settings`, `camps`, `camp_form_fields`
 * (see 0001_init_schema.sql). No secrets, no service-role: safe on the public
 * route. Failures degrade to `null` so the landing page never crashes.
 */

/**
 * Lightweight view of the current camp for the registration section, safe for
 * the public page. Carries the window settings so it can be passed straight to
 * `getRegistrationState` (lib/register/registration-state.ts).
 */
export type LandingCamp = RegistrationWindow & {
  id: string;
  name: string;
  startDate: string | null;
  fields: CampFormField[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapFormField(row: Tables<"camp_form_fields">): CampFormField {
  return {
    id: row.id,
    campId: row.camp_id,
    key: row.key,
    label: row.label,
    fieldType: row.field_type,
    required: row.required,
    options: row.options,
    sortOrder: row.sort_order,
    config: asRecord(row.config),
  };
}

/**
 * Reads the current camp (from `camp_settings.current_camp_id`) plus its form
 * fields. Returns `null` when there is no current camp or on any query error.
 */
export async function getLandingCamp(): Promise<LandingCamp | null> {
  const supabase = getPublicClient();

  const { data: settings, error: settingsError } = await supabase
    .from("camp_settings")
    .select("current_camp_id")
    .maybeSingle();

  const currentCampId = settings?.current_camp_id ?? null;
  if (settingsError || !currentCampId) return null;

  const [campRes, fieldsRes] = await Promise.all([
    supabase
      .from("camps")
      .select(
        "name, start_date, registration_open, registration_opens_at, registration_closes_at, capacity",
      )
      .eq("id", currentCampId)
      .maybeSingle(),
    supabase
      .from("camp_form_fields")
      .select("*")
      .eq("camp_id", currentCampId)
      .order("sort_order", { ascending: true }),
  ]);

  const camp = campRes.data;
  if (campRes.error || !camp) return null;

  return {
    id: currentCampId,
    name: camp.name,
    startDate: camp.start_date,
    registrationOpen: camp.registration_open,
    opensAt: camp.registration_opens_at,
    closesAt: camp.registration_closes_at,
    capacity: camp.capacity,
    fields: (fieldsRes.data ?? []).map(mapFormField),
  };
}

/**
 * The instant the countdown targets: the opening time only. The camp start date
 * is deliberately not a fallback, because reaching it would open registration
 * automatically on the first camp day (research R1).
 */
export function getCountdownTarget(camp: LandingCamp): Date | null {
  if (!camp.opensAt) return null;
  const date = new Date(camp.opensAt);
  return Number.isNaN(date.getTime()) ? null : date;
}
