import "server-only";

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
