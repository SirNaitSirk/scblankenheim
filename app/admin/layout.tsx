import type { Metadata, Viewport } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { TeamClerkProvider } from "@/components/clerk-provider";
import { ADMIN_THEME_COLORS } from "@/lib/admin/theme-colors";
import { getCurrentProfile } from "@/lib/admin/data";

// Home screen app (specs/040-admin-mobile-app): the manifest and the Apple
// settings are linked only here, so public pages stay plain bookmarks.
export const metadata: Metadata = {
  title: "Admin · FCG Summercamp",
  manifest: "/admin.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Summercamp Admin",
    statusBarStyle: "default",
  },
};

// `viewportFit: cover` exposes the safe area insets used by topbar, drawer,
// dialogs and bottom bar. No maximum scale: pinch zoom stays available.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: ADMIN_THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: ADMIN_THEME_COLORS.dark },
  ],
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
    <TeamClerkProvider>
      <AdminShell
        visibleTabs={profile?.visibleTabs ?? []}
        isSuperadmin={profile?.role === "superadmin"}
      >
        {children}
      </AdminShell>
    </TeamClerkProvider>
  );
}
