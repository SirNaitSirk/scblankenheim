"use client";

import { Bell, BellSlash, Copy, PaperPlaneTilt, PencilSimple } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { isOverdue, outstandingOf, type FinanceRow } from "@/lib/admin/finance";
import { PAYMENT_STATUS_LABELS, de } from "@/lib/admin/messages";
import type { PaymentStatus } from "@/lib/admin/types";
import { formatCurrency } from "@/lib/format";
import { FinanceRowEditor, type FinanceEdit } from "./finance-row-editor";

const t = de.finances;

const paymentTone: Record<PaymentStatus, "paid" | "pending" | "neutral" | "danger"> = {
  unpaid: "neutral",
  processing: "pending",
  partial: "pending",
  paid: "paid",
  refunded: "neutral",
};

export type FinanceTableProps = {
  rows: FinanceRow[];
  dueDate: string | null;
  today: string;
  canEdit: boolean;
  canCopyLink: boolean;
  editingRef: string | null;
  pendingRef: string | null;
  onStartEdit: (reference: string) => void;
  onCancelEdit: () => void;
  onSave: (row: FinanceRow, edit: FinanceEdit) => void;
  onCopyLink: (row: FinanceRow) => void;
  onSendLink: (row: FinanceRow) => void;
  onTogglePause: (row: FinanceRow) => void;
};

const pause = de.registrations.reminderPause;

function fullName(row: FinanceRow): string {
  return `${row.firstName} ${row.lastName}`.trim() || row.reference;
}

function Outstanding({ row }: { row: FinanceRow }) {
  const value = outstandingOf(row);
  if (value < 0) {
    return <span className="text-success">{t.credit(formatCurrency(-value))}</span>;
  }
  return (
    <span className={value > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}>
      {formatCurrency(value)}
    </span>
  );
}

function StatusBadges({ row, overdue }: { row: FinanceRow; overdue: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone={paymentTone[row.payment]}>{PAYMENT_STATUS_LABELS[row.payment]}</Badge>
      {overdue && <Badge tone="danger">{t.overdueBadge}</Badge>}
      {row.remindersPaused && <Badge tone="neutral">{pause.badge}</Badge>}
    </div>
  );
}

function RowActions({
  row,
  canEdit,
  canCopyLink,
  onStartEdit,
  onCopyLink,
  onSendLink,
  onTogglePause,
  showEdit = true,
}: Pick<
  FinanceTableProps,
  "canEdit" | "canCopyLink" | "onStartEdit" | "onCopyLink" | "onSendLink" | "onTogglePause"
> & {
  row: FinanceRow;
  showEdit?: boolean;
}) {
  if (!canEdit) return null;
  const hasDue =
    outstandingOf(row) > 0 && (row.payment === "unpaid" || row.payment === "partial");
  const iconButton =
    "flex h-9 w-9 items-center justify-center rounded-input text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="flex items-center justify-end gap-1">
      {hasDue && canCopyLink && (
        <button
          type="button"
          className={iconButton}
          onClick={() => onCopyLink(row)}
          aria-label={`${de.paymentLink.copy}: ${fullName(row)}`}
          title={de.paymentLink.copy}
        >
          <Copy size={16} />
        </button>
      )}
      {hasDue && row.email.trim() !== "" && (
        <button
          type="button"
          className={iconButton}
          onClick={() => onSendLink(row)}
          aria-label={`${de.paymentLink.send}: ${fullName(row)}`}
          title={de.paymentLink.send}
        >
          <PaperPlaneTilt size={16} />
        </button>
      )}
      {(hasDue || row.remindersPaused) && (
        <button
          type="button"
          className={iconButton}
          onClick={() => onTogglePause(row)}
          aria-pressed={row.remindersPaused}
          aria-label={`${row.remindersPaused ? pause.resumeAction : pause.pauseAction}: ${fullName(row)}`}
          title={row.remindersPaused ? pause.resumeAction : pause.pauseAction}
        >
          {row.remindersPaused ? <BellSlash size={16} /> : <Bell size={16} />}
        </button>
      )}
      {showEdit && (
        <button
          type="button"
          className={iconButton}
          onClick={() => onStartEdit(row.reference)}
          aria-label={t.editPayment(fullName(row))}
          title={t.enterPayment}
        >
          <PencilSimple size={16} />
        </button>
      )}
    </div>
  );
}

