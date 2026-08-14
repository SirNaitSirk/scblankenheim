"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";
import { AdminTopbar } from "./admin-topbar";
import { SidebarContent } from "./admin-sidebar";

const STORAGE_KEY = "cc-admin-sidebar-collapsed";
const CHANGE_EVENT = "cc-sidebar-change";
const DESKTOP = "(min-width: 768px)";

// Persisted rail state read via an external store so there is no setState-in-effect
// and no SSR/client hydration mismatch (server snapshot is always expanded).
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getCollapsed() {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

function setCollapsedPersisted(value: boolean) {
  localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function AdminShell({
  children,
  visibleTabs,
  isSuperadmin,
}: {
  children: ReactNode;
  visibleTabs: string[];
  isSuperadmin: boolean;
}) {
  const collapsed = useSyncExternalStore(subscribe, getCollapsed, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const toggle = useCallback(() => {
    if (window.matchMedia(DESKTOP).matches) {
      setCollapsedPersisted(!getCollapsed());
    } else {
      setMobileOpen((prev) => !prev);
    }
  }, []);

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="admin-theme-scope flex min-h-[100dvh] bg-canvas">
      {/* Desktop sidebar / rail */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-surface md:sticky md:top-0 md:flex md:h-[100dvh] md:flex-col",
          "transition-[width] duration-200 ease-[var(--ease-out-expo)]",
          collapsed ? "md:w-[72px]" : "md:w-[248px]",
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          visibleTabs={visibleTabs}
          isSuperadmin={isSuperadmin}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden">
          <div
            aria-hidden
            onClick={closeMobile}
            className="fixed inset-0 z-40 bg-black/50"
          />
          <aside
            role="dialog"
            aria-label={de.shell.openMenu}
            className="fixed inset-y-0 left-0 z-50 w-[248px] border-r border-border bg-surface shadow-pop"
          >
            <SidebarContent
              onNavigate={closeMobile}
              visibleTabs={visibleTabs}
              isSuperadmin={isSuperadmin}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onToggle={toggle} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
