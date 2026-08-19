import { Badge } from "@/components/ui/badge";
import { DashboardMetricsDialog } from "@/components/admin/dashboard-metrics-dialog";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { PaymentOverview } from "@/components/admin/payment-overview";
import { RegistrationsManager } from "@/components/admin/registrations-manager";
import { StatCard } from "@/components/admin/stat-card";
import { canUseSection } from "@/lib/admin/access";
import {
  buildMetricCatalog,
  DEFAULT_METRICS,
  resolveMetric,
} from "@/lib/admin/dashboard-metrics";
import {
  getCampFormFields,
  getCurrentCamp,
  getCurrentProfile,
  getFinanceSummary,
  getPriceTiers,
  getRegistrations,
} from "@/lib/admin/data";
import { de } from "@/lib/admin/messages";
import { updateDashboardMetrics } from "./dashboard-actions";

export default async function DashboardPage() {
  // Dashboard is always visible; only its registration actions are permission-gated.
  // MOCK BOUNDARY: swap these getters for real Supabase reads (server-side).
  const [profile, camp, registrations, priceTiers, finance] = await Promise.all([
    getCurrentProfile(),
    getCurrentCamp(),
    getRegistrations(),
    getPriceTiers(),
    getFinanceSummary(),
  ]);

  // The registration dialog is built from the current camp's dynamic fields.
  const formFields = camp ? await getCampFormFields(camp.id) : [];

  const canWriteRegistrations = profile
    ? canUseSection(profile, "registrations")
    : false;

  const active = registrations.filter((r) => !r.deleted);

  // Each admin picks which metric cards show (per-user preference). An empty
  // selection falls back to the defaults so existing users see no change.
  const catalog = buildMetricCatalog(formFields);
  const selection =
    profile && profile.dashboardMetrics.length > 0
      ? profile.dashboardMetrics
      : DEFAULT_METRICS;
  const cards = selection
    .map((metric, index) =>
      resolveMetric(metric, { active, finance, camp, catalog }, index === 0),
    )
    .filter((card) => card !== null);

  return (
    <PageBody>
      <PageHeader
        title={de.dashboard.title}
        badge={<Badge tone="paid">{camp.name}</Badge>}
        description={de.dashboard.description(camp.name)}
        actions={
          <DashboardMetricsDialog
            catalog={catalog}
            initial={selection}
            action={updateDashboardMetrics}
          />
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.id}
            hero={card.hero}
            label={card.label}
            value={card.value}
            delta={card.delta}
          />
        ))}
      </div>

      <PaymentOverview summary={finance} />

      <RegistrationsManager
        initialRegistrations={registrations}
        priceTiers={priceTiers}
        formFields={formFields}
        canWrite={canWriteRegistrations}
        userId={profile?.id ?? null}
      />
    </PageBody>
  );
}
