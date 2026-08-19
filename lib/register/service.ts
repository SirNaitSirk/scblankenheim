import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { createRegistration, writeLog } from "@/lib/admin/data";
import {
  getCampAvailability,
  readFieldCapacity,
} from "@/lib/marketing/availability";
import type { CampFormField, RegistrationInput } from "@/lib/admin/types";

/**
 * Public registration service. All work runs server-side with the service-role
 * client — the public route handler ([app/api/register]) is the only caller.
 * The server is the gate: it re-loads the current camp, re-validates every field
 * against `camp_form_fields`, enforces the open/closed state, resolves the
 * amount (base price or a hidden price-tier via invitation token), and throttles
 * abuse. Client-side validation is never trusted.
 */

// --- constants --------------------------------------------------------------

const THROTTLE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const THROTTLE_MAX_ATTEMPTS = 5; // per email OR ip within the window

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// German validation copy — mirrors the client form so inline errors match.
const MESSAGES = {
  required: "Pflichtfeld",
  email: "Bitte gib eine gültige E-Mail-Adresse ein",
  number: "Bitte gib eine Zahl ein",
  checkbox: "Bitte bestätige dieses Feld",
  full: "Leider sind alle Plätze für diese Option belegt.",
} as const;

// Fixed identity fields backed by dedicated `registrations` columns. Mirrors
// the client's CORE_FIELDS so server validation is identical.
const CORE_KEYS = ["first_name", "last_name", "email"] as const;
type CoreKey = (typeof CORE_KEYS)[number];

const CORE_FIELDS: CampFormField[] = [
  { key: "first_name", label: "Vorname", fieldType: "text" },
  { key: "last_name", label: "Nachname", fieldType: "text" },
  { key: "email", label: "E-Mail", fieldType: "email" },
].map((f) => ({
  ...f,
  id: `core-${f.key}`,
  campId: "",
  required: true,
  options: null,
  sortOrder: -1,
  config: {},
}));

// --- types ------------------------------------------------------------------

type FieldValue = string | boolean;

export type RegistrationPayload = {
  values: Record<string, FieldValue>;
  priceTierToken?: string;
  ip: string | null;
};

export type RegistrationResult =
  | { ok: true; reference: string }
  | { ok: false; reason: "closed" }
  | { ok: false; reason: "throttled" }
  | { ok: false; reason: "invalid"; fieldErrors: Record<string, string> }
  | { ok: false; reason: "full"; fieldErrors: Record<string, string> }
  | { ok: false; reason: "error" };

type CurrentCamp = {
  id: string;
  basePrice: number;
  isOpen: boolean;
};

// --- helpers ----------------------------------------------------------------

/** Current camp id + base price + whether registration is open (server-side). */
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
    .select("id, base_price, registration_open")
    .eq("id", currentCampId)
    .maybeSingle();

  if (error || !camp) return null;

  return {
    id: camp.id,
    basePrice: camp.base_price,
    isOpen: camp.registration_open,
  };
}

/** Camp's dynamic fields, ordered — the same set the public form renders. */
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

/** Core identity fields first, then dynamic fields (deduped by key). */
function mergeFields(dynamic: CampFormField[]): CampFormField[] {
  const coreKeys = new Set<string>(CORE_KEYS);
  return [...CORE_FIELDS, ...dynamic.filter((f) => !coreKeys.has(f.key))];
}

/** Validates one field's value; returns a German message or `null` if valid. */
function validateField(field: CampFormField, value: FieldValue): string | null {
  if (field.fieldType === "checkbox") {
    if (field.required && value !== true) return MESSAGES.checkbox;
    return null;
  }

  const text = typeof value === "string" ? value.trim() : "";

  if (field.required && text === "") return MESSAGES.required;
  if (text === "") return null; // empty optional value passes

  if (field.fieldType === "email" && !EMAIL_RE.test(text)) return MESSAGES.email;
  if (field.fieldType === "number" && Number.isNaN(Number(text)))
    return MESSAGES.number;

  return null;
}

/** Validates all fields; returns per-key German errors (empty when all valid). */
function validateFields(
  fields: CampFormField[],
  values: Record<string, FieldValue>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const message = validateField(field, values[field.key] ?? "");
    if (message) errors[field.key] = message;
  }
  return errors;
}

