"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { AccessFields, type AccessValue } from "@/components/admin/access-controls";
import { de } from "@/lib/admin/messages";
import type { ActionResult, AddUserFormValues } from "@/lib/admin/types";

const EMPTY: AddUserFormValues = {
  name: "",
  email: "",
  password: "",
  role: "admin",
  permissions: [],
  visibleTabs: [],
};

export function AddUserDialog({
  open,
  onClose,
  onSubmit,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddUserFormValues) => Promise<ActionResult>;
  onSuccess: () => void;
}) {
  const [values, setValues] = useState<AddUserFormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const t = de.users.add;

  const setAccess = (access: AccessValue) =>
    setValues((prev) => ({ ...prev, ...access }));

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
      title={t.title}
      description={t.description}
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
          <Button type="submit" form="add-user-form" size="sm" disabled={saving}>
            {saving ? t.saving : t.submit}
          </Button>
        </>
      }
    >
      <form
        id="add-user-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-4">
          <Field label={t.name} htmlFor="add-user-name">
            <Input
              id="add-user-name"
              value={values.name}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={t.namePlaceholder}
              autoComplete="off"
            />
          </Field>

          <Field label={t.email} htmlFor="add-user-email" error={errors.email}>
            <Input
              id="add-user-email"
              type="email"
              value={values.email}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder={t.emailPlaceholder}
              aria-invalid={Boolean(errors.email)}
              autoComplete="off"
            />
          </Field>

          <Field
            label={t.password}
            htmlFor="add-user-password"
            hint={t.passwordHint}
            error={errors.password}
          >
            <Input
              id="add-user-password"
              type="password"
              value={values.password}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder={t.passwordPlaceholder}
              aria-invalid={Boolean(errors.password)}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <AccessFields value={values} onChange={setAccess} />
      </form>
    </Dialog>
  );
}
