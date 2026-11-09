"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/cn";
import { de } from "@/lib/admin/messages";
import { AdminBottomBar } from "./admin-bottom-bar";
import { AdminTopbar, ThemeControl } from "./admin-topbar";
import { SidebarContent } from "./admin-sidebar";

const STORAGE_KEY = "cc-admin-sidebar-collapsed";
const CHANGE_EVENT = "cc-sidebar-change";
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const drawerRef = useRef<HTMLElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);
  const toggleDesktop = useCallback(() => setCollapsedPersisted(!getCollapsed()), []);

  // Phone drawer (specs/040-admin-mobile-app): Escape closes, Tab stays inside,
  // the page behind does not scroll, and focus returns to the toggle on close.
  useEffect(() => {
    if (!mobileOpen) return;
    const drawer = drawerRef.current;
    const toggleButton = mobileToggleRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawer) return;
      const nodes = drawer.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    drawer?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      toggleButton?.focus();
    };
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
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={de.shell.menu}
            className="fixed inset-y-0 left-0 z-50 flex w-[272px] max-w-[85vw] flex-col overscroll-contain border-r border-border bg-surface pl-[env(safe-area-inset-left)] pt-[env(safe-area-inset-top)] shadow-pop"
          >
            <SidebarContent
              onNavigate={closeMobile}
              visibleTabs={visibleTabs}
              isSuperadmin={isSuperadmin}
              footer={<ThemeControl large />}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleDesktop={toggleDesktop}
          onToggleMobile={toggleMobile}
          mobileToggleRef={mobileToggleRef}
        />
        {/* Room for the bottom bar of the home screen app on phones. */}
        <main className="flex-1 standalone:pb-[calc(4rem+env(safe-area-inset-bottom))] md:standalone:pb-0">
          {children}
        </main>
      </div>

      <AdminBottomBar
        visibleTabs={visibleTabs}
        isSuperadmin={isSuperadmin}
        onOpenMenu={openMobile}
      />
    </div>
  );
}
