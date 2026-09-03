import { CalendarBlank, MapPin, Ticket } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/marketing/reveal";

/* Placeholder values — real Termin/Ort/Beitrag come from camps/camp_settings later. */
const facts = [
  {
    label: "Wann",
    value: "Sommer 2027",
    note: "Eine Woche in den Ferien",
    Icon: CalendarBlank,
  },
  {
    label: "Wo",
    value: "Blankenheim",
    note: "Check-in ab 16 Uhr, Bahnhofstraße 18",
    Icon: MapPin,
  },
  {
    label: "Beitrag",
    value: "ab 150 €",
    note: "Übernachtung & Verpflegung inklusive",
    Icon: Ticket,
  },
];

/**
 * Intro section (Persuade): asymmetric split — narrative lead on the left,
 * three key-fact tiles stacked on the right. Anchored as `#camp`.
 */
export function IntroFacts() {
  return (
    <section id="camp" className="border-t border-border bg-sand-50">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-24 md:grid-cols-[1.1fr_0.9fr] md:px-10 lg:py-32">
        <Reveal>
          <h2 className="max-w-[16ch] font-display text-4xl font-black leading-[1.02] tracking-tight text-foreground md:text-5xl">
            Eine Woche, die du{" "}
            <span className="text-amber-600">nicht vergisst</span>.
          </h2>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
            Ein Camp voller Gemeinschaft, Abenteuer und Glaube. Zusammen mit
            Jugendlichen aus der ganzen Region erlebst du eine unvergessliche
            Woche voller Spaß, echter Begegnungen und Zeit mit Gott. Wir freuen
            uns auf dich und deine Gruppe.
          </p>
        </Reveal>

        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-amber-100 bg-surface shadow-warm">
          {facts.map((fact, i) => (
            <Reveal
              key={fact.label}
              delay={i * 90}
              className="flex items-center justify-between gap-6 p-6"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-amber-100 text-amber-700">
                  <fact.Icon size={20} weight="duotone" />
                </span>
                <div>
                  <span className="eyebrow">{fact.label}</span>
                  <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-foreground">
                    {fact.value}
                  </p>
                </div>
              </div>
              <p className="max-w-[18ch] text-right text-sm leading-snug text-muted-foreground">
                {fact.note}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
