"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { loadBoardingList, type ListResult } from "@/app/admin/bus/actions";
import { ButtonLink } from "@/components/ui/button";
import { LIST_POLL_MS, TRIP_PARAM, TRIP_STORAGE_KEY, TRIPS } from "@/lib/bus/limits";
import { busMessages as copy } from "@/lib/bus/messages";
import { cn } from "@/lib/cn";
import type { Trip } from "@/lib/bus/types";
import { BusBoardingList } from "./bus-boarding-list";
import { BusScanner } from "./bus-scanner";

type StationState = "ready" | "disabled" | "mapping_broken" | "no_camp";

function readStoredTrip(): Trip | null {
  try {
    const value = window.localStorage.getItem(TRIP_STORAGE_KEY);
    return value === "outbound" || value === "return" ? value : null;
  } catch {
    return null;
  }
}

function storeTrip(trip: Trip): void {
  try {
    window.localStorage.setItem(TRIP_STORAGE_KEY, trip);
  } catch {
    // Private mode or blocked storage: the URL still keeps the trip.
  }
}

/** Writes the trip into `?fahrt=` and drops a processed `?t=` without a reload. */
function syncUrl(trip: Trip | null, dropCode: boolean): void {
  const url = new URL(window.location.href);
  if (trip) url.searchParams.set("fahrt", TRIP_PARAM[trip]);
  if (dropCode) url.searchParams.delete("t");
  window.history.replaceState(null, "", url);
}

/**
 * Client shell of the scan page (specs/021-bus-ticket): trip choice, live count,
 * scanner and boarding list. The list polls every few seconds while visible
 * (research R8) and refreshes right after own scans and changes.
 */
export function BusStation({
  state,
  canScan,
  canEditSettings,
  settingsHref,
  initialTrip,
  initialCode,
}: {
  state: StationState;
  canScan: boolean;
  canEditSettings: boolean;
  settingsHref: string | null;
  initialTrip: Trip | null;
  initialCode: string | null;
}) {
  const [trip, setTrip] = useState<Trip | null>(initialTrip);
  const [pendingCode, setPendingCode] = useState<string | null>(initialCode);
  const [tab, setTab] = useState<"scan" | "list">("scan");
  const [list, setList] = useState<ListResult | null>(null);

  useEffect(() => {
    if (initialTrip) {
      storeTrip(initialTrip);
      return;
    }
    const stored = readStoredTrip();
    // Restoring the device's trip after mount keeps server and client markup equal.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setTrip(stored);
  }, [initialTrip]);

  const refresh = useCallback(async () => {
    if (!trip || !canScan) return;
    try {
      setList(await loadBoardingList(trip));
    } catch {
      setList({ ok: false, error: copy.list.loadFailed });
    }
  }, [trip, canScan]);

  useEffect(() => {
    if (!trip || !canScan || state !== "ready") return;
    // First load for the chosen trip, then polling while the tab is visible.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, LIST_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [trip, canScan, state, refresh]);

  function chooseTrip(next: Trip) {
    setTrip(next);
    setList(null);
    storeTrip(next);
    syncUrl(next, false);
  }

  const codeHandled = useCallback(() => {
    setPendingCode(null);
    syncUrl(null, true);
  }, []);

  if (!canScan) return <Notice>{copy.state.noPermission}</Notice>;
  if (state !== "ready") {
    const message =
      state === "no_camp" ? copy.state.noCamp : state === "disabled" ? copy.state.disabled : copy.state.mappingBroken;
    return (
      <Notice>
        <p>{message}</p>
        {canEditSettings && settingsHref && state !== "no_camp" && (
          <ButtonLink href={settingsHref} variant="outline" size="sm" className="mt-3 self-start">
            {copy.state.toSettings}
          </ButtonLink>
        )}
      </Notice>
    );
  }

  const ready = list?.ok && list.state === "ready" ? list : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-card sm:border sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <div
            role="radiogroup"
            aria-label={copy.chooseTrip}
            className="grid flex-1 grid-cols-2 gap-1 rounded-pill bg-ink-100 p-1 sm:max-w-sm"
          >
            {TRIPS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={trip === option}
                onClick={() => chooseTrip(option)}
                className={cn(
                  "min-h-11 rounded-pill px-4 text-sm font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  trip === option ? "bg-surface-inverse text-on-inverse shadow-card" : "text-ink-700",
                )}
              >
                {copy.trips[option]}
              </button>
            ))}
          </div>
          {ready && (
            <p className="shrink-0 text-right text-sm tabular-nums text-muted-foreground" aria-live="polite">
              <span className="font-display text-xl font-bold text-foreground">{ready.boarded}</span>
              <span> / {ready.total}</span>
            </p>
          )}
        </div>
        {trip && (
          <div role="tablist" className="grid grid-cols-2 gap-1 lg:hidden">
            {(["scan", "list"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={tab === option}
                onClick={() => setTab(option)}
                className={cn(
                  "min-h-10 border-b-2 text-sm font-medium transition-colors",
                  tab === option ? "border-accent text-foreground" : "border-transparent text-muted-foreground",
                )}
              >
                {copy.tabs[option]}
              </button>
            ))}
          </div>
        )}
      </div>

      {!trip ? (
        <Notice>
          <p className="font-medium text-foreground">{copy.chooseTrip}</p>
          <p>{copy.chooseTripHint}</p>
        </Notice>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className={cn(tab === "scan" ? "block" : "hidden", "lg:block")}>
            <BusScanner
              trip={trip}
              active={tab === "scan"}
              pendingCode={pendingCode}
              onCodeHandled={codeHandled}
              onChange={refresh}
            />
          </div>
          <div className={cn(tab === "list" ? "block" : "hidden", "lg:block")}>
            <BusBoardingList trip={trip} list={list} onChange={refresh} />
          </div>
        </div>
      )}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-card border border-border bg-paper px-4 py-4 text-sm text-muted-foreground">
      <WarningCircle size={20} className="mt-0.5 shrink-0 text-ink-500" />
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
    </div>
  );
}
