"use client";

import { Check, PencilSimpleLine, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { de } from "@/lib/admin/messages";
import type {
  AdminParticipantMessage,
  ParticipantMessagesResult,
  ResolveMessageResult,
} from "@/lib/admin/types";
import { cn } from "@/lib/cn";
import { formatDateTimeBerlin } from "@/lib/format";

const t = de.participantMessages;

type ResolveInput = { action: "done" | "apply" | "dismiss"; confirmOverwrite?: boolean };

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; items: AdminParticipantMessage[] };

/**
 * Section „Nachrichten“ in the registration dialog (specs/018-participant-messages,
 * US2 and US3): messages and change requests from the participant page, with
 * mark done, apply (with conflict confirmation) and dismiss.
 */
export function ParticipantMessagesPanel({
  reference,
  load,
  resolve,
}: {
  reference: string;
  load: (reference: string) => Promise<ParticipantMessagesResult>;
  resolve: (id: string, input: ResolveInput) => Promise<ResolveMessageResult>;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "loading" });
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [conflict, setConflict] = useState<{ id: string; text: string } | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const result = await load(reference);
      setState(result.ok ? { phase: "ready", items: result.items } : { phase: "error", message: result.error });
    } catch {
      setState({ phase: "error", message: t.loadFailed });
    }
  }, [load, reference]);

  useEffect(() => {
    // Loading the items is a fetch on mount, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchItems();
  }, [fetchItems]);

  const run = (id: string, input: ResolveInput) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await resolve(id, input);
      if (!result.ok) {
        if (result.conflict) setConflict({ id, text: result.error });
        else setFeedback({ tone: "error", text: result.error });
        return;
      }
      setConflict(null);
      setFeedback({ tone: "ok", text: input.action === "apply" ? t.applied : t.closed });
      await fetchItems();
      router.refresh(); // updates the open badge in the table
    });
  };

  return (
    <section className="flex flex-col gap-3 rounded-input border border-border bg-ink-50/60 p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.title}</h3>
        <p className="text-sm text-muted-foreground">{t.hint}</p>
      </div>

      {state.phase === "loading" && <p className="text-sm text-muted-foreground">{t.loading}</p>}
      {state.phase === "error" && <p className="text-sm text-danger">{state.message}</p>}
      {state.phase === "ready" && state.items.length === 0 && (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      )}

      {state.phase === "ready" && state.items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {state.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex flex-col gap-2 rounded-input border border-border bg-surface p-3",
                item.status === "done" && "opacity-70",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {t.kinds[item.kind]} · {formatDateTimeBerlin(item.createdAt)}
                </span>
                {item.status === "open" ? (
                  <Badge tone="pending">{t.open}</Badge>
                ) : (
                  <Badge tone="neutral">{item.resolution ? t.results[item.resolution] : t.results.done}</Badge>
                )}
              </div>

              {item.kind === "change_request" && (
                <p className="text-sm font-medium text-foreground">
                  {t.change(item.fieldLabel ?? "", item.previous ?? "", item.proposed ?? "")}
                </p>
              )}
              {item.text && (
                <p className="whitespace-pre-line break-words text-sm text-foreground">
                  {item.kind === "change_request" ? t.reason(item.text) : item.text}
                </p>
              )}

              {item.status === "done" && item.resolvedAt && (
                <p className="text-xs text-muted-foreground">
                  {t.resolvedBy(
                    item.resolution ? t.results[item.resolution] : t.results.done,
                    item.resolvedByName,
                    formatDateTimeBerlin(item.resolvedAt),
                  )}
                </p>
              )}

              {item.status === "open" && conflict?.id === item.id && (
                <div role="alertdialog" className="flex flex-col gap-2 rounded-input border border-danger/30 p-3">
                  <p className="text-sm text-foreground">{conflict.text}</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={pending}
                      onClick={() => run(item.id, { action: "apply", confirmOverwrite: true })}
                    >
                      {t.applyAnyway}
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setConflict(null)}>
                      {t.cancel}
                    </Button>
                  </div>
                </div>
              )}

              {item.status === "open" && conflict?.id !== item.id && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  {item.kind === "change_request" ? (
                    <>
                      <Button type="button" size="sm" disabled={pending} onClick={() => run(item.id, { action: "apply" })}>
                        <PencilSimpleLine size={16} aria-hidden />
                        {t.apply}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => run(item.id, { action: "dismiss" })}
                      >
                        <X size={16} aria-hidden />
                        {t.dismiss}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => run(item.id, { action: "done" })}
                    >
                      <Check size={16} aria-hidden />
                      {t.markDone}
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p
        aria-live="polite"
        className={feedback?.tone === "error" ? "text-sm text-danger" : "text-sm text-muted-foreground"}
      >
        {feedback?.text ?? ""}
      </p>
    </section>
  );
}
