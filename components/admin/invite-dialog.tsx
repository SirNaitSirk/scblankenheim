"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { AccessFields, type AccessValue } from "@/components/admin/access-controls";
import { de } from "@/lib/admin/messages";
import type { ActionResult, InviteFormValues } from "@/lib/admin/types";

const EMPTY: InviteFormValues = {
  email: "",
  role: "admin",
  permissions: [],
  visibleTabs: [],
};

export function InviteDialog({
  open,
  onClose,
  onSubmit,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: InviteFormValues) => Promise<ActionResult>;
  onSuccess: () => void;
}) {
  const [values, setValues] = useState<InviteFormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const t = de.users.inviteDialog;

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
          <Button type="submit" form="invite-form" size="sm" disabled={saving}>
            {saving ? t.saving : t.submit}
          </Button>
        </>
      }
    >
      <form id="invite-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field label={t.email} htmlFor="invite-email" error={errors.email}>
          <Input
            id="invite-email"
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

        <AccessFields value={values} onChange={setAccess} />
      </form>
    </Dialog>
  );
}
