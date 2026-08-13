import "server-only";

import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";
import type {
  AdminUser,
  AppSettings,
  Camp,
  CampFormField,
  CampInput,
  FieldInput,
  FinanceSummary,
  LogEntry,
  LogLevel,
  PaymentStatus,
  PriceTier,
  Registration,
  RegistrationStatus,
  UserRole,
} from "./types";

/**
 * Real Supabase data-access layer (replaces the former mock-data.ts).
 *
 * All reads use the service-role client and run only inside the Clerk-protected
 * admin surface (Server Components). Function signatures match the former mock
 * getters, so consumers are unchanged. Row → domain mapping helpers live here.
 */

// --- helpers ---------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapCamp(
  row: Tables<"camps">,
  currentCampId: string | null,
  registrationCount: number,
  formFieldCount: number,
): Camp {
  return {
    id: row.id,
    name: row.name,
    location: row.location ?? "",
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    capacity: row.capacity ?? 0,
    registrations: registrationCount,
    basePrice: row.base_price,
    isCurrent: row.id === currentCampId,
    registrationOpen: row.registration_open,
    formFieldCount,
    roomCapacity: row.room_capacity,
    registrationOpensAt: row.registration_opens_at,
    registrationClosesAt: row.registration_closes_at,
    paymentDueDate: row.payment_due_date,
    tagline: row.tagline,
    description: row.description,
    config: asRecord(row.config),
  };
}

function mapRegistration(row: Tables<"registrations">): Registration {
  return {
    id: row.reference,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    email: row.email ?? "",
    city: row.city ?? "",
    campId: row.camp_id,
    priceTierId: row.price_tier_id ?? "",
    registeredAt: row.registered_at,
    status: row.status as RegistrationStatus,
    payment: row.payment_status as PaymentStatus,
    amountDue: row.amount_due,
    amountPaid: row.amount_paid,
    deleted: row.deleted,
    formData: asRecord(row.form_data),
  };
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

function mapAdminUser(
  profile: Tables<"profiles">,
  role: UserRole,
): AdminUser {
  return {
    id: profile.id,
    name: profile.name ?? "",
    email: profile.email ?? "",
    role,
    permissions: profile.permissions,
    visibleTabs: profile.visible_tabs,
    status: profile.status === "invited" ? "invited" : "active",
    lastActiveAt: profile.last_active_at,
  };
}

async function getCurrentCampId(): Promise<string | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("camp_settings")
    .select("current_camp_id")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return data?.current_camp_id ?? null;
}

// Build all camps with derived counts (non-deleted registrations + form fields).
async function buildCamps(): Promise<Camp[]> {
  const supabase = getServiceClient();

  const [campsRes, currentCampId, regsRes, fieldsRes] = await Promise.all([
    supabase.from("camps").select("*").order("start_date", { ascending: false }),
    getCurrentCampId(),
    supabase.from("registrations").select("camp_id, deleted"),
    supabase.from("camp_form_fields").select("camp_id"),
  ]);

  if (campsRes.error) throw campsRes.error;
  if (regsRes.error) throw regsRes.error;
  if (fieldsRes.error) throw fieldsRes.error;

  const regCount = new Map<string, number>();
  for (const r of regsRes.data ?? []) {
    if (r.deleted) continue;
    regCount.set(r.camp_id, (regCount.get(r.camp_id) ?? 0) + 1);
  }

  const fieldCount = new Map<string, number>();
  for (const f of fieldsRes.data ?? []) {
    fieldCount.set(f.camp_id, (fieldCount.get(f.camp_id) ?? 0) + 1);
  }

  return (campsRes.data ?? []).map((camp) =>
    mapCamp(camp, currentCampId, regCount.get(camp.id) ?? 0, fieldCount.get(camp.id) ?? 0),
  );
}

// --- getters (mock-compatible signatures) ----------------------------------

export async function getCamps(): Promise<Camp[]> {
  return buildCamps();
}

export async function getCurrentCamp(): Promise<Camp> {
  const camps = await buildCamps();
  return camps.find((c) => c.isCurrent) ?? camps[0];
}

