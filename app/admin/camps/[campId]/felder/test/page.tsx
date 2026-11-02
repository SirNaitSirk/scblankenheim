import { notFound } from "next/navigation";
import { ArrowLeft, Flask } from "@phosphor-icons/react/dist/ssr";
import { testRegistrationAction } from "@/app/admin/camps/[campId]/felder/actions";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { RegistrationForm } from "@/components/marketing/registration-form";
import { ButtonLink } from "@/components/ui/button";
import { getCampById, getCampFormFields } from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import { getCampAvailability } from "@/lib/marketing/availability";

const copy = de.fields.test;

/**
 * The one public registration form of the chosen camp in the landing look
 * (specs/036-form-test-preview). Ignores the registration window on purpose;
 * submitting only validates on the server and stores nothing.
 */
export default async function CampFormTestPage({
  params,
}: {
  params: Promise<{ campId: string }>;
}) {
  await guardTab("/admin/camps");

  const { campId } = await params;
  const camp = await getCampById(campId);
  if (!camp) notFound();

  const fields = await getCampFormFields(campId);
  const availability = await getCampAvailability(campId, fields);
  const fieldsHref = `/admin/camps/${campId}/felder`;

  return (
    <PageBody>
      <PageHeader
        title={copy.title(camp.name)}
        actions={
          <ButtonLink href={fieldsHref} variant="ghost" size="sm">
            <ArrowLeft size={16} weight="bold" aria-hidden />
            {copy.back}
          </ButtonLink>
        }
      />

      <p
        role="note"
        className="flex items-center gap-2 rounded-input border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-medium text-foreground"
      >
        <Flask size={18} weight="bold" aria-hidden className="shrink-0 text-accent-strong" />
        {copy.banner}
      </p>

      {/* Light landing tokens even in the dark admin theme, same frame as #anmelden. */}
      <div className="marketing-scope rounded-card border border-border bg-sand-50 text-foreground">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 md:py-16">
          <RegistrationForm
            fields={fields}
            availability={availability}
            formToken=""
            testSubmit={testRegistrationAction.bind(null, campId)}
          />
        </div>
      </div>
    </PageBody>
  );
}
