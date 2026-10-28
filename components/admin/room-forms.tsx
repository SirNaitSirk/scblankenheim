"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";
import { MAX_BEDS, MAX_NAME_LENGTH } from "@/lib/admin/room-planning";
import type { ActionResult } from "@/lib/admin/types";

const t = de.rooms.dialog;

/**
 * Create or edit dialog for a house (name only) or a room (name and beds).
 * Validation runs on the server (Zod); field errors come back per key.
 */
export function RoomFormDialog({
  open,
  kind,
  mode,
  initial,
  onClose,
  onSubmit,
  onSaved,
}: {
  open: boolean;
  kind: "house" | "room";
  mode: "create" | "edit";
  initial: { name: string; beds: string };
  onClose: () => void;
  onSubmit: (values: { name: string; beds: string }) => Promise<ActionResult>;
  onSaved: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const title =
    kind === "house"
      ? mode === "create" ? t.createHouse : t.editHouse
      : mode === "create" ? t.createRoom : t.editRoom;

  function submit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await onSubmit(values);
      if (result.ok) {
        onSaved();
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.fieldErrors ? null : result.error);
    });
  }

  const formId = `${kind}-form`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={t.cancel}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" form={formId} disabled={pending}>
            {t.save}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {formError && (
          <p className="rounded-input border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}
        <Field label={t.name} htmlFor={`${formId}-name`} error={errors.name}>
          <Input
            id={`${formId}-name`}
            value={values.name}
            maxLength={MAX_NAME_LENGTH}
            placeholder={kind === "house" ? t.houseNamePlaceholder : t.roomNamePlaceholder}
            aria-invalid={errors.name ? true : undefined}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className={cn(errors.name && "border-danger focus-visible:border-danger")}
          />
        </Field>
        {kind === "room" && (
          <Field label={t.beds} htmlFor={`${formId}-beds`} hint={t.bedsHint} error={errors.beds}>
            <Input
              id={`${formId}-beds`}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_BEDS}
              value={values.beds}
              aria-invalid={errors.beds ? true : undefined}
              onChange={(e) => setValues((v) => ({ ...v, beds: e.target.value }))}
              className={cn("w-28 tabular-nums", errors.beds && "border-danger focus-visible:border-danger")}
            />
          </Field>
        )}
      </form>
    </Dialog>
  );
}

/** Confirmation for destructive actions; names how many assignments go away. */
export function ConfirmDeleteDialog({
  open,
  title,
  impact,
  pending,
  onClose,
  onConfirm,
  describeImpact = de.rooms.confirm.impact,
}: {
  open: boolean;
  title: string;
  impact: number | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Wording of the hosting planner; defaults to room planning. */
  describeImpact?: (count: number) => string;
}) {
  const c = de.rooms.confirm;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={c.cancel}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {c.cancel}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={pending || impact === null}>
            {c.confirm}
          </Button>
        </>
      }
    >
      <p className="text-sm text-foreground">
        {impact === null ? de.common.loading : describeImpact(impact)}
      </p>
    </Dialog>
  );
}
