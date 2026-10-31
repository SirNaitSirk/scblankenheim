import Link from "next/link";
import { copyrightLine, legalMessages } from "@/lib/legal/messages";
import { marketingMessages } from "@/lib/marketing/messages";

const copy = marketingMessages.footer;
const legal = legalMessages.links;

/**
 * Minimal marketing footer, also used on the packing list and payment pages,
 * so every target is absolute. The landing page passes `showSchoolRelease`
 * to mirror its nav (specs/024-landing-structure R9) and the current camp's
 * start year for the season line; other pages show it without a year.
 */
export function SiteFooter({
  showSchoolRelease = false,
  campYear = null,
}: {
  showSchoolRelease?: boolean;
  campYear?: number | null;
}) {
  const links = [
    { label: copy.camp, href: "/#camp" },
    { label: copy.goodToKnow, href: "/#gut-zu-wissen" },
    ...(showSchoolRelease ? [{ label: copy.schoolRelease, href: "/#schulbefreiung" }] : []),
    { label: copy.register, href: "/#anmelden" },
    { label: copy.packingList, href: "/packzettel" },
  ];

  return (
    <footer className="border-t border-border bg-sand-50">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between md:px-10">
        <div>
          <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
            {marketingMessages.brand.full}
          </span>
          <p className="mt-1 text-sm text-muted-foreground">{marketingMessages.brand.season(campYear)}</p>
        </div>

        <nav className="flex flex-wrap gap-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Legal row (specs/025-legal-pages): quieter than the main links. */}
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 border-t border-border px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-10">
        <span>{copyrightLine(new Date().getFullYear(), marketingMessages.brand.full)}</span>
        <nav aria-label={legal.legalNav} className="flex gap-5">
          <Link href="/impressum" className="transition-colors duration-150 hover:text-foreground">
            {legal.imprint}
          </Link>
          <Link href="/datenschutz" className="transition-colors duration-150 hover:text-foreground">
            {legal.privacy}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
