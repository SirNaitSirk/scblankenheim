import "server-only";

import { cache } from "react";
import { getActiveRegistrationCount } from "@/lib/marketing/availability";
import { getLandingCamp, type LandingCamp } from "@/lib/marketing/current-camp";
import { registrationCta, type RegistrationCta } from "@/lib/register/registration-cta";
import {
  getRegistrationState,
  type RegistrationState,
} from "@/lib/register/registration-state";
import { getReleaseSettings } from "@/lib/school-release/data";
import { isReleaseActive } from "@/lib/school-release/settings";
import type { ReleaseSettings } from "@/lib/school-release/types";
import { berlinDate } from "@/lib/time/berlin";

/**
 * Everything the landing page sections must agree on within one request
 * (specs/024-landing-structure, data-model.md): the current camp, the
 * registration state, the registration button and whether the school release
 * block shows. Cached per request; failures degrade like the sections did before.
 */
export type LandingState = {
  camp: LandingCamp | null;
  registrationState: RegistrationState;
  opensAt: string | null;
  cta: RegistrationCta;
  /** Active release settings, or null when the school release block is hidden. */
  schoolRelease: ReleaseSettings | null;
};

/** Active registrations of the camp; failures count as zero. */
async function loadActiveCount(campId: string): Promise<number> {
  try {
    return await getActiveRegistrationCount(campId);
  } catch {
    return 0;
  }
}

/** Release settings when active by the spec 020 rule, else null. */
async function loadActiveRelease(camp: LandingCamp, now: Date): Promise<ReleaseSettings | null> {
  if (camp.endDate && camp.endDate < berlinDate(now)) return null;
  try {
    const settings = await getReleaseSettings(camp.id);
    return isReleaseActive(settings) ? settings : null;
  } catch {
    return null; // the landing page never breaks because of this block
  }
}

async function loadLandingState(): Promise<LandingState> {
  const now = new Date();
  const camp = await getLandingCamp();
  const activeRelease = camp ? await loadActiveRelease(camp, now) : null;
  // One count serves both the capacity check and the release rule.
  const needsCount = camp !== null && (camp.capacity !== null || activeRelease !== null);
  const activeCount = needsCount ? await loadActiveCount(camp.id) : 0;
  // The release block only helps people already registered (specs/031 FR-011).
  const schoolRelease = activeCount > 0 ? activeRelease : null;
  const registrationState = getRegistrationState(camp, now, activeCount);
  const opensAt = camp?.opensAt ?? null;

  return {
    camp,
    registrationState,
    opensAt,
    cta: registrationCta(registrationState, opensAt),
    schoolRelease,
  };
}

export const getLandingState = cache(loadLandingState);
