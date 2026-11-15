/**
 * Domain types of the school release letter (specs/020-school-release,
 * specs/042-church-release-letter data-model.md).
 */

export type ReleaseSettings = {
  enabled: boolean;
  dates: string[]; // ISO dates, only for hints on the website
  signaturePath: string | null; // stamp with signature, one image
};

export type SchoolReleaseData = {
  schoolName: string;
  schoolLocation: string;
};

export type ReleaseGender = "female" | "male" | null;

/** Everything the letter needs; built on the server, rendered by `buildLetter`. */
export type ReleaseLetterInput = {
  data: SchoolReleaseData;
  participantName: string;
  gender: ReleaseGender;
  campStart: string | null; // ISO date
  campEnd: string | null; // ISO date
  campLocation: string | null;
  today: string; // ISO date
};

/** Release section of the admin registration dialog (specs/020-school-release, US4). */
export type AdminSchoolRelease = {
  data: SchoolReleaseData | null;
  available: boolean; // release on for the camp and registration active
  canEdit: boolean; // `registrations` permission
  participantLocked: boolean; // not paid yet, the person cannot create it themselves (FR-006a)
  participantName: string;
  dates: string; // German long format, empty when none set
  updatedAt: string | null;
  updatedBy: "participant" | "admin" | null;
  updatedByName: string | null;
};

export type AdminSchoolReleaseResult =
  | { ok: true; release: AdminSchoolRelease }
  | { ok: false; error: string };
