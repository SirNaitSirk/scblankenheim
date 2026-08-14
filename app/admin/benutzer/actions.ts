"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  clerkErrorCode,
  createAdminInvitation,
  createAdminUserDirect,
  deleteAdminUser,
  getAdminUserStatus,
  revokeAdminInvitation,
  updateAdminUser,
  writeLog,
} from "@/lib/admin/data";
import { NAV_HREFS, PERMISSION_KEYS } from "@/lib/admin/access";
import { AuthError, requireSuperadmin } from "@/lib/admin/guard";
import { de } from "@/lib/admin/messages";
import type {
  ActionResult,
  AddUserFormValues,
  AdminUser,
  AdminUserFormValues,
  InviteFormValues,
  UserRole,
} from "@/lib/admin/types";

// --- validation -------------------------------------------------------------

// Sources of truth for what a client may select (PERMISSION_KEYS / NAV_HREFS,
// from lib/admin/access). Anything outside these sets is rejected server-side,
// never trusted from the payload.
const adminUserSchema = z
  .object({
    role: z.enum(["admin", "superadmin"], {
      message: de.users.errors.invalidRole,
    }),
    permissions: z.array(z.string()),
    visibleTabs: z.array(z.string()),
  })
  .superRefine((values, ctx) => {
    for (const key of values.permissions) {
      if (!PERMISSION_KEYS.includes(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["permissions"],
          message: de.users.errors.unknownPermission,
        });
        break;
      }
    }
    for (const href of values.visibleTabs) {
      if (!NAV_HREFS.includes(href)) {
        ctx.addIssue({
          code: "custom",
          path: ["visibleTabs"],
          message: de.users.errors.unknownTab,
        });
        break;
      }
    }
  });

// Shared access selection: role + permissions/tabs constrained to the known sets.
const accessSchema = {
  role: z.enum(["admin", "superadmin"], {
    message: de.users.errors.invalidRole,
  }),
  permissions: z
    .array(z.string())
    .refine((keys) => keys.every((k) => PERMISSION_KEYS.includes(k)), {
      message: de.users.errors.unknownPermission,
    }),
  visibleTabs: z
    .array(z.string())
    .refine((hrefs) => hrefs.every((h) => NAV_HREFS.includes(h)), {
      message: de.users.errors.unknownTab,
    }),
} as const;

const addUserSchema = z.object({
  name: z.string(),
  email: z
    .string()
    .trim()
    .min(1, de.users.errors.emailRequired)
    .email(de.users.errors.emailInvalid),
  password: z.string().min(8, de.users.errors.passwordTooShort),
  ...accessSchema,
});

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, de.users.errors.emailRequired)
    .email(de.users.errors.emailInvalid),
  ...accessSchema,
});

// A superadmin implicitly holds every permission and sees every tab; persist that
// so the stored grant matches what the UI shows.
function normalizeAccess(
  role: UserRole,
  permissions: string[],
  visibleTabs: string[],
): { permissions: string[]; visibleTabs: string[] } {
  if (role === "superadmin") {
    return { permissions: [...PERMISSION_KEYS], visibleTabs: [...NAV_HREFS] };
  }
  return { permissions, visibleTabs };
}

// Absolute origin for the invitation redirect (works in dev + prod without a
// dedicated env). Falls back to the forwarded host, then localhost.
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

// Maps a first-issue Zod error to `{ error, fieldErrors }`.
function zodResult(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return { ok: false, error: de.users.toast.error, fieldErrors };
}

// --- shared helpers ---------------------------------------------------------

function revalidateUsers(): void {
  revalidatePath("/admin/benutzer");
  revalidatePath("/admin/profil"); // the edited user's own profile view
}

// Runs `fn` only after a successful superadmin check, mapping auth and unexpected
// failures to German error results instead of throwing to the client.
async function runGuarded(
  fn: (admin: AdminUser) => Promise<ActionResult>,
): Promise<ActionResult> {
  let admin: AdminUser;
  try {
    admin = await requireSuperadmin();
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: de.users.toast.unauthorized };
    }
    console.error("[users] auth check failed", error);
    return { ok: false, error: de.users.toast.error };
  }
  try {
    return await fn(admin);
  } catch (error) {
    console.error("[users] action failed", error);
    return { ok: false, error: de.users.toast.error };
  }
}

function actorLabel(admin: AdminUser): string {
  return admin.name?.trim() || admin.email?.trim() || admin.id;
}

// --- actions ----------------------------------------------------------------

