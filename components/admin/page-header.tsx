import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Consistent content container: max width, page padding, vertical rhythm. */
export function PageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8 md:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * In-content page header used across every admin page for a consistent title /
 * badge / description / actions rhythm. No eyebrow — the heading carries itself.
 */
export function PageHeader({
  title,
  badge,
  description,
  actions,
  className,
}: {
  title: string;
  badge?: ReactNode;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          {badge}
        </div>
        {description ? (
          <p className="max-w-[60ch] text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
