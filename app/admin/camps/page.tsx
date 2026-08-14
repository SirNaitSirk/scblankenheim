import { CampsBoard } from "@/components/admin/camps-board";
import { PageBody } from "@/components/admin/page-header";
import { canUseSection } from "@/lib/admin/access";
import { getCamps } from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";

export default async function CampsPage() {
  const profile = await guardTab("/admin/camps");
  const camps = await getCamps();

  return (
    <PageBody>
      <CampsBoard camps={camps} canWrite={canUseSection(profile, "camps")} />
    </PageBody>
  );
}
