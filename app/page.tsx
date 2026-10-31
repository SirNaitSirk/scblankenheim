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
import { campYear } from "@/lib/marketing/camp-dates";
import { getLandingState } from "@/lib/marketing/landing-state";
import { marketingMessages } from "@/lib/marketing/messages";

// Read the current camp's registration state (open / countdown / closed) live on
// every request, so admin changes to camp settings are reflected immediately.
export const dynamic = "force-dynamic";

const description = marketingMessages.share.description;
const baseUrl = appBaseUrl();

/** The title carries the current camp's start year, read per request. */
export async function generateMetadata(): Promise<Metadata> {
  const { camp } = await getLandingState();
  const title = marketingMessages.brand.pageTitle(campYear(camp?.startDate ?? null));
  return {
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
}

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
  const { camp, cta, schoolRelease } = await getLandingState();
  const showSchoolRelease = schoolRelease !== null;
  const year = campYear(camp?.startDate ?? null);

  return (
    <main id="start">
      <MountainHero cta={cta} showSchoolRelease={showSchoolRelease} campYear={year} />
      <IntroFacts />
      <ProgramHighlights />
      <CommunityGroups />
      <ClosingCta cta={cta} />
      <RegistrationSection invitationToken={invitationToken} />
      <GoodToKnow />
      <SiteFooter showSchoolRelease={showSchoolRelease} campYear={year} />
    </main>
  );
}
