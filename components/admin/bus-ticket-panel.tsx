"use client";

import { ArrowsClockwise, Bus, EnvelopeSimple, Prohibit } from "@phosphor-icons/react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { de } from "@/lib/admin/messages";
import type { ActionResult } from "@/lib/admin/types";
import { TRIPS } from "@/lib/bus/limits";
import { busMessages } from "@/lib/bus/messages";
import type { AdminBusTicket, AdminBusTicketResult } from "@/lib/bus/types";
import { formatDateTimeBerlin } from "@/lib/format";

const t = de.bus.panel;

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; ticket: AdminBusTicket };

type Confirm = "reissue" | "block" | null;

/**
 * Section „Busticket“ in the registration dialog (specs/021-bus-ticket, US5):
 * ticket state, boardings per trip, send, reissue and block. Hidden for
 * registrations that are no bus persons and never had a ticket.
 */
export function BusTicketPanel({
  reference,
  load,
  reissue,
  block,
  send,
  onMailSent,
}: {
  reference: string;
  load: (reference: string) => Promise<AdminBusTicketResult>;
  reissue: (reference: string) => Promise<ActionResult>;
  block: (reference: string) => Promise<ActionResult>;
  send: (reference: string) => Promise<ActionResult>;
  onMailSent?: () => void;
}) {
  const [state, setState] = useState<State>({ phase: "loading" });
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const fetchTicket = useCallback(async () => {
    try {
      const result = await load(reference);
      setState(result.ok ? { phase: "ready", ticket: result.ticket } : { phase: "error", message: result.error });
    } catch {
      setState({ phase: "error", message: t.loadFailed });
    }
  }, [load, reference]);

  useEffect(() => {
    // Loading the ticket is a fetch on mount, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTicket();
  }, [fetchTicket]);

  if (state.phase === "ready" && !state.ticket.isBusPerson && state.ticket.state === "none") return null;

  const run = (action: (reference: string) => Promise<ActionResult>, okText: string, isMail = false) => {
    setFeedback(null);
    setConfirm(null);
    startTransition(async () => {
      const result = await action(reference);
      setFeedback(result.ok ? { tone: "ok", text: okText } : { tone: "error", text: result.error });
      if (isMail) onMailSent?.();
      await fetchTicket();
    });
  };

  return (
    <section className="flex flex-col gap-3 rounded-input border border-border bg-ink-50/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Bus size={14} weight="bold" />
          {t.title}
        </h3>
        {state.phase === "ready" && (
          <Badge tone={state.ticket.state === "active" ? "paid" : state.ticket.state === "blocked" ? "danger" : "neutral"}>
            {t.state[state.ticket.state]}
          </Badge>
        )}
      </div>

      {state.phase === "loading" && <p className="text-sm text-muted-foreground">{busMessages.list.loading}</p>}
      {state.phase === "error" && <p className="text-sm text-danger">{state.message}</p>}

      {state.phase === "ready" && (
        <>
          {!state.ticket.isBusPerson && <p className="text-sm text-muted-foreground">{t.notBus}</p>}
          {state.ticket.issuedAt && (
            <p className="text-sm text-muted-foreground">{t.issuedAt(formatDateTimeBerlin(state.ticket.issuedAt))}</p>
          )}

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {TRIPS.map((trip) => {
              const boarding = state.ticket.boardings[trip];
              return (
                <div key={trip} className="contents">
                  <dt className="text-muted-foreground">{busMessages.trips[trip]}</dt>
                  <dd className="text-foreground">
                    {boarding
                      ? `${formatDateTimeBerlin(boarding.at)}${boarding.method === "manual" ? `, ${t.manual}` : ""}`
                      : t.notBoarded}
                  </dd>
                </div>
              );
            })}
          </dl>

          {confirm ? (
            <div className="flex flex-col gap-2 rounded-input border border-border bg-paper p-3 text-sm">
              <p className="text-foreground">{confirm === "reissue" ? t.reissueConfirm : t.blockConfirm}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    confirm === "reissue" ? run(reissue, t.toast.reissued) : run(block, t.toast.blocked)
                  }
                >
                  {t.confirm}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setConfirm(null)}>
                  {t.cancel}
                </Button>
              </div>
            </div>
          ) : (
            state.ticket.isBusPerson && (
              <div className="flex flex-wrap gap-2">
                {state.ticket.state !== "blocked" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending || !state.ticket.hasEmail}
                    onClick={() => run(send, t.toast.sent, true)}
                  >
                    <EnvelopeSimple size={14} weight="bold" />
                    {pending ? t.sending : t.send}
                  </Button>
                )}
                <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setConfirm("reissue")}>
                  <ArrowsClockwise size={14} />
                  {t.reissue}
                </Button>
                {state.ticket.state === "active" && (
                  <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setConfirm("block")}>
                    <Prohibit size={14} />
                    {t.block}
                  </Button>
                )}
              </div>
            )
          )}
          {state.ticket.isBusPerson && !state.ticket.hasEmail && (
            <p className="text-xs text-muted-foreground">{t.errors.noEmail}</p>
          )}
        </>
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
