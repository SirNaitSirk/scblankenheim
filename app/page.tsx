import type { Metadata } from "next";
import { MountainHero } from "@/components/marketing/mountain-hero";
import { IntroFacts } from "@/components/marketing/intro-facts";
import { ProgramHighlights } from "@/components/marketing/program-highlights";
import { PackingTeaser } from "@/components/marketing/packing-teaser";
import { ArrivalCommunity } from "@/components/marketing/arrival-community";
import { PaymentFaq } from "@/components/marketing/payment-faq";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { RegistrationSection } from "@/components/marketing/registration-section";
import { SiteFooter } from "@/components/marketing/site-footer";

// Read the current camp's registration state (open / countdown / closed) live on
// every request, so admin changes to camp settings are reflected immediately.
export const dynamic = "force-dynamic";

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
      <RegistrationSection />
      <SiteFooter />
    </main>
  );
}
