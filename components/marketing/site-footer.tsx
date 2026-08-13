const links = [
  { label: "Camp", href: "#camp" },
  { label: "Packliste", href: "/packzettel" },
  { label: "Anmelden", href: "#anmelden" },
];

/** Minimal marketing footer. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-canvas">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between md:px-10">
        <div>
          <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
            CampConnect
          </span>
          <p className="mt-1 text-sm text-muted-foreground">
            FCG Blankenheim Summercamp · Sommer 2027
          </p>
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
    </footer>
  );
}
