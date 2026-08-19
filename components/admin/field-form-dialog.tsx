"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_TYPES, isChoiceType } from "@/lib/admin/field-types";
import { de } from "@/lib/admin/messages";
import type {
  ActionResult,
  CampFormField,
  FieldFormValues,
} from "@/lib/admin/types";

type Mode = "create" | "edit";

const EMPTY: FieldFormValues = {
  key: "",
  label: "",
  fieldType: "text",
  required: false,
  options: "",
  placeholder: "",
  helpText: "",
  capacityOption: "",
  capacityLimit: "",
};

// German-aware slug: transliterate umlauts, lowercase, non-alphanumerics → `_`.
function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^([0-9])/, "feld_$1");
}

function readOptionLines(value: unknown): string {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string").join("\n")
    : "";
}

function readConfigString(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  return typeof value === "string" ? value : "";
}

// Reads a stored `config.capacity` back into the two raw string form fields.
function readCapacity(config: Record<string, unknown>): {
  option: string;
  limit: string;
} {
  const capacity = config.capacity;
  if (capacity && typeof capacity === "object" && !Array.isArray(capacity)) {
    const record = capacity as Record<string, unknown>;
    const option = typeof record.option === "string" ? record.option : "";
    const limit =
      typeof record.limit === "number" ? String(record.limit) : "";
    return { option, limit };
  }
  return { option: "", limit: "" };
}

// One choice per non-empty line, deduped, order preserved — mirrors the server.
function parseOptionLines(raw: string): string[] {
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

function fromField(field: CampFormField): FieldFormValues {
  const capacity = readCapacity(field.config);
  return {
    key: field.key,
    label: field.label,
    fieldType: FIELD_TYPES.includes(field.fieldType as (typeof FIELD_TYPES)[number])
      ? (field.fieldType as FieldFormValues["fieldType"])
      : "text",
    required: field.required,
    options: readOptionLines(field.options),
    placeholder: readConfigString(field.config, "placeholder"),
    helpText: readConfigString(field.config, "helpText"),
    capacityOption: capacity.option,
    capacityLimit: capacity.limit,
  };
}

const TYPE_OPTIONS = FIELD_TYPES.map((type) => ({
  value: type,
  label: de.fields.types[type],
}));

export function FieldFormDialog({
  open,
  mode,
  field,
  onClose,
  onSubmit,
  onSuccess,
}: {
  open: boolean;
  mode: Mode;
  field: CampFormField | null;
  onClose: () => void;
  onSubmit: (values: FieldFormValues) => Promise<ActionResult>;
  onSuccess: () => void;
}) {
  // Initialised from props at mount; the parent remounts this via `key` on each
  // open, so state is always fresh without a setState-in-effect reset.
  const [values, setValues] = useState<FieldFormValues>(() =>
    mode === "edit" && field ? fromField(field) : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  // On create, keep suggesting a key from the label until the admin edits it.
  const [keyTouched, setKeyTouched] = useState(mode === "edit");

  const t = de.fields.form;

  const set = <K extends keyof FieldFormValues>(key: K, value: FieldFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const onLabelChange = (label: string) => {
    setValues((prev) => ({
      ...prev,
      label,
      key: mode === "create" && !keyTouched ? slugify(label) : prev.key,
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrors({});
    const result = await onSubmit(values);
    if (result.ok) {
      onSuccess();
      return;
    }
    setErrors(result.fieldErrors ?? {});
    setSaving(false);
  }

  const showOptions = isChoiceType(values.fieldType);

  // Choices offered as the limited option — the current options, plus the saved
  // one if the admin has since removed it from the list (so it stays visible).
  const parsedOptions = parseOptionLines(values.options);
  const capacityOptions =
    values.capacityOption !== "" && !parsedOptions.includes(values.capacityOption)
      ? [values.capacityOption, ...parsedOptions]
      : parsedOptions;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "edit" ? t.editTitle : t.createTitle}
      description={mode === "edit" ? t.editDescription : t.createDescription}
      closeLabel={t.close}
      footer={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            {t.cancel}
          </Button>
          <Button type="submit" form="field-form" size="sm" disabled={saving}>
            {saving ? t.saving : t.save}
          </Button>
        </>
      }
    >
      <form id="field-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label={t.label} htmlFor="field-label" error={errors.label}>
          <Input
            id="field-label"
            value={values.label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder={t.labelPlaceholder}
            aria-invalid={Boolean(errors.label)}
            autoComplete="off"
            autoFocus
          />
        </Field>

        <Field
          label={t.key}
          htmlFor="field-key"
          error={errors.key}
          hint={mode === "edit" ? t.keyWarning : t.keyHint}
        >
          <Input
            id="field-key"
            value={values.key}
            onChange={(e) => {
              setKeyTouched(true);
              set("key", e.target.value);
            }}
            placeholder={t.keyPlaceholder}
            aria-invalid={Boolean(errors.key)}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
          <Field label={t.type} htmlFor="field-type">
            <Select
              id="field-type"
              value={values.fieldType}
              onChange={(e) => set("fieldType", e.target.value as FieldFormValues["fieldType"])}
              options={TYPE_OPTIONS}
            />
          </Field>
          <div className="flex h-10 items-center sm:mt-[26px]">
            <Switch
              id="field-required"
              checked={values.required}
              onCheckedChange={(checked) => set("required", checked)}
              label={t.requiredToggle}
            />
          </div>
        </div>

        {showOptions && (
          <>
            <Field
              label={t.options}
              htmlFor="field-options"
              error={errors.options}
              hint={t.optionsHint}
            >
              <Textarea
                id="field-options"
                value={values.options}
                onChange={(e) => set("options", e.target.value)}
                placeholder={t.optionsPlaceholder}
                aria-invalid={Boolean(errors.options)}
              />
            </Field>

            <Field
              label={t.capacityOption}
              htmlFor="field-capacity-option"
              hint={t.capacityOptionHint}
              error={errors.capacityOption}
            >
              <Select
                id="field-capacity-option"
                value={values.capacityOption}
                onChange={(e) => set("capacityOption", e.target.value)}
                aria-invalid={Boolean(errors.capacityOption)}
                options={[
                  { value: "", label: t.capacityOptionNone },
                  ...capacityOptions.map((opt) => ({ value: opt, label: opt })),
                ]}
              />
            </Field>

            {values.capacityOption !== "" && (
              <Field
                label={t.capacityLimit}
                htmlFor="field-capacity-limit"
                error={errors.capacityLimit}
              >
                <Input
                  id="field-capacity-limit"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={values.capacityLimit}
                  onChange={(e) => set("capacityLimit", e.target.value)}
                  placeholder={t.capacityLimitPlaceholder}
                  aria-invalid={Boolean(errors.capacityLimit)}
                  autoComplete="off"
                />
              </Field>
            )}
          </>
        )}

        <Field label={t.placeholder} htmlFor="field-placeholder">
          <Input
            id="field-placeholder"
            value={values.placeholder}
            onChange={(e) => set("placeholder", e.target.value)}
            placeholder={t.placeholderPlaceholder}
            autoComplete="off"
          />
        </Field>

        <Field label={t.helpText} htmlFor="field-help">
          <Input
            id="field-help"
            value={values.helpText}
            onChange={(e) => set("helpText", e.target.value)}
            placeholder={t.helpTextPlaceholder}
            autoComplete="off"
          />
        </Field>
      </form>
    </Dialog>
  );
}
