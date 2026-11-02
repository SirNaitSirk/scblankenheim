# Contract: `POST /api/register` (erweitert)

## Request

```json
{
  "values": { "<feldschlüssel>": "string | boolean" },
  "priceTierToken": "optional string",
  "formToken": "string, vom Server beim Rendern ausgestellt",
  "trap": "string, muss leer sein oder fehlen"
}
```

`formToken` und `trap` sind im Zod Schema optional, damit fehlende Werte nicht als 400 auffallen,
sondern still abgewiesen werden.

## Prüfreihenfolge

1. JSON und Zod Schema wie bisher (400 bei Formfehlern).
2. `trap` nicht leer → still abweisen.
3. Token prüfen: `missing`, `forged`, `too_fast` → still abweisen; `expired` → 409.
4. `submitRegistration`: Camp, Zustand, Feldprüfung wie bisher.
5. Obergrenze pro Stunde → 429 `busy`.
6. Bestehende Drosselung pro Mail und IP → 429 `throttled` (unverändert).
7. Speichern, Stripe, Bestätigungsmail wie bisher.

## Responses (neu oder geändert)

| Fall | Status | Body |
|---|---|---|
| still abgewiesen | 200 | `{ "reference": "REG-XXXXXXXX", "free": true, "checkoutUrl": null }` |
| Formular zu alt | 409 | `{ "error": "Das Formular war zu lange geöffnet. Bitte lade die Seite neu und sende es noch einmal ab." }` |
| Obergrenze erreicht | 429 | `{ "error": "Gerade gehen sehr viele Anmeldungen ein. Bitte versuche es in einer Stunde noch einmal." }` |

Alle übrigen Antworten bleiben unverändert.

## Formular (Client)

- Neue Prop `formToken: string` an `RegistrationForm`, gesetzt von `RegistrationSection`.
- Ein verstecktes Fallenfeld, dessen Wert als `trap` mitgeht.
- Nach „Noch jemanden anmelden“ bleibt dasselbe Token gültig, bis es 24 Stunden alt ist.
