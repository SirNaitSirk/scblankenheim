import { Tent } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FinanceManager } from "@/components/admin/finance-manager";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/states";
import { canUseSection } from "@/lib/admin/access";
import {
  getCamps,
  getCurrentCampId,
  getPriceTiers,
  getRegistrations,
} from "@/lib/admin/data";
import { isActiveRegistration, toFinanceRow, todayInBerlin } from "@/lib/admin/finance";
import { guardTab } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import { appBaseUrl } from "@/lib/email/links";
import { formatDate } from "@/lib/format";

const t = de.finances;

// File name safe camp label for the CSV export.
function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "camp"
  );
}

export default async function FinancesPage() {
  const profile = await guardTab("/admin/finanzen");

  const [currentCampId, camps, registrations, tiers] = await Promise.all([
    getCurrentCampId(),
    getCamps(),
    getRegistrations(),
    getPriceTiers(),
  ]);
  const camp = camps.find((c) => c.id === currentCampId) ?? null;
  const canEdit = canUseSection(profile, "finances");

  if (!camp) {
    return (
      <PageBody>
        <PageHeader title={t.title} />
        <Card>
          <EmptyState
            icon={Tent}
            title={t.noCurrentCamp.title}
            description={t.noCurrentCamp.description}
          />
        </Card>
      </PageBody>
    );
  }

  // Only finance fields leave the server: form answers stay here (FR-007).
  const tierNames = new Map(tiers.map((tier) => [tier.id, tier.name]));
  const rows = registrations
    .filter((r) => r.campId === camp.id && isActiveRegistration(r))
    .sort((a, b) => a.lastName.localeCompare(b.lastName, "de") || a.firstName.localeCompare(b.firstName, "de"))
    .map((r) => toFinanceRow(r, tierNames));

  return (
    <PageBody>
      <PageHeader
        title={t.title}
        badge={
          <div className="flex items-center gap-2">
            <Badge tone="paid">{camp.name}</Badge>
            {!canEdit && <Badge tone="neutral">{t.readOnly}</Badge>}
          </div>
        }
        description={camp.paymentDueDate ? t.dueDate(formatDate(camp.paymentDueDate)) : t.noDueDate}
      />
      <FinanceManager
        rows={rows}
        dueDate={camp.paymentDueDate}
        today={todayInBerlin()}
        canEdit={canEdit}
        appUrl={appBaseUrl()}
        campSlug={slugify(camp.name)}
      />
    </PageBody>
  );
}
