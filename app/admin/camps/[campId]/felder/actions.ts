"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createFormField,
  deleteFormField,
  getCampFormFields,
  isUniqueViolation,
  reorderFormFields,
  updateFormField,
  writeLog,
} from "@/lib/admin/data";
import {
  FIELD_TYPES,
  isChoiceType,
  isQuestionType,
  slugifyKey,
} from "@/lib/admin/field-types";
import { canSeeTab } from "@/lib/admin/access";
import { AuthError, requireAdmin, requirePermission } from "@/lib/admin/guard";
import { busCounts, saveBusSettings } from "@/lib/bus/data";
import { mappingProblem } from "@/lib/bus/rules";
import { busSettingsInputSchema, type BusSettingsInput } from "@/lib/bus/schema";
import { de } from "@/lib/admin/messages";
import { registerMessages } from "@/lib/register/messages";
import { newConditionProblems, type ConditionProblem } from "@/lib/register/conditions";
import { questionFields } from "@/lib/register/steps";
import {
  mergeFields,
  validateFields,
  type FieldValue,
  type TestSubmitResult,
} from "@/lib/register/validation";
import type {
  ActionResult,
  AdminUser,
  CampFormField,
  FieldCondition,
  FieldFormValues,
  FieldInput,
} from "@/lib/admin/types";

// --- validation -------------------------------------------------------------

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const STEP_TITLE_MAX = 60;
const STEP_SUBTITLE_MAX = 140;

function nullify(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

// Raw string/boolean values in → validated `FieldInput` out. Cross-field checks
// run in `superRefine` so each issue carries a field path; `transform` produces
// the row-ready shape (options list, config bag) only once validation passed.
// Parses the raw capacity limit; returns a positive integer or null when unset/invalid.
function parseLimit(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isInteger(value) && value >= 1 ? value : null;
}

const fieldSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    fieldType: z.enum(FIELD_TYPES),
    required: z.boolean(),
    options: z.string(),
    placeholder: z.string(),
    helpText: z.string(),
    capacityOption: z.string(),
    capacityLimit: z.string(),
    showWhenField: z.string(),
    showWhenValues: z.array(z.string()),
  })
  .superRefine((values, ctx) => {
    if (values.label.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["label"], message: de.fields.errors.labelRequired });
    }
    // A step break only carries a title and a subtitle; its key is generated.
    if (!isQuestionType(values.fieldType)) {
      if (values.label.trim().length > STEP_TITLE_MAX) {
        ctx.addIssue({ code: "custom", path: ["label"], message: de.fields.errors.stepTitleTooLong });
      }
      if (values.helpText.trim().length > STEP_SUBTITLE_MAX) {
        ctx.addIssue({
          code: "custom",
          path: ["helpText"],
          message: de.fields.errors.stepSubtitleTooLong,
        });
      }
      return;
    }
    const key = values.key.trim();
    if (key === "") {
      ctx.addIssue({ code: "custom", path: ["key"], message: de.fields.errors.keyRequired });
    } else if (!KEY_PATTERN.test(key)) {
      ctx.addIssue({ code: "custom", path: ["key"], message: de.fields.errors.keyInvalid });
    }
    const options = parseOptions(values.options);
    if (isChoiceType(values.fieldType) && options.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: de.fields.errors.optionsRequired,
      });
    }
    if (values.showWhenField.trim() !== "" && cleanValues(values.showWhenValues).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["showWhenValues"],
        message: de.fields.errors.condition.no_values,
      });
    }
    // Capacity only applies to select fields with a chosen option.
    const capacityOption = values.capacityOption.trim();
    if (isChoiceType(values.fieldType) && capacityOption !== "") {
      if (!options.includes(capacityOption)) {
        ctx.addIssue({
          code: "custom",
          path: ["capacityOption"],
          message: de.fields.errors.capacityOptionInvalid,
        });
      }
      if (parseLimit(values.capacityLimit) === null) {
        ctx.addIssue({
          code: "custom",
          path: ["capacityLimit"],
          message: de.fields.errors.capacityLimitInvalid,
        });
      }
    }
  })
  .transform((values): FieldInput => {
    if (!isQuestionType(values.fieldType)) {
      return {
        key: values.key.trim(),
        label: values.label.trim(),
        fieldType: values.fieldType,
        required: false,
        options: null,
        config: { placeholder: null, helpText: nullify(values.helpText), capacity: null },
      };
    }
    const isSelect = isChoiceType(values.fieldType);
    const capacityOption = values.capacityOption.trim();
    const limit = parseLimit(values.capacityLimit);
    const capacity =
      isSelect && capacityOption !== "" && limit !== null
        ? { option: capacityOption, limit }
        : null;
    return {
      key: values.key.trim(),
      label: values.label.trim(),
      fieldType: values.fieldType,
      required: values.required,
      options: isSelect ? parseOptions(values.options) : null,
      config: {
        placeholder: nullify(values.placeholder),
        helpText: nullify(values.helpText),
        capacity,
        showWhen: readShowWhen(values.showWhenField, values.showWhenValues),
      },
    };
  });

