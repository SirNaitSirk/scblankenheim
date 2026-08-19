"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { de } from "@/lib/admin/messages";
import type { ActionResult, Camp, CampFormValues } from "@/lib/admin/types";

type Mode = "create" | "edit";

const EMPTY: CampFormValues = {
  name: "",
  location: "",
  startDate: "",
  endDate: "",
  capacity: "",
  basePrice: "",
  registrationOpen: true,
  registrationOpensAt: "",
  registrationClosesAt: "",
  paymentDueDate: "",
  tagline: "",
  description: "",
};

// `camp_settings` stores timestamptz; a datetime-local input needs `YYYY-MM-DDTHH:mm`.
function toLocalDateTime(iso: string | null): string {
  return iso ? iso.slice(0, 16) : "";
}

function fromCamp(camp: Camp): CampFormValues {
  return {
    name: camp.name,
    location: camp.location,
    startDate: camp.startDate,
    endDate: camp.endDate,
    capacity: camp.capacity ? String(camp.capacity) : "",
    basePrice: String(camp.basePrice),
    registrationOpen: camp.registrationOpen,
    registrationOpensAt: toLocalDateTime(camp.registrationOpensAt),
    registrationClosesAt: toLocalDateTime(camp.registrationClosesAt),
    paymentDueDate: camp.paymentDueDate ?? "",
    tagline: camp.tagline ?? "",
    description: camp.description ?? "",
  };
}

export function CampFormDialog({
  open,
  mode,
  camp,
  onClose,
  onSubmit,
  onSuccess,
}: {
  open: boolean;
  mode: Mode;
  camp: Camp | null;
  onClose: () => void;
  onSubmit: (values: CampFormValues) => Promise<ActionResult>;
  onSuccess: () => void;
}) {
  // Initialised from props at mount; the parent remounts this via `key` on each
  // open, so state is always fresh without a setState-in-effect reset.
  const [values, setValues] = useState<CampFormValues>(() =>
    mode === "edit" && camp ? fromCamp(camp) : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set =<K extends keyof CampFormValues>(key: K, value: CampFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const t = de.camps.form;

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "edit" ? t.editTitle : t.createTitle}
      description={mode === "edit" ? t.editDescription : t.createDescription}
      closeLabel={t.close}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            {t.cancel}
          </Button>
          <Button type="submit" form="camp-form" size="sm" disabled={saving}>
            {saving ? t.saving : t.save}
          </Button>
        </>
      }
    >
      <form id="camp-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label={t.name} htmlFor="camp-name" error={errors.name}>
          <Input
            id="camp-name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={t.namePlaceholder}
            aria-invalid={Boolean(errors.name)}
            autoComplete="off"
          />
        </Field>

        <Field label={t.location} htmlFor="camp-location">
          <Input
            id="camp-location"
            value={values.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder={t.locationPlaceholder}
            autoComplete="off"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.startDate} htmlFor="camp-start">
            <Input
              id="camp-start"
              type="date"
              value={values.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </Field>
          <Field label={t.endDate} htmlFor="camp-end" error={errors.endDate}>
            <Input
              id="camp-end"
              type="date"
              value={values.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              aria-invalid={Boolean(errors.endDate)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.capacity} htmlFor="camp-capacity" error={errors.capacity}>
            <Input
              id="camp-capacity"
              inputMode="numeric"
              value={values.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              placeholder={t.capacityPlaceholder}
              aria-invalid={Boolean(errors.capacity)}
            />
          </Field>
          <Field
            label={t.basePrice}
            htmlFor="camp-price"
            error={errors.basePrice}
          >
            <Input
              id="camp-price"
              inputMode="numeric"
              value={values.basePrice}
              onChange={(e) => set("basePrice", e.target.value)}
              placeholder={t.basePricePlaceholder}
              aria-invalid={Boolean(errors.basePrice)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.registrationOpensAt} htmlFor="camp-opens">
            <Input
              id="camp-opens"
              type="datetime-local"
              value={values.registrationOpensAt}
              onChange={(e) => set("registrationOpensAt", e.target.value)}
            />
          </Field>
          <Field label={t.registrationClosesAt} htmlFor="camp-closes">
            <Input
              id="camp-closes"
              type="datetime-local"
              value={values.registrationClosesAt}
              onChange={(e) => set("registrationClosesAt", e.target.value)}
            />
          </Field>
        </div>

        <Field label={t.paymentDueDate} htmlFor="camp-due" className="sm:max-w-[50%]">
          <Input
            id="camp-due"
            type="date"
            value={values.paymentDueDate}
            onChange={(e) => set("paymentDueDate", e.target.value)}
          />
        </Field>

        <Switch
          id="camp-registration-open"
          checked={values.registrationOpen}
          onCheckedChange={(checked) => set("registrationOpen", checked)}
          label={t.registrationOpen}
        />

        <Field label={t.tagline} htmlFor="camp-tagline">
          <Input
            id="camp-tagline"
            value={values.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            placeholder={t.taglinePlaceholder}
            autoComplete="off"
          />
        </Field>

        <Field label={t.description} htmlFor="camp-description">
          <Textarea
            id="camp-description"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={t.descriptionPlaceholder}
          />
        </Field>
      </form>
    </Dialog>
  );
}
