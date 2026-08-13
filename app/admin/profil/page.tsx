import { currentUser } from "@clerk/nextjs/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NAV_ITEMS } from "@/components/admin/nav-items";
import { PageBody, PageHeader } from "@/components/admin/page-header";
import { getCurrentProfile } from "@/lib/admin/data";
import { PERMISSION_LABELS, ROLE_LABELS, de } from "@/lib/admin/messages";

const navLabel = (href: string) =>
  NAV_ITEMS.find((n) => n.href === href)?.label ?? href;

export default async function ProfilePage() {
  const clerkUser = await currentUser();
  // Role, permissions and visible tabs come from Supabase `profiles`/`user_roles`
  // (keyed by the Clerk user id). Null until a profile is linked (invitation flow).
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <PageBody>
        <PageHeader title={de.profile.title} description={de.profile.description} />
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Für dieses Konto ist noch kein Profil verknüpft.
          </p>
        </Card>
      </PageBody>
    );
  }

  const name =
    clerkUser?.fullName ||
    clerkUser?.username ||
    profile.name;
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress || profile.email;

  const hasAll = profile.permissions.length >= Object.keys(PERMISSION_LABELS).length;

  return (
    <PageBody>
      <PageHeader title={de.profile.title} description={de.profile.description} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-4 p-6 lg:col-span-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-pill bg-surface-inverse font-display text-lg font-black text-on-inverse">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              {name}
            </span>
            <span className="text-sm text-muted-foreground">{email}</span>
          </div>
          <div>
            <Badge tone="paid">{ROLE_LABELS[profile.role]}</Badge>
          </div>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-3 font-display text-base font-bold tracking-tight text-foreground">
              {de.profile.permissions}
            </h2>
            {hasAll ? (
              <p className="text-sm text-muted-foreground">
                {de.users.allPermissions}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.permissions.map((p) => (
                  <span
                    key={p}
                    className="rounded-input bg-ink-100 px-3 py-1 text-sm text-ink-700"
                  >
                    {PERMISSION_LABELS[p] ?? p}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 font-display text-base font-bold tracking-tight text-foreground">
              {de.profile.visibleTabs}
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.visibleTabs.map((href) => (
                <span
                  key={href}
                  className="rounded-input border border-border px-3 py-1 text-sm text-foreground"
                >
                  {navLabel(href)}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageBody>
  );
}
