"use client";

import { ArrowsClockwise, Copy, DownloadSimple, QrCode } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { renewFeedbackLink, setFeedbackOpen } from "@/app/admin/feedback/actions";
import { useFeedbackToast } from "@/components/admin/feedback-toast";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { de } from "@/lib/admin/messages";

const t = de.feedback.access;

/**
 * Access card of one camp's feedback (specs/038-camp-feedback, US2): open
 * switch, the page address, QR code in full screen or as image and renewal.
 */
export function FeedbackLinkCard({
  campId,
  open,
  url,
  hasQuestions,
  canWrite,
}: {
  campId: string;
  open: boolean;
  url: string | null;
  hasQuestions: boolean;
  canWrite: boolean;
}) {
  const router = useRouter();
  const { show, toast } = useFeedbackToast();
  const [isOpen, setIsOpen] = useState(open);
  const [renewing, setRenewing] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setIsOpen(next);
    startTransition(async () => {
      const result = await setFeedbackOpen(campId, next);
      if (result.ok) {
        show(next ? t.opened : t.closed);
        router.refresh();
      } else {
        setIsOpen(!next);
        show(result.error);
      }
    });
  }

  function renew() {
    setRenewing(false);
    startTransition(async () => {
      const result = await renewFeedbackLink(campId);
      show(result.ok ? t.renewed : result.error);
      if (result.ok) router.refresh();
    });
  }

  async function copyUrl() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      show(t.copied);
    } catch {
      show(url);
    }
  }

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-input bg-accent/10 text-accent">
            <QrCode size={20} weight="bold" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground">{t.title}</h2>
            <p className="max-w-prose text-sm text-muted-foreground">{t.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <Switch
            id="feedback-open"
            checked={isOpen}
            onCheckedChange={toggle}
            label={t.switch}
            disabled={!canWrite || pending || (!hasQuestions && !isOpen)}
          />
          {!hasQuestions && <span className="text-xs text-muted-foreground">{t.switchHint}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">{t.address}</span>
        {url ? (
          <div className="flex min-w-0 items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-input border border-border bg-ink-50 px-3 py-2 font-mono text-sm text-foreground">
              {url}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={copyUrl} aria-label={t.copy}>
              <Copy size={16} weight="bold" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-danger">{t.noBaseUrl}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap">
        <ButtonLink href={`/admin/feedback/${campId}/qr`} target="_blank" size="sm">
          <QrCode size={16} weight="bold" />
          {t.showQr}
        </ButtonLink>
        <ButtonLink href={`/api/admin/feedback/${campId}/qr`} variant="outline" size="sm">
          <DownloadSimple size={16} weight="bold" />
          {t.downloadQr}
        </ButtonLink>
        {canWrite && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setRenewing(true)} disabled={pending}>
            <ArrowsClockwise size={16} weight="bold" />
            {t.renew}
          </Button>
        )}
      </div>

      <Dialog
        open={renewing}
        onClose={() => setRenewing(false)}
        title={t.renewTitle}
        description={t.renewBody}
        closeLabel={t.cancel}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setRenewing(false)}>
              {t.cancel}
            </Button>
            <Button type="button" variant="danger" onClick={renew}>
              {t.renewConfirm}
            </Button>
          </>
        }
      >
        <span className="sr-only">{t.renewBody}</span>
      </Dialog>

      {toast}
    </Card>
  );
}
