"use client";

import { ArrowRight, Info, PaperPlaneTilt } from "@phosphor-icons/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { sendTestMailAction } from "@/app/admin/mail/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";

const t = de.mail;

/** Delivery state of an info mail for the current camp (specs/012-info-mails, US5). */
export type InfoMailPanel = {
  enabled: boolean;
  counts: { received: number; notReceived: number; withoutEmail: number };
  hints: string[];
  settingsHref: string;
};

/** Hint that a mail is switched off for the current camp (specs/016-mail-settings, US2). */
export type MailOffNotice = { text: string; settingsHref: string };

export type MailPreviewItem = {
  id: string;
  name: string;
  trigger: string;
  subject: string;
  html: string;
  text: string;
  info?: InfoMailPanel;
  off?: MailOffNotice;
};

type View = "html" | "text";

/**
 * Read only template browser for the admin tab "Mail"
 * (specs/007-transactional-emails, US4). The HTML renders in a sandboxed iframe
 * without scripts so mail styles and admin styles never mix; pointer events are
 * off so links and the pay button inside do nothing.
 */
export function MailPreview({
  previews,
  test,
}: {
  previews: MailPreviewItem[];
  /** Test send to the admin's own address; null hides it (specs/016-mail-settings, US6). */
  test: { email: string | null } | null;
}) {
  const [selectedId, setSelectedId] = useState(previews[0]?.id ?? "");
  const [view, setView] = useState<View>("html");
  const selected = previews.find((p) => p.id === selectedId) ?? previews[0];
  if (!selected) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
      <nav aria-label={t.listLabel} className="min-w-0">
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {previews.map((preview, index) => {
            const active = preview.id === selected.id;
            const startsInfoGroup = Boolean(preview.info) && !previews[index - 1]?.info;
            return (
              <li key={preview.id} className="flex shrink-0 items-center gap-2 lg:block lg:shrink">
                {startsInfoGroup && (
                  <span className="hidden px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">
                    {t.infoGroup}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedId(preview.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-input border px-4 py-3 text-left transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                    active
                      ? "border-ink-300 bg-surface shadow-card"
                      : "border-transparent hover:bg-ink-100",
                  )}
                >
                  <span className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-foreground lg:whitespace-normal">
                    {preview.name}
                    {preview.off && (
                      <span className="rounded-pill bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {t.infoInactive}
                      </span>
                    )}
                    {preview.info && (
                      <span
                        className={cn(
                          "rounded-pill px-2 py-0.5 text-[11px] font-medium",
                          preview.info.enabled ? "bg-accent/15 text-accent" : "bg-ink-100 text-muted-foreground",
                        )}
                      >
                        {preview.info.enabled ? t.infoActive : t.infoInactive}
                      </span>
                    )}
                  </span>
                  <span className="hidden text-xs text-muted-foreground lg:block">
                    {preview.trigger}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <Card className="flex min-w-0 flex-col">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
          <dl className="flex min-w-0 flex-col gap-2 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.subject}
              </dt>
              <dd className="font-semibold text-foreground">{selected.subject}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.sentWhen}
              </dt>
              <dd className="text-muted-foreground">{selected.trigger}</dd>
            </div>
          </dl>

          <div
            role="group"
            aria-label={t.previewTitle(selected.name)}
            className="flex shrink-0 items-center gap-0.5 self-start rounded-pill border border-border p-0.5"
          >
            {(["html", "text"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                aria-pressed={view === option}
                className={cn(
                  "h-8 rounded-pill px-3 text-sm transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  view === option
                    ? "bg-surface-inverse text-on-inverse"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option === "html" ? t.viewHtml : t.viewText}
              </button>
            ))}
          </div>
        </div>

        {test && <TestSend key={selected.id} templateId={selected.id} email={test.email} />}
        {selected.off && <OffNotice notice={selected.off} />}
        {selected.info && <InfoStatus info={selected.info} />}

        <div className="bg-ink-100 p-3 sm:p-6">
          {view === "html" ? (
            <MailFrame key={selected.id} html={selected.html} title={t.previewTitle(selected.name)} />
          ) : (
            <pre className="mx-auto max-w-[600px] whitespace-pre-wrap break-words rounded-input bg-surface p-5 font-mono text-[13px] leading-relaxed text-foreground">
              {selected.text}
            </pre>
          )}
        </div>
      </Card>
    </div>
  );
}

function TestSend({ templateId, email }: { templateId: string; email: string | null }) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const send = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await sendTestMailAction(templateId);
      setFeedback(
        result.ok ? { tone: "ok", text: t.test.sent(email ?? "") } : { tone: "error", text: result.error },
      );
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-5 py-4">
      <p
        aria-live="polite"
        className={cn(
          "min-w-0 flex-[1_1_16rem] text-sm",
          feedback?.tone === "error" ? "text-danger" : feedback ? "text-accent" : "text-muted-foreground",
        )}
      >
        {feedback?.text ?? (email ? t.test.hint : t.test.noEmail)}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={send} disabled={pending || !email} className="shrink-0">
        <PaperPlaneTilt size={16} aria-hidden />
        {pending ? t.test.sending : t.test.send}
      </Button>
    </div>
  );
}

function OffNotice({ notice }: { notice: MailOffNotice }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
        {notice.text}
      </p>
      <Link
        href={notice.settingsHref}
        className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t.remindersSettings}
        <ArrowRight size={14} weight="bold" aria-hidden />
      </Link>
    </div>
  );
}

function InfoStatus({ info }: { info: InfoMailPanel }) {
  const counts = [
    [info.counts.received, t.infoCounts.received],
    [info.counts.notReceived, t.infoCounts.notReceived],
    [info.counts.withoutEmail, t.infoCounts.withoutEmail],
  ] as const;
  return (
    <div className="flex flex-col gap-3 border-b border-border px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.infoStatus}
          </span>
          <span className={cn("font-semibold", info.enabled ? "text-accent" : "text-muted-foreground")}>
            {info.enabled ? t.infoActive : t.infoInactive}
          </span>
        </div>
        <Link
          href={info.settingsHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t.infoSettings}
          <ArrowRight size={14} weight="bold" aria-hidden />
        </Link>
      </div>
      <ul className="flex flex-wrap gap-2">
        {counts.map(([value, label]) => (
          <li
            key={label}
            className="rounded-pill border border-border bg-surface px-3 py-1 text-sm text-muted-foreground"
          >
            <span className="font-semibold tabular-nums text-foreground">{value}</span> {label}
          </li>
        ))}
      </ul>
      {info.hints.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {info.hints.map((hint) => (
            <li key={hint} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
              {hint}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MailFrame({ html, title }: { html: string; title: string }) {
  const [height, setHeight] = useState(640);
  return (
    <iframe
      title={title}
      srcDoc={html}
      sandbox="allow-same-origin"
      onLoad={(event) => {
        const doc = event.currentTarget.contentDocument;
        if (doc) setHeight(doc.documentElement.scrollHeight);
      }}
      style={{ height }}
      className="pointer-events-none mx-auto block w-full max-w-[640px] rounded-input border-0 bg-transparent"
    />
  );
}
