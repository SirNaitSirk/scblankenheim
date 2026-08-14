"use client";

import { ArrowDown, ArrowUp, ArrowsDownUp, MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/admin/states";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  PAYMENT_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  de,
} from "@/lib/admin/messages";
import { cn } from "@/lib/cn";
import type {
  PaymentStatus,
  Registration,
  RegistrationStatus,
} from "@/lib/admin/types";
import { type ColumnDef, formatFieldValue } from "./registration-columns";

export type SortDir = "asc" | "desc";

const statusTone: Record<RegistrationStatus, "paid" | "pending" | "danger"> = {
  confirmed: "paid",
  pending: "pending",
  cancelled: "danger",
};

const paymentTone: Record<PaymentStatus, "paid" | "pending" | "neutral"> = {
  paid: "paid",
  partial: "pending",
  unpaid: "neutral",
};

const PAYMENT_OPTIONS = (
  Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]
).map((value) => ({ value, label: PAYMENT_STATUS_LABELS[value] }));

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ArrowUp size={12} weight="bold" />
        ) : (
          <ArrowDown size={12} weight="bold" />
        )
      ) : (
        <ArrowsDownUp size={12} className="text-ink-300" />
      )}
    </button>
  );
}

/** Renders the cell for a given column of a registration row. */
function Cell({
  column,
  row,
  canWrite,
  onPaymentChange,
}: {
  column: ColumnDef;
  row: Registration;
  canWrite: boolean;
  onPaymentChange: (id: string, payment: PaymentStatus) => void;
}) {
  if (column.kind === "field" && column.field) {
    return (
      <td className="px-4 py-3 text-muted-foreground">
        {formatFieldValue(column.field, row.formData[column.field.key])}
      </td>
    );
  }

  switch (column.key) {
    case "name":
      return (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {row.firstName} {row.lastName}
            </span>
            {row.deleted && (
              <Badge tone="danger">{de.registrations.deletedBadge}</Badge>
            )}
          </div>
        </td>
      );
    case "contact":
      return <td className="px-4 py-3 text-muted-foreground">{row.email}</td>;
    case "id":
      return (
        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
          {row.id}
        </td>
      );
    case "registeredAt":
      return (
        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
          {formatDate(row.registeredAt)}
        </td>
      );
    case "amount":
      return (
        <td className="px-4 py-3 font-mono tabular-nums">
          {formatCurrency(row.amountDue)}
        </td>
      );
    case "payment":
      // Editable inline for permitted admins; stop the row-open click/keydown so
      // changing the status never opens the edit dialog.
      return (
        <td
          className="px-4 py-3"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {canWrite ? (
            <div className="w-36">
              <Select
                aria-label={de.registrations.payment}
                value={row.payment}
                onChange={(e) =>
                  onPaymentChange(row.id, e.target.value as PaymentStatus)
                }
                options={PAYMENT_OPTIONS}
              />
            </div>
          ) : (
            <Badge tone={paymentTone[row.payment]}>
              {PAYMENT_STATUS_LABELS[row.payment]}
            </Badge>
          )}
        </td>
      );
    case "status":
      return (
        <td className="px-4 py-3">
          <Badge tone={statusTone[row.status]}>
            {REGISTRATION_STATUS_LABELS[row.status]}
          </Badge>
        </td>
      );
    default:
      return <td className="px-4 py-3" />;
  }
}

export function RegistrationsTable({
  rows,
  columns,
  sortColumn,
  sortDir,
  onSort,
  onReorderColumn,
  onEdit,
  onPaymentChange,
  onResetFilters,
  canWrite,
}: {
  rows: Registration[];
  columns: ColumnDef[];
  sortColumn: string;
  sortDir: SortDir;
  onSort: (key: string) => void;
  onReorderColumn: (fromKey: string, toKey: string) => void;
  onEdit: (registration: Registration) => void;
  onPaymentChange: (id: string, payment: PaymentStatus) => void;
  onResetFilters: () => void;
  canWrite: boolean;
}) {
  // Transient header drag state; the persisted order stays the source of truth.
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const endColumnDrag = () => {
    setDraggingKey(null);
    setOverKey(null);
  };
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={MagnifyingGlass}
        title={de.registrations.empty.title}
        description={de.registrations.empty.description}
        action={
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            {de.registrations.clearFilters}
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-xs">
            {columns.map((column) => (
              <th
                key={column.key}
                draggable
                onDragStart={(e) => {
                  setDraggingKey(column.key);
                  e.dataTransfer.effectAllowed = "move";
                  // Firefox requires data to be set for a drag to start.
                  e.dataTransfer.setData("text/plain", column.key);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (overKey !== column.key) setOverKey(column.key);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingKey && draggingKey !== column.key) {
                    onReorderColumn(draggingKey, column.key);
                  }
                  endColumnDrag();
                }}
                onDragEnd={endColumnDrag}
                className={cn(
                  "cursor-grab select-none px-4 py-3 text-left font-medium text-muted-foreground transition-colors duration-150",
                  draggingKey === column.key && "opacity-50",
                  overKey === column.key &&
                    draggingKey &&
                    draggingKey !== column.key &&
                    "bg-ink-100",
                )}
              >
                {column.sortable ? (
                  <SortHeader
                    label={column.label}
                    active={sortColumn === column.key}
                    dir={sortDir}
                    onClick={() => onSort(column.key)}
                  />
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const rowLabel = `${de.registrations.openRow}: ${row.firstName} ${row.lastName}`;
            return (
              <tr
                key={row.id}
                {...(canWrite
                  ? {
                      role: "button" as const,
                      tabIndex: 0,
                      "aria-label": rowLabel,
                      onClick: () => onEdit(row),
                      onKeyDown: (e: React.KeyboardEvent<HTMLTableRowElement>) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onEdit(row);
                        }
                      },
                    }
                  : {})}
                className={cn(
                  "text-foreground transition-colors duration-150 hover:bg-ink-50",
                  canWrite &&
                    "cursor-pointer focus-visible:outline-none focus-visible:bg-ink-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  row.deleted && "opacity-55",
                )}
              >
                {columns.map((column) => (
                  <Cell
                    key={column.key}
                    column={column}
                    row={row}
                    canWrite={canWrite}
                    onPaymentChange={onPaymentChange}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
