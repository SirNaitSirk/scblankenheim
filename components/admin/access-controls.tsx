"use client";

import { Check } from "@phosphor-icons/react";
import { NAV_ITEMS } from "@/components/admin/nav-items";
import { PERMISSION_KEYS } from "@/lib/admin/access";
import { cn } from "@/lib/cn";
import { PERMISSION_LABELS, ROLE_LABELS, de } from "@/lib/admin/messages";
import type { UserRole } from "@/lib/admin/types";

const ROLES: UserRole[] = ["admin", "superadmin"];

/** Role + permissions + visible-tabs selector shared by the edit/add/invite dialogs. */
export type AccessValue = {
  role: UserRole;
  permissions: string[];
  visibleTabs: string[];
};

export function AccessFields({
  value,
  onChange,
  roleLocked = false,
  roleHint,
}: {
  value: AccessValue;
  onChange: (next: AccessValue) => void;
  roleLocked?: boolean;
  roleHint?: string;
}) {
  const t = de.users.form;
  const isSuperadmin = value.role === "superadmin";
  const hint = roleHint ?? (roleLocked ? t.roleSelfLocked : t.roleSuperadminHint);

  const setRole = (role: UserRole) => {
    if (roleLocked) return;
    onChange({ ...value, role });
  };

  const togglePermission = (key: string) =>
    onChange({
      ...value,
      permissions: value.permissions.includes(key)
        ? value.permissions.filter((p) => p !== key)
        : [...value.permissions, key],
    });

  const toggleTab = (href: string) =>
    onChange({
      ...value,
      visibleTabs: value.visibleTabs.includes(href)
        ? value.visibleTabs.filter((h) => h !== href)
        : [...value.visibleTabs, href],
    });

  const allPermissionsSelected =
    value.permissions.length >= PERMISSION_KEYS.length;
  const toggleAllPermissions = () =>
    onChange({
      ...value,
      permissions: allPermissionsSelected ? [] : [...PERMISSION_KEYS],
    });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {t.role}
        </span>
        <div className="inline-flex w-fit rounded-input border border-ink-200 bg-ink-50 p-1">
          {ROLES.map((role) => {
            const active = value.role === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setRole(role)}
                disabled={roleLocked}
                aria-pressed={active}
                className={cn(
                  "rounded-sm px-4 py-1.5 text-sm font-medium transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
                  active
                    ? "bg-surface-inverse text-on-inverse shadow-card"
                    : "text-muted-foreground hover:text-foreground",
                  roleLocked && "cursor-not-allowed opacity-70",
                )}
              >
                {ROLE_LABELS[role]}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t.permissions}
          </span>
          {!isSuperadmin && (
            <button
              type="button"
              onClick={toggleAllPermissions}
              className="text-xs font-medium text-accent transition-colors duration-150 hover:text-accent-strong focus-visible:outline-none focus-visible:underline"
            >
              {allPermissionsSelected ? t.deselectAll : t.selectAll}
            </button>
          )}
        </div>
        {isSuperadmin ? (
          <AllGrantedNote />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PERMISSION_KEYS.map((key) => (
              <ToggleChip
                key={key}
                label={PERMISSION_LABELS[key] ?? key}
                active={value.permissions.includes(key)}
                onClick={() => togglePermission(key)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <span className="text-xs font-medium text-muted-foreground">
          {t.visibleTabs}
        </span>
        {isSuperadmin ? (
          <AllGrantedNote />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NAV_ITEMS.map((item) => (
              <ToggleChip
                key={item.href}
                label={item.label}
                active={value.visibleTabs.includes(item.href)}
                onClick={() => toggleTab(item.href)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AllGrantedNote() {
  return (
    <p className="rounded-input border border-border bg-ink-50 px-3 py-2 text-sm text-muted-foreground">
      {de.users.allPermissions}
    </p>
  );
}

export function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-input border px-3 py-2 text-sm font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
        active
          ? "border-transparent bg-surface-inverse text-on-inverse"
          : "border-ink-200 bg-surface text-foreground hover:border-ink-300 hover:bg-ink-50",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-150",
          active
            ? "border-on-inverse/40 bg-on-inverse/15 text-on-inverse"
            : "border-ink-300 text-transparent",
        )}
      >
        <Check size={11} weight="bold" />
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