export async function getCampById(campId: string): Promise<Camp | null> {
  const camps = await buildCamps();
  return camps.find((c) => c.id === campId) ?? null;
}

export async function getRegistrations(): Promise<Registration[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .order("registered_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRegistration);
}

export async function getCampFormFields(campId: string): Promise<CampFormField[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("camp_form_fields")
    .select("*")
    .eq("camp_id", campId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapFormField);
}

export async function getPriceTiers(): Promise<PriceTier[]> {
  const supabase = getServiceClient();
  const currentCampId = await getCurrentCampId();
  if (!currentCampId) return [];

  const [tiersRes, regsRes] = await Promise.all([
    supabase
      .from("price_tiers")
      .select("*")
      .eq("camp_id", currentCampId)
      .order("price", { ascending: false }),
    supabase
      .from("registrations")
      .select("price_tier_id, deleted")
      .eq("camp_id", currentCampId),
  ]);

  if (tiersRes.error) throw tiersRes.error;
  if (regsRes.error) throw regsRes.error;

  const tierCount = new Map<string, number>();
  for (const r of regsRes.data ?? []) {
    if (r.deleted || !r.price_tier_id) continue;
    tierCount.set(r.price_tier_id, (tierCount.get(r.price_tier_id) ?? 0) + 1);
  }

  return (tiersRes.data ?? []).map((tier) => ({
    id: tier.id,
    name: tier.name,
    price: tier.price,
    hidden: tier.hidden,
    count: tierCount.get(tier.id) ?? 0,
    validFrom: tier.valid_from,
    validUntil: tier.valid_until,
  }));
}

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("camp_settings")
    .select("settings")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return asRecord(data?.settings);
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const supabase = getServiceClient();
  const currentCampId = await getCurrentCampId();

  const campsPromise = buildCamps();
  const regsPromise = currentCampId
    ? supabase
        .from("registrations")
        .select("amount_due, amount_paid, payment_status, deleted")
        .eq("camp_id", currentCampId)
    : Promise.resolve({ data: [], error: null } as const);

  const [camps, regsRes] = await Promise.all([campsPromise, regsPromise]);
  if (regsRes.error) throw regsRes.error;

  const active = (regsRes.data ?? []).filter((r) => !r.deleted);
  const expected = active.reduce((sum, r) => sum + r.amount_due, 0);
  const collected = active.reduce((sum, r) => sum + r.amount_paid, 0);
  const currentCamp = camps.find((c) => c.id === currentCampId) ?? camps[0];

  return {
    basePrice: currentCamp?.basePrice ?? 0,
    expected,
    collected,
    outstanding: expected - collected,
    paidCount: active.filter((r) => r.payment_status === "paid").length,
    totalCount: active.length,
  };
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const supabase = getServiceClient();
  const [profilesRes, rolesRes] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (rolesRes.error) throw rolesRes.error;

  const roleByUser = new Map<string, UserRole>();
  for (const r of rolesRes.data ?? []) {
    roleByUser.set(r.user_id, r.role as UserRole);
  }

  return (profilesRes.data ?? []).map((profile) =>
    mapAdminUser(profile, roleByUser.get(profile.id) ?? "admin"),
  );
}

export async function getCurrentProfile(): Promise<AdminUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = getServiceClient();
  const [profileRes, roleRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (roleRes.error) throw roleRes.error;
  if (!profileRes.data) return null;

  const role = (roleRes.data?.role as UserRole) ?? "admin";
  return mapAdminUser(profileRes.data, role);
}

// --- writes (service-role; callers must have passed requireAdmin) -----------

/** Domain (camelCase) camp payload → `camps` row (snake_case). */
function mapCampInputToRow(input: CampInput) {
  return {
    name: input.name,
    location: input.location,
    start_date: input.startDate,
    end_date: input.endDate,
    capacity: input.capacity,
    base_price: input.basePrice,
    room_capacity: input.roomCapacity,
    registration_open: input.registrationOpen,
    registration_opens_at: input.registrationOpensAt,
    registration_closes_at: input.registrationClosesAt,
    payment_due_date: input.paymentDueDate,
    tagline: input.tagline,
    description: input.description,
  };
}

