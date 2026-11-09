"use client";

import { CaretRight } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import {
  PAYMENT_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  de,
} from "@/lib/admin/messages";
import type { Registration } from "@/lib/admin/types";
import { paymentTone, statusTone } from "./registrations-table";

/**
 * Phone view of the registrations (specs/040-admin-mobile-app): one card per
 * row, fed by the same filtered and sorted rows as the table, so search,
 * filters and sort behave identically. Tapping a card opens the dialog.
 */
export function RegistrationCardList({
  rows,
  onEdit,
  canWrite,
}: {
  rows: Registration[];
  onEdit: (registration: Registration) => void;
  canWrite: boolean;
}) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {rows.map((row) => (
        <li key={row.id}>
          {canWrite ? (
            <button
              type="button"
              onClick={() => onEdit(row)}
              aria-label={`${de.registrations.openRow}: ${row.firstName} ${row.lastName}`}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors duration-150",
                "active:bg-ink-50 focus-visible:outline-none focus-visible:bg-ink-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                row.deleted && "opacity-55",
              )}
            >
              <CardBody row={row} />
              <CaretRight size={16} weight="bold" className="shrink-0 text-ink-300" />
            </button>
          ) : (
            <div className={cn("flex items-center gap-3 px-4 py-4", row.deleted && "opacity-55")}>
              <CardBody row={row} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function CardBody({ row }: { row: Registration }) {
  const outstanding = Math.max(0, row.amountDue - row.amountPaid);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">
          {row.firstName} {row.lastName}
        </span>
        <span className="truncate text-xs text-muted-foreground">{row.email}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {row.status === "cancelled" && (
          <Badge tone={statusTone[row.status]}>
            {REGISTRATION_STATUS_LABELS[row.status]}
          </Badge>
        )}
        <Badge tone={paymentTone[row.payment]}>{PAYMENT_STATUS_LABELS[row.payment]}</Badge>
        {row.amountPaid > row.amountDue && (
          <Badge tone="danger">{de.registrations.overpaid}</Badge>
        )}
        {row.deleted && <Badge tone="danger">{de.registrations.deletedBadge}</Badge>}
        {row.openMessages > 0 && (
          <Badge tone="pending">{de.participantMessages.badge(row.openMessages)}</Badge>
        )}
      </div>
      <dl className="flex gap-6 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{de.registrations.card.due}</dt>
          <dd className="font-mono tabular-nums">{formatCurrency(row.amountDue)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{de.registrations.card.outstanding}</dt>
          <dd className="font-mono tabular-nums">{formatCurrency(outstanding)}</dd>
        </div>
      </dl>
    </div>
  );
}
