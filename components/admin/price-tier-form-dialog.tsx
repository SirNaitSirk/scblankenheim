"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { de } from "@/lib/admin/messages";
import type { ActionResult, PriceTier, PriceTierFormValues } from "@/lib/admin/types";

type Mode = "create" | "edit";

type LocalValues = PriceTierFormValues; // validity as datetime-local (YYYY-MM-DDTHH:mm)

const EMPTY: LocalValues = { name: "", price: "", validFrom: "", validUntil: "" };

// The input shows local time; the server stores an absolute instant. Converting
// in the browser keeps the admin's time zone instead of the server's.
function isoToLocal(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function localToIso(local: string): string {
  return local.trim() === "" ? "" : new Date(local).toISOString();
}

function fromTier(tier: PriceTier): LocalValues {
  return {
    name: tier.name,
    price: String(tier.price),
    validFrom: isoToLocal(tier.validFrom),
    validUntil: isoToLocal(tier.validUntil),
  };
}

export function PriceTierFormDialog({
  open,
  mode,
  tier,
  onClose,
  onSubmit,
  onSuccess,
}: {
  open: boolean;
  mode: Mode;
  tier: PriceTier | null;
  onClose: () => void;
  onSubmit: (values: PriceTierFormValues) => Promise<ActionResult>;
  onSuccess: () => void;
}) {
  // Initialised from props at mount; the parent remounts this via `key` on each open.
  const [values, setValues] = useState<LocalValues>(() =>
    mode === "edit" && tier ? fromTier(tier) : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof LocalValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const t = de.pricing.form;
  const existing = mode === "edit" && tier ? tier.count : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrors({});
    setFormError(null);
    const result = await onSubmit({
      ...values,
      validFrom: localToIso(values.validFrom),
      validUntil: localToIso(values.validUntil),
    });
    if (result.ok) {
      onSuccess();
      return;
    }
    setErrors(result.fieldErrors ?? {});
    if (!result.fieldErrors) setFormError(result.error);
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
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            {t.cancel}
          </Button>
          <Button type="submit" form="price-tier-form" size="sm" disabled={saving}>
            {saving ? t.saving : t.save}
          </Button>
        </>
      }
    >
      <form id="price-tier-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <Field label={t.name} htmlFor="tier-name" error={errors.name}>
            <Input
              id="tier-name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t.namePlaceholder}
              aria-invalid={Boolean(errors.name)}
              autoComplete="off"
              maxLength={80}
            />
          </Field>
          <Field label={t.price} htmlFor="tier-price" error={errors.price}>
            <Input
              id="tier-price"
              inputMode="numeric"
              value={values.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder={t.pricePlaceholder}
              aria-invalid={Boolean(errors.price)}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.validFrom} htmlFor="tier-from" error={errors.validFrom}>
              <Input
                id="tier-from"
                type="datetime-local"
                value={values.validFrom}
                onChange={(e) => set("validFrom", e.target.value)}
                aria-invalid={Boolean(errors.validFrom)}
              />
            </Field>
            <Field label={t.validUntil} htmlFor="tier-until" error={errors.validUntil}>
              <Input
                id="tier-until"
                type="datetime-local"
                value={values.validUntil}
                onChange={(e) => set("validUntil", e.target.value)}
                aria-invalid={Boolean(errors.validUntil)}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">{t.validityHint}</p>
        </div>

        {existing > 0 && (
          <p className="rounded-input border border-border bg-ink-50 px-4 py-3 text-sm text-muted-foreground">
            {t.existingHint(existing)}
          </p>
        )}

        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}
      </form>
    </Dialog>
  );
}
