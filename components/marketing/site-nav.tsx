"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { marketingMessages } from "@/lib/marketing/messages";
import { registerMessages } from "@/lib/register/messages";

type NavVariant = "solid" | "overlay";

type NavCta = { label: string; href: string };

const copy = marketingMessages.nav;

const DEFAULT_CTA: NavCta = { label: registerMessages.cta.openShort, href: "/#anmelden" };

/**
 * Uppercase, letter spaced top navigation (specs/024-landing-structure R9).
 * Text links for the page's targets, the registration as a button on the right.
 * `overlay` is fixed and transparent over the hero photo, then fades to a solid
 * warm background once the visitor scrolls past the fold. `solid` for content
 * pages renders inline with a solid background from the start.
 */
export function SiteNav({
  variant = "solid",
  cta = DEFAULT_CTA,
  showSchoolRelease = false,
}: {
  variant?: NavVariant;
  cta?: NavCta;
  showSchoolRelease?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const overlay = variant === "overlay";
  const navRef = useRef<HTMLElement | null>(null);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const past = y > 40;
    setScrolled((prev) => (prev === past ? prev : past));
  });

  // The open mobile menu closes on Esc, on a tap outside the nav and whenever
  // the page jumps to an anchor. A document listener is used for the outside tap
  // because the blurred nav confines any fixed backdrop to its own box.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", close);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", close);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const items = [
    { label: copy.camp, href: "#camp" },
    { label: copy.goodToKnow, href: "#gut-zu-wissen" },
    ...(showSchoolRelease ? [{ label: copy.schoolRelease, href: "#schulbefreiung" }] : []),
  ];

  // Transparent over the photo only while overlay AND above the fold; otherwise solid.
  const solidBg = !overlay || scrolled || open;
  const lightText = overlay && !scrolled && !open;

  return (
    <nav
      ref={navRef}
      className={cn(
        overlay ? "fixed inset-x-0 top-0 z-30" : "relative z-20 w-full",
        "transition-colors duration-300 ease-[var(--ease-out-expo)]",
        solidBg
          ? "border-b border-border bg-sand-50/85 text-foreground backdrop-blur-md"
          : "border-b border-transparent text-on-inverse",
      )}
    >
      <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between px-6 md:px-10">
        <a
          href="#start"
          aria-label={copy.home}
          className="font-display text-xl font-extrabold tracking-tight"
        >
          {marketingMessages.brand.short}
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-8">
            {items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={cn(
                    "text-xs font-medium uppercase tracking-[0.18em] transition-colors duration-150",
                    lightText
                      ? "text-on-inverse/80 hover:text-on-inverse"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <ButtonLink href={cta.href} size="sm">
            {cta.label}
          </ButtonLink>
        </div>

        <button
          type="button"
          aria-label={open ? copy.closeMenu : copy.openMenu}
          aria-expanded={open}
          aria-controls="site-nav-menu"
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
        <div
          id="site-nav-menu"
          className="border-t border-border bg-surface px-6 py-4 text-foreground md:hidden"
        >
          <ul className="flex flex-col gap-1">
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
          <ButtonLink
            href={cta.href}
            onClick={() => setOpen(false)}
            className="mt-4 w-full"
          >
            {cta.label}
          </ButtonLink>
        </div>
      )}
    </nav>
  );
}
