import { de } from "@/lib/admin/messages";

export type NavItem = {
  label: string;
  href: string;
};

/**
 * In-scope admin navigation (labels + hrefs only, no icons) so this module stays
 * server-safe. Icons are attached in the client sidebar. v1's Hausplanung /
 * Backups / Mails are dropped.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: de.nav.dashboard, href: "/admin" },
  { label: de.nav.finances, href: "/admin/finanzen" },
  { label: de.nav.camps, href: "/admin/camps" },
  { label: de.nav.logs, href: "/admin/logs" },
  { label: de.nav.users, href: "/admin/benutzer" },
  { label: de.nav.profile, href: "/admin/profil" },
];
