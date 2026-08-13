import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { PaymentOverview } from "@/components/admin/payment-overview";
import { RegistrationsManager } from "@/components/admin/registrations-manager";
import { StatCard } from "@/components/admin/stat-card";
import {
  getCurrentCamp,
  getFinanceSummary,
  getPriceTiers,
  getRegistrations,
} from "@/lib/admin/data";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { de } from "@/lib/admin/messages";

export default async function DashboardPage() {
  // MOCK BOUNDARY: swap these getters for real Supabase reads (server-side).
  const [camp, registrations, priceTiers, finance] = await Promise.all([
    getCurrentCamp(),
    getRegistrations(),
    getPriceTiers(),
    getFinanceSummary(),
  ]);

  const active = registrations.filter((r) => !r.deleted);
  const total = active.length;
  const openCount = active.filter((r) => r.payment !== "paid").length;
  const paidRatio = total > 0 ? finance.paidCount / total : 0;
  const expectedRatio =
    finance.expected > 0 ? finance.collected / finance.expected : 0;

  return (
    <PageBody>
      <PageHeader
        title={de.dashboard.title}
        badge={<Badge tone="paid">{camp.name}</Badge>}
        description={de.dashboard.description(camp.name)}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          hero
          label={de.dashboard.stats.registrations}
          value={formatNumber(total)}
          delta={`${formatNumber(camp.registrations)} ${de.common.of} ${formatNumber(camp.capacity)} ${de.camps.capacity.toLowerCase()}`}
        />
        <StatCard
          label={de.dashboard.stats.paid}
          value={formatNumber(finance.paidCount)}
          delta={`${formatPercent(paidRatio)} ${de.registrations.title.toLowerCase()}`}
        />
        <StatCard
          label={de.dashboard.stats.open}
          value={formatNumber(openCount)}
          delta={`${formatCurrency(finance.outstanding)} ${de.payments.outstanding.toLowerCase()}`}
        />
        <StatCard
          label={de.dashboard.stats.revenue}
          value={formatCurrency(finance.collected)}
          delta={`${formatPercent(expectedRatio)} ${de.payments.expected.toLowerCase()}`}
        />
      </div>

      <PaymentOverview summary={finance} />

      <RegistrationsManager
        initialRegistrations={registrations}
        priceTiers={priceTiers}
      />
    </PageBody>
  );
}
