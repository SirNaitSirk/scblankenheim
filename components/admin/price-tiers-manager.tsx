"use client";

import {
  ArrowsClockwise,
  Copy,
  PencilSimple,
  Plus,
  StopCircle,
  Tag,
  Trash,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { EmptyState } from "@/components/admin/states";
import { PriceTierFormDialog } from "@/components/admin/price-tier-form-dialog";
import {
  createPriceTierAction,
  deletePriceTierAction,
  endPriceTierAction,
  regeneratePriceTierLinkAction,
  updatePriceTierAction,
} from "@/app/admin/preise/actions";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { de } from "@/lib/admin/messages";
import type {
  ActionResult,
  PriceTier,
  PriceTierFormValues,
  PriceTierStatus,
} from "@/lib/admin/types";

type DialogState = { mode: "create" | "edit"; tier: PriceTier | null } | null;
type ConfirmKind = "regenerate" | "end" | "delete";
type ConfirmState = { kind: ConfirmKind; tier: PriceTier } | null;

const t = de.pricing;

const STATUS_TONE: Record<PriceTierStatus, "paid" | "pending" | "neutral"> = {
  active: "paid",
  scheduled: "pending",
  expired: "neutral",
};

function invitationLink(token: string): string {
  return `${window.location.origin}/?einladung=${encodeURIComponent(token)}`;
}

function validityLabel(tier: PriceTier): string {
  const { validFrom, validUntil } = tier;
  if (validFrom && validUntil) {
    return `${formatDateTime(validFrom)} bis ${formatDateTime(validUntil)}`;
  }
  if (validFrom) return t.validity.from(formatDateTime(validFrom));
  if (validUntil) return t.validity.until(formatDateTime(validUntil));
  return t.validity.always;
}

export function PriceTiersManager({
  tiers,
  basePrice,
  canWrite,
}: {
  tiers: PriceTier[];
  basePrice: number;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const copyLink = useCallback(
    async (token: string) => {
      const link = invitationLink(token);
      try {
        await navigator.clipboard.writeText(link);
        showToast(t.toast.copied);
      } catch {
        setFallbackLink(link);
      }
    },
    [showToast],
  );

  const submitTier = useCallback(
    (values: PriceTierFormValues): Promise<ActionResult> =>
      dialog?.mode === "edit" && dialog.tier
        ? updatePriceTierAction(dialog.tier.id, values)
        : createPriceTierAction(values),
    [dialog],
  );

  const onFormSuccess = useCallback(() => {
    showToast(dialog?.mode === "edit" ? t.toast.updated : t.toast.created);
    setDialog(null);
    router.refresh();
  }, [dialog, router, showToast]);

  const runConfirmed = useCallback(() => {
    if (!confirm) return;
    const { kind, tier } = confirm;
    startTransition(async () => {
      const [action, success] =
        kind === "regenerate"
          ? [regeneratePriceTierLinkAction(tier.id), t.toast.regenerated]
          : kind === "end"
            ? [endPriceTierAction(tier.id), t.toast.ended]
            : [deletePriceTierAction(tier.id), t.toast.deleted];
      const result = await action;
      setConfirm(null);
      showToast(result.ok ? success : result.error);
      if (result.ok) router.refresh();
    });
  }, [confirm, router, showToast]);

  const openCreate = () => setDialog({ mode: "create", tier: null });

  function rowMenu(tier: PriceTier, status: PriceTierStatus): MenuItem[] {
    const items: MenuItem[] = [
      { label: t.edit, icon: PencilSimple, onSelect: () => setDialog({ mode: "edit", tier }) },
      {
        label: t.regenerate,
        icon: ArrowsClockwise,
        onSelect: () => setConfirm({ kind: "regenerate", tier }),
      },
    ];
    if (status !== "expired") {
      items.push({
        label: t.end,
        icon: StopCircle,
        onSelect: () => setConfirm({ kind: "end", tier }),
      });
    }
    items.push({
      label: t.delete,
      icon: Trash,
      danger: true,
      // Tiers with registrations stay for reporting; explain instead of failing.
      onSelect: () =>
        tier.count > 0
          ? showToast(t.errors.hasRegistrations)
          : setConfirm({ kind: "delete", tier }),
    });
    return items;
  }

  const totalCount = tiers.reduce((sum, tier) => sum + tier.count, 0);
  const totalRevenue = tiers.reduce((sum, tier) => sum + tier.price * tier.count, 0);

  const createButton = canWrite ? (
    <Button size="sm" onClick={openCreate}>
      <Plus size={16} weight="bold" />
      {t.create}
    </Button>
  ) : null;

  const confirmCopy = confirm
    ? {
        regenerate: {
          title: t.confirm.regenerateTitle,
          description: t.confirm.regenerateDescription(confirm.tier.name),
          label: t.confirm.regenerateConfirm,
        },
        end: {
          title: t.confirm.endTitle,
          description: t.confirm.endDescription(confirm.tier.name),
          label: t.confirm.endConfirm,
        },
        delete: {
          title: t.confirm.deleteTitle,
          description: t.confirm.deleteDescription(confirm.tier.name),
          label: t.confirm.deleteConfirm,
        },
      }[confirm.kind]
    : null;

  return (
    <>
      <Card className="flex flex-col">
        <div className="flex flex-col gap-4 p-6 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
              {t.tiersTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{t.tiersDescription}</p>
            <p className="text-sm text-foreground">
              {t.basePrice(formatCurrency(basePrice))}
            </p>
          </div>
          {tiers.length > 0 && createButton}
        </div>

        {tiers.length === 0 ? (
          <EmptyState
            icon={Tag}
            title={t.empty.title}
            description={t.empty.description}
            action={createButton}
            className="border-t border-border"
          />
        ) : (
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-6 py-3 text-left font-medium">{t.tierColumns.tier}</th>
                  <th className="px-6 py-3 text-right font-medium">{t.tierColumns.price}</th>
                  <th className="px-6 py-3 text-left font-medium">{t.tierColumns.validity}</th>
                  <th className="px-6 py-3 text-right font-medium">{t.tierColumns.count}</th>
                  <th className="px-6 py-3 text-right font-medium">{t.tierColumns.revenue}</th>
                  <th className="px-6 py-3 text-right font-medium">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tiers.map((tier) => {
                  const { status } = tier;
                  return (
                    <tr key={tier.id} className="text-foreground">
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{tier.name}</span>
                          <Badge tone={STATUS_TONE[status]}>{t.status[status]}</Badge>
                          {!tier.hidden && <Badge tone="neutral">{t.publicTier}</Badge>}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-mono tabular-nums">
                        {formatCurrency(tier.price)}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {validityLabel(tier)}
                      </td>
                      <td className="px-6 py-3 text-right font-mono tabular-nums">
                        {formatNumber(tier.count)}
                      </td>
                      <td className="px-6 py-3 text-right font-mono tabular-nums">
                        {formatCurrency(tier.price * tier.count)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {tier.invitationToken ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyLink(tier.invitationToken!)}
                            >
                              <Copy size={16} weight="regular" />
                              {t.copyLink}
                            </Button>
                          ) : (
                            <span className="px-4 text-xs text-muted-foreground">
                              {t.noLink}
                            </span>
                          )}
                          {canWrite && <Menu label={t.actions} items={rowMenu(tier, status)} />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-medium text-foreground">
                  <td className="px-6 py-3">{t.total}</td>
                  <td className="px-6 py-3" aria-hidden />
                  <td className="px-6 py-3" aria-hidden />
                  <td className="px-6 py-3 text-right font-mono tabular-nums">
                    {formatNumber(totalCount)}
                  </td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums">
                    {formatCurrency(totalRevenue)}
                  </td>
                  <td className="px-6 py-3" aria-hidden />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <PriceTierFormDialog
        key={dialog ? `${dialog.mode}-${dialog.tier?.id ?? "new"}` : "closed"}
        open={dialog !== null}
        mode={dialog?.mode ?? "create"}
        tier={dialog?.tier ?? null}
        onClose={() => setDialog(null)}
        onSubmit={submitTier}
        onSuccess={onFormSuccess}
      />

      <Dialog
        open={confirm !== null}
        onClose={() => !pending && setConfirm(null)}
        title={confirmCopy?.title ?? ""}
        description={confirmCopy?.description}
        closeLabel={t.form.close}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirm(null)}
              disabled={pending}
            >
              {t.confirm.cancel}
            </Button>
            <Button
              type="button"
              variant={confirm?.kind === "delete" ? "danger" : "primary"}
              size="sm"
              onClick={runConfirmed}
              disabled={pending}
            >
              {pending ? t.confirm.working : confirmCopy?.label}
            </Button>
          </>
        }
      >
        {null}
      </Dialog>

      <Dialog
        open={fallbackLink !== null}
        onClose={() => setFallbackLink(null)}
        title={t.linkFallback.title}
        description={t.linkFallback.description}
        closeLabel={t.linkFallback.close}
      >
        <Input
          readOnly
          value={fallbackLink ?? ""}
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
          aria-label={t.linkFallback.title}
        />
      </Dialog>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-center text-sm text-on-inverse shadow-pop"
        >
          {toast}
        </div>
      )}
    </>
  );
}
