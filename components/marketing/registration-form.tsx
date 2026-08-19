"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import type { CampFormField } from "@/lib/admin/types";
import type { FieldAvailability } from "@/lib/marketing/availability";

const copy = {
  submit: "Anmeldung absenden",
  submitting: "Wird gesendet …",
  required: "Pflichtfeld",
  email: "Bitte gib eine gültige E-Mail-Adresse ein",
  number: "Bitte gib eine Zahl ein",
  checkbox: "Bitte bestätige dieses Feld",
  selectPlaceholder: "Bitte wählen",
  checkboxFallback: "Zustimmung",
  soldOut: "ausgebucht",
  seatsLeft: (remaining: number, limit: number, option: string) =>
    `„${option}“: noch ${remaining} von ${limit} Plätzen frei`,
  seatsSoldOut: (option: string) => `„${option}“: ausgebucht`,
  successTitle: "Anmeldung eingegangen!",
  successBody:
    "Wir haben deine Anmeldung erhalten. Deine Referenznummer lautet {reference} — bewahre sie gut auf. Zur Bezahlung melden wir uns in Kürze bei dir.",
  registerAnother: "Noch jemanden anmelden",
  errorTitle: "Das hat nicht geklappt",
  errorGeneric: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldValue = string | boolean;

/**
 * Fixed identity fields backed by dedicated `registrations` columns
 * (`first_name`, `last_name`, `email`) rather than `form_data`. Always rendered,
 * above the camp's dynamic fields. Synthetic `CampFormField`s so the existing
 * renderer and validation apply unchanged.
 */
const CORE_FIELDS: CampFormField[] = [
  { key: "first_name", label: "Vorname", fieldType: "text", required: true },
  { key: "last_name", label: "Nachname", fieldType: "text", required: true },
  { key: "email", label: "E-Mail", fieldType: "email", required: true },
].map((f) => ({
  ...f,
  id: `core-${f.key}`,
  campId: "",
  options: null,
  sortOrder: -1,
  config: {},
}));

const CORE_KEYS = new Set(CORE_FIELDS.map((f) => f.key));

/** Core identity fields first, then the camp's dynamic fields (deduped by key). */
function mergeFields(dynamic: CampFormField[]): CampFormField[] {
  return [...CORE_FIELDS, ...dynamic.filter((f) => !CORE_KEYS.has(f.key))];
}

/** Reads the field's config extras defensively (config is `Record<string, unknown>`). */
function readString(config: Record<string, unknown>, key: string): string | undefined {
  const value = config[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function readOptions(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

// Maps a field type to the native <input> type. Non-input types handled separately.
function inputTypeFor(fieldType: string): string {
  switch (fieldType) {
    case "email":
      return "email";
    case "tel":
      return "tel";
    case "number":
      return "number";
    case "date":
      return "date";
    default:
      return "text";
  }
}

/** Dynamically-built per-field Zod schema. Empty non-required values pass. */
function fieldSchema(field: CampFormField): z.ZodTypeAny {
  switch (field.fieldType) {
    case "checkbox":
      return field.required
        ? z.boolean().refine((v) => v === true, copy.checkbox)
        : z.boolean();
    case "email":
      return z
        .string()
        .refine((v) => !field.required || v.trim() !== "", copy.required)
        .refine((v) => v.trim() === "" || EMAIL_RE.test(v.trim()), copy.email);
    case "number":
      return z
        .string()
        .refine((v) => !field.required || v.trim() !== "", copy.required)
        .refine(
          (v) => v.trim() === "" || !Number.isNaN(Number(v)),
          copy.number,
        );
    default:
      return z
        .string()
        .refine((v) => !field.required || v.trim() !== "", copy.required);
  }
}

function validate(field: CampFormField, value: FieldValue): string | null {
  const result = fieldSchema(field).safeParse(value);
  return result.success ? null : result.error.issues[0]?.message ?? copy.required;
}

function initialValue(field: CampFormField): FieldValue {
  return field.fieldType === "checkbox" ? false : "";
}

export function RegistrationForm({
  fields,
  availability = {},
}: {
  fields: CampFormField[];
  availability?: Record<string, FieldAvailability>;
}) {
  const allFields = mergeFields(fields);
  const [values, setValues] = useState<Record<string, FieldValue>>(() =>
    Object.fromEntries(allFields.map((f) => [f.key, initialValue(f)])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reference, setReference] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function resetForm() {
    setValues(
      Object.fromEntries(allFields.map((f) => [f.key, initialValue(f)])),
    );
    setErrors({});
    setServerError(null);
    setReference(null);
  }

  function setValue(key: string, value: FieldValue) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setServerError(null);
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: Record<string, string> = {};
    for (const field of allFields) {
      const message = validate(field, values[field.key]);
      if (message) nextErrors[field.key] = message;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        reference?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (response.ok && data.reference) {
        setReference(data.reference);
        return;
      }
      if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
        setErrors(data.fieldErrors);
      }
      setServerError(data.error ?? copy.errorGeneric);
    } catch {
      setServerError(copy.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <Notice
        tone="success"
        title={copy.successTitle}
        body={copy.successBody.replace("{reference}", reference)}
      >
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={resetForm}
          className="mt-6"
        >
          {copy.registerAnother}
        </Button>
      </Notice>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8"
    >
      <div className="flex flex-col gap-5">
        {allFields.map((field) => (
          <FormField
            key={field.id}
            field={field}
            value={values[field.key]}
            error={errors[field.key]}
            availability={availability[field.key]}
            onChange={(value) => setValue(field.key, value)}
          />
        ))}
      </div>
      {serverError && (
        <p
          role="alert"
          className="mt-6 rounded-input border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {serverError}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="mt-7 w-full sm:w-auto"
      >
        {submitting ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}

function FormField({
  field,
  value,
  error,
  availability,
  onChange,
}: {
  field: CampFormField;
  value: FieldValue;
  error?: string;
  availability?: FieldAvailability;
  onChange: (value: FieldValue) => void;
}) {
  const id = `reg-${field.key}`;
  const errorId = error ? `${id}-error` : undefined;
  const placeholder = readString(field.config, "placeholder");
  const helpText = readString(field.config, "helpText");
  const required = field.required;

  if (field.fieldType === "checkbox") {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2.5 text-sm text-foreground">
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded-sm border-ink-200 accent-accent"
          />
          <span>
            {field.label || copy.checkboxFallback}
            {required && <span className="text-danger"> *</span>}
          </span>
        </label>
        {helpText && !error && (
          <span className="pl-[26px] text-xs text-muted-foreground">
            {helpText}
          </span>
        )}
        {error && (
          <span id={errorId} className="pl-[26px] text-xs text-danger">
            {error}
          </span>
        )}
      </div>
    );
  }

  const label = required ? `${field.label} *` : field.label;
  const stringValue = typeof value === "string" ? value : "";

  return (
    <Field label={label} htmlFor={id} hint={helpText} error={error}>
      {field.fieldType === "textarea" ? (
        <Textarea
          id={id}
          value={stringValue}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && "border-danger focus-visible:border-danger")}
        />
      ) : field.fieldType === "select" ? (
        <>
          <Select
            id={id}
            value={stringValue}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            onChange={(e) => onChange(e.target.value)}
            className={cn(error && "border-danger focus-visible:border-danger")}
            options={[
              { value: "", label: placeholder ?? copy.selectPlaceholder },
              ...readOptions(field.options).map((opt) => {
                const soldOut =
                  availability?.option === opt && availability.remaining <= 0;
                return {
                  value: opt,
                  label: soldOut ? `${opt} — ${copy.soldOut}` : opt,
                  disabled: soldOut,
                };
              }),
            ]}
          />
          {availability && <SeatNote availability={availability} />}
        </>
      ) : (
        <Input
          id={id}
          type={inputTypeFor(field.fieldType)}
          value={stringValue}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && "border-danger focus-visible:border-danger")}
        />
      )}
    </Field>
  );
}

/** Small live-seat indicator under a capacity-limited select. */
function SeatNote({ availability }: { availability: FieldAvailability }) {
  const { option, limit, remaining } = availability;
  const soldOut = remaining <= 0;
  return (
    <span
      className={cn(
        "mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium",
        soldOut ? "text-danger" : "text-accent-strong",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          soldOut ? "bg-danger" : "bg-accent",
        )}
      />
      {soldOut
        ? copy.seatsSoldOut(option)
        : copy.seatsLeft(remaining, limit, option)}
    </span>
  );
}

function Notice({
  tone,
  title,
  body,
  children,
}: {
  tone: "success" | "muted";
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-card border bg-surface p-8 text-center shadow-card",
        tone === "success" ? "border-accent/40" : "border-border",
      )}
    >
      <p
        className={cn(
          "font-display text-2xl font-extrabold tracking-tight",
          tone === "success" ? "text-accent-strong" : "text-foreground",
        )}
      >
        {title}
      </p>
      <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      {children}
    </div>
  );
}
