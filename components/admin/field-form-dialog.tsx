"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  FIELD_TYPES,
  isChoiceType,
  isQuestionType,
  slugifyKey,
  type FieldType,
} from "@/lib/admin/field-types";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";
import {
  dependentsOf,
  newConditionProblems,
  readCondition,
} from "@/lib/register/conditions";
import { CORE_FIELDS, mergeFields } from "@/lib/register/validation";
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
  showWhenField: "",
  showWhenValues: [],
};

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
  const condition = readCondition(field);
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
    showWhenField: condition?.fieldKey ?? "",
    showWhenValues: condition?.values ?? [],
  };
}

const GENDER_FIELD = CORE_FIELDS.filter((field) => field.key === "gender");

// Select fields that may show or hide other fields (specs/037): no own
// condition, never the edited field itself; the gender core field included.
function triggerCandidates(fields: CampFormField[], selfId: string | null): CampFormField[] {
  return [...GENDER_FIELD, ...fields].filter(
    (field) => field.fieldType === "select" && field.id !== selfId && !readCondition(field),
  );
}

function optionList(field: CampFormField | undefined): string[] {
  return Array.isArray(field?.options) ? field.options.filter((o): o is string => typeof o === "string") : [];
}

// The edited field as it would be saved; mirrors the server transform closely
// enough for the condition check (the server stays authoritative).
function draftField(values: FieldFormValues, base: CampFormField | null): CampFormField {
  return {
    id: base?.id ?? "new",
    campId: base?.campId ?? "",
    sortOrder: base?.sortOrder ?? Number.MAX_SAFE_INTEGER,
    key: values.key.trim(),
    label: values.label.trim(),
    fieldType: values.fieldType,
    required: values.required,
    options: isChoiceType(values.fieldType) ? parseOptionLines(values.options) : null,
    config: {
      showWhen:
        values.showWhenField === "" ? null : { fieldKey: values.showWhenField, values: values.showWhenValues },
    },
  };
}

// Step breaks are added through their own button, never by changing a question's type.
const TYPE_OPTIONS = FIELD_TYPES.filter(isQuestionType).map((type) => ({
  value: type,
  label: de.fields.types[type],
}));

