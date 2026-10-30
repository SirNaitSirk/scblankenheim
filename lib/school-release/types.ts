/** Domain types of the school release letter (specs/020-school-release, data-model.md). */

export type ReleaseSettings = {
  enabled: boolean;
  dates: string[]; // ISO dates
  signerName: string | null;
  signerRole: string | null;
  signaturePath: string | null;
  addressKeys: string[];
};

export type SchoolReleaseData = {
  teacherName: string;
  schoolName: string;
  schoolAddress: string;
  participantAddress: string;
  className: string | null;
};

/** Everything the letter needs; built on the server, rendered by `buildLetter`. */
export type ReleaseLetterInput = {
  settings: ReleaseSettings;
  data: SchoolReleaseData;
  participantName: string;
  campName: string;
  campStart: string | null; // ISO date
  campEnd: string | null; // ISO date
  senderLines: string[];
  today: string; // ISO date
};

/** Release section of the admin registration dialog (specs/020-school-release, US4). */
export type AdminSchoolRelease = {
  data: SchoolReleaseData | null;
  available: boolean; // release on for the camp and registration active
  canEdit: boolean; // `registrations` permission
  participantLocked: boolean; // not paid yet, the person cannot create it themselves (FR-006a)
  participantName: string;
  prefillAddress: string;
  dates: string; // German long format, empty when none set
  updatedAt: string | null;
  updatedBy: "participant" | "admin" | null;
  updatedByName: string | null;
};

export type AdminSchoolReleaseResult =
  | { ok: true; release: AdminSchoolRelease }
  | { ok: false; error: string };
