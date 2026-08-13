"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowsDownUp,
  Copy,
  MagnifyingGlass,
  Trash,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, type MenuItem } from "@/components/ui/menu";
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

export type SortKey = "name" | "registeredAt" | "amountDue";
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

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={cn("px-4 py-3 text-left font-medium", className)}>
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
    </th>
  );
}

export function RegistrationsTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  onDelete,
  onRestore,
  onCopyEmail,
  onResetFilters,
}: {
  rows: Registration[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onCopyEmail: (email: string) => void;
  onResetFilters: () => void;
}) {
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
            <SortHeader
              label={de.registrations.columns.name}
              active={sortKey === "name"}
              dir={sortDir}
              onClick={() => onSort("name")}
            />
            <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
              {de.registrations.columns.contact}
            </th>
            <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground xl:table-cell">
              {de.registrations.columns.city}
            </th>
            <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
              {de.registrations.columns.id}
            </th>
            <SortHeader
              label={de.registrations.columns.registeredAt}
              active={sortKey === "registeredAt"}
              dir={sortDir}
              onClick={() => onSort("registeredAt")}
              className="hidden md:table-cell"
            />
            <SortHeader
              label={de.registrations.columns.amount}
              active={sortKey === "amountDue"}
              dir={sortDir}
              onClick={() => onSort("amountDue")}
            />
            <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
              {de.registrations.columns.payment}
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {de.registrations.columns.status}
            </th>
            <th className="w-12 px-4 py-3" aria-hidden />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const actions: MenuItem[] = [
              {
                label: de.common.copyEmail,
                icon: Copy,
                onSelect: () => onCopyEmail(row.email),
              },
              row.deleted
                ? {
                    label: de.common.restore,
                    onSelect: () => onRestore(row.id),
                  }
                : {
                    label: de.common.delete,
                    icon: Trash,
                    danger: true,
                    onSelect: () => onDelete(row.id),
                  },
            ];
            return (
              <tr
                key={row.id}
                className={cn(
                  "text-foreground transition-colors duration-150 hover:bg-ink-50",
                  row.deleted && "opacity-55",
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {row.firstName} {row.lastName}
                    </span>
                    {row.deleted && (
                      <Badge tone="danger">
                        {de.registrations.deletedBadge}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {row.email}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                  {row.city}
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                  {row.id}
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                  {formatDate(row.registeredAt)}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {formatCurrency(row.amountDue)}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <Badge tone={paymentTone[row.payment]}>
                    {PAYMENT_STATUS_LABELS[row.payment]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[row.status]}>
                    {REGISTRATION_STATUS_LABELS[row.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Menu
                    label={`${de.common.edit} ${row.firstName} ${row.lastName}`}
                    items={actions}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
