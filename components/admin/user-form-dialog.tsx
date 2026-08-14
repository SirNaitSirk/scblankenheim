"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AccessFields } from "@/components/admin/access-controls";
import { de } from "@/lib/admin/messages";
import type {
  ActionResult,
  AdminUser,
  AdminUserFormValues,
} from "@/lib/admin/types";

function fromUser(user: AdminUser): AdminUserFormValues {
  return {
    role: user.role,
    permissions: user.permissions,
    visibleTabs: user.visibleTabs,
  };
}

export function UserFormDialog({
  open,
  user,
  isSelf,
  onClose,
  onSubmit,
  onSuccess,
}: {
  open: boolean;
  user: AdminUser | null;
  isSelf: boolean;
  onClose: () => void;
  onSubmit: (values: AdminUserFormValues) => Promise<ActionResult>;
  onSuccess: () => void;
}) {
  // Initialised from props at mount; the parent remounts this via `key` on each
  // open, so state is always fresh without a setState-in-effect reset.
  const [values, setValues] = useState<AdminUserFormValues>(() =>
    user ? fromUser(user) : { role: "admin", permissions: [], visibleTabs: [] },
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const t = de.users.form;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const result = await onSubmit(values);
    if (result.ok) {
      onSuccess();
      return;
    }
    setError(result.error);
    setSaving(false);
  }

  const name = user?.name?.trim() || user?.email || "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t.editTitle}
      description={user ? t.editDescription(name) : undefined}
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
          <Button type="submit" form="user-form" size="sm" disabled={saving}>
            {saving ? t.saving : t.save}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <p className="rounded-input border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <AccessFields value={values} onChange={setValues} roleLocked={isSelf} />
      </form>
    </Dialog>
  );
}
