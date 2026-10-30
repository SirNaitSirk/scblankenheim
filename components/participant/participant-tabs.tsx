"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { resolveTab, TAB_FRAGMENTS, type ParticipantTab } from "@/lib/participant/tabs";

export type ParticipantPanel = {
  tab: ParticipantTab;
  label: string;
  /** Shown instead of `label` on very narrow screens. */
  shortLabel?: string;
  content: ReactNode;
};

// Without JavaScript the tab bar disappears and every panel stacks (research R2).
const NO_SCRIPT_CSS =
  "[data-participant-tablist]{display:none}" +
  "[data-participant-panel][hidden]{display:block!important}" +
  "[data-participant-panel]+[data-participant-panel]{margin-top:1.5rem}";

/**
 * Tab bar and panels of the participant page (specs/022-participant-tabs).
 * All panels stay mounted so form input and action results survive a switch
 * (research R1); the active tab follows the URL fragment (research R3).
 */
export function ParticipantTabs({ panels, label }: { panels: ParticipantPanel[]; label: string }) {
  const [active, setActive] = useState<ParticipantTab>("overview");
  const buttons = useRef(new Map<ParticipantTab, HTMLButtonElement>());
  const available = panels.map((panel) => panel.tab);
  const availableKey = available.join(",");

  useEffect(() => {
    const tabs = availableKey.split(",") as ParticipantTab[];
    const sync = () => {
      const { tab, scrollTo } = resolveTab(window.location.hash, tabs);
      setActive(tab);
      if (scrollTo) {
        requestAnimationFrame(() => document.getElementById(scrollTo)?.scrollIntoView({ block: "start" }));
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [availableKey]);

  const select = (tab: ParticipantTab) => {
    setActive(tab);
    // Keeps the router state, adds no history entry and does not scroll.
    window.history.replaceState(window.history.state, "", `#${TAB_FRAGMENTS[tab]}`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = available.indexOf(active);
    const last = available.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    select(available[next]);
    buttons.current.get(available[next])?.focus();
  };

  return (
    <div>
      <noscript>
        <style>{NO_SCRIPT_CSS}</style>
      </noscript>

      <div data-participant-tablist className="sticky top-0 z-10 -mx-1 bg-canvas/95 px-1 py-2 backdrop-blur">
        <div
          role="tablist"
          aria-label={label}
          onKeyDown={onKeyDown}
          className={cn(
            "grid gap-1 rounded-pill bg-ink-100 p-1",
            panels.length === 3 ? "grid-cols-3" : "grid-cols-2",
          )}
        >
          {panels.map((panel) => {
            const selected = panel.tab === active;
            return (
              <button
                key={panel.tab}
                ref={(node) => {
                  if (node) buttons.current.set(panel.tab, node);
                  else buttons.current.delete(panel.tab);
                }}
                type="button"
                role="tab"
                id={`participant-tab-${panel.tab}`}
                aria-selected={selected}
                aria-controls={`participant-panel-${panel.tab}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(panel.tab)}
                className={cn(
                  "h-11 whitespace-nowrap rounded-pill px-2 text-[13px] transition-colors duration-150 sm:text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "bg-surface font-semibold text-foreground shadow-card"
                    : "font-medium text-muted-foreground hover:text-foreground",
                )}
              >
                {panel.shortLabel ? (
                  <>
                    <span className="min-[360px]:hidden">{panel.shortLabel}</span>
                    <span className="hidden min-[360px]:inline">{panel.label}</span>
                  </>
                ) : (
                  panel.label
                )}
              </button>
            );
          })}
        </div>
      </div>

      {panels.map((panel) => (
        <div
          key={panel.tab}
          role="tabpanel"
          id={`participant-panel-${panel.tab}`}
          aria-labelledby={`participant-tab-${panel.tab}`}
          tabIndex={0}
          hidden={panel.tab !== active}
          data-participant-panel
          className="mt-4 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex flex-col gap-6">{panel.content}</div>
        </div>
      ))}
    </div>
  );
}
