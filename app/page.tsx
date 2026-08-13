import type { Metadata } from "next";
import { MountainHero } from "@/components/marketing/mountain-hero";
import { IntroFacts } from "@/components/marketing/intro-facts";
import { ProgramHighlights } from "@/components/marketing/program-highlights";
import { PackingTeaser } from "@/components/marketing/packing-teaser";
import { ArrivalCommunity } from "@/components/marketing/arrival-community";
import { PaymentFaq } from "@/components/marketing/payment-faq";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "FCG Blankenheim Summercamp · Sommer 2027",
  description:
    "Eine unvergessliche Woche voller Gemeinschaft, Abenteuer und Glaube. Melde dich jetzt für das FCG Blankenheim Summercamp an.",
};

export default function Home() {
  return (
    <main id="start">
      <MountainHero />
      <IntroFacts />
      <ProgramHighlights />
      <PackingTeaser />
      <ArrivalCommunity />
      <PaymentFaq />
      <ClosingCta />
      <SiteFooter />
    </main>
  );
}
