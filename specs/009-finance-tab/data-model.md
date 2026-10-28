# Data Model: Finanzen Tab

Keine Migration. Alle Werte kommen aus bestehenden Spalten.

## FinanceRow (abgeleitet, nur im Speicher)

| Feld | Quelle | Hinweis |
| --- | --- | --- |
| `reference` | `registrations.reference` | Schlüssel für Actions |
| `firstName`, `lastName` | `registrations` | |
| `email` | `registrations.email` | nur für „Zahlungslink senden“ |
| `priceTierName` | `price_tiers.name` über `price_tier_id` | `null` wird „Keine“ |
| `amountDue` | `registrations.amount_due` | ganze Euro |
| `amountPaid` | `registrations.amount_paid` | ganze Euro, editierbar |
| `payment` | `registrations.payment_status` | editierbar |
| `reminderCount`, `lastReminderAt` | bestehende Erinnerungsinfo | |
| `outstanding` | `amountDue - amountPaid` | negativ heißt Guthaben |
| `overdue` | `isOverdue(row, camp.paymentDueDate, today)` | siehe Regel unten |

Bewusst nicht enthalten: `formData`, `gender`, `status`, Zeitstempel der Anmeldung.

## Regeln

- **Aktiv**: `deleted = false` und `status <> 'cancelled'`, nur aktuelles Camp.
- **Offen**: `outstanding > 0`.
- **Teilweise**: `payment = 'partial'`.
- **Überfällig**: Zahlungsziel gesetzt, Zahlungsziel vor heute (Datum in Europe/Berlin),
  `outstanding > 0`, `payment` nicht `processing` und nicht `refunded`.
- **Statusvorschlag**: `amountPaid = 0` ergibt `unpaid`, `0 < amountPaid < amountDue` ergibt
  `partial`, `amountPaid >= amountDue` ergibt `paid`.

## Schreibvorgang

`updateRegistrationFinanceAction(reference, { amountPaid: number, payment: PaymentStatus })`
setzt `amount_paid`, `payment_status`, `updated_at` und schreibt einen Logeintrag
`registration.finance` mit `REF · 0 € unpaid → 250 € paid`.
