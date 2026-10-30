import type { Metadata } from "next";
import { LegalBlocks } from "@/components/legal/legal-blocks";
import { LegalPage } from "@/components/legal/legal-page";
import { legalMessages } from "@/lib/legal/messages";

const copy = legalMessages.imprint;

export const metadata: Metadata = { title: copy.metaTitle };

/** Static imprint (specs/025-legal-pages); open during the prelaunch gate. */
export default function ImprintPage() {
  return (
    <LegalPage title={copy.title}>
      <LegalBlocks sections={copy.sections} />
    </LegalPage>
  );
}
