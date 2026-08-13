import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "paid" | "pending" | "neutral" | "danger";

const tones: Record<BadgeTone, string> = {
  paid: "bg-surface-inverse text-on-inverse",
  pending: "bg-amber-100 text-amber-600",
  neutral: "bg-ink-100 text-ink-700",
  danger: "bg-danger/10 text-danger",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-3 py-1 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
