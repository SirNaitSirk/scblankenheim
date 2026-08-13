import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Mono uppercase label. Use sparingly — at most one per few sections. */
export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <span className={cn("eyebrow", className)}>{children}</span>;
}
