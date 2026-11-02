"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  countdownRemaining,
  formatOpeningDate,
  formatOpeningTime,
  type CountdownRemaining,
} from "@/lib/register/countdown";
import { registerMessages } from "@/lib/register/messages";

const copy = registerMessages.countdown;

const TICK_MS = 30_000;
const DAY_MS = 86_400_000;

// A 30s ticker via useSyncExternalStore: nothing on screen changes more often
// than once an hour, so a coarse tick is enough (specs/031 research R2). The
// snapshot is quantized to the tick so it stays stable between ticks.
function subscribe(onChange: () => void): () => void {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
}
function getTickSnapshot(): number {
  return Math.floor(Date.now() / TICK_MS) * TICK_MS;
}
// Server + first hydration render: `0` sentinel → no remaining line, no mismatch.
function getServerSnapshot(): number {
  return 0;
}

function remainingLabel(remaining: CountdownRemaining): string {
  switch (remaining.kind) {
    case "days":
      return copy.remainingDays(remaining.value);
    case "hours":
      return copy.remainingHours(remaining.value);
    case "underHour":
      return copy.remainingUnderHour;
  }
}

/** Keeps „1. Februar 2027“ on one line so a narrow screen breaks after the weekday. */
function OpeningDate({ text }: { text: string }) {
  const comma = text.indexOf(", ");
  if (comma === -1) return text;
  return (
    <>
      {text.slice(0, comma + 1)}{" "}
      <span className="whitespace-nowrap">{text.slice(comma + 2)}</span>
    </>
  );
}

/**
 * Date led countdown (specs/031-landing-review-fixes): the opening date and
 * time as the main statement, the remaining time as a quiet line. No seconds
 * and no live region, so screen readers are not interrupted.
 */
export function CountdownPanel({ target }: { target: string }) {
  const targetDate = new Date(target);
  const targetMs = targetDate.getTime();
  const tick = useSyncExternalStore(subscribe, getTickSnapshot, getServerSnapshot);

  // A one shot timer flips to "reached" exactly at the target, independent of the tick.
  const [hitTarget, setHitTarget] = useState(false);
  useEffect(() => {
    const delay = targetMs - Date.now();
    if (delay <= 0 || delay > DAY_MS) return;
    const id = setTimeout(() => setHitTarget(true), delay);
    return () => clearTimeout(id);
  }, [targetMs]);

  const ready = tick !== 0;
  const remaining = ready ? countdownRemaining(targetMs, tick) : null;
  const reached = hitTarget || (ready && remaining === null);

  // At zero the server opens registration automatically (research R1/R7 of
  // specs/001): refresh once so the server renders the form instead.
  const router = useRouter();
  const refreshed = useRef(false);
  useEffect(() => {
    if (!reached || refreshed.current) return;
    refreshed.current = true;
    router.refresh();
  }, [reached, router]);

  if (reached) {
    return (
      <div className="rounded-card border border-border bg-surface p-8 text-center">
        <p className="font-display text-2xl font-extrabold tracking-tight text-accent-strong">
          {copy.reachedTitle}
        </p>
        <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
          {copy.reachedBody}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-surface px-6 py-10 text-center sm:px-10">
      <p className="text-balance font-display text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
        <OpeningDate text={formatOpeningDate(targetDate)} />
      </p>
      <p className="mt-2 text-lg font-medium text-foreground/80">
        {copy.opensAtTime(formatOpeningTime(targetDate))}
      </p>
      <p className="mt-6 min-h-[1.5em] text-sm font-medium uppercase tracking-[0.14em] text-amber-700">
        {remaining ? remainingLabel(remaining) : null}
      </p>
    </div>
  );
}
