import { CalendarBlank, MapPin, Ticket } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/marketing/reveal";
import { formatCurrency } from "@/lib/format";
import { formatCampDateRange } from "@/lib/marketing/camp-dates";
import { getLandingCamp, type LandingCamp } from "@/lib/marketing/current-camp";

type Fact = {
  label: string;
  value: string;
  note: string;
  Icon: typeof Ticket;
};

/*
 * "Wann" shows the current camp's dates and falls back to a neutral season
 * without a camp or dates. "Wo" is still static. The fee comes from the current
 * camp's public base price so no hidden tier price can ever show up here
 * (constitution VI); without a camp the tile is left out.
 */
function whenFact(camp: LandingCamp | null): Fact {
  const dates = camp ? formatCampDateRange(camp.startDate, camp.endDate) : null;
  return {
    label: "Wann",
    value: dates ?? "Im Sommer",
    note: "Eine Woche in den Ferien",
    Icon: CalendarBlank,
  };
}

const staticFacts: Fact[] = [
  {
    label: "Wo",
    value: "Belgien",
    note: "Pannenhoeve Bivak, Groenestraat 76",
    Icon: MapPin,
  },
];

function feeFact(basePrice: number): Fact {
  return {
    label: "Beitrag",
    value: formatCurrency(basePrice),
    note: "Übernachtung & Verpflegung inklusive",
    Icon: Ticket,
  };
}

/**
 * Intro section (Persuade): asymmetric split with the narrative lead on the left,
 * three fact tiles stacked on the right. Anchored as `#camp`.
 */
export async function IntroFacts() {
  const camp = await getLandingCamp();
  const facts = [
    whenFact(camp),
    ...staticFacts,
    ...(camp ? [feeFact(camp.basePrice)] : []),
  ];

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
          {facts.map((fact) => (
            <Reveal
              key={fact.label}
              className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
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
              <p className="pl-15 text-sm leading-snug text-muted-foreground sm:max-w-[18ch] sm:pl-0 sm:text-right">
                {fact.note}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
