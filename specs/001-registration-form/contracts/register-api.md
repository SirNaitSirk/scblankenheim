# Contract: `POST /api/register`

Public, not Clerk protected (see `proxy.ts`). Runtime: Node.js.

## Request

```json
{
  "values": { "first_name": "Lena", "last_name": "Muster", "email": "lena@example.com", "<field key>": "string or boolean" },
  "priceTierToken": "optional non empty string"
}
```

Validated with Zod: `values` is a record of string to `string | boolean`; `priceTierToken` is an
optional trimmed non empty string. Anything else → `400`.

## Responses

All `error` and `fieldErrors` strings come from `lib/register/messages.ts` and are German.

| Status | Body | When |
|--------|------|------|
| 200 | `{ "reference": "string" }` | registration stored |
| 400 | `{ "error": string }` | body not JSON or schema mismatch |
| 400 | `{ "error": string, "fieldErrors": { key: message } }` | field validation failed |
| 409 | `{ "error": string, "fieldErrors": { key: message } }` | selected option has no seats left |
| 409 | `{ "error": string }` | camp is full (new, `camp_full`) |
| 409 | `{ "error": string }` | registration not open (no camp, before opening, after deadline, switched off) |
| 429 | `{ "error": string }` | throttled |
| 500 | `{ "error": string }` | unexpected failure |

## Server side order of checks

1. Load current camp; compute state with the shared rule using the active count.
   Not `open` → `closed` (or `camp_full` when state is `full`).
2. Validate all fields (core first, then camp fields).
3. Throttle check (records the attempt).
4. Resolve amount from `priceTierToken` (invalid token → base price, silently).
5. Call `create_public_registration` RPC; map `camp_full` and `option_full` to 409.
6. Write log `registration.created`; return reference.

Steps 1 and 5 both check capacity: step 1 gives a fast answer, step 5 is authoritative.
