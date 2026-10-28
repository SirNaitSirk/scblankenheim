import { de } from "@/lib/admin/messages";

export type NavItem = {
  label: string;
  href: string;
};

/**
 * In-scope admin navigation (labels + hrefs only, no icons) so this module stays
 * server-safe. Icons are attached in the client sidebar. Backups are dropped;
 * Mail is a read only template preview; Zimmerplanung is specs/008-room-planning;
 * Zeltkreise is specs/011-tent-circles;
 * Finanzen is specs/009-finance-tab.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: de.nav.dashboard, href: "/admin" },
  { label: de.nav.finances, href: "/admin/finanzen" },
  { label: de.nav.pricing, href: "/admin/preise" },
  { label: de.nav.camps, href: "/admin/camps" },
  { label: de.nav.rooms, href: "/admin/zimmerplanung" },
  { label: de.nav.tentCircles, href: "/admin/zeltkreise" },
  { label: de.nav.logs, href: "/admin/logs" },
  { label: de.nav.mail, href: "/admin/mail" },
  { label: de.nav.users, href: "/admin/benutzer" },
  { label: de.nav.profile, href: "/admin/profil" },
];
