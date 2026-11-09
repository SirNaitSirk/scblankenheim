"use client";

import { Bus, List, Receipt, SquaresFour, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { canSeeTab } from "@/lib/admin/access";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";
import { BOTTOM_BAR_HREFS, NAV_ITEMS, isActive } from "./nav-items";

const ICONS: Record<(typeof BOTTOM_BAR_HREFS)[number], Icon> = {
  "/admin": SquaresFour,
  "/admin/finanzen": Receipt,
  "/admin/bus": Bus,
};

const entry =
  "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-input py-1.5 text-[11px] font-medium transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

/**
 * Quick access bar of the home screen app on phones (specs/040-admin-mobile-app):
 * Übersicht, Finanzen and Bus where the admin may see them, plus the menu.
 * Shown only in standalone mode below `md`, purely by CSS.
 */
export function AdminBottomBar({
  visibleTabs,
  isSuperadmin,
  onOpenMenu,
}: {
  visibleTabs: string[];
  isSuperadmin: boolean;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const role = isSuperadmin ? "superadmin" : "admin";
  const items = NAV_ITEMS.filter(
    (item) =>
      (BOTTOM_BAR_HREFS as readonly string[]).includes(item.href) &&
      canSeeTab({ role, visibleTabs }, item.href),
  );

  return (
    <nav
      aria-label={de.shell.bottomNav}
      className="fixed inset-x-0 bottom-0 z-30 hidden border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur standalone:block md:standalone:hidden"
    >
      <ul className="flex h-16 items-stretch gap-1 px-2 py-1.5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Glyph = ICONS[item.href as keyof typeof ICONS];
          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                prefetch
                aria-current={active ? "page" : undefined}
                className={cn(
                  entry,
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Glyph
                  size={22}
                  weight={active ? "fill" : "regular"}
                  className={cn(active && "text-amber-400")}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <button
            type="button"
            onClick={onOpenMenu}
            className={cn(entry, "text-muted-foreground")}
          >
            <List size={22} />
            {de.shell.menu}
          </button>
        </li>
      </ul>
    </nav>
  );
}
