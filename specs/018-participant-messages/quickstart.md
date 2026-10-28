# Quickstart: Nachricht ans Team und Änderung anfragen

## Prerequisites

- Migration `0014_participant_messages.sql` applied, types updated
- `APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM` set; a reply address in the camp's mail settings or
  `EMAIL_REPLY_TO`
- `npm run dev`

## Checks

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

## Manual scenarios

1. **Message**: open a participant page, send "Kann sie einen Tag später anreisen?". Page shows the
   success text and the item under "Deine Anliegen" as offen. The team inbox gets the mail; "Antworten"
   addresses the registration's mail.
2. **Validation**: send an empty message and one with 2001 characters: both rejected with a hint.
3. **Change request**: choose a select field, pick another option, add a reason, send. Choose the same
   value as stored: rejected with "Der Wert ist schon so eingetragen."
4. **Admin badge**: `/admin` shows "2 offen" on that registration.
5. **Done**: in the dialog section "Nachrichten" mark the message done. Badge goes to "1 offen", the
   page shows erledigt.
6. **Apply**: apply the change request. The answers on the participant page show the new value,
   `/admin/logs` lists `registration.change_applied` without the value.
7. **Conflict**: send another change request, then edit that field in the dialog and save, then
   apply: the conflict hint shows the current value; "Trotzdem übernehmen" writes the requested value.
8. **Dismiss**: send and dismiss a change request: registration unchanged.
9. **Limits**: send a sixth item on the same day: the day limit hint appears.
10. **No team address**: clear the reply address and `EMAIL_REPLY_TO`, send: item stored, log shows
    `email.skipped`, badge visible.