export async function updateAdminUserAction(
  id: string,
  values: AdminUserFormValues,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = adminUserSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: de.users.toast.error };
    }

    // A superadmin must not lock themselves out by demoting their own account.
    if (id === admin.id && parsed.data.role !== "superadmin") {
      return { ok: false, error: de.users.errors.selfDemote };
    }

    // A superadmin implicitly holds every permission and sees every tab; persist
    // that so the stored row matches what the UI shows.
    const role = parsed.data.role;
    const permissions =
      role === "superadmin" ? PERMISSION_KEYS : parsed.data.permissions;
    const visibleTabs =
      role === "superadmin" ? NAV_HREFS : parsed.data.visibleTabs;

    await updateAdminUser(id, { role, permissions, visibleTabs });
    await writeLog({
      actor: actorLabel(admin),
      action: "user.update",
      message: id,
    });
    revalidateUsers();
    return { ok: true, id };
  });
}

export async function deleteAdminUserAction(id: string): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    if (id === admin.id) {
      return { ok: false, error: de.users.errors.selfDelete };
    }

    // Re-read the status server-side rather than trusting the client on whether a
    // Clerk login exists (invited users have none yet).
    const status = await getAdminUserStatus(id);
    if (status === null) {
      return { ok: false, error: de.users.errors.notFound };
    }

    await deleteAdminUser(id, status !== "invited");
    await writeLog({
      level: "warning",
      actor: actorLabel(admin),
      action: "user.delete",
      message: id,
    });
    revalidateUsers();
    return { ok: true };
  });
}

// Maps a Clerk create/invite error to a German field error, or null if unhandled.
function clerkFieldError(error: unknown): ActionResult | null {
  switch (clerkErrorCode(error)) {
    case "form_identifier_exists":
    case "duplicate_record":
      return {
        ok: false,
        error: de.users.toast.error,
        fieldErrors: { email: de.users.errors.emailTaken },
      };
    case "form_password_length_too_short":
      return {
        ok: false,
        error: de.users.toast.error,
        fieldErrors: { password: de.users.errors.passwordTooShort },
      };
    case "form_password_pwned":
    case "form_password_not_strong_enough":
      return {
        ok: false,
        error: de.users.toast.error,
        fieldErrors: { password: de.users.errors.passwordWeak },
      };
    default:
      return null;
  }
}

export async function addAdminUserAction(
  values: AddUserFormValues,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = addUserSchema.safeParse(values);
    if (!parsed.success) return zodResult(parsed.error);

    const { role, name, email, password } = parsed.data;
    const access = normalizeAccess(
      role,
      parsed.data.permissions,
      parsed.data.visibleTabs,
    );

    try {
      const id = await createAdminUserDirect({
        name,
        email,
        password,
        role,
        ...access,
      });
      await writeLog({
        actor: actorLabel(admin),
        action: "user.create",
        message: email,
      });
      revalidateUsers();
      return { ok: true, id };
    } catch (error) {
      const mapped = clerkFieldError(error);
      if (mapped) return mapped;
      throw error;
    }
  });
}

export async function inviteAdminUserAction(
  values: InviteFormValues,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    const parsed = inviteSchema.safeParse(values);
    if (!parsed.success) return zodResult(parsed.error);

    const { role, email } = parsed.data;
    const access = normalizeAccess(
      role,
      parsed.data.permissions,
      parsed.data.visibleTabs,
    );
    const redirectUrl = `${await requestOrigin()}/admin/accept-invitation`;

    try {
      await createAdminInvitation(
        { email, role, ...access },
        redirectUrl,
        actorLabel(admin),
      );
      await writeLog({
        actor: actorLabel(admin),
        action: "user.invite",
        message: email,
      });
      revalidateUsers();
      return { ok: true };
    } catch (error) {
      const mapped = clerkFieldError(error);
      if (mapped) {
        // Clerk uses `duplicate_record` for an already-pending invitation.
        if (clerkErrorCode(error) === "duplicate_record") {
          return {
            ok: false,
            error: de.users.toast.error,
            fieldErrors: { email: de.users.errors.alreadyInvited },
          };
        }
        return mapped;
      }
      throw error;
    }
  });
}

export async function revokeInvitationAction(
  id: string,
): Promise<ActionResult> {
  return runGuarded(async (admin) => {
    await revokeAdminInvitation(id);
    await writeLog({
      level: "warning",
      actor: actorLabel(admin),
      action: "user.invite_revoke",
      message: id,
    });
    revalidateUsers();
    return { ok: true };
  });
}
