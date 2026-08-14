import { notFound } from "next/navigation";
import { FieldsManager } from "@/components/admin/fields-manager";
import { PageBody } from "@/components/admin/page-header";
import { canUseSection } from "@/lib/admin/access";
import { getCampById, getCampFormFields } from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";

export default async function CampFieldsPage({
  params,
}: {
  params: Promise<{ campId: string }>;
}) {
  // Form fields live under the Camps section, so gate them by the same tab.
  const profile = await guardTab("/admin/camps");

  const { campId } = await params;
  const camp = await getCampById(campId);
  if (!camp) notFound();

  const fields = await getCampFormFields(campId);

  return (
    <PageBody>
      <FieldsManager
        campId={campId}
        campName={camp.name}
        fields={fields}
        canWrite={canUseSection(profile, "camps")}
      />
    </PageBody>
  );
}
