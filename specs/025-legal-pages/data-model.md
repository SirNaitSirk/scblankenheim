# Data Model: Impressum und Datenschutzerklärung

No schema change, no migration, no new table or column. One maintenance query on an existing table
(R6).

## LegalOperator (new, code constant)

`lib/legal/operator.ts`, the only place that holds operator data (FR-002). `null` means not yet
provided and renders as a marked gap (FR-003).

| Field | Type | Example | Used on |
|---|---|---|---|
| `associationName` | `string \| null` | „Freie Christengemeinde Blankenheim e. V.“ | both |
| `street` | `string \| null` | „Bahnhofstraße 18“ | both |
| `postalCity` | `string \| null` | „53945 Blankenheim“ | both |
| `board` | `string[] \| null` | names of the board members entitled to represent | Impressum |
| `registerCourt` | `string \| null` | „Amtsgericht …“ | Impressum |
| `registerNumber` | `string \| null` | „VR …“ | Impressum |
| `email` | `string \| null` | contact address | both |
| `phone` | `string \| null` | contact phone | Impressum |
| `contentResponsible` | `string \| null` | person responsible for content, with address if different | Impressum |
| `dataProtectionOfficer` | `string \| null` | only shown when set | Datenschutz |
| `supervisoryAuthority` | `string \| null` | default „Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein Westfalen“, confirmed by the association | Datenschutz |
| `hostingRegion` | `string \| null` | server location of Vercel and Supabase as configured | Datenschutz |
| `updatedAt` | `string` | „30. Oktober 2026“ | both („Stand“) |

Every field that is not known today starts as `null`. The values the code already knows
(meeting address on the landing page) are **not** copied, because the meeting point is not
necessarily the legal seat.

## Derived helpers (pure, unit tested)

- `missingOperatorFields(operator)` → list of German labels for every `null` field except the
  optional `dataProtectionOfficer`; empty list means ready for go live.
- `operatorAddressLines(operator)` → name, street, postal city as lines, gaps kept as `null` for
  the marker component.

## Maintenance on `submission_attempts` (R6)

| Rule | Value |
|---|---|
| Retention | `SUBMISSION_ATTEMPT_RETENTION_DAYS = 7` in `lib/legal/limits.ts` |
| Query | delete rows with `created_at` older than now minus 7 days |
| When | once a day at the start of `app/api/cron/info-mails`, failure logged, mails continue |
| Pure helper | `attemptRetentionCutoff(now)` → ISO timestamp, unit tested |
