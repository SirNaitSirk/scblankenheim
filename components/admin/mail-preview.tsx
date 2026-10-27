"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";

const t = de.mail;

export type MailPreviewItem = {
  id: string;
  name: string;
  trigger: string;
  subject: string;
  html: string;
  text: string;
};

type View = "html" | "text";

/**
 * Read only template browser for the admin tab "Mail"
 * (specs/007-transactional-emails, US4). The HTML renders in a sandboxed iframe
 * without scripts so mail styles and admin styles never mix; pointer events are
 * off so links and the pay button inside do nothing.
 */
export function MailPreview({ previews }: { previews: MailPreviewItem[] }) {
  const [selectedId, setSelectedId] = useState(previews[0]?.id ?? "");
  const [view, setView] = useState<View>("html");
  const selected = previews.find((p) => p.id === selectedId) ?? previews[0];
  if (!selected) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(240px,300px)_1fr]">
      <nav aria-label={t.listLabel}>
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {previews.map((preview) => {
            const active = preview.id === selected.id;
            return (
              <li key={preview.id} className="shrink-0 lg:shrink">
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
                  <span className="whitespace-nowrap text-sm font-semibold text-foreground lg:whitespace-normal">
                    {preview.name}
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
