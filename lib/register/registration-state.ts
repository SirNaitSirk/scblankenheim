/**
 * The one rule that decides what the registration area shows and whether the
 * server accepts a submission (research R1). Pure and isomorphic: the landing
 * page and the register service call the same function, so they never disagree.
 */

export type RegistrationState = "open" | "countdown" | "closed" | "full";

/** The camp settings the rule depends on. Dates are ISO strings or null. */
export type RegistrationWindow = {
  registrationOpen: boolean;
  opensAt: string | null;
  closesAt: string | null;
  capacity: number | null;
};

/** Parses an ISO string to epoch milliseconds; null when missing or invalid. */
function toTime(value: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Order of evaluation:
 * 1. no current camp: closed
 * 2. deadline reached: closed
 * 3. switch on: open candidate
 * 4. switch off with an opening time: countdown before it, open candidate after
 * 5. otherwise: closed
 * 6. open candidate with capacity reached by active registrations: full
 */
export function getRegistrationState(
  camp: RegistrationWindow | null,
  now: Date,
  activeCount: number,
): RegistrationState {
  if (!camp) return "closed";

  const nowTime = now.getTime();
  const closesAt = toTime(camp.closesAt);
  if (closesAt !== null && nowTime >= closesAt) return "closed";

  if (!camp.registrationOpen) {
    const opensAt = toTime(camp.opensAt);
    if (opensAt === null) return "closed";
    if (nowTime < opensAt) return "countdown";
  }

  if (camp.capacity !== null && activeCount >= camp.capacity) return "full";
  return "open";
}
