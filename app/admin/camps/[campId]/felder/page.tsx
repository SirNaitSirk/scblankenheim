import { notFound } from "next/navigation";
import { FieldsManager } from "@/components/admin/fields-manager";
import { PageBody } from "@/components/admin/page-header";
import { getCampById, getCampFormFields } from "@/lib/admin/data";

export default async function CampFieldsPage({
  params,
}: {
  params: Promise<{ campId: string }>;
}) {
  const { campId } = await params;
  const camp = await getCampById(campId);
  if (!camp) notFound();

  const fields = await getCampFormFields(campId);

  return (
    <PageBody>
      <FieldsManager campId={campId} campName={camp.name} fields={fields} />
    </PageBody>
  );
}
