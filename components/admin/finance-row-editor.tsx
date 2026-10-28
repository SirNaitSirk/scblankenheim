"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import {
  MAX_FINANCE_AMOUNT,
  PAYMENT_STATUSES,
  suggestPaymentStatus,
  type FinanceRow,
} from "@/lib/admin/finance";
import { PAYMENT_STATUS_LABELS, de } from "@/lib/admin/messages";
import type { PaymentStatus } from "@/lib/admin/types";

const t = de.finances.editor;

const PAYMENT_OPTIONS = PAYMENT_STATUSES.map((value) => ({
  value,
  label: PAYMENT_STATUS_LABELS[value],
}));

export type FinanceEdit = { amountPaid: number; payment: PaymentStatus };

// Whole euros from 0 up to the limit, or null for anything else.
function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value <= MAX_FINANCE_AMOUNT ? value : null;
}

/**
 * Paid amount and status for one registration. Typing an amount suggests the
 * matching status until a status is picked by hand. Enter saves,
 * Escape cancels. `layout` switches between the table row and the mobile sheet.
 */
export function FinanceRowEditor({
  row,
  pending,
  layout,
  onSave,
  onCancel,
}: {
  row: FinanceRow;
  pending: boolean;
  layout: "inline" | "stacked";
  onSave: (edit: FinanceEdit) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [amount, setAmount] = useState(String(row.amountPaid));
  const [payment, setPayment] = useState<PaymentStatus>(row.payment);
  const [statusTouched, setStatusTouched] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAmountChange = (raw: string) => {
    setAmount(raw);
    setError(null);
    const parsed = parseAmount(raw);
    if (parsed === null || statusTouched) return;
    const next = suggestPaymentStatus(row.amountDue, parsed);
    setSuggested(next !== row.payment);
    setPayment(next);
  };

  const submit = () => {
    const parsed = parseAmount(amount);
    if (parsed === null) {
      setError(t.invalidAmount);
      return;
    }
    onSave({ amountPaid: parsed, payment });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }
  };

  const stacked = layout === "stacked";

  return (
    <div
      className={cn("flex gap-3", stacked ? "flex-col" : "flex-wrap items-start")}
      onKeyDown={onKeyDown}
    >
      <div className={cn("flex flex-col gap-1.5", stacked ? "w-full" : "w-32")}>
        <label htmlFor={`${id}-amount`} className={cn("text-xs font-medium text-muted-foreground", !stacked && "sr-only")}>
          {t.amountPaid}
        </label>
        <div className="relative">
          <Input
            id={`${id}-amount`}
            inputMode="numeric"
            autoFocus
            value={amount}
            disabled={pending}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(e) => onAmountChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="pr-8 text-right font-mono tabular-nums"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            €
          </span>
        </div>
      </div>
      <div className={cn("flex flex-col gap-1.5", stacked ? "w-full" : "w-40")}>
        <label htmlFor={`${id}-payment`} className={cn("text-xs font-medium text-muted-foreground", !stacked && "sr-only")}>
          {t.payment}
        </label>
        <Select
          id={`${id}-payment`}
          value={payment}
          disabled={pending}
          options={PAYMENT_OPTIONS}
          onChange={(e) => {
            setPayment(e.target.value as PaymentStatus);
            setStatusTouched(true);
            setSuggested(false);
          }}
        />
      </div>
      <div className={cn("flex items-center gap-2", stacked && "mt-1 justify-end")}>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={pending}>
          {t.cancel}
        </Button>
        <Button size="sm" variant="inverse" onClick={submit} disabled={pending}>
          {pending ? t.saving : t.save}
        </Button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="w-full text-xs text-danger">
          {error}
        </p>
      ) : suggested ? (
        <p className="w-full text-xs text-muted-foreground">{t.suggested}</p>
      ) : null}
    </div>
  );
}
