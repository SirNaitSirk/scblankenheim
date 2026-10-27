import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { generateReference, writeLog } from "@/lib/admin/data";
import {
  getActiveRegistrationCount,
  readFieldCapacity,
} from "@/lib/marketing/availability";
import { findValidTier } from "@/lib/register/invitation";
import { questionFields } from "@/lib/register/steps";
import { registerMessages } from "@/lib/register/messages";
import {
  getRegistrationState,
  type RegistrationWindow,
} from "@/lib/register/registration-state";
import {
  isCoreKey,
  mergeFields,
  validateFields,
  type CoreKey,
  type FieldValue,
} from "@/lib/register/validation";
import type { Json } from "@/lib/database.types";
import type { CampFormField } from "@/lib/admin/types";

/**
 * Public registration service. All work runs on the server with the service
 * role client; the public route handler ([app/api/register]) is the only caller.
 * The server is the gate: it reloads the current camp, validates every field
 * again against `camp_form_fields` with the shared rules, enforces the open or
 * closed state, resolves the amount (base price or a hidden price tier via
 * invitation token), throttles abuse, and inserts through
 * `create_public_registration`, which enforces camp and option capacity
 * atomically. Validation in the browser is never trusted.
 */

// --- constants --------------------------------------------------------------

const THROTTLE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const THROTTLE_MAX_ATTEMPTS = 5; // per email OR ip within the window
const REFERENCE_ATTEMPTS = 5; // retries on the rare reference collision

// --- types ------------------------------------------------------------------

export type RegistrationPayload = {
  values: Record<string, FieldValue>;
  priceTierToken?: string;
  ip: string | null;
};

export type RegistrationResult =
  | { ok: true; reference: string }
  | { ok: false; reason: "closed" }
  | { ok: false; reason: "camp_full" }
  | { ok: false; reason: "throttled" }
  | { ok: false; reason: "invalid"; fieldErrors: Record<string, string> }
  | { ok: false; reason: "full"; fieldErrors: Record<string, string> }
  | { ok: false; reason: "error" };

type CurrentCamp = RegistrationWindow & {
  id: string;
  basePrice: number;
};

type OptionLimit = { key: string; option: string; limit: number };

type InsertOutcome =
  | { status: "ok"; reference: string }
  | { status: "camp_full" }
  | { status: "option_full"; keys: string[] };

type NewRegistration = {
  core: Record<CoreKey, string>;
  formData: Record<string, FieldValue>;
  amountDue: number;
  priceTierId: string | null;
};

// --- helpers ----------------------------------------------------------------

/** Current camp id, base price and registration window settings. */
async function loadCurrentCamp(): Promise<CurrentCamp | null> {
  const supabase = getServiceClient();

  const { data: settings } = await supabase
    .from("camp_settings")
    .select("current_camp_id")
    .maybeSingle();

  const currentCampId = settings?.current_camp_id ?? null;
  if (!currentCampId) return null;

  const { data: camp, error } = await supabase
    .from("camps")
    .select(
      "id, base_price, registration_open, registration_opens_at, registration_closes_at, capacity",
    )
    .eq("id", currentCampId)
    .maybeSingle();

  if (error || !camp) return null;

  return {
    id: camp.id,
    basePrice: camp.base_price,
    registrationOpen: camp.registration_open,
    opensAt: camp.registration_opens_at,
    closesAt: camp.registration_closes_at,
    capacity: camp.capacity,
  };
}

/** Camp's dynamic fields, ordered: the same set the public form renders. */
async function loadDynamicFields(campId: string): Promise<CampFormField[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("camp_form_fields")
    .select("*")
    .eq("camp_id", campId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    campId: row.camp_id,
    key: row.key,
    label: row.label,
    fieldType: row.field_type,
    required: row.required,
    options: row.options,
    sortOrder: row.sort_order,
    config:
      row.config && typeof row.config === "object" && !Array.isArray(row.config)
        ? (row.config as Record<string, unknown>)
        : {},
  }));
}

/**
 * Seat limits the submission actually claims: fields with a capacity whose
 * submitted value is the limited option. The RPC checks only these.
 */
function selectedOptionLimits(
  fields: CampFormField[],
  formData: Record<string, FieldValue>,
): OptionLimit[] {
  const limits: OptionLimit[] = [];
  for (const field of fields) {
    const capacity = readFieldCapacity(field);
    if (capacity && formData[field.key] === capacity.option) {
      limits.push({ key: field.key, ...capacity });
    }
  }
  return limits;
}

/**
 * Resolves the amount due. A valid invitation token → that tier's price + id;
 * otherwise the camp's base price with no tier. The tier must belong to the
 * camp and be within its validity window. Hidden prices are only ever returned
 * as the caller's own `amountDue`, never listed.
 */
async function resolveAmount(
  camp: CurrentCamp,
  priceTierToken: string | undefined,
): Promise<{ amountDue: number; priceTierId: string | null }> {
  const fallback = { amountDue: camp.basePrice, priceTierId: null };
  if (!priceTierToken) return fallback;

  const tier = await findValidTier(camp.id, priceTierToken);
  return tier ? { amountDue: tier.price, priceTierId: tier.id } : fallback;
}

