import { PageBody } from "@/components/admin/page-header";
import { UsersBoard } from "@/components/admin/users-board";
import { getAdminUsers, getPendingInvitations } from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";

export default async function UsersPage() {
  // Admin identity lives in Clerk; roles/permissions in Supabase
  // `profiles`/`user_roles`. Only a superadmin may manage users — plain admins
  // get the read-only table (no row actions, no add/invite). Pending invitations
  // live in `admin_invitations` (no Clerk id yet) and are only fetched for the
  // superadmin view that can act on them.
  const profile = await guardTab("/admin/benutzer");
  const isSuperadmin = profile.role === "superadmin";

  const [users, pendingInvitations] = await Promise.all([
    getAdminUsers(),
    isSuperadmin ? getPendingInvitations() : Promise.resolve([]),
  ]);

  return (
    <PageBody>
      <UsersBoard
        users={users}
        pendingInvitations={pendingInvitations}
        currentUserId={profile.id}
        isSuperadmin={Boolean(isSuperadmin)}
      />
    </PageBody>
  );
}
