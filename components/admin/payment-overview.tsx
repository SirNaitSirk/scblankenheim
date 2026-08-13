import { Card } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { de } from "@/lib/admin/messages";
import type { FinanceSummary } from "@/lib/admin/types";

/** Zahlungsübersicht: base price, collected vs outstanding, with a progress bar. */
export function PaymentOverview({ summary }: { summary: FinanceSummary }) {
  const ratio =
    summary.expected > 0 ? summary.collected / summary.expected : 0;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          {de.payments.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {de.payments.basePrice} {formatCurrency(summary.basePrice)}{" "}
          {de.payments.perPerson} · {de.payments.expected}{" "}
          {formatCurrency(summary.expected)}
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-input bg-ink-50 p-4">
          <span className="text-xs font-medium text-muted-foreground">
            {de.payments.collected}
          </span>
          <span className="font-display text-2xl font-bold tracking-tight text-success">
            {formatCurrency(summary.collected)}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {summary.paidCount} {de.common.of} {summary.totalCount}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-input bg-ink-50 p-4">
          <span className="text-xs font-medium text-muted-foreground">
            {de.payments.outstanding}
          </span>
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            {formatCurrency(summary.outstanding)}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {formatPercent(ratio)} {de.finances.collectedRatio.toLowerCase()}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-pill bg-ink-100">
          <div
            className="h-full rounded-pill bg-accent transition-[width] duration-500 ease-[var(--ease-out-expo)]"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