export function FieldFormDialog({
  open,
  mode,
  field,
  fields,
  onClose,
  onSubmit,
  onSuccess,
  initialType = "text",
}: {
  open: boolean;
  mode: Mode;
  field: CampFormField | null;
  /** All fields of the camp, for the condition (specs/037). */
  fields: CampFormField[];
  onClose: () => void;
  onSubmit: (values: FieldFormValues) => Promise<ActionResult>;
  onSuccess: () => void;
  /** Type of a newly created entry; `step` opens the step break variant. */
  initialType?: FieldType;
}) {
  // Initialised from props at mount; the parent remounts this via `key` on each
  // open, so state is always fresh without a setState-in-effect reset.
  const [values, setValues] = useState<FieldFormValues>(() =>
    mode === "edit" && field ? fromField(field) : { ...EMPTY, fieldType: initialType },
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
      key: mode === "create" && !keyTouched ? slugifyKey(label) : prev.key,
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const blocked = dependentProblem();
    if (blocked) {
      setErrors({ form: blocked });
      return;
    }
    setSaving(true);
    setErrors({});
    const result = await onSubmit(values);
    if (result.ok) {
      onSuccess();
      return;
    }
    setErrors({ ...(result.fieldErrors ?? {}), ...(result.fieldErrors ? {} : { form: result.error }) });
    setSaving(false);
  }

  // Same rule as the server: does this edit break a condition of another field?
  function dependentProblem(): string | null {
    if (mode !== "edit" || !field) return null;
    const next = fields.map((candidate) => (candidate.id === field.id ? draftField(values, field) : candidate));
    const others = newConditionProblems(mergeFields(fields), mergeFields(next)).filter(
      (problem) => problem.fieldKey !== values.key.trim(),
    );
    if (others.length === 0) return null;
    const labels = [...new Set(others.map((problem) => `„${problem.fieldLabel}“`))].join(", ");
    return de.fields.errors.dependentBlocked(labels);
  }

  const showOptions = isChoiceType(values.fieldType);
  const isStep = !isQuestionType(values.fieldType);
  const s = de.fields.step;
  const title = isStep
    ? mode === "edit" ? s.editTitle : s.createTitle
    : mode === "edit" ? t.editTitle : t.createTitle;
  const description = isStep
    ? mode === "edit" ? s.editDescription : s.createDescription
    : mode === "edit" ? t.editDescription : t.createDescription;

  // Choices offered as the limited option — the current options, plus the saved
  // one if the admin has since removed it from the list (so it stays visible).
  const parsedOptions = parseOptionLines(values.options);

  const triggers = triggerCandidates(fields, field?.id ?? null);
  const trigger = triggers.find((candidate) => candidate.key === values.showWhenField);
  const triggerOptions = optionList(trigger);
  // A trigger of other fields cannot itself be conditional (one level only).
  const dependents = field ? dependentsOf(fields, field.key) : [];
  const conditionOn = values.showWhenField !== "";
  const beforeTrigger =
    conditionOn && trigger !== undefined && field !== null && !trigger.id.startsWith("core-") &&
    trigger.sortOrder > field.sortOrder;

  const toggleCondition = (on: boolean) =>
    setValues((prev) => ({
      ...prev,
      showWhenField: on ? (triggers[0]?.key ?? "") : "",
      showWhenValues: [],
    }));

  const toggleValue = (value: string) =>
    setValues((prev) => ({
      ...prev,
      showWhenValues: prev.showWhenValues.includes(value)
        ? prev.showWhenValues.filter((item) => item !== value)
        : [...prev.showWhenValues, value],
    }));
  const capacityOptions =
    values.capacityOption !== "" && !parsedOptions.includes(values.capacityOption)
      ? [values.capacityOption, ...parsedOptions]
      : parsedOptions;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
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
      {isStep ? (
        <form id="field-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label={s.title} htmlFor="field-label" error={errors.label}>
            <Input
              id="field-label"
              value={values.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder={s.titlePlaceholder}
              aria-invalid={Boolean(errors.label)}
              maxLength={60}
              autoComplete="off"
              autoFocus
            />
          </Field>
          <Field
            label={s.subtitle}
            htmlFor="field-help"
            hint={s.subtitleHint}
            error={errors.helpText}
          >
            <Input
              id="field-help"
              value={values.helpText}
              onChange={(e) => set("helpText", e.target.value)}
              placeholder={s.subtitlePlaceholder}
              aria-invalid={Boolean(errors.helpText)}
              maxLength={140}
              autoComplete="off"
            />
          </Field>
        </form>
      ) : (
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

          <div className="flex flex-col gap-4 border-t border-border pt-4">
            <Switch
              id="field-show-when"
              checked={conditionOn}
              onCheckedChange={toggleCondition}
              label={t.showWhenToggle}
              disabled={dependents.length > 0 || (!conditionOn && triggers.length === 0)}
            />
            {dependents.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t.showWhenLocked(dependents.map((d) => `„${d.label}“`).join(", "))}
              </p>
            ) : !conditionOn && triggers.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t.showWhenNoTriggers}</p>
            ) : null}

            {conditionOn && (
              <>
                <Field
                  label={t.showWhenField}
                  htmlFor="field-show-when-field"
                  hint={t.showWhenFieldHint}
                  error={errors.showWhenField}
                >
                  <Select
                    id="field-show-when-field"
                    value={values.showWhenField}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, showWhenField: e.target.value, showWhenValues: [] }))
                    }
                    aria-invalid={Boolean(errors.showWhenField)}
                    options={[
                      ...(trigger ? [] : [{ value: values.showWhenField, label: t.showWhenFieldPlaceholder }]),
                      ...triggers.map((candidate) => ({ value: candidate.key, label: candidate.label })),
                    ]}
                  />
                </Field>

                <Field label={t.showWhenValues} hint={t.showWhenValuesHint} error={errors.showWhenValues}>
                  <div className="flex flex-wrap gap-2">
                    {triggerOptions.map((option) => {
                      const selected = values.showWhenValues.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleValue(option)}
                          className={cn(
                            "inline-flex min-h-9 items-center rounded-pill border px-3 py-1.5 text-sm transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selected
                              ? "border-accent bg-accent/10 text-foreground"
                              : "border-ink-200 text-muted-foreground hover:border-ink-300",
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {beforeTrigger && <p className="text-xs text-muted-foreground">{t.showWhenOrderHint}</p>}
              </>
            )}
          </div>

          {errors.form && (
            <p role="alert" className="text-sm text-danger">
              {errors.form}
            </p>
          )}
        </form>
      )}
    </Dialog>
  );
}
