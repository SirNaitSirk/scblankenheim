"use client";

import { ArrowClockwise, ArrowSquareOut, Copy } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { de } from "@/lib/admin/messages";
import type { ParticipantLinkResult, Registration } from "@/lib/admin/types";

const t = de.participantLink;

type Feedback = { tone: "ok" | "error"; text: string } | null;

/**
 * "Teilnehmerseite" block in the registration dialog (specs/017-participant-page,
 * US3 and US6). The link is fetched from the server on each click and never
 * kept in props or table data. Renewal asks inline before it replaces the link.
 */
export function ParticipantLinkPanel({
  registration,
  onGetLink,
  onRenewLink,
}: {
  registration: Registration;
  onGetLink: (reference: string) => Promise<ParticipantLinkResult>;
  onRenewLink?: (reference: string) => Promise<ParticipantLinkResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const copyLink = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await onGetLink(registration.id);
      if (!result.ok) return setFeedback({ tone: "error", text: result.error });
      try {
        await navigator.clipboard.writeText(result.url);
        setFeedback({ tone: "ok", text: t.copied });
      } catch {
        setFeedback({ tone: "error", text: t.copyFailed });
      }
    });
  };

  const openLink = () => {
    setFeedback(null);
    // Open synchronously so the browser does not block the tab, then navigate it.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    startTransition(async () => {
      const result = await onGetLink(registration.id);
      if (!result.ok) {
        tab?.close();
        return setFeedback({ tone: "error", text: result.error });
      }
      if (tab) tab.location.href = result.url;
      else window.open(result.url, "_blank", "noopener,noreferrer");
    });
  };

  const renew = () => {
    if (!onRenewLink) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await onRenewLink(registration.id);
      setConfirming(false);
      if (!result.ok) return setFeedback({ tone: "error", text: result.error });
      try {
        await navigator.clipboard.writeText(result.url);
        setFeedback({ tone: "ok", text: t.renewed });
      } catch {
        setFeedback({ tone: "ok", text: t.renewedNotCopied });
      }
    });
  };

  return (
    <section className="flex flex-col gap-3 rounded-input border border-border bg-ink-50/60 p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.title}
        </h3>
        <p className="text-sm text-muted-foreground">{t.hint}</p>
      </div>

      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby={`renew-title-${registration.id}`}
          className="flex flex-col gap-3 rounded-input border border-danger/30 bg-surface p-3"
        >
          <div>
            <p id={`renew-title-${registration.id}`} className="text-sm font-semibold text-foreground">
              {t.renewTitle}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t.renewBody}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="danger" size="sm" onClick={renew} disabled={pending}>
              {t.renewConfirm}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              {t.renewCancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={copyLink} disabled={pending}>
            <Copy size={16} aria-hidden />
            {t.copy}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={openLink} disabled={pending}>
            <ArrowSquareOut size={16} aria-hidden />
            {t.open}
          </Button>
          {onRenewLink && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFeedback(null);
                setConfirming(true);
              }}
              disabled={pending}
            >
              <ArrowClockwise size={16} aria-hidden />
              {t.renew}
            </Button>
          )}
        </div>
      )}

      <p
        aria-live="polite"
        className={feedback?.tone === "error" ? "text-sm text-danger" : "text-sm text-muted-foreground"}
      >
        {pending ? t.loading : (feedback?.text ?? "")}
      </p>
    </section>
  );
}
