# Research: Schulbefreiung im Gemeindebriefkopf

## R1 · PDF engine stays pdf-lib with Helvetica

- **Decision**: Keep `pdf-lib` and the standard Helvetica family (regular, bold, oblique for the
  italic source note). The template uses Arial; Helvetica is metrically equivalent.
- **Rationale**: No new dependency, no font file to embed, existing WinAnsi sanitising keeps working.
- **Alternatives**: Embedding Arial (licence, `fontkit` dependency); HTML to PDF via a headless
  browser (heavy on Vercel).

## R2 · Logo source

- **Decision**: Extract image `Im0` (1075 × 203 px, indexed colour with soft mask) from
  `template-2026.pdf` once into `lib/school-release/assets/church-logo.png` with transparency,
  embed it with `embedPng`, read with `fs` on the server and cache in memory. It contains the cross,
  the wordmark and the green line.
- **Rationale**: Exactly the look of the template; a better print file can replace the PNG later
  without code changes.
- **Alternatives**: Redraw the logo as vector paths (effort, risk of looking off); public URL
  fetch (needless network hop).

## R3 · Stamp with signature

- **Decision**: Keep the existing private upload. Image `Im1` of the template (531 × 420 px JPEG,
  stamp plus signature) is the expected upload; the admin card says so. The PDF draws it about
  170 × 135 pt under "FCG Blankenheim eV", like the template.
- **Rationale**: No new storage, signature stays private.

## R4 · Letterhead data in one place

- **Decision**: `lib/school-release/letterhead.ts` holds sender line, phone, office hours, fax,
  office mail, leader name and mobile, bank name, BIC, IBAN, register entry, as given in the
  template. Association name, street, postal city, phone and register reuse `lib/legal/operator.ts`
  where the values match; formatting as in the template (for example "Bahnhofstr. 18").
- **Rationale**: Constitution IV; the footer changes rarely and is not camp specific, so no admin UI.

## R5 · Period and location

- **Decision**: Period from `camps.start_date` and `camps.end_date`, format `DD.MM.` for the start
  and `DD.MM.YYYY` for the end; both with year when the years differ. Location from `camps.location`
  (free text, for example "Nieuwpoort/Belgien"); empty location drops " in …". The release switch
  requires both dates (new missing reason "Campzeitraum").
- **Rationale**: User decision: full camp period, not the release dates.

## R6 · Gendered request

- **Decision**: `registrations.gender` `male` → "den Teilnehmer", `female` → "die Teilnehmerin",
  missing → "die teilnehmende Person". Title "Teilnehmer Bescheinigung" stays fixed as in the template.

## R7 · Migration of old rows

- **Decision**: In SQL: `school_location` = last line of `school_address` with a leading five digit
  postal code removed and trimmed; when that leaves nothing, the full last line. Then drop
  `teacher_name`, `school_address`, `participant_address`, `class_name` on `school_releases` and
  `release_signer_name`, `release_signer_role`, `release_address_keys` on `camp_mail_info`.
- **Rationale**: Spec User Story 4 and FR-003 (data minimisation). Release data are reproducible
  by the participant in seconds, so dropping columns carries little risk; Supabase backups exist.
- **Alternatives**: Keep the old columns unused (dead data with personal content).

## R8 · Mail copy

- **Decision**: Release mail says it applies to the camp period instead of the release dates and
  "leite ihn an deine Schule weiter" instead of the teacher. Hints on landing, participant page and
  teaser mail keep naming the release dates.
