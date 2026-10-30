import type { Metadata } from "next";
import { MountainHero } from "@/components/marketing/mountain-hero";
import { IntroFacts } from "@/components/marketing/intro-facts";
import { ProgramHighlights } from "@/components/marketing/program-highlights";
import { PackingTeaser } from "@/components/marketing/packing-teaser";
import { ArrivalCommunity } from "@/components/marketing/arrival-community";
import { PaymentFaq } from "@/components/marketing/payment-faq";
import { SchoolReleaseSection } from "@/components/marketing/school-release-section";
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

type HomeProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/** Personal invitation code from `?einladung=`; first value wins, empty is ignored. */
function readInvitationToken(value: string | string[] | undefined): string | undefined {
  const token = (Array.isArray(value) ? value[0] : value)?.trim();
  return token ? token : undefined;
}

export default async function Home({ searchParams }: HomeProps) {
  const invitationToken = readInvitationToken((await searchParams).einladung);

  return (
    <main id="start">
      <MountainHero />
      <IntroFacts />
      <ProgramHighlights />
      <PackingTeaser />
      <ArrivalCommunity />
      <SchoolReleaseSection />
      <PaymentFaq />
      <ClosingCta />
      <RegistrationSection invitationToken={invitationToken} />
      <SiteFooter />
    </main>
  );
}
