# Data Model: Schulbefreiung im Gemeindebriefkopf

Migration `supabase/migrations/0020_church_release_letter.sql`. No CHECK constraints; validation in Zod.

## school_releases (changed)

| Column | Type | Change |
|---|---|---|
| registration_id | uuid pk | unchanged |
| camp_id | uuid | unchanged |
| school_name | text not null | unchanged |
| school_location | text not null | **new**, backfilled (research R7) |
| updated_by | text | unchanged |
| created_at, updated_at | timestamptz | unchanged |
| teacher_name, school_address, participant_address, class_name | | **dropped** |

Validation (`schoolReleaseInputSchema`): `schoolName` one line, required, max `SCHOOL_NAME_MAX`;
`schoolLocation` one line, required, max `SCHOOL_LOCATION_MAX` (80, in `limits.ts`).

## camp_mail_info (changed)

| Column | Change |
|---|---|
| release_enabled, release_dates, release_signature_path | unchanged |
| release_signer_name, release_signer_role, release_address_keys | **dropped** |

Enable rule (`missingForEnable`): signature image, at least one release date, camp start and end date.

## Read only inputs to the letter

- `camps.name`, `camps.start_date`, `camps.end_date`, `camps.location`
- `registrations.first_name`, `last_name`, `gender`
- Letterhead constants in `lib/school-release/letterhead.ts`

## Types

```ts
type SchoolReleaseData = { schoolName: string; schoolLocation: string };
type ReleaseSettings = { enabled: boolean; dates: string[]; signaturePath: string | null };
type ReleaseLetterInput = {
  data: SchoolReleaseData;
  participantName: string;
  gender: "female" | "male" | null;
  campStart: string | null;
  campEnd: string | null;
  campLocation: string | null;
  today: string;
};
```
