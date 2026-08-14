"use client";

import { useSyncExternalStore } from "react";

const copy = {
  reopenHint: "Anmeldung öffnet am",
  reachedTitle: "Es geht los!",
  reachedBody:
    "Die Anmeldung sollte jetzt geöffnet sein. Lade die Seite neu, um zum Formular zu gelangen.",
  units: {
    days: "Tage",
    hours: "Std.",
    minutes: "Min.",
    seconds: "Sek.",
  },
} as const;

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function remainingFrom(targetMs: number, nowMs: number): Remaining | null {
  const diff = targetMs - nowMs;
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

// A 1s ticker via useSyncExternalStore — no setState-in-effect, clean hydration.
// The snapshot is quantized to whole seconds so it stays stable between ticks.
function subscribe(onChange: () => void): () => void {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}
function getSecondSnapshot(): number {
  return Math.floor(Date.now() / 1000);
}
// Server + first hydration render: `0` sentinel → show placeholder, no mismatch.
function getServerSnapshot(): number {
  return 0;
}

export function CountdownPanel({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  const nowSecond = useSyncExternalStore(
    subscribe,
    getSecondSnapshot,
    getServerSnapshot,
  );

  const ready = nowSecond !== 0;
  const remaining = ready ? remainingFrom(targetMs, nowSecond * 1000) : null;

  if (ready && remaining === null) {
    return (
      <div className="rounded-card border border-border bg-surface p-8 text-center shadow-card">
        <p className="font-display text-2xl font-extrabold tracking-tight text-accent-strong">
          {copy.reachedTitle}
        </p>
        <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
          {copy.reachedBody}
        </p>
      </div>
    );
  }

  const units: { key: keyof Remaining; label: string }[] = [
    { key: "days", label: copy.units.days },
    { key: "hours", label: copy.units.hours },
    { key: "minutes", label: copy.units.minutes },
    { key: "seconds", label: copy.units.seconds },
  ];

  return (
    <div className="text-center">
      <div
        aria-live="polite"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
      >
        {units.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-card border border-border bg-surface px-4 py-6 shadow-card"
          >
            <span className="block font-display text-4xl font-black tabular-nums tracking-tight text-foreground sm:text-5xl">
              {remaining ? String(remaining[key]).padStart(2, "0") : "--"}
            </span>
            <span className="mt-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        {copy.reopenHint}{" "}
        <span className="font-medium text-foreground">
          {dateFormatter.format(new Date(target))}
        </span>
      </p>
    </div>
  );
}
