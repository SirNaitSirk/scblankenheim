import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin — CampConnect",
};

// Admin pages read live, privileged data per request (service-role Supabase +
// Clerk session), so never statically prerender them at build time.
export const dynamic = "force-dynamic";

// Pre-hydration theme resolution: set `data-admin-theme` on <html> before first
// paint so the admin dark theme never flashes. Mirrors hooks/use-admin-theme.ts
// (key `cc-admin-theme`, values light | dark | system). Rendered only in the
// admin layout, so public pages never carry the attribute on a fresh load.
const themeInitScript = `(function(){try{var c=localStorage.getItem("cc-admin-theme");var d=c==="dark"||((!c||c==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-admin-theme",d?"dark":"light");}catch(e){}})();`;

// Access control is enforced in middleware.ts (clerkMiddleware protects /admin(.*)).
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      <AdminShell>{children}</AdminShell>
    </>
  );
}
