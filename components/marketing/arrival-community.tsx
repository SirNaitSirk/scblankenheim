import Image from "next/image";
import { Reveal } from "@/components/marketing/reveal";

// TODO: swap for real photo of the camp community (warm outdoor light).
const COMMUNITY_PHOTO =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80";

const groups = [
  "Blankenheim",
  "Euskirchen",
  "C3",
  "Kall",
  "Lüdenscheid",
  "Ludwigshafen",
];

/**
 * Arrival & community (Persuade): check-in / address details beside the list
 * of participating youth groups.
 */
export function ArrivalCommunity() {
  return (
    <section className="border-t border-border bg-sand-50">
      <div className="mx-auto grid max-w-[1400px] gap-4 px-6 py-24 md:grid-cols-2 md:px-10 lg:py-32">
        <Reveal className="flex flex-col justify-between rounded-card border border-amber-100 bg-surface p-8 shadow-warm md:p-10">
          <h2 className="max-w-[14ch] font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            So kommst du ins Camp
          </h2>
          <dl className="mt-10 flex flex-col gap-6">
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
              <dt className="text-sm text-muted-foreground">Check-in</dt>
              <dd className="font-display text-lg font-bold text-foreground">
                ab 16 Uhr
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
              <dt className="text-sm text-muted-foreground">Treffpunkt</dt>
              <dd className="text-right font-display text-lg font-bold text-foreground">
                FCG Blankenheim,
                <br />
                Bahnhofstraße 18
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
              <dt className="text-sm text-muted-foreground">Fahrgemeinschaft</dt>
              <dd className="text-right text-sm text-foreground">
                Gemeinsam anreisen? Bei der Anmeldung möglich.
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal
          delay={120}
          className="group relative flex flex-col justify-between overflow-hidden rounded-card p-8 md:p-10"
        >
          <Image
            src={COMMUNITY_PHOTO}
            alt="Jugendliche gemeinsam draußen im Sonnenlicht"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/40 to-ink-950/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-amber-400/20" />
          <div className="relative">
            <h2 className="max-w-[18ch] font-display text-3xl font-extrabold tracking-tight text-on-inverse md:text-4xl">
              Jugenden aus der ganzen Region
            </h2>
            <p className="mt-4 max-w-[36ch] text-on-inverse/85">
              Beim Summercamp treffen sich Jugendgruppen aus mehreren Städten.
              Neue Leute, echte Gemeinschaft, eine gemeinsame Woche.
            </p>
          </div>
          <ul className="relative mt-10 flex flex-wrap gap-2">
            {groups.map((group) => (
              <li
                key={group}
                className="rounded-pill border border-on-inverse/25 bg-on-inverse/10 px-4 py-2 text-sm font-medium text-on-inverse backdrop-blur-sm"
              >
                {group}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
