import type { Metadata } from "next";
import { ParticipantSummary } from "@/components/participant/participant-summary";
import { PaymentNotice, PaymentShell } from "@/components/payment/payment-shell";
import { requestIp } from "@/lib/payment/lookup";
import {
  findParticipantByToken,
  isParticipantThrottled,
  recordParticipantMiss,
} from "@/lib/participant/lookup";
import { participantMessages as copy } from "@/lib/participant/messages";
import { normalizeAccessToken } from "@/lib/participant/token";
import { sendParticipantMessageAction } from "./actions";

export const metadata: Metadata = {
  title: copy.title,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type ParticipantPageProps = {
  params: Promise<{ token: string }>;
};

/**
 * Private, read only participant page (specs/017-participant-page). Malformed,
 * unknown, renewed and deleted tokens all render the same notice (FR-011);
 * only misses count toward the per ip throttle (research R6).
 */
export default async function ParticipantPage({ params }: ParticipantPageProps) {
  const token = normalizeAccessToken((await params).token);
  if (!token) return <NotFound />;

  const ip = await requestIp();
  if (await isParticipantThrottled(ip)) {
    return (
      <PaymentShell>
        <PaymentNotice tone="danger" title={copy.throttled.title} body={copy.throttled.body} />
      </PaymentShell>
    );
  }

  const view = await findParticipantByToken(token);
  if (!view) {
    await recordParticipantMiss(ip);
    return <NotFound />;
  }

  return (
    <PaymentShell>
      <ParticipantSummary view={view} contactAction={sendParticipantMessageAction.bind(null, token)} />
    </PaymentShell>
  );
}

function NotFound() {
  return (
    <PaymentShell>
      <PaymentNotice title={copy.notFound.title} body={copy.notFound.body} />
    </PaymentShell>
  );
}
