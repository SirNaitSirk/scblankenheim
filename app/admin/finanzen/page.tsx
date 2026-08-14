import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import {
  getCurrentCamp,
  getFinanceSummary,
  getPriceTiers,
} from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { de } from "@/lib/admin/messages";

export default async function FinancesPage() {
  await guardTab("/admin/finanzen");

  // MOCK BOUNDARY: swap for real Supabase aggregates (server-side).
  const [camp, finance, tiers] = await Promise.all([
    getCurrentCamp(),
    getFinanceSummary(),
    getPriceTiers(),
  ]);

  const paidRatio =
    finance.totalCount > 0 ? finance.paidCount / finance.totalCount : 0;
  const collectedRatio =
    finance.expected > 0 ? finance.collected / finance.expected : 0;
  const totalRevenue = tiers.reduce((sum, t) => sum + t.price * t.count, 0);

  return (
    <PageBody>
      <PageHeader
        title={de.finances.title}
        badge={<Badge tone="paid">{camp.name}</Badge>}
        description={de.finances.description(camp.name)}
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
          label={de.finances.collectedRatio}
          value={formatPercent(collectedRatio)}
        />
        <StatCard
          label={de.finances.paidRegistrations}
          value={`${formatNumber(finance.paidCount)} / ${formatNumber(finance.totalCount)}`}
          delta={`${formatPercent(paidRatio)} ${de.payments.collected.toLowerCase()}`}
        />
      </div>

      <Card className="flex flex-col">
        <div className="p-6 pb-4">
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
            {de.finances.tierBreakdown}
          </h2>
        </div>
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-6 py-3 text-left font-medium">
                  {de.finances.tierColumns.tier}
                </th>
                <th className="px-6 py-3 text-right font-medium">
                  {de.finances.tierColumns.price}
                </th>
                <th className="px-6 py-3 text-right font-medium">
                  {de.finances.tierColumns.count}
                </th>
                <th className="px-6 py-3 text-right font-medium">
                  {de.finances.tierColumns.revenue}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tiers.map((tier) => (
                <tr key={tier.id} className="text-foreground">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tier.name}</span>
                      {tier.hidden && (
                        <Badge tone="neutral">{de.finances.hiddenTier}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums text-muted-foreground">
                    {formatCurrency(tier.price)}
                  </td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums">
                    {formatNumber(tier.count)}
                  </td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums">
                    {formatCurrency(tier.price * tier.count)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-medium text-foreground">
                <td className="px-6 py-3">{de.payments.collected}</td>
                <td className="px-6 py-3" aria-hidden />
                <td className="px-6 py-3 text-right font-mono tabular-nums">
                  {formatNumber(tiers.reduce((s, t) => s + t.count, 0))}
                </td>
                <td className="px-6 py-3 text-right font-mono tabular-nums">
                  {formatCurrency(totalRevenue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </PageBody>
  );
}
