"use client";

import {
  ClipboardText,
  CurrencyEur,
  type Icon,
  SquaresFour,
  Tent,
  UserCircle,
  Users,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { canSeeTab } from "@/lib/admin/access";
import { de } from "@/lib/admin/messages";
import { NAV_ITEMS } from "./nav-items";

const NAV_ICONS: Record<string, Icon> = {
  "/admin": SquaresFour,
  "/admin/finanzen": CurrencyEur,
  "/admin/camps": Tent,
  "/admin/logs": ClipboardText,
  "/admin/benutzer": Users,
  "/admin/profil": UserCircle,
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Sidebar content (brand block + nav). Positioning and width are owned by
 * AdminShell so the same content serves the desktop rail and the mobile drawer.
 */
export function SidebarContent({
  collapsed = false,
  onNavigate,
  visibleTabs,
  isSuperadmin,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  visibleTabs: string[];
  isSuperadmin: boolean;
}) {
  const pathname = usePathname();
  const role = isSuperadmin ? "superadmin" : "admin";
  const navItems = NAV_ITEMS.filter((item) =>
    canSeeTab({ role, visibleTabs }, item.href),
  );

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-3"
          aria-label={de.brand.name}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-surface-inverse font-display text-sm font-black text-on-inverse">
            SC
          </span>
          {!collapsed && (
            <span className="flex flex-col leading-tight">
              <span className="font-display text-sm font-extrabold tracking-tight text-foreground">
                Summercamp
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {de.brand.panel}
              </span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Glyph = NAV_ICONS[item.href];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-input px-3 py-2 text-sm font-medium transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-surface-inverse text-on-inverse"
                      : "text-muted-foreground hover:bg-ink-100 hover:text-foreground",
                  )}
                >
                  <Glyph
                    size={20}
                    weight={active ? "fill" : "regular"}
                    className={cn("shrink-0", active && "text-amber-400")}
                  />
                  {!collapsed && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
