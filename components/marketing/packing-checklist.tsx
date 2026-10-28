"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/ui/print-button";
import {
  PACKING_STORAGE_KEY,
  packingListMessages as copy,
  parseCheckedItems,
  type PackingSection,
} from "@/lib/marketing/packing-list";

const CHANGE_EVENT = "packing-list-change";

// Fallback when the browser refuses storage (private mode, blocked site data):
// ticks then live for this page visit only.
let memoryValue: string | null = null;

function readStored(): string | null {
  if (memoryValue !== null) return memoryValue;
  try {
    return localStorage.getItem(PACKING_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(value: string) {
  memoryValue = value;
  try {
    localStorage.setItem(PACKING_STORAGE_KEY, value);
  } catch {
    // Keep the in memory value only.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PACKING_STORAGE_KEY) return;
    memoryValue = null;
    callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

// The server renders every box empty; saved ticks appear after hydration.
function serverSnapshot(): string | null {
  return null;
}

/** Tickable packing list with progress and reset; ticks stay on this device. */
export function PackingChecklist({ sections }: { sections: PackingSection[] }) {
  const raw = useSyncExternalStore(subscribe, readStored, serverSnapshot);
  const checked = useMemo(() => parseCheckedItems(raw), [raw]);
  const total = sections.reduce((sum, section) => sum + section.items.length, 0);

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(checked);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeStored(JSON.stringify([...next]));
    },
    [checked],
  );

  const reset = useCallback(() => writeStored("[]"), []);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-y border-border py-4 print:hidden">
        <p aria-live="polite" className="text-sm font-medium tabular-nums text-foreground">
          {checked.size === total ? copy.complete : copy.progress(checked.size, total)}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset} disabled={checked.size === 0}>
            {copy.reset}
          </Button>
          <PrintButton label={copy.print} />
        </div>
      </div>

      <div className="grid gap-x-16 gap-y-12 md:grid-cols-2 print:grid-cols-2 print:gap-x-10 print:gap-y-6">
        {sections.map((section) => (
          <fieldset key={section.id} className="packing-section min-w-0">
            <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground print:mb-1 print:text-black">
              {section.title}
            </legend>
            <ul className="flex flex-col">
              {section.items.map((item) => (
                <li key={item.id}>
                  <label className="group flex min-h-11 cursor-pointer items-start gap-3 py-2.5 print:min-h-0 print:py-1">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked.has(item.id)}
                      onChange={() => toggle(item.id)}
                    />
                    <span
                      aria-hidden
                      className="packing-tick mt-0.5 grid size-5 shrink-0 place-items-center rounded-[6px] border-[1.5px] border-ink-300 bg-surface text-accent-foreground transition-colors duration-150 ease-[var(--ease-out-expo)] group-hover:border-amber-400 group-has-checked:border-accent group-has-checked:bg-accent group-has-focus-visible:ring-2 group-has-focus-visible:ring-ring group-has-focus-visible:ring-offset-2 group-has-focus-visible:ring-offset-canvas"
                    >
                      <Check
                        size={13}
                        weight="bold"
                        className="opacity-0 transition-opacity duration-150 group-has-checked:opacity-100"
                      />
                    </span>
                    <span className="packing-label min-w-0 text-base leading-snug text-foreground transition-colors duration-150 group-has-checked:text-muted-foreground group-has-checked:line-through group-has-checked:decoration-ink-300">
                      {item.label}
                      {item.note && (
                        <span className="ml-2 text-sm text-muted-foreground">{item.note}</span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
