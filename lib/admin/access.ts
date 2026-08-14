/**
 * Central, server-safe access rules for the admin surface. Shared by the client
 * sidebar, the server route guards (`guard.ts`) and the server actions so the
 * "see" (visibleTabs) and "act" (permissions) semantics never drift.
 *
 * Model (see AGENTS.md — users & roles):
 * - `visibleTabs` decides which nav items render and which routes are reachable.
 * - `permissions` decides whether write actions inside a section are allowed.
 * - Dashboard + Profil are always reachable, regardless of `visibleTabs`.
 * - A `superadmin` implicitly holds every tab and every permission.
 */

import { NAV_ITEMS } from "@/components/admin/nav-items";
import { PERMISSION_LABELS } from "./messages";
import type { AdminUser } from "./types";

/** Permission keys a plain admin can be granted (registrations, finances, …). */
export const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS);

/** Every known nav href — the allowed set for `visibleTabs`. */
export const NAV_HREFS = NAV_ITEMS.map((item) => item.href);

/** Tabs every admin can always see/reach, independent of their grant. */
export const ALWAYS_VISIBLE_TABS = ["/admin", "/admin/profil"] as const;

/**
 * Maps a nav href to the permission that governs its write actions. Hrefs without
 * an entry (e.g. `/admin/profil`) have no gated actions.
 */
export const PERMISSION_BY_HREF: Record<string, string> = {
  "/admin": "registrations",
  "/admin/finanzen": "finances",
  "/admin/camps": "camps",
  "/admin/logs": "logs",
  "/admin/benutzer": "users",
};

/** Whether the user may see/reach the given nav href. */
export function canSeeTab(
  user: Pick<AdminUser, "role" | "visibleTabs">,
  href: string,
): boolean {
  if (user.role === "superadmin") return true;
  if ((ALWAYS_VISIBLE_TABS as readonly string[]).includes(href)) return true;
  return user.visibleTabs.includes(href);
}

/** Whether the user may perform write actions in the given section. */
export function canUseSection(
  user: Pick<AdminUser, "role" | "permissions">,
  permissionKey: string,
): boolean {
  if (user.role === "superadmin") return true;
  return user.permissions.includes(permissionKey);
}
