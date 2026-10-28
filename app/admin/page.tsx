import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { isAdminRole } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import { appBaseUrl } from "@/lib/email/links";
import { updateDashboardMetrics } from "./dashboard-actions";
import { questionFields } from "@/lib/register/steps";

export default async function DashboardPage() {
  // The proxy only ensures a Clerk session. Any Clerk account can exist (open
  // sign up), so registrations and finances load only for a linked admin.
  const profile = await getCurrentProfile();
  if (!profile || !isAdminRole(profile.role)) {
    return (
      <PageBody>
        <PageHeader title={de.dashboard.title} />
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">{de.dashboard.noAccess}</p>
        </Card>
      </PageBody>
    );
  }

  // Dashboard is always visible to admins; only its registration actions are
  // permission-gated.
  const [camp, registrations, priceTiers, finance] = await Promise.all([
    getCurrentCamp(),
    getRegistrations(),
    getPriceTiers(),
    getFinanceSummary(),
  ]);

  // The registration dialog is built from the current camp's dynamic fields.
  // Step breaks only structure the public form: no column, CSV entry or metric.
  const formFields = camp ? questionFields(await getCampFormFields(camp.id)) : [];

  const canWriteRegistrations = canUseSection(profile, "registrations");

  const active = registrations.filter((r) => !r.deleted);

  // Each admin picks which metric cards show (per-user preference). An empty
  // selection falls back to the defaults so existing users see no change.
  const catalog = buildMetricCatalog(formFields);
  const selection =
    profile.dashboardMetrics.length > 0
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
        userId={profile.id}
        appUrl={appBaseUrl()}
      />
    </PageBody>
  );
}
