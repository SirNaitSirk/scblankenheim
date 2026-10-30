import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentCamp } from "@/lib/admin/data";
import { isComingSoonEnabled } from "@/lib/coming-soon/gate";
import { COMING_SOON_MESSAGES as m } from "@/lib/coming-soon/messages";

// The switch and the camp name are read per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: m.pageTitle,
  robots: { index: false, follow: false },
};

async function readCampName(): Promise<string> {
  try {
    const camp = await getCurrentCamp();
    return camp?.name || m.fallbackCampName;
  } catch {
    return m.fallbackCampName;
  }
}

/** Coming soon page the proxy rewrites gated requests to (specs/023-coming-soon). */
export default async function ComingSoonPage() {
  if (!isComingSoonEnabled(process.env.COMING_SOON)) notFound();
  const campName = await readCampName();

  return (
    <main className="grid min-h-dvh place-items-center bg-sand-50 px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground">
          {m.eyebrow}
        </p>
        <h1 className="mt-5 font-display text-4xl font-black leading-[0.95] tracking-tight text-balance break-words text-foreground sm:text-6xl">
          {campName}
        </h1>
        <p className="mt-8 font-display text-xl font-bold text-foreground">{m.lead}</p>
        <p className="mt-3 text-base text-muted-foreground">{m.text}</p>
        <Link
          href="/sign-in?redirect_url=/"
          className="mt-14 inline-flex min-h-11 items-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline"
        >
          {m.teamLink}
        </Link>
      </div>
    </main>
  );
}
