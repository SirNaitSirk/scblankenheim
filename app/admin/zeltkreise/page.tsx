import { Printer } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { TentCirclePlanner } from "@/components/admin/tent-circle-planner";
import { canUseSection } from "@/lib/admin/access";
import { getCurrentCampId } from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import { getTentCirclePlan } from "@/lib/admin/tent-circles-data";

export default async function TentCirclesPage() {
  const profile = await guardTab("/admin/zeltkreise");
  const plan = await getTentCirclePlan(await getCurrentCampId());
  const t = de.tentCircles;

  return (
    <PageBody>
      <PageHeader
        title={t.title}
        badge={plan.campName ? <Badge tone="paid">{plan.campName}</Badge> : undefined}
        description={plan.campName ? t.description(plan.campName) : t.descriptionNoCamp}
        actions={
          plan.campId && plan.circles.length > 0 ? (
            <ButtonLink href="/admin/zeltkreise/druck" target="_blank" variant="outline" size="sm">
              <Printer size={16} weight="bold" />
              {t.print}
            </ButtonLink>
          ) : undefined
        }
      />
      <TentCirclePlanner plan={plan} canWrite={canUseSection(profile, "tentCircles")} />
    </PageBody>
  );
}
