import {
  ArrivalBlock,
  PackingBlock,
  PaymentBlock,
  SchoolReleaseBlock,
} from "@/components/marketing/good-to-know-blocks";
import { Reveal } from "@/components/marketing/reveal";
import { getLandingState } from "@/lib/marketing/landing-state";
import { marketingMessages } from "@/lib/marketing/messages";

const copy = marketingMessages.goodToKnow;

/**
 * „Gut zu wissen“ (specs/024-landing-structure R4): the logistics after the
 * registration, as open blocks in a two column grid. Without the school release
 * block the packing block spans both columns, so the grid never shows a gap.
 */
export async function GoodToKnow() {
  const { schoolRelease } = await getLandingState();

  return (
    <section id="gut-zu-wissen" className="border-t border-border bg-sand-50">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 lg:py-32">
        <Reveal>
          <h2 className="max-w-[18ch] text-balance font-display text-4xl font-black leading-[1.02] tracking-tight text-foreground md:text-5xl">
            {copy.heading}
          </h2>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
            {copy.intro}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <ArrivalBlock />
          <PaymentBlock />
          <PackingBlock className={schoolRelease ? undefined : "md:col-span-2"} />
          {schoolRelease ? <SchoolReleaseBlock dates={schoolRelease.dates} /> : null}
        </div>
      </div>
    </section>
  );
}
