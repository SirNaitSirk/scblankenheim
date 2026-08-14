import "server-only";

import { redirect } from "next/navigation";
import { canSeeTab, canUseSection } from "./access";
import { getCurrentProfile } from "./data";
import type { AdminUser } from "./types";

/**
 * Authorization guard for privileged admin Server Actions. Clerk middleware
 * (`proxy.ts`) protects the `/admin` *routes*, but Server Actions are invoked
 * directly and must re-check the session themselves. `requireAdmin` resolves the
 * Clerk session → `profiles` row and enforces an admin role, throwing `AuthError`
 * otherwise so callers can map it to a German error instead of leaking internals.
 */
export class AuthError extends Error {
  constructor(message = "unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export function isAdminRole(role: AdminUser["role"]): boolean {
  return role === "admin" || role === "superadmin";
}

export async function requireAdmin(): Promise<AdminUser> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AuthError("no-session-or-profile");
  if (!isAdminRole(profile.role)) throw new AuthError("forbidden");
  return profile;
}

/**
 * Stricter guard for user-management actions (editing roles/permissions, deleting
 * admins): only a `superadmin` may pass. Plain admins get `forbidden`.
 */
export async function requireSuperadmin(): Promise<AdminUser> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AuthError("no-session-or-profile");
  if (profile.role !== "superadmin") throw new AuthError("forbidden");
  return profile;
}

/**
 * Route-level "see" guard for an admin page (Server Component). Resolves the
 * admin, then redirects to the dashboard when the section is not in their
 * `visibleTabs` — so typing a URL cannot bypass the hidden nav. Returns the
 * profile so the page can reuse it for permission ("act") gating.
 */
export async function guardTab(href: string): Promise<AdminUser> {
  const profile = await requireAdmin();
  if (!canSeeTab(profile, href)) redirect("/admin");
  return profile;
}

/**
 * Action-level "act" guard for a Server Action. Enforces an admin session and
 * the section permission; throws `AuthError("forbidden")` otherwise so callers
 * map it to a German error toast. This is the real gate — hiding UI is cosmetic.
 */
export async function requirePermission(
  permissionKey: string,
): Promise<AdminUser> {
  const profile = await requireAdmin();
  if (!canUseSection(profile, permissionKey)) throw new AuthError("forbidden");
  return profile;
}
