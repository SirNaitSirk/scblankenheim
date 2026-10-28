import { Printer } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { RoomPlanner } from "@/components/admin/room-planner";
import { canUseSection } from "@/lib/admin/access";
import { getCurrentCampId } from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import { getRoomPlan } from "@/lib/admin/rooms-data";

export default async function RoomPlanningPage() {
  const profile = await guardTab("/admin/zimmerplanung");
  const plan = await getRoomPlan(await getCurrentCampId());
  const t = de.rooms;

  return (
    <PageBody>
      <PageHeader
        title={t.title}
        badge={plan.campName ? <Badge tone="paid">{plan.campName}</Badge> : undefined}
        description={plan.campName ? t.description(plan.campName) : t.descriptionNoCamp}
        actions={
          plan.campId && plan.houses.length > 0 ? (
            <ButtonLink href="/admin/zimmerplanung/druck" target="_blank" variant="outline" size="sm">
              <Printer size={16} weight="bold" />
              {t.print}
            </ButtonLink>
          ) : undefined
        }
      />
      <RoomPlanner plan={plan} canWrite={canUseSection(profile, "rooms")} />
    </PageBody>
  );
}
