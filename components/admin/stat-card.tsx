import { cn } from "@/lib/cn";

/**
 * Dashboard metric tile. `hero` renders the near-black variant (one per row),
 * matching the incumbent dashboard reference. `delta` is an optional secondary
 * line; `tone` controls whether it reads as a positive signal or neutral context.
 */
export function StatCard({
  label,
  value,
  delta,
  tone = "muted",
  hero = false,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "positive" | "muted";
  hero?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-card border p-5 shadow-card",
        hero
          ? "border-transparent bg-surface-inverse text-on-inverse"
          : "border-border bg-surface text-foreground",
      )}
    >
      <span
        className={cn(
          "text-xs font-medium",
          hero ? "text-on-inverse/70" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span className="font-display text-2xl font-bold tracking-tight">
        {value}
      </span>
      {delta ? (
        <span
          className={cn(
            "text-xs",
            tone === "positive"
              ? hero
                ? "text-amber-400"
                : "text-success"
              : hero
                ? "text-on-inverse/60"
                : "text-muted-foreground",
          )}
        >
          {delta}
        </span>
      ) : null}
    </div>
  );
}
