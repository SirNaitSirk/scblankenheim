"use client";

import type { Icon } from "@phosphor-icons/react";
import { DotsThreeVertical } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export type MenuItem = {
  label: string;
  icon?: Icon;
  onSelect: () => void;
  danger?: boolean;
};

/**
 * Row / action menu. The panel renders in a portal with fixed positioning so it
 * escapes any `overflow` ancestor (e.g. a horizontally scrolling table) instead
 * of being clipped. Closes on outside click, Escape, scroll, and resize.
 */
export function Menu({
  items,
  label,
  align = "end",
}: {
  items: MenuItem[];
  label: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const WIDTH = 192;

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left =
      align === "end"
        ? Math.max(8, rect.right - WIDTH)
        : Math.min(window.innerWidth - WIDTH - 8, rect.left);
    setCoords({ top: rect.bottom + 4, left });
    setOpen(true);
  }, [align]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (
        !panelRef.current?.contains(t) &&
        !triggerRef.current?.contains(t)
      ) {
        close();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : openMenu())}
        className="flex h-8 w-8 items-center justify-center rounded-input text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <DotsThreeVertical size={18} weight="bold" />
      </button>

      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="menu"
              style={{ top: coords.top, left: coords.left, width: WIDTH }}
              className="fixed z-50 overflow-hidden rounded-input border border-border bg-surface p-1 shadow-pop"
            >
              {items.map((item) => {
                const Glyph = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      item.onSelect();
                      close();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm transition-colors duration-150",
                      item.danger
                        ? "text-danger hover:bg-danger/10"
                        : "text-foreground hover:bg-ink-100",
                    )}
                  >
                    {Glyph ? <Glyph size={16} weight="regular" /> : null}
                    {item.label}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
