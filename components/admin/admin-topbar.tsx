"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { List, Moon, Monitor, Sun } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";
import { useAdminTheme, type ThemeChoice } from "@/hooks/use-admin-theme";

const themeOptions: { value: ThemeChoice; label: string; Icon: Icon }[] = [
  { value: "light", label: de.shell.theme.light, Icon: Sun },
  { value: "system", label: de.shell.theme.system, Icon: Monitor },
  { value: "dark", label: de.shell.theme.dark, Icon: Moon },
];

function ThemeControl() {
  const { choice, setChoice } = useAdminTheme();

  return (
    <div
      role="group"
      aria-label={de.shell.theme.label}
      className="flex items-center gap-0.5 rounded-pill border border-border p-0.5"
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
              "flex h-7 w-7 items-center justify-center rounded-pill transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              active
                ? "bg-surface-inverse text-on-inverse"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={16} weight={active ? "fill" : "regular"} />
          </button>
        );
      })}
    </div>
  );
}

export function AdminTopbar({ onToggle }: { onToggle: () => void }) {
  const { user } = useUser();
  const displayName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    de.shell.account;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/90 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        onClick={onToggle}
        aria-label={de.shell.collapse}
        className="flex h-9 w-9 items-center justify-center rounded-input text-muted-foreground transition-colors duration-150 hover:bg-ink-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <List size={20} weight="bold" />
      </button>

      <div className="flex items-center gap-3">
        <ThemeControl />
        <span className="hidden max-w-[220px] truncate text-sm font-medium text-foreground sm:inline">
          {displayName}
        </span>
        <UserButton
          appearance={{ elements: { avatarBox: "h-9 w-9" } }}
        />
      </div>
    </header>
  );
}
