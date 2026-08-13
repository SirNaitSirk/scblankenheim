"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type NavVariant = "solid" | "overlay";

const items = [
  { label: "Start", href: "#start" },
  { label: "Camp", href: "#camp" },
  { label: "Packliste", href: "#packliste" },
  { label: "Anmelden", href: "#anmelden" },
];

/**
 * Uppercase, letter-spaced top navigation.
 * `overlay` sits transparent over the hero photo; `solid` for content pages.
 */
export function SiteNav({ variant = "solid" }: { variant?: NavVariant }) {
  const [open, setOpen] = useState(false);
  const overlay = variant === "overlay";

  return (
    <nav
      className={cn(
        "relative z-20 w-full",
        overlay ? "text-on-inverse" : "text-foreground",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-6 md:px-10">
        <span className="font-display text-xl font-extrabold tracking-tight">
          CampConnect
        </span>

        <ul className="hidden items-center gap-8 md:flex">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={cn(
                  "text-xs font-medium uppercase tracking-[0.18em] transition-colors duration-150",
                  overlay
                    ? "text-on-inverse/80 hover:text-on-inverse"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-label="Menü öffnen"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center md:hidden"
        >
          <span className="flex flex-col gap-1.5">
            <span className="block h-px w-6 bg-current" />
            <span className="block h-px w-6 bg-current" />
          </span>
        </button>
      </div>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-border bg-surface px-6 py-4 text-foreground md:hidden">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
