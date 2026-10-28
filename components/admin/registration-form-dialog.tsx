"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import {
  GENDER_LABELS,
  PAYMENT_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  de,
} from "@/lib/admin/messages";
import { splitCampFields } from "@/lib/admin/form-layout";
import type {
  ActionResult,
  ParticipantLinkResult,
  CampFormField,
  Gender,
  PaymentStatus,
  PriceTier,
  Registration,
  RegistrationFormValues,
  RegistrationStatus,
} from "@/lib/admin/types";
import type { MailHistoryResult } from "@/lib/email/history";
import { MailHistory } from "./mail-history";
import { ParticipantLinkPanel } from "./participant-link-panel";
import { hasPaymentDue, PaymentLinkPanel } from "./payment-link-panel";
import { CORE_FIELD_KEYS } from "./registration-columns";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const t = de.registrations.form;

/** Contact and registration rows: four short fields side by side on desktop. */
const CORE_GRID = "grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4";

const GENDER_OPTIONS = [
  { value: "", label: t.genderNone },
  ...(Object.entries(GENDER_LABELS) as [Gender, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

const STATUS_OPTIONS = (
  Object.keys(REGISTRATION_STATUS_LABELS) as RegistrationStatus[]
).map((value) => ({ value, label: REGISTRATION_STATUS_LABELS[value] }));

const PAYMENT_OPTIONS = (
  Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]
).map((value) => ({ value, label: PAYMENT_STATUS_LABELS[value] }));

type DynamicValue = string | boolean;

function readString(config: Record<string, unknown>, key: string): string | undefined {
  const value = config[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function readOptions(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

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

/** The camp's own fields, minus any that collide with a core identity column. */
function dynamicFields(fields: CampFormField[]): CampFormField[] {
  return fields.filter((f) => !CORE_FIELD_KEYS.has(f.key));
}

function initialDynamicValue(field: CampFormField): DynamicValue {
  return field.fieldType === "checkbox" ? false : "";
}

/** Reads a stored answer defensively (form_data is `Record<string, unknown>`). */
function readAnswer(field: CampFormField, raw: unknown): DynamicValue {
  if (field.fieldType === "checkbox") return raw === true;
  return typeof raw === "string" ? raw : typeof raw === "number" ? String(raw) : "";
}

function initialValues(
  registration: Registration | null,
  fields: CampFormField[],
): RegistrationFormValues {
  const formData: Record<string, DynamicValue> = {};
  for (const field of dynamicFields(fields)) {
    formData[field.key] = registration
      ? readAnswer(field, registration.formData[field.key])
      : initialDynamicValue(field);
  }
  return {
    firstName: registration?.firstName ?? "",
    lastName: registration?.lastName ?? "",
    email: registration?.email ?? "",
    gender: registration?.gender ?? "",
    priceTierId: registration?.priceTierId ?? "",
    status: registration?.status ?? "active",
    payment: registration?.payment ?? "unpaid",
    amountDue: registration ? String(registration.amountDue) : "",
    amountPaid: registration ? String(registration.amountPaid) : "",
    formData,
  };
}

function isAmount(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0;
}

function validateDynamic(field: CampFormField, value: DynamicValue): string | null {
  if (field.fieldType === "checkbox") {
    return field.required && value !== true ? de.registrations.errors.required : null;
  }
  const s = typeof value === "string" ? value.trim() : "";
  if (field.required && s === "") return de.registrations.errors.required;
  if (field.fieldType === "email" && s !== "" && !EMAIL_RE.test(s)) {
    return de.registrations.errors.emailInvalid;
  }
  if (field.fieldType === "number" && s !== "" && Number.isNaN(Number(s))) {
    return de.registrations.errors.amountInvalid;
  }
  return null;
}

function validate(
  values: RegistrationFormValues,
  fields: CampFormField[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.firstName.trim() === "") errors.firstName = de.registrations.errors.firstNameRequired;
  if (values.lastName.trim() === "") errors.lastName = de.registrations.errors.lastNameRequired;
  const email = values.email.trim();
  if (email === "") errors.email = de.registrations.errors.emailRequired;
  else if (!EMAIL_RE.test(email)) errors.email = de.registrations.errors.emailInvalid;
  if (!isAmount(values.amountDue)) errors.amountDue = de.registrations.errors.amountInvalid;
  if (!isAmount(values.amountPaid)) errors.amountPaid = de.registrations.errors.amountInvalid;
  for (const field of dynamicFields(fields)) {
    const message = validateDynamic(field, values.formData[field.key]);
    if (message) errors[field.key] = message;
  }
  return errors;
}

export function RegistrationFormDialog({
  open,
  mode,
  registration,
  formFields,
  priceTiers,
  onClose,
  onSubmit,
  onSuccess,
  onDelete,
  onRestore,
  appUrl,
  onSendPaymentLink,
  onSetReminderPause,
  onLoadMails,
  onGetParticipantLink,
  onRenewParticipantLink,
}: {
  open: boolean;
  mode: "create" | "edit";
  registration: Registration | null;
  formFields: CampFormField[];
  priceTiers: PriceTier[];
  onClose: () => void;
  onSubmit: (values: RegistrationFormValues) => Promise<ActionResult>;
  onSuccess: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  appUrl?: string | null;
  onSendPaymentLink?: (reference: string) => Promise<ActionResult>;
  onSetReminderPause?: (reference: string, paused: boolean) => Promise<ActionResult>;
  onLoadMails?: (reference: string) => Promise<MailHistoryResult>;
  onGetParticipantLink?: (reference: string) => Promise<ParticipantLinkResult>;
  onRenewParticipantLink?: (reference: string) => Promise<ParticipantLinkResult>;
}) {
  // Initialised from props at mount; the parent remounts via `key` on each open,
  // so state is always fresh without a setState-in-effect reset.
  const [values, setValues] = useState<RegistrationFormValues>(() =>
    initialValues(registration, formFields),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Bumped after a payment link send so the mail history shows the new attempt.
  const [mailsReloadKey, setMailsReloadKey] = useState(0);

  const dynamic = dynamicFields(formFields);
  const campFields = splitCampFields(dynamic);

  function clearError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function setValue<K extends keyof RegistrationFormValues>(
    key: K,
    value: RegistrationFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key as string);
  }

  // Picking a tier in create mode prefills the (still-empty) amount due.
  function setTier(priceTierId: string) {
    setValues((prev) => {
      const next = { ...prev, priceTierId };
      if (mode === "create" && prev.amountDue.trim() === "") {
        const tier = priceTiers.find((p) => p.id === priceTierId);
        if (tier) next.amountDue = String(tier.price);
      }
      return next;
    });
  }

  function setDynamic(key: string, value: DynamicValue) {
    setValues((prev) => ({ ...prev, formData: { ...prev.formData, [key]: value } }));
    clearError(key);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const nextErrors = validate(values, formFields);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setSaving(true);
    setFormError(null);
    const result = await onSubmit(values);
    if (result.ok) {
      onSuccess();
      return;
    }
    if (result.fieldErrors) setErrors(result.fieldErrors);
    setFormError(result.error);
    setSaving(false);
  }

  const name = registration
    ? `${registration.firstName} ${registration.lastName}`.trim() || registration.email
    : "";

  const tierOptions = [
    { value: "", label: t.tierNone },
    ...priceTiers.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "edit" ? t.editTitle : t.createTitle}
      description={
        mode === "edit" ? t.editDescription(name) : t.createDescription
      }
      closeLabel={t.close}
      className="max-w-lg sm:max-w-2xl lg:max-w-5xl"
      footer={
        <>
          {mode === "edit" && registration?.deleted && onRestore ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRestore}
              disabled={saving}
              className="mr-auto"
            >
              {de.common.restore}
            </Button>
          ) : mode === "edit" && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={saving}
              className="mr-auto text-danger hover:bg-danger/10 hover:text-danger"
            >
              {t.delete}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            {t.cancel}
          </Button>
          <Button type="submit" form="registration-form" size="sm" disabled={saving}>
            {saving ? t.saving : t.save}
          </Button>
        </>
      }
    >
      <form
        id="registration-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        {formError && (
          <p className="rounded-input border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <Section title={t.sectionContact}>
          <div className={CORE_GRID}>
            <Field label={t.firstName} htmlFor="reg-firstName" error={errors.firstName}>
              <Input
                id="reg-firstName"
                value={values.firstName}
                aria-invalid={errors.firstName ? true : undefined}
                onChange={(e) => setValue("firstName", e.target.value)}
                className={cn(errors.firstName && "border-danger focus-visible:border-danger")}
              />
            </Field>
            <Field label={t.lastName} htmlFor="reg-lastName" error={errors.lastName}>
              <Input
                id="reg-lastName"
                value={values.lastName}
                aria-invalid={errors.lastName ? true : undefined}
                onChange={(e) => setValue("lastName", e.target.value)}
                className={cn(errors.lastName && "border-danger focus-visible:border-danger")}
              />
            </Field>
            <Field label={t.email} htmlFor="reg-email" error={errors.email}>
              <Input
                id="reg-email"
                type="email"
                value={values.email}
                aria-invalid={errors.email ? true : undefined}
                onChange={(e) => setValue("email", e.target.value)}
                className={cn(errors.email && "border-danger focus-visible:border-danger")}
              />
            </Field>
            <Field label={t.gender} htmlFor="reg-gender">
              <Select
                id="reg-gender"
                value={values.gender}
                onChange={(e) => setValue("gender", e.target.value as Gender | "")}
                options={GENDER_OPTIONS}
              />
            </Field>
          </div>
        </Section>

        <Section title={t.sectionRegistration}>
          <div className={CORE_GRID}>
            <Field label={t.tier} htmlFor="reg-tier">
              <Select
                id="reg-tier"
                value={values.priceTierId}
                onChange={(e) => setTier(e.target.value)}
                options={tierOptions}
              />
            </Field>
            <Field label={t.status} htmlFor="reg-status">
              <Select
                id="reg-status"
                value={values.status}
                onChange={(e) => setValue("status", e.target.value as RegistrationStatus)}
                options={STATUS_OPTIONS}
              />
            </Field>
            <Field label={t.payment} htmlFor="reg-payment">
              <Select
                id="reg-payment"
                value={values.payment}
                onChange={(e) => setValue("payment", e.target.value as PaymentStatus)}
                options={PAYMENT_OPTIONS}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t.amountDue} htmlFor="reg-amountDue" error={errors.amountDue}>
                <Input
                  id="reg-amountDue"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={values.amountDue}
                  aria-invalid={errors.amountDue ? true : undefined}
                  onChange={(e) => setValue("amountDue", e.target.value)}
                  className={cn(errors.amountDue && "border-danger focus-visible:border-danger")}
                />
              </Field>
              <Field label={t.amountPaid} htmlFor="reg-amountPaid" error={errors.amountPaid}>
                <Input
                  id="reg-amountPaid"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={values.amountPaid}
                  aria-invalid={errors.amountPaid ? true : undefined}
                  onChange={(e) => setValue("amountPaid", e.target.value)}
                  className={cn(errors.amountPaid && "border-danger focus-visible:border-danger")}
                />
              </Field>
            </div>
          </div>
        </Section>

        {mode === "edit" && registration && onSendPaymentLink && hasPaymentDue(registration) && (
          <PaymentLinkPanel
            registration={registration}
            appUrl={appUrl ?? null}
            onSend={async (reference) => {
              const result = await onSendPaymentLink(reference);
              setMailsReloadKey((key) => key + 1);
              return result;
            }}
            onSetReminderPause={onSetReminderPause}
          />
        )}

        {mode === "edit" && registration && !registration.deleted && onGetParticipantLink && (
          <ParticipantLinkPanel
            registration={registration}
            onGetLink={onGetParticipantLink}
            onRenewLink={onRenewParticipantLink}
          />
        )}

        {mode === "edit" && registration && onLoadMails && (
          <MailHistory reference={registration.id} load={onLoadMails} reloadKey={mailsReloadKey} />
        )}

        {dynamic.length > 0 && (
          <Section title={t.sectionCampFields}>
            {campFields.inputs.length > 0 && (
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {campFields.inputs.map((field) => (
                  <DynamicField
                    key={field.id}
                    field={field}
                    value={values.formData[field.key]}
                    error={errors[field.key]}
                    onChange={(value) => setDynamic(field.key, value)}
                    className={field.fieldType === "textarea" ? "sm:col-span-full" : undefined}
                  />
                ))}
              </div>
            )}
            {campFields.toggles.length > 0 && (
              <div className="grid gap-x-6 gap-y-2.5 pt-1 sm:grid-cols-2 lg:grid-cols-3">
                {campFields.toggles.map((field) => (
                  <DynamicField
                    key={field.id}
                    field={field}
                    value={values.formData[field.key]}
                    error={errors[field.key]}
                    onChange={(value) => setDynamic(field.key, value)}
                  />
                ))}
              </div>
            )}
          </Section>
        )}
      </form>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DynamicField({
  field,
  value,
  error,
  onChange,
  className,
}: {
  field: CampFormField;
  value: DynamicValue;
  error?: string;
  onChange: (value: DynamicValue) => void;
  className?: string;
}) {
  const id = `reg-field-${field.key}`;
  const placeholder = readString(field.config, "placeholder");
  const helpText = readString(field.config, "helpText");
  const label = field.required ? `${field.label} *` : field.label;
  const stringValue = typeof value === "string" ? value : "";

  if (field.fieldType === "checkbox") {
    return (
      <Switch
        id={id}
        checked={value === true}
        onCheckedChange={onChange}
        label={field.label || t.selectPlaceholder}
      />
    );
  }

  return (
    <Field label={label} htmlFor={id} hint={helpText} error={error} className={className}>
      {field.fieldType === "textarea" ? (
        <Textarea
          id={id}
          value={stringValue}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && "border-danger focus-visible:border-danger")}
        />
      ) : field.fieldType === "select" ? (
        <Select
          id={id}
          value={stringValue}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && "border-danger focus-visible:border-danger")}
          options={[
            { value: "", label: placeholder ?? t.selectPlaceholder },
            ...readOptions(field.options).map((opt) => ({ value: opt, label: opt })),
          ]}
        />
      ) : (
        <Input
          id={id}
          type={inputTypeFor(field.fieldType)}
          value={stringValue}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && "border-danger focus-visible:border-danger")}
        />
      )}
    </Field>
  );
}
