import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { SiteFooter } from "@/components/marketing/site-footer";

/** Narrow, centered page frame for the public payment pages. */
export function PaymentShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-canvas">
      <header className="mx-auto w-full max-w-[40rem] px-6 pt-10 md:pt-16">
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          FCG Blankenheim Summercamp
        </Link>
      </header>
      <div className="mx-auto w-full max-w-[40rem] flex-1 px-6 py-10 md:py-16">
        {children}
      </div>
      <SiteFooter />
    </main>
  );
}

type NoticeTone = "success" | "muted" | "danger";

/** Card in the same look as the registration success notice. */
export function PaymentNotice({
  tone = "muted",
  title,
  body,
  busy = false,
  heading: Heading = "h1",
  children,
}: {
  tone?: NoticeTone;
  title: string;
  body?: string;
  busy?: boolean;
  /** "h2" when the notice sits above the page's own heading. */
  heading?: "h1" | "h2";
  children?: ReactNode;
}) {
  return (
    <section
      aria-live="polite"
      aria-busy={busy}
      className={cn(
        "rounded-card border bg-surface p-8 text-center shadow-card",
        tone === "success" && "border-accent/40",
        tone === "danger" && "border-danger/40",
        tone === "muted" && "border-border",
      )}
    >
      {busy && (
        <span
          aria-hidden
          className="mx-auto mb-5 block h-8 w-8 rounded-full border-2 border-ink-200 border-t-accent motion-safe:animate-spin"
        />
      )}
      <Heading
        className={cn(
          "font-display text-2xl font-extrabold tracking-tight",
          tone === "success" && "text-accent-strong",
          tone === "danger" && "text-danger",
          tone === "muted" && "text-foreground",
        )}
      >
        {title}
      </Heading>
      {body && (
        <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
      )}
      {children}
    </section>
  );
}