// Clicking the paid amount or the status opens the editor for permitted users.
function EditableCell({
  canEdit,
  label,
  onEdit,
  children,
  className,
}: {
  canEdit: boolean;
  label: string;
  onEdit: () => void;
  children: ReactNode;
  className?: string;
}) {
  if (!canEdit) return <div className={className}>{children}</div>;
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={label}
      className={cn(
        "-mx-2 rounded-input px-2 py-1 transition-colors duration-150 hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Desktop table (md and up) plus stacked cards for phones and small tablets. */
export function FinanceTable(props: FinanceTableProps) {
  const { rows, dueDate, today, canEdit, editingRef, pendingRef, onStartEdit, onCancelEdit, onSave } =
    props;
  const c = t.columns;

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">{c.name}</th>
              <th className="px-4 py-3 text-left font-medium">{c.tier}</th>
              <th className="px-4 py-3 text-right font-medium">{c.due}</th>
              <th className="px-4 py-3 text-right font-medium">{c.paid}</th>
              <th className="px-4 py-3 text-right font-medium">{c.outstanding}</th>
              <th className="px-4 py-3 text-left font-medium">{c.payment}</th>
              <th className="px-4 py-3 text-right font-medium">{c.reminders}</th>
              <th className="px-4 py-3 text-right font-medium">
                <span className="sr-only">{c.actions}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const overdue = isOverdue(row, dueDate, today);
              const editing = editingRef === row.reference;
              const pending = pendingRef === row.reference;
              const edit = () => onStartEdit(row.reference);
              return [
                <tr
                  key={row.reference}
                  className={cn(
                    "text-foreground transition-[background-color,opacity] duration-150 hover:bg-ink-50",
                    editing && "bg-ink-50",
                    pending && "opacity-60",
                  )}
                >
                  <td
                    className={cn(
                      "border-l-2 py-3 pl-4 pr-4",
                      overdue ? "border-l-danger" : "border-l-transparent",
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{fullName(row)}</span>
                      <span className="font-mono text-xs text-muted-foreground">{row.reference}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.priceTierName ?? t.noTier}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {formatCurrency(row.amountDue)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    <EditableCell canEdit={canEdit} label={t.editPayment(fullName(row))} onEdit={edit}>
                      {formatCurrency(row.amountPaid)}
                    </EditableCell>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    <Outstanding row={row} />
                  </td>
                  <td className="px-4 py-3">
                    <EditableCell canEdit={canEdit} label={t.editPayment(fullName(row))} onEdit={edit}>
                      <StatusBadges row={row} overdue={overdue} />
                    </EditableCell>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                    {row.reminderCount}
                  </td>
                  <td className="px-4 py-2">
                    <RowActions row={row} {...props} />
                  </td>
                </tr>,
                editing ? (
                  <tr key={`${row.reference}-edit`} className="bg-ink-50">
                    <td colSpan={8} className="px-4 pb-4 pt-1">
                      <div className="flex justify-end">
                        <FinanceRowEditor
                          row={row}
                          pending={pending}
                          layout="inline"
                          onSave={(value) => onSave(row, value)}
                          onCancel={onCancelEdit}
                        />
                      </div>
                    </td>
                  </tr>
                ) : null,
              ];
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col divide-y divide-border md:hidden">
        {rows.map((row) => {
          const overdue = isOverdue(row, dueDate, today);
          const editing = editingRef === row.reference;
          const pending = pendingRef === row.reference;
          return (
            <li
              key={row.reference}
              className={cn(
                "flex flex-col gap-3 border-l-2 px-4 py-4 transition-opacity duration-150",
                overdue ? "border-l-danger" : "border-l-transparent",
                pending && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-foreground">{fullName(row)}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {row.reference} · {row.priceTierName ?? t.noTier}
                  </span>
                </div>
                <StatusBadges row={row} overdue={overdue} />
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                {(
                  [
                    [t.columns.due, formatCurrency(row.amountDue)],
                    [t.columns.paid, formatCurrency(row.amountPaid)],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="font-mono tabular-nums">{value}</dd>
                  </div>
                ))}
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">{t.columns.outstanding}</dt>
                  <dd className="font-mono tabular-nums">
                    <Outstanding row={row} />
                  </dd>
                </div>
              </dl>
              {editing ? (
                <FinanceRowEditor
                  row={row}
                  pending={pending}
                  layout="stacked"
                  onSave={(value) => onSave(row, value)}
                  onCancel={onCancelEdit}
                />
              ) : canEdit ? (
                <div className="flex items-center justify-between gap-2">
                  <Button size="sm" variant="outline" onClick={() => onStartEdit(row.reference)}>
                    {t.enterPayment}
                  </Button>
                  <RowActions row={row} {...props} showEdit={false} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
