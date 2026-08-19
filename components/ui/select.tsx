import { CaretDown } from "@phosphor-icons/react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: SelectOption[];
};

/** Native select styled to the tokens, with a custom caret. */
export function Select({ className, options, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-input border border-ink-200 bg-surface pl-3 pr-9 text-sm text-foreground",
          "transition-colors duration-150 focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <CaretDown
        size={14}
        weight="bold"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