/**
 * Enforces per-option seat limits (the authoritative gate — the public form's
 * counter is only advisory). For each capacity-limited field whose submitted
 * value is the limited option, rejects when no seats remain. Returns per-field
 * German errors (empty when nothing is full).
 */
async function checkCapacity(
  campId: string,
  fields: CampFormField[],
  formData: Record<string, FieldValue>,
): Promise<Record<string, string>> {
  const limited = fields.filter((field) => readFieldCapacity(field) !== null);
  if (limited.length === 0) return {};

  const availability = await getCampAvailability(campId, limited);
  const errors: Record<string, string> = {};

  for (const field of limited) {
    const capacity = readFieldCapacity(field);
    if (!capacity) continue;
    if (
      formData[field.key] === capacity.option &&
      (availability[field.key]?.remaining ?? 0) <= 0
    ) {
      errors[field.key] = MESSAGES.full;
    }
  }

  return errors;
}

/**
 * Resolves the amount due. A valid invitation token → that tier's price + id;
 * otherwise the camp's base price with no tier. The tier must belong to the
 * camp and be within its validity window. Hidden prices are only ever returned
 * as the caller's own `amountDue` — never listed.
 */
async function resolveAmount(
  camp: CurrentCamp,
  priceTierToken: string | undefined,
): Promise<{ amountDue: number; priceTierId: string | null }> {
  const fallback = { amountDue: camp.basePrice, priceTierId: null };
  if (!priceTierToken) return fallback;

  const supabase = getServiceClient();
  const { data: tier } = await supabase
    .from("price_tiers")
    .select("id, price, camp_id, valid_from, valid_until")
    .eq("invitation_token", priceTierToken)
    .maybeSingle();

  if (!tier || tier.camp_id !== camp.id) return fallback;

  const now = Date.now();
  if (tier.valid_from && new Date(tier.valid_from).getTime() > now)
    return fallback;
  if (tier.valid_until && new Date(tier.valid_until).getTime() < now)
    return fallback;

  return { amountDue: tier.price, priceTierId: tier.id };
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
  const core = { first_name: "", last_name: "", email: "" } as Record<
    CoreKey,
    string
  >;
  const formData: Record<string, FieldValue> = {};
  const coreKeys = new Set<string>(CORE_KEYS);

  for (const field of fields) {
    const value = values[field.key];
    if (coreKeys.has(field.key)) {
      core[field.key as CoreKey] =
        typeof value === "string" ? value.trim() : "";
    } else if (value !== undefined) {
      formData[field.key] =
        typeof value === "string" ? value.trim() : value;
    }
  }

  return { core, formData };
}

// --- entry point ------------------------------------------------------------

export async function submitRegistration(
  payload: RegistrationPayload,
): Promise<RegistrationResult> {
  const camp = await loadCurrentCamp();
  if (!camp || !camp.isOpen) return { ok: false, reason: "closed" };

  const dynamicFields = await loadDynamicFields(camp.id);
  const fields = mergeFields(dynamicFields);

  const fieldErrors = validateFields(fields, payload.values);
  if (Object.keys(fieldErrors).length > 0)
    return { ok: false, reason: "invalid", fieldErrors };

  const { core, formData } = splitValues(fields, payload.values);

  const capacityErrors = await checkCapacity(camp.id, dynamicFields, formData);
  if (Object.keys(capacityErrors).length > 0)
    return { ok: false, reason: "full", fieldErrors: capacityErrors };

  if (await isThrottled(camp.id, core.email, payload.ip))
    return { ok: false, reason: "throttled" };

  const { amountDue, priceTierId } = await resolveAmount(
    camp,
    payload.priceTierToken,
  );

  const input: RegistrationInput = {
    firstName: core.first_name,
    lastName: core.last_name,
    email: core.email,
    priceTierId,
    status: "pending",
    payment: "unpaid",
    amountDue,
    amountPaid: 0,
    formData,
  };

  try {
    const reference = await createRegistration(camp.id, input);
    await writeLog({
      action: "registration.created",
      message: `${reference} · ${core.email}`,
    });
    return { ok: true, reference };
  } catch {
    return { ok: false, reason: "error" };
  }
}
