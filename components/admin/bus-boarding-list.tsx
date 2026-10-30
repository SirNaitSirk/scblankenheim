"use client";

import { ArrowCounterClockwise, CheckCircle, MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState, useTransition } from "react";
import { markBoardedManually, undoBoarding, type ListResult } from "@/app/admin/bus/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { busMessages as copy } from "@/lib/bus/messages";
import { formatTimeBerlin } from "@/lib/format";
import type { BoardingListEntry, ScanOutcome, Trip } from "@/lib/bus/types";

const collator = new Intl.Collator("de", { sensitivity: "base" });

function matches(entry: BoardingListEntry, query: string): boolean {
  if (!query) return true;
  const needle = query.toLocaleLowerCase("de");
  return entry.name.toLocaleLowerCase("de").includes(needle) || entry.reference.toLocaleLowerCase("de").includes(needle);
}

function outcomeMessage(outcome: ScanOutcome): string | null {
  switch (outcome.kind) {
    case "boarded":
      return null;
    case "already":
      return copy.outcome.already(formatTimeBerlin(outcome.at));
    default:
      return copy.outcome[outcome.kind];
  }
}

/**
 * Boarding list per trip (specs/021-bus-ticket, US3): missing first, then
 * boarded with time and method; manual boarding and undo with confirmation.
 */
export function BusBoardingList({
  trip,
  list,
  onChange,
}: {
  trip: Trip;
  list: ListResult | null;
  onChange: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [undoTarget, setUndoTarget] = useState<BoardingListEntry | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const entries = useMemo(() => (list?.ok && list.state === "ready" ? list.entries : []), [list]);
  const filtered = entries.filter((entry) => matches(entry, query.trim()));
  const missing = filtered.filter((entry) => !entry.boardedAt);
  const boarded = filtered
    .filter((entry) => entry.boardedAt)
    .sort((a, b) => collator.compare(b.boardedAt ?? "", a.boardedAt ?? ""));

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }

  function markBoarded(entry: BoardingListEntry) {
    setBusyId(entry.registrationId);
    startTransition(async () => {
      try {
        const result = await markBoardedManually({ registrationId: entry.registrationId, trip });
        const message = result.ok ? outcomeMessage(result.outcome) : result.error;
        if (message) showToast(message);
      } catch {
        showToast(copy.outcome.offline);
      }
      await onChange();
      setBusyId(null);
    });
  }

  function confirmUndo() {
    const entry = undoTarget;
    if (!entry) return;
    setUndoTarget(null);
    setBusyId(entry.registrationId);
    startTransition(async () => {
      try {
        const result = await undoBoarding({ registrationId: entry.registrationId, trip });
        if (!result.ok) showToast(result.error);
      } catch {
        showToast(copy.outcome.offline);
      }
      await onChange();
      setBusyId(null);
    });
  }

  if (!list) return <p className="py-6 text-sm text-muted-foreground">{copy.list.loading}</p>;
  if (!list.ok) return <p className="py-6 text-sm text-danger">{list.error}</p>;
  if (list.state !== "ready") return null;
  if (list.total === 0) return <p className="py-6 text-sm text-muted-foreground">{copy.list.empty}</p>;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {copy.count(list.boarded, list.total)}
      </p>
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={copy.list.search}
        aria-label={copy.list.search}
        leading={<MagnifyingGlass size={16} />}
        className="h-11"
      />

      <section aria-labelledby="bus-missing" className="flex flex-col gap-2">
        <h3 id="bus-missing" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {copy.list.missing} · {missing.length}
        </h3>
        {missing.length === 0 ? (
          <p className="text-sm text-muted-foreground">{query ? copy.list.noMatch : copy.list.noneMissing}</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-paper">
            {missing.map((entry) => (
              <li key={entry.registrationId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{entry.name}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">{entry.reference}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11 shrink-0"
                  disabled={busyId === entry.registrationId}
                  onClick={() => markBoarded(entry)}
                >
                  <CheckCircle size={16} weight="bold" />
                  {copy.list.markBoarded}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="bus-boarded" className="flex flex-col gap-2">
        <h3 id="bus-boarded" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {copy.list.boarded} · {boarded.length}
        </h3>
        {boarded.length === 0 ? (
          <p className="text-sm text-muted-foreground">{query ? copy.list.noMatch : copy.list.noneBoarded}</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-paper">
            {boarded.map((entry) => (
              <li key={entry.registrationId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{entry.name}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs tabular-nums text-muted-foreground">
                    <span>{entry.reference}</span>
                    {entry.boardedAt && <span>{formatTimeBerlin(entry.boardedAt)}</span>}
                    {entry.method === "manual" && (
                      <span className="rounded-pill bg-ink-100 px-2 py-0.5 text-ink-700">{copy.list.manual}</span>
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="min-h-11 shrink-0"
                  disabled={busyId === entry.registrationId}
                  onClick={() => setUndoTarget(entry)}
                  aria-label={`${copy.list.undo}: ${entry.name}`}
                >
                  <ArrowCounterClockwise size={16} />
                  <span className="hidden sm:inline">{copy.list.undo}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={undoTarget !== null}
        onClose={() => setUndoTarget(null)}
        title={undoTarget ? copy.list.undoConfirm(undoTarget.name) : ""}
        closeLabel={copy.list.cancel}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setUndoTarget(null)}>
              {copy.list.cancel}
            </Button>
            <Button type="button" onClick={confirmUndo}>
              {copy.list.undoConfirmYes}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">{copy.trips[trip]}</p>
      </Dialog>

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-sm text-on-inverse shadow-pop sm:bottom-6"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
