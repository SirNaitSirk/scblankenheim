# Contract: Mail templates

All copy German, in `lib/email/messages.ts`; amounts via the existing euro formatter in
`lib/format.ts`, dates as `dd.MM.yyyy`. Every mail has HTML and text, the shared layout (camp name
header, footer "FCG Blankenheim Summercamp · Antworten auf diese Mail erreichen unser Team"), and
escapes every value. Never included: price tier name, other prices, last name, form answers.

| Template | Kind | Subject (draft) | Content |
|----------|------|-----------------|---------|
| Anmeldebestätigung | `confirmation` | „Deine Anmeldung zum {Camp}“ | Hallo {Vorname}, Anmeldung eingegangen; Camp, Zeitraum, Referenznummer, Betrag. Betrag > 0: Knopf „Jetzt bezahlen“, lesbarer Link, Zahlungsziel falls gesetzt, Hinweis „Hast du schon bezahlt? Dann ist alles erledigt.“ Betrag 0: „Für dich ist nichts zu zahlen.“ |
| Zahlungslink | `payment_link` | „Dein Zahlungslink für das {Camp}“ | Hallo {Vorname}, offener Betrag, Referenznummer, Knopf und Link, Zahlungsziel falls gesetzt. |
| Erinnerung 1 | `reminder_1` | „Erinnerung: Zahlung für das {Camp}“ | Freundlich: Zahlung noch offen, offener Betrag, Knopf, Link, Zahlungsziel falls gesetzt. |
| Erinnerung 2 | `reminder_2` | „Zahlungsziel am {Datum}“ | Zahlungsziel rückt näher, offener Betrag, Knopf, Link. |
| Erinnerung 3 | `reminder_3` | „Deine Zahlung für das {Camp} ist noch offen“ | Zahlungsziel überschritten, Platz bleibt bestehen, Bitte um Zahlung oder Rückmeldung bei Fragen, Kontakt per Antwort auf diese Mail. Keine Androhung einer Stornierung (FR-017). |

Input type shared by all templates:

```ts
type EmailContext = {
  firstName: string | null;
  campName: string;
  campStart: string | null;   // ISO date
  campEnd: string | null;     // ISO date
  reference: string;
  amountDue: number;          // whole euros, own price
  outstanding: number;        // whole euros, used by payment link and reminders
  paymentDueDate: string | null;
  payUrl: string;             // ${APP_URL}/bezahlen?ref=...
};
```

Partial payments: payment link and reminders always show `outstanding` (spec US2 scenario 4).
