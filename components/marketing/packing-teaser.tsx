import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

const items = [
  "Schlafsack",
  "Iso-Matte",
  "Kissen",
  "Handtuch",
  "Waschzeug",
  "Zahnbürste & Zahnpasta",
  "Warme Sachen",
  "Lockere Kleidung",
  "Regenfeste Schuhe",
  "Etwas Sportliches",
  "Deine Bibel",
];

/**
 * Packing-list teaser (Persuade): full-width band, real items as chips,
 * link to the full `/packzettel` page. Anchored as `#packliste`.
 */
export function PackingTeaser() {
  return (
    <section id="packliste" className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 lg:py-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal className="max-w-[30ch]">
            <h2 className="font-display text-4xl font-black leading-[1.02] tracking-tight text-foreground md:text-5xl">
              Alles, was du mitbringen musst
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <ButtonLink href="/packzettel" variant="outline">
              Zur vollständigen Packliste
            </ButtonLink>
          </Reveal>
        </div>

        <Reveal delay={80} className="mt-12">
          <ul className="flex flex-wrap gap-3">
            {items.map((item) => (
              <li
                key={item}
                className="rounded-pill border border-border bg-canvas px-4 py-2 text-sm font-medium text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
