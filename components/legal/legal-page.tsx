import type { ReactNode } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/marketing/site-footer";
import { legalMessages } from "@/lib/legal/messages";
import { legalOperator } from "@/lib/legal/operator";

/**
 * Reading frame of the imprint and the privacy policy, in the look of the
 * packing list (specs/025-legal-pages, contracts/legal-ui.md).
 */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-canvas print:bg-white">
      <header className="mx-auto w-full max-w-[46rem] px-6 pt-10 md:pt-16 print:hidden">
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          {legalMessages.links.home}
        </Link>
      </header>

      <article className="mx-auto w-full max-w-[46rem] flex-1 break-words px-6 pb-20 pt-12 md:pb-28 md:pt-20 print:pt-0 print:text-black">
        <h1 className="font-display text-5xl font-black leading-[1.02] tracking-tight text-foreground text-balance md:text-6xl print:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {legalMessages.links.updated}: {legalOperator.updatedAt}
        </p>
        <div className="mt-12">{children}</div>
      </article>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </main>
  );
}
