import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmRefresher } from "@/components/payment/confirm-refresher";
import { PayCard } from "@/components/payment/pay-card";
import { PaymentNotice, PaymentShell } from "@/components/payment/payment-shell";
import {
  findRegistrationByReference,
  isPaymentThrottled,
  normalizeReference,
  requestIp,
} from "@/lib/payment/lookup";
import { paymentMessages } from "@/lib/payment/messages";

export const metadata: Metadata = {
  title: "Zahlung · FCG Blankenheim Summercamp",
  robots: { index: false },
};

type ThanksProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const copy = paymentMessages;

/**
 * Stripe's success redirect lands here. The page only reads the stored state;
 * the webhook is the one that marks a registration paid (FR-009, SC-004).
 */
export default async function PaymentThanksPage({ searchParams }: ThanksProps) {
  const reference = normalizeReference((await searchParams).ref);
  if (reference && (await isPaymentThrottled(await requestIp()))) {
    return (
      <PaymentShell>
        <PaymentNotice tone="danger" title={copy.throttled.title} body={copy.throttled.body} />
      </PaymentShell>
    );
  }
  const registration = reference ? await findRegistrationByReference(reference) : null;

  return (
    <PaymentShell>
      <ThanksState registration={registration} />
    </PaymentShell>
  );
}

function ThanksState({
  registration,
}: {
  registration: Awaited<ReturnType<typeof findRegistrationByReference>>;
}) {
  if (!registration) {
    return <PaymentNotice title={copy.notFound.title} body={copy.notFound.body} />;
  }

  const homeLink = (
    <ButtonLink href="/" variant="outline" size="lg" className="mt-6">
      {copy.thanks.backHome}
    </ButtonLink>
  );

  switch (registration.paymentStatus) {
    case "paid":
      return (
        <PaymentNotice
          tone="success"
          title={copy.thanks.title}
          body={copy.thanks.body(registration.reference)}
        >
          {homeLink}
        </PaymentNotice>
      );
    case "processing":
      return (
        <PaymentNotice title={copy.processing.title} body={copy.processing.body}>
          {homeLink}
        </PaymentNotice>
      );
    case "refunded":
      return <PaymentNotice title={copy.blocked.title} body={copy.blocked.body} />;
    default: {
      const stillOpen = (
        <PayCard registration={registration} hint={copy.thanks.stillOpenBody} />
      );
      // A partial payment will not settle by waiting; only unpaid ones wait.
      if (registration.paymentStatus === "partial") return stillOpen;
      return (
        <ConfirmRefresher fallback={stillOpen}>
          <PaymentNotice
            busy
            title={copy.thanks.confirmingTitle}
            body={copy.thanks.confirmingBody}
          />
        </ConfirmRefresher>
      );
    }
  }
}
