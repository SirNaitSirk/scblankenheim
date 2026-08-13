import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Composed empty state that teaches the next action, not a bare "nothing here". */
export function EmptyState({
  icon: IconGlyph,
  title,
  description,
  action,
  className,
}: {
  icon: Icon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-ink-100 text-ink-500">
        <IconGlyph size={22} weight="regular" />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-base font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mx-auto max-w-[42ch] text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** Skeleton row block for loading.tsx segments. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <div className="h-4 w-40 animate-pulse rounded-sm bg-ink-100" />
          <div className="hidden h-4 w-56 animate-pulse rounded-sm bg-ink-100 sm:block" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded-sm bg-ink-100" />
          <div className="h-6 w-20 animate-pulse rounded-pill bg-ink-100" />
        </div>
      ))}
    </div>
  );
}

/** Small block used inside loading.tsx to mimic a stat tile. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-card border border-border bg-surface p-5 shadow-card",
        className,
      )}
    >
      <div className="h-3 w-20 animate-pulse rounded-sm bg-ink-100" />
      <div className="h-7 w-28 animate-pulse rounded-sm bg-ink-100" />
      <div className="h-3 w-16 animate-pulse rounded-sm bg-ink-100" />
    </div>
  );
}
