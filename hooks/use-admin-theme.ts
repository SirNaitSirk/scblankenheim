"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "cc-admin-theme";
const CHANGE_EVENT = "cc-theme-change";
const DARK_QUERY = "(prefers-color-scheme: dark)";
const ATTR = "data-admin-theme";

// The exact string the pre-hydration inline script in app/admin/layout.tsx uses.
// Kept here as the single documented reference for that mirror.
export { STORAGE_KEY as THEME_STORAGE_KEY, ATTR as THEME_ATTR };

function isChoice(value: string | null): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

function readChoice(): ThemeChoice {
  const stored = localStorage.getItem(STORAGE_KEY);
  return isChoice(stored) ? stored : "system";
}

function resolve(choice: ThemeChoice): "light" | "dark" {
  if (choice === "system") {
    return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  }
  return choice;
}

function applyToDom(choice: ThemeChoice) {
  document.documentElement.setAttribute(ATTR, resolve(choice));
}

// External-store subscription for the persisted choice: mirrors the sidebar
// pattern in admin-shell.tsx (custom event + cross-tab storage event).
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Server snapshot is always "system"; the inline script has already set the real
// attribute on <html> before paint, so there is no flash.
function serverChoice(): ThemeChoice {
  return "system";
}

export function useAdminTheme() {
  const choice = useSyncExternalStore(subscribe, readChoice, serverChoice);

  // Keep the DOM attribute aligned with the active choice.
  useEffect(() => {
    applyToDom(choice);
  }, [choice]);

  // While mounted with "system", follow live OS appearance changes.
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      if (readChoice() === "system") applyToDom("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setChoice = useCallback((next: ThemeChoice) => {
    localStorage.setItem(STORAGE_KEY, next);
    applyToDom(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { choice, setChoice };
}