// Trims, drops blanks, dedupes while preserving order.
function cleanValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value !== ""))];
}

// The stored condition (specs/037); null when the admin switched it off.
function readShowWhen(fieldKey: string, values: string[]): FieldCondition | null {
  const key = fieldKey.trim();
  return key === "" ? null : { fieldKey: key, values: cleanValues(values) };
}

// One choice per line; trims, drops blanks, dedupes while preserving order.
function parseOptions(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of raw.split("\n")) {
    const value = line.trim();
    if (value === "" || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

// --- shared helpers ---------------------------------------------------------

function fieldErrorResult(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return { ok: false, error: de.fields.toast.error, fieldErrors };
}

function revalidateFields(campId: string): void {
  revalidatePath(`/admin/camps/${campId}/felder`);
  revalidatePath("/admin/camps"); // the card shows the field count
  revalidatePath("/"); // the public form reads the fields
}

// Runs `fn` only after a successful admin check, mapping auth and unexpected
// failures to German error results instead of throwing to the client.
async function runGuarded(
  fn: (admin: AdminUser) => Promise<ActionResult>,
): Promise<ActionResult> {
  let admin: AdminUser;
  try {
    admin = await requirePermission("camps");
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: de.fields.toast.unauthorized };
    }
    console.error("[fields] auth check failed", error);
    return { ok: false, error: de.fields.toast.error };
  }
  try {
    return await fn(admin);
  } catch (error) {
    console.error("[fields] action failed", error);
    return { ok: false, error: de.fields.toast.error };
  }
}

function actorLabel(admin: AdminUser): string {
  return admin.name?.trim() || admin.email?.trim() || admin.id;
}

// App-layer uniqueness check (friendly, per-field). The DB unique index is the
// real guarantee; `isUniqueViolation` below maps a racing insert to the same copy.
async function keyTaken(
  campId: string,
  key: string,
  ignoreId?: string,
): Promise<boolean> {
  const fields = await getCampFormFields(campId);
  return fields.some((f) => f.key === key && f.id !== ignoreId);
}

// First free `schritt_<slug>` key in the camp; step keys are never shown.
async function freeStepKey(campId: string, label: string): Promise<string> {
  const taken = new Set((await getCampFormFields(campId)).map((f) => f.key));
  const base = `schritt_${slugifyKey(label) || "neu"}`;
  let key = base;
  for (let n = 2; taken.has(key); n++) key = `${base}_${n}`;
  return key;
}

// --- conditions (specs/037-conditional-form-fields) -------------------------

function asField(id: string, campId: string, input: FieldInput, sortOrder: number): CampFormField {
  return { id, campId, sortOrder, ...input };
}

const VALUE_REASONS: ReadonlySet<ConditionProblem["reason"]> = new Set(["no_values", "value_missing"]);

function quoted(problems: ConditionProblem[]): string {
  return [...new Set(problems.map((problem) => `„${problem.fieldLabel}“`))].join(", ");
}

/**
 * Rejects a change that breaks a condition. Problems on the edited field
 * become field errors; problems on other fields mean they depend on this one.
 */
function conditionResult(
  current: CampFormField[],
  next: CampFormField[],
  editedKey: string | null,
): ActionResult | null {
  const problems = newConditionProblems(mergeFields(current), mergeFields(next));
  if (problems.length === 0) return null;

  const others = problems.filter((problem) => problem.fieldKey !== editedKey);
  if (others.length > 0) {
    return { ok: false, error: de.fields.errors.dependentBlocked(quoted(others)) };
  }
  const own = problems[0];
  const path = VALUE_REASONS.has(own.reason) ? "showWhenValues" : "showWhenField";
  return {
    ok: false,
    error: de.fields.toast.error,
    fieldErrors: { [path]: de.fields.errors.condition[own.reason] },
  };
}

function keyTakenResult(): ActionResult {
  return {
    ok: false,
    error: de.fields.toast.error,
    fieldErrors: { key: de.fields.errors.keyTaken },
  };
}

// --- actions ----------------------------------------------------------------

export async function createFieldAction(
  campId: string,
  values: FieldFormValues,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = fieldSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);

    const input = isQuestionType(parsed.data.fieldType)
      ? parsed.data
      : { ...parsed.data, key: await freeStepKey(campId, parsed.data.label) };
    if (await keyTaken(campId, input.key)) return keyTakenResult();

    const current = await getCampFormFields(campId);
    const next = [...current, asField("new", campId, input, current.length)];
    const blocked = conditionResult(current, next, input.key);
    if (blocked) return blocked;

    try {
      const id = await createFormField(campId, input);
      await writeLog({
        actor: actorLabel(admin),
        action: "field.create",
        message: `${input.label} (${input.key})`,
      });
      revalidateFields(campId);
      return { ok: true, id };
    } catch (error) {
      if (isUniqueViolation(error)) return keyTakenResult();
      throw error;
    }
  });
}

