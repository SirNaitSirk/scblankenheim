import { CampsBoard } from "@/components/admin/camps-board";
import { PageBody } from "@/components/admin/page-header";
import { getCamps } from "@/lib/admin/data";

export default async function CampsPage() {
  const camps = await getCamps();

  return (
    <PageBody>
      <CampsBoard camps={camps} />
    </PageBody>
  );
}
