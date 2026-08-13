import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { PendingAction } from "@/components/admin/pending-action";
import { getAdminUsers } from "@/lib/admin/data";
import { formatDate } from "@/lib/format";
import { PERMISSION_LABELS, ROLE_LABELS, de } from "@/lib/admin/messages";

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS).length;

export default async function UsersPage() {
  // MOCK BOUNDARY: real admin identity lives in Clerk; roles/permissions in
  // Supabase `profiles`/`user_roles`. Swap this getter for those reads.
  const users = await getAdminUsers();

  return (
    <PageBody>
      <PageHeader
        title={de.users.title}
        description={de.users.description}
        actions={<PendingAction label={de.users.invite} icon="userPlus" />}
      />

      <Card className="flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-6 py-3 text-left font-medium">
                  {de.users.columns.user}
                </th>
                <th className="px-6 py-3 text-left font-medium">
                  {de.users.columns.role}
                </th>
                <th className="hidden px-6 py-3 text-left font-medium lg:table-cell">
                  {de.users.columns.permissions}
                </th>
                <th className="hidden px-6 py-3 text-left font-medium md:table-cell">
                  {de.users.columns.lastActive}
                </th>
                <th className="px-6 py-3 text-left font-medium">
                  {de.users.columns.status}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const hasAll =
                  user.role === "superadmin" ||
                  user.permissions.length >= ALL_PERMISSIONS;
                return (
                  <tr key={user.id} className="align-top text-foreground">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={user.role === "superadmin" ? "paid" : "neutral"}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      {hasAll ? (
                        <span className="text-muted-foreground">
                          {de.users.allPermissions}
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {user.permissions.map((p) => (
                            <span
                              key={p}
                              className="rounded-sm bg-ink-100 px-2 py-0.5 text-xs text-ink-700"
                            >
                              {PERMISSION_LABELS[p] ?? p}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="hidden px-6 py-4 font-mono text-xs text-muted-foreground md:table-cell">
                      {user.lastActiveAt
                        ? formatDate(user.lastActiveAt)
                        : de.users.neverActive}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        tone={user.status === "active" ? "neutral" : "pending"}
                      >
                        {user.status === "active"
                          ? de.users.statusActive
                          : de.users.statusInvited}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PageBody>
  );
}
