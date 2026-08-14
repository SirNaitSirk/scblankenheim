import { getPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/lib/database.types";
import type { CampFormField } from "@/lib/admin/types";

/**
 * Public (anon) read layer for the landing page. Uses the anon Supabase client
 * — RLS grants anon `select` on `camp_settings`, `camps`, `camp_form_fields`
 * (see 0001_init_schema.sql). No secrets, no service-role: safe on the public
 * route. Failures degrade to `null` so the landing page never crashes.
 */

/** Lightweight, public-safe view of the current camp for the registration section. */
export type LandingCamp = {
  name: string;
  startDate: string | null;
  registrationOpen: boolean;
  registrationOpensAt: string | null;
  fields: CampFormField[];
};

/** Which registration UI the landing page shows for the current camp. */
export type RegistrationState = "open" | "countdown" | "closed";

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
        "name, start_date, registration_open, registration_opens_at",
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
    name: camp.name,
    startDate: camp.start_date,
    registrationOpen: camp.registration_open,
    registrationOpensAt: camp.registration_opens_at,
    fields: (fieldsRes.data ?? []).map(mapFormField),
  };
}

/**
 * State precedence:
 * - `registrationOpen` is the master switch → `open`.
 * - otherwise, if the opening moment (`registrationOpensAt`, falling back to
 *   `startDate`) parses to a future instant → `countdown`.
 * - otherwise → `closed`.
 */
export function getRegistrationState(camp: LandingCamp | null): RegistrationState {
  if (!camp) return "closed";
  if (camp.registrationOpen) return "open";

  const target = getCountdownTarget(camp);
  if (target && target.getTime() > Date.now()) return "countdown";

  return "closed";
}

/** The instant the countdown targets: `registrationOpensAt` else `startDate`. */
export function getCountdownTarget(camp: LandingCamp): Date | null {
  const raw = camp.registrationOpensAt ?? camp.startDate;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}
