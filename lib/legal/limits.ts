/**
 * Retention of throttling data (specs/025-legal-pages, research R6). The throttles
 * look back 10 minutes; a week leaves room to look at abuse after a weekend.
 */
export const SUBMISSION_ATTEMPT_RETENTION_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO time before which `submission_attempts` rows are deleted. */
export function attemptRetentionCutoff(now: Date): string {
  return new Date(now.getTime() - SUBMISSION_ATTEMPT_RETENTION_DAYS * DAY_MS).toISOString();
}
