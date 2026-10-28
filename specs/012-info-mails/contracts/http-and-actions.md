# Contracts: Cron route and Server Action

## `GET /api/cron/info-mails`

- **Auth**: `Authorization: Bearer <CRON_SECRET>` via `isAuthorizedCronRequest`; otherwise `401`
  `{ "error": "unauthorized" }`. Not Clerk authenticated.
- **Schedule**: `vercel.json` entry `{ "path": "/api/cron/info-mails", "schedule": "30 6 * * *" }`.
- **Effect**: runs `runInfoMails(today)`; never changes a registration.
- **200**: counts only, no personal data:
  `{ "sent": number, "failed": number, "skipped": number, "budget": number, "capped": boolean }`
- **500**: `{ "error": "internal" }`, plus log entry `info_mails.failed`.
- **Log**: one `info_mails.run` entry per run with the counts; per mail `email.sent`,
  `email.failed` or `email.skipped` with kind and reference only (as in 007).

## Server Action `saveCampMailInfoAction(campId, values)`

File `app/admin/camps/[campId]/infomails/actions.ts`.

- **Auth**: `requirePermission("camps")`; `AuthError` maps to the existing German error result.
- **Input** (Zod, strings trimmed, empty becomes null): `highlights`, `teamGreeting`,
  `arrivalAddress`, `arrivalTime`, `pickupTime`, `firstDay`, `emergencyPhone`, `phoneRules`,
  `photosUrl`, `feedbackUrl`, `nextCampNote` and the four booleans `teaserEnabled`,
  `packingEnabled`, `arrivalEnabled`, `thanksEnabled`.
- **Rules**: length limits from the data model; URLs must start with `https://`; when
  `arrivalEnabled` is true, `arrivalAddress`, `arrivalTime` and `emergencyPhone` must be filled,
  each missing one yields a field error in German (FR-015).
- **Effect**: upsert into `camp_mail_info` for an existing camp id (checked on the server), then
  `revalidatePath` for the subpage and `/admin/mail`, log `camp_mail_info.saved`.
- **Result**: the existing `ActionResult` shape (`ok` or field errors).

# Contract: Info mail templates

Pure functions in `lib/email/info-templates.ts`, `(ctx: InfoMailContext) => RenderedEmail`, copy in
`lib/email/messages.ts` under `info`. Every mail has HTML and text, the shared layout and footer, and
never shows price tier names or invitation links.

| Kind | Subject (draft) | Always | Only when |
|---|---|---|---|
| `info_teaser` | „Noch 8 Wochen bis zum {Camp}“ | greeting, camp, dates | motto, highlights list, team greeting |
| `info_packing` | „Deine Packliste für das {Camp}“ | greeting, featured packing items, button „Zur Packliste“, note on medication and food needs (reply to this mail) | |
| `info_arrival` | „Bald geht es los: alles zur Anreise“ | greeting, address, arrival time, emergency phone, link to the packing list | pickup time, first day, phone rules, payment block with outstanding amount and „Jetzt bezahlen“ when outstanding > 0 € |
| `info_thanks` | „Danke für das {Camp}“ | greeting, thanks | photos button, feedback button, next camp note |
