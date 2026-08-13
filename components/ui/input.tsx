import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "h-10 w-full rounded-input border border-ink-200 bg-surface px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Optional leading adornment (e.g. a search icon). Adds left padding. */
  leading?: ReactNode;
};

export function Input({ className, leading, ...props }: InputProps) {
  if (leading) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {leading}
        </span>
        <input className={cn(control, "pl-9", className)} {...props} />
      </div>
    );
  }
  return <input className={cn(control, className)} {...props} />;
}

/** Label-above field wrapper. Keeps label / control / helper spacing consistent. */
export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}
