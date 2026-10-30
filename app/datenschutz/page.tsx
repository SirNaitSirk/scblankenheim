import type { Metadata } from "next";
import { LegalBlocks } from "@/components/legal/legal-blocks";
import { LegalPage } from "@/components/legal/legal-page";
import { legalMessages } from "@/lib/legal/messages";

const copy = legalMessages.privacy;

export const metadata: Metadata = { title: copy.metaTitle };

/** Static privacy policy (specs/025-legal-pages); open during the prelaunch gate. */
export default function PrivacyPage() {
  return (
    <LegalPage title={copy.title}>
      <p className="max-w-[60ch] text-lg leading-relaxed text-muted-foreground">{copy.intro}</p>

      <nav
        aria-labelledby="inhalt-heading"
        className="mt-10 rounded-card bg-surface p-6 shadow-card md:p-8 print:hidden"
      >
        <h2
          id="inhalt-heading"
          className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
        >
          {legalMessages.links.contents}
        </h2>
        <ol className="mt-4 grid list-decimal gap-x-10 gap-y-2 pl-5 text-sm marker:text-muted-foreground md:grid-cols-2">
          {copy.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-foreground underline-offset-4 transition-colors duration-150 hover:text-accent-strong hover:underline"
              >
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-14">
        <LegalBlocks sections={copy.sections} />
      </div>
    </LegalPage>
  );
}
