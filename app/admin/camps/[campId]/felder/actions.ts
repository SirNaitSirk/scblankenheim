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
import { FIELD_TYPES, isChoiceType } from "@/lib/admin/field-types";
import { AuthError, requirePermission } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import type {
  ActionResult,
  AdminUser,
  FieldFormValues,
  FieldInput,
} from "@/lib/admin/types";

// --- validation -------------------------------------------------------------

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

function nullify(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

// Raw string/boolean values in → validated `FieldInput` out. Cross-field checks
// run in `superRefine` so each issue carries a field path; `transform` produces
// the row-ready shape (options list, config bag) only once validation passed.
const fieldSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    fieldType: z.enum(FIELD_TYPES),
    required: z.boolean(),
    options: z.string(),
    placeholder: z.string(),
    helpText: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.label.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["label"], message: de.fields.errors.labelRequired });
    }
    const key = values.key.trim();
    if (key === "") {
      ctx.addIssue({ code: "custom", path: ["key"], message: de.fields.errors.keyRequired });
    } else if (!KEY_PATTERN.test(key)) {
      ctx.addIssue({ code: "custom", path: ["key"], message: de.fields.errors.keyInvalid });
    }
    if (isChoiceType(values.fieldType) && parseOptions(values.options).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: de.fields.errors.optionsRequired,
      });
    }
  })
  .transform(
    (values): FieldInput => ({
      key: values.key.trim(),
      label: values.label.trim(),
      fieldType: values.fieldType,
      required: values.required,
      options: isChoiceType(values.fieldType) ? parseOptions(values.options) : null,
      config: {
        placeholder: nullify(values.placeholder),
        helpText: nullify(values.helpText),
      },
    }),
  );

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

    if (await keyTaken(campId, parsed.data.key)) return keyTakenResult();

    try {
      const id = await createFormField(campId, parsed.data);
      await writeLog({
        actor: actorLabel(admin),
        action: "field.create",
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

export async function updateFieldAction(
  campId: string,
  id: string,
  values: FieldFormValues,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = fieldSchema.safeParse(values);
    if (!parsed.success) return fieldErrorResult(parsed.error);

    if (await keyTaken(campId, parsed.data.key, id)) return keyTakenResult();

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
