"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { List, Moon, Monitor, Sun, X } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import type { Ref } from "react";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";
import { useAdminTheme, type ThemeChoice } from "@/hooks/use-admin-theme";
import { ReloadButton } from "./reload-button";

const themeOptions: { value: ThemeChoice; label: string; Icon: Icon }[] = [
  { value: "light", label: de.shell.theme.light, Icon: Sun },
  { value: "system", label: de.shell.theme.system, Icon: Monitor },
  { value: "dark", label: de.shell.theme.dark, Icon: Moon },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

/**
 * Light, system and dark switch. `large` gives 44px targets for the phone
 * drawer (specs/040-admin-mobile-app); the topbar keeps the compact size.
 */
export function ThemeControl({ large = false }: { large?: boolean }) {
  const { choice, setChoice } = useAdminTheme();

  return (
    <div
      role="group"
      aria-label={de.shell.theme.label}
      className={cn(
        "flex items-center gap-0.5 rounded-pill border border-border p-0.5",
        large && "w-full justify-between",
      )}
    >
      {themeOptions.map(({ value, label, Icon }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setChoice(value)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={cn(
              "flex items-center justify-center gap-2 rounded-pill transition-colors duration-150",
              focusRing,
              large ? "h-11 flex-1 text-sm font-medium" : "h-7 w-7",
              active
                ? "bg-surface-inverse text-on-inverse"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={16} weight={active ? "fill" : "regular"} />
            {large && label}
          </button>
        );
      })}
    </div>
  );
}

const iconButton =
  "flex items-center justify-center rounded-input text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground " +
  focusRing;

export function AdminTopbar({
  collapsed,
  mobileOpen,
  onToggleDesktop,
  onToggleMobile,
  mobileToggleRef,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleDesktop: () => void;
  onToggleMobile: () => void;
  mobileToggleRef: Ref<HTMLButtonElement>;
}) {
  const { user } = useUser();
  const displayName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    de.shell.account;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:px-6">
        {/* Two toggles instead of a viewport check in JS: the phone one opens the
            drawer, the desktop one collapses the rail. */}
        <button
          ref={mobileToggleRef}
          type="button"
          onClick={onToggleMobile}
          aria-label={mobileOpen ? de.shell.closeMenu : de.shell.openMenu}
          aria-expanded={mobileOpen}
          className={cn(iconButton, "-ml-1 h-11 w-11 md:hidden")}
        >
          {mobileOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
        </button>
        <button
          type="button"
          onClick={onToggleDesktop}
          aria-label={collapsed ? de.shell.expand : de.shell.collapse}
          className={cn(iconButton, "hidden h-9 w-9 md:flex")}
        >
          <List size={20} weight="bold" />
        </button>

        <div className="flex items-center gap-3">
          <ReloadButton />
          <div className="hidden md:flex">
            <ThemeControl />
          </div>
          <span className="hidden max-w-[220px] truncate text-sm font-medium text-foreground sm:inline">
            {displayName}
          </span>
          <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
        </div>
      </div>
    </header>
  );
}
