import type { Metadata } from "next";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { PaymentNotice, PaymentShell } from "@/components/payment/payment-shell";
import { findOpenFeedbackByCode, toPublicQuestion } from "@/lib/feedback/data";
import { FEEDBACK_LINK_CODE_PATTERN, feedbackCookieName } from "@/lib/feedback/limits";
import { feedbackMessages as copy } from "@/lib/feedback/messages";
import { issueFormToken } from "@/lib/register/form-token-server";
import { submitFeedback } from "./actions";

export const metadata: Metadata = {
  title: copy.metaTitle,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * Public feedback page behind the QR code (specs/038-camp-feedback, US1).
 * Unknown codes and closed feedback render the same notice without the camp.
 */
export default async function FeedbackPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const feedback = FEEDBACK_LINK_CODE_PATTERN.test(code) ? await findOpenFeedbackByCode(code) : null;

  if (!feedback) {
    return (
      <PaymentShell>
        <PaymentNotice title={copy.unavailable.title} body={copy.unavailable.body} />
      </PaymentShell>
    );
  }

  if ((await cookies()).get(feedbackCookieName(feedback.campId))?.value === "1") {
    return (
      <PaymentShell>
        <PaymentNotice tone="success" title={copy.already.title} body={copy.already.body} />
      </PaymentShell>
    );
  }

  return (
    <PaymentShell>
      <header className="mb-8 flex flex-col gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-accent-strong">{copy.eyebrow}</span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {copy.title(feedback.campName)}
        </h1>
        <p className="text-base text-muted-foreground">{copy.intro}</p>
        <p className="rounded-input border border-border bg-ink-50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {copy.anonymous}
        </p>
      </header>
      <FeedbackForm
        initialQuestions={feedback.questions.map(toPublicQuestion)}
        nonce={randomUUID()}
        formToken={issueFormToken()}
        action={submitFeedback.bind(null, code)}
      />
    </PaymentShell>
  );
}