/**
 * Throttle: reject when the same email OR ip already has ≥ THROTTLE_MAX_ATTEMPTS
 * recorded within the window. Always records the current attempt afterwards.
 */
async function isThrottled(
  campId: string,
  email: string,
  ip: string | null,
): Promise<boolean> {
  const supabase = getServiceClient();
  const since = new Date(Date.now() - THROTTLE_WINDOW_MS).toISOString();

  const { count } = await supabase
    .from("submission_attempts")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since)
    .or(`email.eq.${email},ip.eq.${ip ?? "__none__"}`);

  const throttled = (count ?? 0) >= THROTTLE_MAX_ATTEMPTS;

  await supabase
    .from("submission_attempts")
    .insert({ email, ip, camp_id: campId });

  return throttled;
}

/** Splits submitted values into core columns vs dynamic `form_data`. */
function splitValues(
  fields: CampFormField[],
  values: Record<string, FieldValue>,
): { core: Record<CoreKey, string>; formData: Record<string, FieldValue> } {
  const core: Record<CoreKey, string> = { first_name: "", last_name: "", email: "" };
  const formData: Record<string, FieldValue> = {};

  for (const field of fields) {
    const value = values[field.key];
    if (isCoreKey(field.key)) {
      core[field.key] = typeof value === "string" ? value.trim() : "";
    } else if (value !== undefined) {
      formData[field.key] = typeof value === "string" ? value.trim() : value;
    }
  }

  return { core, formData };
}

/** Narrows the RPC's jsonb answer; unknown shapes are treated as errors. */
function readRpcResult(data: Json): { status: string; keys: string[] } {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("create_public_registration returned an unexpected value");
  }
  const status = typeof data.status === "string" ? data.status : "";
  const keys = Array.isArray(data.keys)
    ? data.keys.filter((k): k is string => typeof k === "string")
    : [];
  return { status, keys };
}

/**
 * Inserts through the RPC, which holds an advisory lock and checks capacity in
 * the same transaction. Retries with a fresh reference on the rare collision.
 */
async function insertPublicRegistration(
  campId: string,
  registration: NewRegistration,
  optionLimits: OptionLimit[],
): Promise<InsertOutcome> {
  const supabase = getServiceClient();

  for (let attempt = 0; attempt < REFERENCE_ATTEMPTS; attempt += 1) {
    const reference = generateReference();
    const { data, error } = await supabase.rpc("create_public_registration", {
      p_camp_id: campId,
      p_reference: reference,
      p_first_name: registration.core.first_name,
      p_last_name: registration.core.last_name,
      p_email: registration.core.email,
      p_form_data: registration.formData,
      p_amount_due: registration.amountDue,
      p_price_tier_id: registration.priceTierId,
      p_option_limits: optionLimits,
    });
    if (error) throw error;

    const result = readRpcResult(data);
    switch (result.status) {
      case "ok":
        return { status: "ok", reference };
      case "camp_full":
        return { status: "camp_full" };
      case "option_full":
        return { status: "option_full", keys: result.keys };
      case "duplicate_reference":
        continue;
      default:
        throw new Error(`unknown registration status: ${result.status}`);
    }
  }
  throw new Error("could not generate a unique registration reference");
}

// --- entry point ------------------------------------------------------------

export async function submitRegistration(
  payload: RegistrationPayload,
): Promise<RegistrationResult> {
  const camp = await loadCurrentCamp();
  if (!camp) return { ok: false, reason: "closed" };

  // Fast answer with the shared rule; the RPC below stays authoritative for
  // capacity under concurrency.
  let activeCount = 0;
  try {
    if (camp.capacity !== null) activeCount = await getActiveRegistrationCount(camp.id);
  } catch {
    return { ok: false, reason: "error" };
  }
  const state = getRegistrationState(camp, new Date(), activeCount);
  if (state === "full") return { ok: false, reason: "camp_full" };
  if (state !== "open") return { ok: false, reason: "closed" };

  // Step breaks only structure the public form; they never carry an answer.
  const dynamicFields = questionFields(await loadDynamicFields(camp.id));
  const fields = mergeFields(dynamicFields);

  const fieldErrors = validateFields(fields, payload.values);
  if (Object.keys(fieldErrors).length > 0)
    return { ok: false, reason: "invalid", fieldErrors };

  const { core, formData } = splitValues(fields, payload.values);

  if (await isThrottled(camp.id, core.email, payload.ip))
    return { ok: false, reason: "throttled" };

  const { amountDue, priceTierId } = await resolveAmount(
    camp,
    payload.priceTierToken,
  );

  try {
    const outcome = await insertPublicRegistration(
      camp.id,
      { core, formData, amountDue, priceTierId },
      selectedOptionLimits(dynamicFields, formData),
    );

    if (outcome.status === "camp_full") return { ok: false, reason: "camp_full" };
    if (outcome.status === "option_full") {
      const optionErrors = Object.fromEntries(
        outcome.keys.map((key) => [key, registerMessages.validation.optionFull]),
      );
      return { ok: false, reason: "full", fieldErrors: optionErrors };
    }

    await writeLog({
      action: "registration.created",
      message: `${outcome.reference} · ${core.email}`,
    });
    return { ok: true, reference: outcome.reference };
  } catch {
    return { ok: false, reason: "error" };
  }
}
