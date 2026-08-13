import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const control =
  "min-h-24 w-full min-w-0 rounded-input border border-ink-200 bg-surface px-3 py-2 text-sm text-foreground " +
  "placeholder:text-muted-foreground transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, className)} {...props} />;
}
