"use client";

import { GearSix, PencilSimple, Plus, Tent, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { CampFormDialog } from "@/components/admin/camp-form-dialog";
import { EmptyState } from "@/components/admin/states";
import { PageHeader } from "@/components/admin/page-header";
import {
  createCampAction,
  deleteCampAction,
  setCurrentCampAction,
  updateCampAction,
} from "@/app/admin/camps/actions";
import { formatCurrency, formatDateLong, formatNumber } from "@/lib/format";
import { de } from "@/lib/admin/messages";
import type { ActionResult, Camp, CampFormValues } from "@/lib/admin/types";

type DialogState = { mode: "create" | "edit"; camp: Camp | null } | null;

export function CampsBoard({
  camps,
  canWrite,
}: {
  camps: Camp[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Camp | null>(null);

  const hasCurrent = camps.some((c) => c.isCurrent);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  // Runs a fire-and-forget action (set current / delete) and refreshes on success.
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

  const submitCamp = useCallback(
    (values: CampFormValues): Promise<ActionResult> =>
      dialog?.mode === "edit" && dialog.camp
        ? updateCampAction(dialog.camp.id, values)
        : createCampAction(values),
    [dialog],
  );

  const onFormSuccess = useCallback(() => {
    showToast(dialog?.mode === "edit" ? de.camps.toast.updated : de.camps.toast.created);
    setDialog(null);
    router.refresh();
  }, [dialog, router, showToast]);

  return (
    <>
      <PageHeader
        title={de.camps.title}
        description={de.camps.description}
        actions={
          canWrite ? (
            <Button
              size="sm"
              onClick={() => setDialog({ mode: "create", camp: null })}
            >
              <Plus size={16} weight="bold" />
              {de.camps.create}
            </Button>
          ) : undefined
        }
      />

      {!hasCurrent && camps.length > 0 && (
        <p className="rounded-input border border-border bg-ink-50 px-4 py-3 text-sm text-muted-foreground">
          {de.camps.noCurrent}
        </p>
      )}

      {camps.length === 0 ? (
        <EmptyState
          icon={Tent}
          title={de.camps.empty.title}
          description={de.camps.empty.description}
          action={
            canWrite ? (
              <Button
                size="sm"
                onClick={() => setDialog({ mode: "create", camp: null })}
              >
                <Plus size={16} weight="bold" />
                {de.camps.create}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {camps.map((camp) => {
            const fill =
              camp.capacity > 0
                ? Math.min(100, Math.round((camp.registrations / camp.capacity) * 100))
                : 0;
            return (
              <Card key={camp.id} className="flex flex-col gap-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                        {camp.name}
                      </h2>
                      {camp.isCurrent && <Badge tone="paid">{de.camps.current}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{camp.location}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge tone={camp.registrationOpen ? "pending" : "neutral"}>
                      {camp.registrationOpen
                        ? de.camps.registrationOpen
                        : de.camps.registrationClosed}
                    </Badge>
                    {canWrite && (
                      <Menu
                        label={de.camps.actions}
                        items={[
                          {
                            label: de.camps.edit,
                            icon: PencilSimple,
                            onSelect: () => setDialog({ mode: "edit", camp }),
                          },
                          {
                            label: de.camps.delete,
                            icon: Trash,
                            danger: true,
                            onSelect: () => setDeleteTarget(camp),
                          },
                        ]}
                      />
                    )}
                  </div>
                </div>

                {camp.startDate && camp.endDate && (
                  <p className="text-sm text-foreground">
                    {formatDateLong(camp.startDate)} bis {formatDateLong(camp.endDate)}
                  </p>
                )}

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{de.camps.capacity}</span>
                    <span className="font-mono tabular-nums">
                      {formatNumber(camp.registrations)} {de.common.of}{" "}
                      {formatNumber(camp.capacity)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-pill bg-ink-100">
                    <div
                      className="h-full rounded-pill bg-accent"
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="flex flex-col">
                    <span className="font-display text-base font-bold tracking-tight text-foreground">
                      {formatCurrency(camp.basePrice)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {de.camps.formFields(camp.formFieldCount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/camps/${camp.id}/felder`)}
                    >
                      <GearSix size={16} weight="regular" />
                      {de.camps.configureFields}
                    </Button>
                    {canWrite && !camp.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          runAction(
                            setCurrentCampAction(camp.id),
                            de.camps.toast.setCurrent,
                          )
                        }
                      >
                        {de.camps.setCurrent}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CampFormDialog
        key={dialog ? `${dialog.mode}-${dialog.camp?.id ?? "new"}` : "closed"}
        open={dialog !== null}
        mode={dialog?.mode ?? "create"}
        camp={dialog?.camp ?? null}
        onClose={() => setDialog(null)}
        onSubmit={submitCamp}
        onSuccess={onFormSuccess}
      />

      <DeleteCampDialog
        key={deleteTarget?.id ?? "none"}
        camp={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(camp) => {
          setDeleteTarget(null);
          runAction(deleteCampAction(camp.id), de.camps.toast.deleted);
        }}
      />

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

function DeleteCampDialog({
  camp,
  onClose,
  onConfirm,
}: {
  camp: Camp | null;
  onClose: () => void;
  onConfirm: (camp: Camp) => void;
}) {
  // Remounted via `key` per target, so the field starts empty on each open.
  const [confirmName, setConfirmName] = useState("");
  const matches = camp !== null && confirmName.trim() === camp.name;

  return (
    <Dialog
      open={camp !== null}
      onClose={onClose}
      title={de.camps.remove.title}
      description={camp ? de.camps.remove.description(camp.name) : undefined}
      closeLabel={de.camps.remove.cancel}
      footer={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {de.camps.remove.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={!matches}
            onClick={() => camp && onConfirm(camp)}
          >
            {de.camps.remove.confirm}
          </Button>
        </>
      }
    >
      <Field label={de.camps.remove.confirmHint} htmlFor="camp-delete-confirm">
        <Input
          id="camp-delete-confirm"
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          placeholder={de.camps.remove.confirmPlaceholder}
          autoComplete="off"
        />
      </Field>
    </Dialog>
  );
}
