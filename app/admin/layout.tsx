import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentProfile } from "@/lib/admin/data";

export const metadata: Metadata = {
  title: "Admin — CampConnect",
};

// Admin pages read live, privileged data per request (service-role Supabase +
// Clerk session), so never statically prerender them at build time.
export const dynamic = "force-dynamic";

// The pre-hydration theme script (sets `data-admin-theme` before first paint)
// lives in the root layout via next/script beforeInteractive — a raw <script>
// here warns under React 19 on client-side navigation into /admin.

// Access control is enforced in middleware.ts (clerkMiddleware protects /admin(.*)).
// The current admin's grant drives which nav sections the sidebar renders; the
// per-route "see" guard (guardTab) is the actual gate on each page.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <AdminShell
      visibleTabs={profile?.visibleTabs ?? []}
      isSuperadmin={profile?.role === "superadmin"}
    >
      {children}
    </AdminShell>
  );
}
