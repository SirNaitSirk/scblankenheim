import { TICKET_ANCHOR } from "@/lib/bus/limits";
import { RELEASE_ANCHOR } from "@/lib/school-release/limits";

/** Tabs of the participant page (specs/022-participant-tabs), in display order. */
export const PARTICIPANT_TABS = ["overview", "details", "documents"] as const;
export type ParticipantTab = (typeof PARTICIPANT_TABS)[number];

/** URL fragment per tab. None of them is used as an element id on the page. */
export const TAB_FRAGMENTS: Record<ParticipantTab, string> = {
  overview: "uebersicht",
  details: "angaben",
  documents: "dokumente",
};

/** Section anchors already sent in mails; they open Dokumente and scroll to the card. */
const DOCUMENT_ANCHORS: readonly string[] = [TICKET_ANCHOR, RELEASE_ANCHOR];

export type ResolvedTab = { tab: ParticipantTab; scrollTo: string | null };

const FALLBACK: ResolvedTab = { tab: "overview", scrollTo: null };

/**
 * Maps a URL fragment to the tab to show (data-model.md, "Fragment
 * resolution"). Unknown fragments and fragments of a missing tab fall back
 * to the overview.
 */
export function resolveTab(hash: string, available: readonly ParticipantTab[]): ResolvedTab {
  const fragment = hash.replace(/^#/, "").trim().toLowerCase();
  if (!fragment) return FALLBACK;

  if (DOCUMENT_ANCHORS.includes(fragment)) {
    return available.includes("documents") ? { tab: "documents", scrollTo: fragment } : FALLBACK;
  }

  const tab = PARTICIPANT_TABS.find((candidate) => TAB_FRAGMENTS[candidate] === fragment);
  return tab && available.includes(tab) ? { tab, scrollTo: null } : FALLBACK;
}
