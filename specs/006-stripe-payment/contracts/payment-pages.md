# Contracts: Payment pages (UI)

All copy lives in `lib/payment/messages.ts` (German). Both pages are Server Components using the same
narrow layout and `Notice` look as the registration success state, so they feel like part of the landing
page. Design pass with the `impeccable` and `tasteskill` skills during implementation.

## /bezahlen

Query: `ref` (optional), `abgebrochen=1` (optional), `fehler=limit|stripe` (optional).

| State | Shown |
|-------|-------|
| no `ref` | short form: field "Referenznummer" + button "Weiter", GET to `/bezahlen` |
| not found (unknown, deleted, malformed) | "Wir haben keine offene Anmeldung zu dieser Nummer gefunden." + form |
| throttled | "Zu viele Versuche. Bitte warte ein paar Minuten." |
| open (`unpaid`, `partial`) | "Hallo {Vorname}", camp name, amount, button "Jetzt bezahlen" (form POST `/api/checkout`); with `abgebrochen=1` a muted hint "Deine Anmeldung ist gespeichert, die Zahlung ist noch offen." |
| `processing` | "Deine Zahlung ist in Bearbeitung. Die Bestätigung kann einige Tage dauern." |
| `paid` | "Bereits bezahlt. Danke!" |
| `refunded` or registration cancelled | "Für diese Anmeldung ist keine Zahlung möglich. Bitte melde dich bei uns." |
| `fehler=stripe` | error notice "Die Bezahlung konnte gerade nicht gestartet werden. Bitte versuche es gleich noch einmal." above the open state |

Never shown: last name, email, form answers, price tier name.

## /bezahlen/danke

Query: `ref` (required; missing or unknown → same neutral not found notice).

| Stored status | Shown |
|---------------|-------|
| `paid` | success: "Danke, deine Zahlung ist eingegangen." + reference |
| `processing` | "Zahlung in Bearbeitung" + SEPA hint |
| `unpaid` (first 30 s) | "Wir bestätigen gerade deine Zahlung …" with spinner; client component refreshes every 3 s |
| `unpaid` (after 30 s) / `partial` | "Deine Zahlung ist noch offen." + button "Jetzt bezahlen" |
| `refunded` | same notice as on `/bezahlen` |

States: loading is the waiting state above; error state is the not found notice. Mobile first, one
column, max width like the registration notice.

## Registration form (changed)

* After a successful submit with `checkoutUrl`: button area turns into "Weiter zur Bezahlung …" and the
  browser navigates to Stripe.
* Without `checkoutUrl`: success notice. Body text changes from "Zur Bezahlung melden wir uns in Kürze bei
  dir." to "Du kannst jederzeit über bezahlen mit deiner Referenznummer bezahlen." with a link to
  `/bezahlen?ref=…`. Free registrations show "Für dich fällt kein Beitrag an. Du bist dabei!".

## Admin (changed)

* Labels: `processing` "In Bearbeitung", `refunded` "Erstattet" (plus existing Offen, Teilweise, Bezahlt).
* Table badge tones: processing → pending, refunded → neutral.
* Filter, edit dialog and inline select list all five values.
* Hint badge "Überzahlt" when `amount_paid > amount_due`.
* Dashboard "Offen" keeps counting every registration that is not `paid`, as today, so `processing`
  counts as open until the money arrives.