export async function updateFieldAction(
  campId: string,
  id: string,
  values: FieldFormValues,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = fieldSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);

    if (await keyTaken(campId, parsed.data.key, id)) return keyTakenResult();

    const current = await getCampFormFields(campId);
    const next = current.map((field) =>
      field.id === id ? asField(id, campId, parsed.data, field.sortOrder) : field,
    );
    const blocked = conditionResult(current, next, parsed.data.key);
    if (blocked) return blocked;

    try {
      await updateFormField(id, parsed.data);
      await writeLog({
        actor: actorLabel(admin),
        action: "field.update",
        message: `${parsed.data.label} (${parsed.data.key})`,
      });
      revalidateFields(campId);
      return { ok: true, id };
    } catch (error) {
      if (isUniqueViolation(error)) return keyTakenResult();
      throw error;
    }
  });
}

export async function deleteFieldAction(
  campId: string,
  id: string,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const current = await getCampFormFields(campId);
    const blocked = conditionResult(
      current,
      current.filter((field) => field.id !== id),
      null,
    );
    if (blocked) return blocked;

    await deleteFormField(id);
    await writeLog({
      level: "warning",
      actor: actorLabel(admin),
      action: "field.delete",
      message: id,
    });
    revalidateFields(campId);
    return { ok: true };
  });
}

export async function reorderFieldsAction(
  campId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    await reorderFormFields(campId, orderedIds);
    await writeLog({
      actor: actorLabel(admin),
      action: "field.reorder",
      message: campId,
    });
    revalidateFields(campId);
    return { ok: true };
  });
}

// --- bus ticket settings (specs/021-bus-ticket, US1) ---------------------------

export type SaveBusSettingsResult =
  | { ok: true; busPersons: number; withoutAnswer: number }
  | { ok: false; error: string };

// Saves the bus mapping of one camp. Enabling needs a fitting question and
// answer (FR-003); a broken mapping may be stored while switched off.
export async function saveBusSettingsAction(input: BusSettingsInput): Promise<SaveBusSettingsResult> {
  const copy = de.bus.settings.toast;
  let admin: AdminUser;
  try {
    admin = await requirePermission("camps");
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: copy.unauthorized };
    console.error("[bus] auth check failed", error);
    return { ok: false, error: copy.error };
  }

  try {
    const parsed = busSettingsInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: copy.invalid };
    const { campId, enabled, fieldKey, answers } = parsed.data;

    const fields = await getCampFormFields(campId);
    const settings = { enabled, fieldKey, answers: [...new Set(answers)] };
    if (enabled && mappingProblem(settings, fields) !== null) return { ok: false, error: copy.cannotEnable };

    await saveBusSettings(campId, settings, admin.id);
    const counts = await busCounts(campId, settings, fields);
    await writeLog({
      actor: admin.name?.trim() || admin.email?.trim() || admin.id,
      action: "bus.settings_saved",
      message: `${enabled ? "aktiv" : "aus"}, Frage ${fieldKey ?? "keine"}`,
    });
    revalidatePath(`/admin/camps/${campId}/felder`);
    revalidatePath("/admin/bus");
    return { ok: true, ...counts };
  } catch (error) {
    console.error("[bus] save settings failed", error);
    return { ok: false, error: copy.error };
  }
}

// --- form test (specs/036-form-test-preview) ----------------------------------

const testValuesSchema = z.record(z.string(), z.union([z.string(), z.boolean()]));

/**
 * Validates a test submission exactly like a real registration, but stores,
 * sends and charges nothing: no registration row, no submission attempt, no
 * mail, no Stripe. Seeing the Camps tab is enough, since nothing is written.
 */
export async function testRegistrationAction(
  campId: string,
  values: Record<string, FieldValue>,
): Promise<TestSubmitResult> {
  try {
    const admin = await requireAdmin();
    if (!canSeeTab(admin, "/admin/camps")) throw new AuthError("forbidden");
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: de.fields.toast.unauthorized };
    console.error("[fields] form test auth check failed", error);
    return { ok: false, error: de.fields.toast.error };
  }

  const parsed = testValuesSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: registerMessages.api.badRequest };

  try {
    const fields = mergeFields(questionFields(await getCampFormFields(campId)));
    const fieldErrors = validateFields(fields, parsed.data);
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, error: registerMessages.api.invalid, fieldErrors };
    }
    return { ok: true };
  } catch (error) {
    console.error("[fields] form test failed", error);
    return { ok: false, error: registerMessages.api.generic };
  }
}
