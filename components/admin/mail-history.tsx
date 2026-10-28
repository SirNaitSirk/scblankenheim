"use client";

import { CheckCircle, Clock, WarningCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { de } from "@/lib/admin/messages";
import { cn } from "@/lib/cn";
import type { MailHistoryEntry, MailHistoryResult, MailHistoryStatus } from "@/lib/email/history";
import { formatDateTimeBerlin } from "@/lib/format";

const t = de.registrations.mails;

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; mails: MailHistoryEntry[] };

const STATUS_STYLE: Record<MailHistoryStatus, { icon: typeof CheckCircle; className: string }> = {
  sent: { icon: CheckCircle, className: "text-accent" },
  failed: { icon: WarningCircle, className: "text-danger" },
  sending: { icon: Clock, className: "text-muted-foreground" },
};

function triggerLabel(entry: MailHistoryEntry): string {
  if (entry.trigger === "registration") return t.trigger.registration;
  if (entry.trigger === "cron") return t.trigger.cron;
  return entry.actorName ? t.trigger.byAdmin(entry.actorName) : t.trigger.byUnknownAdmin;
}

/**
 * Read only section „Mails“ in the registration dialog
 * (specs/013-registration-mail-history). Loads when mounted and again when
 * `reloadKey` changes, for example after the payment link was sent.
 */
export function MailHistory({
  reference,
  load,
  reloadKey,
}: {
  reference: string;
  load: (reference: string) => Promise<MailHistoryResult>;
  reloadKey: number;
}) {
  const [state, setState] = useState<State>({ phase: "loading" });

  const fetchHistory = useCallback(async () => {
    try {
      const result = await load(reference);
      setState(result.ok ? { phase: "ready", mails: result.mails } : { phase: "error", message: result.error });
    } catch {
      setState({ phase: "error", message: t.loadFailed });
    }
  }, [load, reference]);

  useEffect(() => {
    // Loading the history is a fetch on mount, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchHistory();
  }, [fetchHistory, reloadKey]);

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.title}</h3>

      {state.phase === "loading" && (
        <ul aria-busy="true" className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-12 animate-pulse rounded-input bg-ink-100" />
          ))}
        </ul>
      )}

      {state.phase === "error" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-input border border-border px-4 py-3">
          <p className="text-sm text-danger">{state.message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setState({ phase: "loading" });
              void fetchHistory();
            }}
          >
            {t.retry}
          </Button>
        </div>
      )}

      {state.phase === "ready" && state.mails.length === 0 && (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      )}

      {state.phase === "ready" && state.mails.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-input border border-border">
          {state.mails.map((entry) => {
            const status = STATUS_STYLE[entry.status];
            const Icon = status.icon;
            return (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {t.labels[entry.kind] ?? t.fallback}
                  </span>
                  <span className="text-xs text-muted-foreground">{triggerLabel(entry)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatDateTimeBerlin(entry.at)}
                  </span>
                  <span className={cn("inline-flex items-center gap-1 text-xs font-medium", status.className)}>
                    <Icon size={14} weight="fill" aria-hidden />
                    {t.status[entry.status]}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
