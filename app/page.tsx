import type { Metadata } from "next";
import { MountainHero } from "@/components/marketing/mountain-hero";
import { IntroFacts } from "@/components/marketing/intro-facts";
import { ProgramHighlights } from "@/components/marketing/program-highlights";
import { CommunityGroups } from "@/components/marketing/community-groups";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { RegistrationSection } from "@/components/marketing/registration-section";
import { GoodToKnow } from "@/components/marketing/good-to-know";
import { SiteFooter } from "@/components/marketing/site-footer";
import { appBaseUrl } from "@/lib/email/links";
import { getLandingState } from "@/lib/marketing/landing-state";
import { marketingMessages } from "@/lib/marketing/messages";

// Read the current camp's registration state (open / countdown / closed) live on
// every request, so admin changes to camp settings are reflected immediately.
export const dynamic = "force-dynamic";

const title = "FCG Blankenheim Summercamp · Sommer 2027";
const description =
  "Eine unvergessliche Woche voller Gemeinschaft, Abenteuer und Glaube. Melde dich jetzt für das FCG Blankenheim Summercamp an.";
const baseUrl = appBaseUrl();

export const metadata: Metadata = {
  ...(baseUrl ? { metadataBase: new URL(baseUrl) } : {}),
  title,
  description,
  openGraph: {
    title,
    description,
    locale: "de_DE",
    type: "website",
    siteName: marketingMessages.share.fallbackName,
  },
  twitter: { card: "summary_large_image", title, description },
};

type HomeProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/** Personal invitation code from `?einladung=`; first value wins, empty is ignored. */
function readInvitationToken(value: string | string[] | undefined): string | undefined {
  const token = (Array.isArray(value) ? value[0] : value)?.trim();
  return token ? token : undefined;
}

/** Section order per specs/024-landing-structure/contracts/landing-ui.md. */
export default async function Home({ searchParams }: HomeProps) {
  const invitationToken = readInvitationToken((await searchParams).einladung);
  const { cta, schoolRelease } = await getLandingState();
  const showSchoolRelease = schoolRelease !== null;

  return (
    <main id="start">
      <MountainHero cta={cta} showSchoolRelease={showSchoolRelease} />
      <IntroFacts />
      <ProgramHighlights />
      <CommunityGroups />
      <ClosingCta cta={cta} />
      <RegistrationSection invitationToken={invitationToken} />
      <GoodToKnow />
      <SiteFooter showSchoolRelease={showSchoolRelease} />
    </main>
  );
}
