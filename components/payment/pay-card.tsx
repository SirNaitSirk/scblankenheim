import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { outstandingAmount } from "@/lib/payment/eligibility";
import type { PublicRegistration } from "@/lib/payment/lookup";
import { paymentMessages } from "@/lib/payment/messages";

const copy = paymentMessages.open;

/**
 * Open payment: greeting, camp, outstanding amount and a plain form post to
 * /api/checkout, so paying works without JavaScript. Shows only first name,
 * camp and amount (FR-015).
 */
export function PayCard({
  registration,
  hint,
}: {
  registration: PublicRegistration;
  hint?: ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-8 shadow-card">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
        {copy.greeting(registration.firstName)}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {copy.body(registration.campName)}
      </p>

      {hint && (
        <p className="mt-5 rounded-input border border-border bg-canvas px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">{copy.amountLabel}</dt>
          <dd className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
            {formatCurrency(outstandingAmount(registration))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">{copy.referenceLabel}</dt>
          <dd className="mt-2 font-mono text-sm text-foreground">{registration.reference}</dd>
        </div>
      </dl>

      <form method="post" action="/api/checkout" className="mt-8">
        <input type="hidden" name="reference" value={registration.reference} />
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          {copy.pay}
        </Button>
      </form>
    </section>
  );
}
