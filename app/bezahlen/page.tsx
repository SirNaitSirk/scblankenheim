import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PayCard } from "@/components/payment/pay-card";
import { PaymentNotice, PaymentShell } from "@/components/payment/payment-shell";
import { checkoutEligibility } from "@/lib/payment/eligibility";
import {
  findRegistrationByReference,
  isPaymentThrottled,
  normalizeReference,
  requestIp,
  type PublicRegistration,
} from "@/lib/payment/lookup";
import { paymentMessages } from "@/lib/payment/messages";

export const metadata: Metadata = {
  title: "Bezahlen · FCG Blankenheim Summercamp",
  robots: { index: false },
};

type PayProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const copy = paymentMessages;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Pay later by reference (specs/006-stripe-payment, User Story 2). Unknown,
 * deleted and malformed references all render the same neutral notice.
 */
export default async function PayPage({ searchParams }: PayProps) {
  const params = await searchParams;
  const reference = normalizeReference(params.ref);
  const cancelled = firstValue(params.abgebrochen) === "1";
  const error = firstValue(params.fehler);

  if (!reference) {
    return (
      <PaymentShell>
        <ReferenceForm />
      </PaymentShell>
    );
  }

  if (error === "limit" || (await isPaymentThrottled(await requestIp()))) {
    return (
      <PaymentShell>
        <PaymentNotice tone="danger" title={copy.throttled.title} body={copy.throttled.body} />
      </PaymentShell>
    );
  }

  const registration = await findRegistrationByReference(reference);

  return (
    <PaymentShell>
      {error === "stripe" && (
        <div className="mb-6">
          <PaymentNotice
            tone="danger"
            heading="h2"
            title={copy.stripeError.title}
            body={copy.stripeError.body}
          />
        </div>
      )}
      <PayState
        registration={registration}
        reference={reference}
        cancelled={cancelled}
      />
    </PaymentShell>
  );
}

function PayState({
  registration,
  reference,
  cancelled,
}: {
  registration: PublicRegistration | null;
  reference: string;
  cancelled: boolean;
}) {
  switch (checkoutEligibility(registration)) {
    case "ok":
      return (
        <PayCard
          registration={registration!}
          hint={cancelled ? copy.open.cancelledHint : undefined}
        />
      );
    case "paid":
    case "nothing_due":
      return <PaymentNotice tone="success" title={copy.paid.title} body={copy.paid.body} />;
    case "processing":
      return <PaymentNotice title={copy.processing.title} body={copy.processing.body} />;
    case "refunded":
    case "cancelled":
      return <PaymentNotice title={copy.blocked.title} body={copy.blocked.body} />;
    default:
      return (
        <PaymentNotice title={copy.notFound.title} body={copy.notFound.body}>
          <ReferenceForm defaultValue={reference} embedded />
        </PaymentNotice>
      );
  }
}

/** GET form back to this page; works without JavaScript. */
function ReferenceForm({
  defaultValue,
  embedded = false,
}: {
  defaultValue?: string;
  embedded?: boolean;
}) {
  const form = (
    <form
      method="get"
      action="/bezahlen"
      className="mt-6 flex flex-col gap-3 text-left sm:flex-row sm:items-end"
    >
      <Field label={copy.page.referenceLabel} htmlFor="pay-ref" className="flex-1">
        <Input
          id="pay-ref"
          name="ref"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder={copy.page.referencePlaceholder}
          defaultValue={defaultValue}
          className="h-11 font-mono uppercase"
        />
      </Field>
      <Button type="submit" size="md">
        {copy.page.lookup}
      </Button>
    </form>
  );

  if (embedded) return form;
  return (
    <PaymentNotice title={copy.page.title} body={copy.page.intro}>
      {form}
    </PaymentNotice>
  );
}
