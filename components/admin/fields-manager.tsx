"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ListPlus,
  PencilSimple,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  createFieldAction,
  deleteFieldAction,
  reorderFieldsAction,
  updateFieldAction,
} from "@/app/admin/camps/[campId]/felder/actions";
import { FieldFormDialog } from "@/components/admin/field-form-dialog";
import { FieldPreview } from "@/components/admin/field-preview";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FIELD_TYPES } from "@/lib/admin/field-types";
import { de } from "@/lib/admin/messages";
import type {
  ActionResult,
  CampFormField,
  FieldFormValues,
} from "@/lib/admin/types";

type DialogState = { mode: "create" | "edit"; field: CampFormField | null } | null;

function typeLabel(fieldType: string): string {
  return FIELD_TYPES.includes(fieldType as (typeof FIELD_TYPES)[number])
    ? de.fields.types[fieldType as (typeof FIELD_TYPES)[number]]
    : fieldType;
}

export function FieldsManager({
  campId,
  campName,
  fields,
  canWrite,
}: {
  campId: string;
  campName: string;
  fields: CampFormField[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampFormField | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const runAction = useCallback(
    (action: Promise<ActionResult>, successMessage: string) => {
      startTransition(async () => {
        const result = await action;
        if (result.ok) {
          showToast(successMessage);
          router.refresh();
        } else {
          showToast(result.error);
        }
      });
    },
    [router, showToast],
  );

  const submitField = useCallback(
    (values: FieldFormValues): Promise<ActionResult> =>
      dialog?.mode === "edit" && dialog.field
        ? updateFieldAction(campId, dialog.field.id, values)
        : createFieldAction(campId, values),
    [campId, dialog],
  );

  const onFormSuccess = useCallback(() => {
    showToast(dialog?.mode === "edit" ? de.fields.toast.updated : de.fields.toast.created);
    setDialog(null);
    router.refresh();
  }, [dialog, router, showToast]);

  // Reorder by swapping a field with its neighbour, then persist the full order.
  const move = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= fields.length) return;
      const next = [...fields];
      [next[index], next[target]] = [next[target], next[index]];
      runAction(
        reorderFieldsAction(campId, next.map((f) => f.id)),
        de.fields.toast.reordered,
      );
    },
    [campId, fields, runAction],
  );

  return (
    <>
      <PageHeader
        title={de.fields.title}
        description={de.fields.description(campName)}
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/camps")}
            >
              <ArrowLeft size={16} weight="bold" />
              {de.fields.back}
            </Button>
            {canWrite && (
              <Button
                size="sm"
                onClick={() => setDialog({ mode: "create", field: null })}
              >
                <Plus size={16} weight="bold" />
                {de.fields.add}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        {fields.length === 0 ? (
          <Card className="lg:col-span-1">
            <EmptyState
              icon={ListPlus}
              title={de.fields.empty.title}
              description={de.fields.empty.description}
              action={
                canWrite ? (
                  <Button
                    size="sm"
                    onClick={() => setDialog({ mode: "create", field: null })}
                  >
                    <Plus size={16} weight="bold" />
                    {de.fields.add}
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <Card key={field.id} className="flex items-center gap-3 p-4">
                {canWrite && (
                  <div className="flex flex-col">
                    <button
                      type="button"
                      aria-label={de.fields.moveUp}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ArrowUp size={14} weight="bold" />
                    </button>
                    <button
                      type="button"
                      aria-label={de.fields.moveDown}
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ArrowDown size={14} weight="bold" />
                    </button>
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-foreground">{field.label}</span>
                    <Badge tone="neutral">{typeLabel(field.fieldType)}</Badge>
                    {field.required && <Badge tone="pending">{de.fields.requiredShort}</Badge>}
                  </div>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {field.key}
                  </span>
                </div>

                {canWrite && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={de.fields.edit}
                      onClick={() => setDialog({ mode: "edit", field })}
                      className="flex h-8 w-8 items-center justify-center rounded-input text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <PencilSimple size={16} weight="regular" />
                    </button>
                    <button
                      type="button"
                      aria-label={de.fields.delete}
                      onClick={() => setDeleteTarget(field)}
                      className="flex h-8 w-8 items-center justify-center rounded-input text-muted-foreground transition-colors duration-150 hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash size={16} weight="regular" />
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <Card className="flex flex-col gap-4 p-6 lg:sticky lg:top-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-base font-bold tracking-tight text-foreground">
              {de.fields.preview.title}
            </h2>
            <p className="text-sm text-muted-foreground">{de.fields.preview.description}</p>
          </div>
          <div className="border-t border-border pt-4">
            <FieldPreview fields={fields} />
          </div>
        </Card>
      </div>

      <FieldFormDialog
        key={dialog ? `${dialog.mode}-${dialog.field?.id ?? "new"}` : "closed"}
        open={dialog !== null}
        mode={dialog?.mode ?? "create"}
        field={dialog?.field ?? null}
        onClose={() => setDialog(null)}
        onSubmit={submitField}
        onSuccess={onFormSuccess}
      />

      <Dialog
        key={deleteTarget?.id ?? "none"}
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={de.fields.remove.title}
        closeLabel={de.fields.remove.cancel}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              {de.fields.remove.cancel}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                if (!deleteTarget) return;
                const id = deleteTarget.id;
                setDeleteTarget(null);
                runAction(deleteFieldAction(campId, id), de.fields.toast.deleted);
              }}
            >
              {de.fields.remove.confirm}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {de.fields.remove.description(deleteTarget?.label ?? "")}
        </p>
      </Dialog>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-sm text-on-inverse shadow-pop"
        >
          {toast}
        </div>
      )}
    </>
  );
}
