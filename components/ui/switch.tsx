"use client";

import { cn } from "@/lib/cn";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  id?: string;
};

/** Accessible toggle. Label sits to the right and is clickable. */
export function Switch({ checked, onCheckedChange, label, id }: SwitchProps) {
  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-foreground"
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-pill transition-colors duration-150 ease-[var(--ease-out-expo)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          checked ? "bg-accent" : "bg-ink-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-pill bg-paper shadow-card transition-transform duration-150 ease-[var(--ease-out-expo)]",
            checked && "translate-x-4",
          )}
        />
      </button>
      {label}
    </label>
  );
}
