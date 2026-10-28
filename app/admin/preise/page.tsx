import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { PriceTiersManager } from "@/components/admin/price-tiers-manager";
import { StatCard } from "@/components/admin/stat-card";
import { canUseSection } from "@/lib/admin/access";
import {
  getCurrentCamp,
  getCurrentCampId,
  getFinanceSummary,
  getPriceTiers,
} from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { de } from "@/lib/admin/messages";

export default async function PricingPage() {
  const profile = await guardTab("/admin/preise");

  const [currentCampId, camp, finance, tiers] = await Promise.all([
    getCurrentCampId(),
    getCurrentCamp(),
    getFinanceSummary(),
    getPriceTiers(),
  ]);

  const paidRatio =
    finance.totalCount > 0 ? finance.paidCount / finance.totalCount : 0;
  const collectedRatio =
    finance.expected > 0 ? finance.collected / finance.expected : 0;

  return (
    <PageBody>
      <PageHeader
        title={de.pricing.title}
        badge={camp ? <Badge tone="paid">{camp.name}</Badge> : undefined}
        description={camp ? de.pricing.description(camp.name) : undefined}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          hero
          label={de.payments.collected}
          value={formatCurrency(finance.collected)}
          delta={`${formatPercent(collectedRatio)} ${de.payments.expected.toLowerCase()}`}
        />
        <StatCard
          label={de.payments.outstanding}
          value={formatCurrency(finance.outstanding)}
          delta={`${de.payments.expected} ${formatCurrency(finance.expected)}`}
        />
        <StatCard
          label={de.pricing.collectedRatio}
          value={formatPercent(collectedRatio)}
        />
        <StatCard
          label={de.pricing.paidRegistrations}
          value={`${formatNumber(finance.paidCount)} / ${formatNumber(finance.totalCount)}`}
          delta={`${formatPercent(paidRatio)} ${de.payments.collected.toLowerCase()}`}
        />
      </div>

      {currentCampId ? (
        <PriceTiersManager
          tiers={tiers}
          basePrice={finance.basePrice}
          canWrite={canUseSection(profile, "finances")}
        />
      ) : (
        <p className="rounded-input border border-border bg-ink-50 px-4 py-3 text-sm text-muted-foreground">
          {de.pricing.noCurrentCamp}
        </p>
      )}
    </PageBody>
  );
}