export async function createCamp(input: CampInput): Promise<string> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("camps")
    .insert(mapCampInputToRow(input))
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateCamp(id: string, input: CampInput): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("camps")
    .update(mapCampInputToRow(input))
    .eq("id", id);
  if (error) throw error;
}

// FK cascades remove this camp's form fields, price tiers and registrations.
// If it was the current camp, `camp_settings.current_camp_id` becomes null
// (`on delete set null`).
export async function deleteCamp(id: string): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase.from("camps").delete().eq("id", id);
  if (error) throw error;
}

// Writes the current-camp pointer on the `camp_settings` singleton (id = true).
// Upsert because the row may not exist yet on a fresh database.
export async function setCurrentCamp(campId: string): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("camp_settings")
    .upsert(
      {
        id: true,
        current_camp_id: campId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  if (error) throw error;
}

// --- form fields (camp_form_fields; service-role writes) --------------------

/** Postgres unique-violation (e.g. duplicate `(camp_id, key)`). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

/** Domain (camelCase) form-field payload → `camp_form_fields` row (snake_case). */
function mapFieldInputToRow(input: FieldInput) {
  return {
    key: input.key,
    label: input.label,
    field_type: input.fieldType,
    required: input.required,
    options: input.options,
    config: input.config,
  };
}

// Appends the new field last by giving it the next `sort_order`. Two admins
// racing could collide on order, not on data — a later reorder resolves it.
export async function createFormField(
  campId: string,
  input: FieldInput,
): Promise<string> {
  const supabase = getServiceClient();
  const { data: last, error: orderError } = await supabase
    .from("camp_form_fields")
    .select("sort_order")
    .eq("camp_id", campId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderError) throw orderError;

  const nextOrder = (last?.sort_order ?? -1) + 1;
  const { data, error } = await supabase
    .from("camp_form_fields")
    .insert({ camp_id: campId, sort_order: nextOrder, ...mapFieldInputToRow(input) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateFormField(
  id: string,
  input: FieldInput,
): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("camp_form_fields")
    .update(mapFieldInputToRow(input))
    .eq("id", id);
  if (error) throw error;
}

export async function deleteFormField(id: string): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase.from("camp_form_fields").delete().eq("id", id);
  if (error) throw error;
}

// Persists `sort_order` = array index. Guards that every id belongs to `campId`
// before writing, so a tampered payload cannot reorder another camp's fields.
export async function reorderFormFields(
  campId: string,
  orderedIds: string[],
): Promise<void> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("camp_form_fields")
    .select("id")
    .eq("camp_id", campId);
  if (error) throw error;

  const owned = new Set((data ?? []).map((row) => row.id));
  if (orderedIds.length !== owned.size || !orderedIds.every((id) => owned.has(id))) {
    throw new Error("reorder payload does not match this camp's fields");
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("camp_form_fields")
        .update({ sort_order: index })
        .eq("id", id)
        .then(({ error: updateError }) => {
          if (updateError) throw updateError;
        }),
    ),
  );
}

// Best-effort activity log. A logging failure must never fail the mutation.
export async function writeLog(entry: {
  level?: LogLevel;
  actor?: string | null;
  action: string;
  message?: string | null;
}): Promise<void> {
  try {
    const supabase = getServiceClient();
    await supabase.from("logs").insert({
      level: entry.level ?? "info",
      actor: entry.actor ?? null,
      action: entry.action,
      message: entry.message ?? null,
    });
  } catch {
    // Swallow — logging is non-critical.
  }
}

export async function getLogs(): Promise<LogEntry[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((log) => ({
    id: log.id,
    level: log.level as LogEntry["level"],
    actor: log.actor ?? "",
    action: log.action ?? "",
    message: log.message ?? "",
    createdAt: log.created_at,
  }));
}
