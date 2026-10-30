import { cn } from "@/lib/cn";

/**
 * Scroll reveal wrapper. Adds the `.reveal` class, a pure CSS view timeline
 * animation (app/globals.css), so content is visible without JavaScript, under
 * reduced motion and in browsers without scroll driven animations
 * (specs/024-landing-structure R1).
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  id?: string;
}) {
  return (
    <Tag id={id} className={cn("reveal", className)}>
      {children}
    </Tag>
  );
}
