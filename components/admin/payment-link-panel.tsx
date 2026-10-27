"use client";

import { Copy, PaperPlaneTilt } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { de } from "@/lib/admin/messages";
import type { ActionResult, Registration } from "@/lib/admin/types";
import { formatDate } from "@/lib/format";

const t = de.paymentLink;

/** Money still due on the saved registration (the dialog's unsaved edits do not count). */
export function hasPaymentDue(registration: Registration): boolean {
  return (
    !registration.deleted &&
    registration.status !== "cancelled" &&
    (registration.payment === "unpaid" || registration.payment === "partial") &&
    registration.amountDue - registration.amountPaid > 0
  );
}

/**
 * "Zahlung" block in the registration dialog (specs/007-transactional-emails,
 * US3): reminder history, send the payment link mail, copy the link.
 */
export function PaymentLinkPanel({
  registration,
  appUrl,
  onSend,
}: {
  registration: Registration;
  appUrl: string | null;
  onSend: (reference: string) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const hasEmail = registration.email.trim() !== "";
  const link = appUrl ? `${appUrl}/bezahlen?ref=${encodeURIComponent(registration.id)}` : null;

  const send = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await onSend(registration.id);
      setFeedback(result.ok ? { tone: "ok", text: t.sent } : { tone: "error", text: result.error });
    });
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setFeedback({ tone: "ok", text: t.copied });
    } catch {
      setFeedback({ tone: "error", text: t.copyFailed });
    }
  };

  const reminderLine =
    registration.reminderCount > 0 && registration.lastReminderAt
      ? t.reminders(registration.reminderCount, formatDate(registration.lastReminderAt))
      : t.noReminder;

  return (
    <section className="flex flex-col gap-3 rounded-input border border-border bg-ink-50/60 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.title}
        </h3>
        <p className="text-sm text-muted-foreground">{reminderLine}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={send}
          disabled={pending || !hasEmail}
        >
          <PaperPlaneTilt size={16} aria-hidden />
          {pending ? t.sending : t.send}
        </Button>
        {link && (
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            <Copy size={16} aria-hidden />
            {t.copy}
          </Button>
        )}
      </div>

      <p
        aria-live="polite"
        className={
          feedback?.tone === "error"
            ? "text-sm text-danger"
            : "text-sm text-muted-foreground"
        }
      >
        {feedback?.text ?? (hasEmail ? "" : t.noEmail)}
      </p>
    </section>
  );
}
