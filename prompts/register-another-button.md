# Prompt: „Noch jemanden anmelden" button on registration success

## Goal

After a successful registration, parents who register multiple children should be
able to submit another registration without reloading the page. Add a
**„Noch jemanden anmelden"** button beneath the success text that resets the form
to a blank state.

## Existing code inspected

- `components/marketing/registration-form.tsx`
  - Client component with local state: `values`, `errors`, `reference`,
    `submitting`, `serverError`.
  - On a successful submit, `reference` is set and the component early-returns the
    `Notice` (success card) at lines 195–203, replacing the form entirely.
  - `allFields` is derived from props via `mergeFields(fields)`; initial values come
    from `initialValue(field)`.
  - The `Notice` component (lines 374–403) renders a centered card with a title and
    body; it currently accepts only `tone`, `title`, `body`.
- `components/marketing/registration-section.tsx` — parent Server Component, passes
  `fields` + `availability`. No change needed.

## Decisions / assumptions

- Reset happens fully client-side: no refetch, no navigation. The button clears
  `reference`, resets `values` to initial, and clears `errors` / `serverError`,
  which brings back the pristine form.
- Availability data is passed as a prop from the server render; after a client-side
  reset it will not reflect the seat just taken. This is acceptable for now (the
  server re-validates capacity on submit, and the note is informational). Not
  changing the availability flow in this task.
- Button label: **„Noch jemanden anmelden"**. Add both label strings to the local
  `copy` object (German UI copy stays centralized in the component's `copy`).

## Files likely to change

- `components/marketing/registration-form.tsx` only.

## Implementation requirements

1. Add to `copy`:
   - `registerAnother: "Noch jemanden anmelden"`.
2. Add a `resetForm` handler in `RegistrationForm` that:
   - sets `values` back to `Object.fromEntries(allFields.map((f) => [f.key, initialValue(f)]))`,
   - clears `errors` (`{}`), `serverError` (`null`), and `reference` (`null`).
3. In the success early-return, render the `Notice` **with** a button below it.
   Extend `Notice` to accept an optional `children` (or an optional `action` node)
   rendered under the body, and place the `<Button>` there. Use the existing
   `Button` component with `variant="outline"` and `size="lg"`, `type="button"`,
   `onClick={resetForm}`, centered under the success body (e.g. `mt-6`).
4. Keep the reference number visible in the success body as-is.
5. No `any`, keep types explicit, match surrounding style.

## Security requirements

- None new. Purely a client-side UI reset; the server `/api/register` route remains
  the authority and re-validates each submission.

## Acceptance criteria

- After a successful registration, the success card shows the reference number and a
  „Noch jemanden anmelden" button.
- Clicking it returns the empty registration form (all fields blank, no errors, no
  reference), ready for a new submission.
- A second registration submits and succeeds independently.
- All visible copy is German.

## Checks to run

- `npm run lint`
- `npm run build`

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/#anmelden` (camp must be in the `open`
   state).
2. Fill and submit the form → success card with reference appears.
3. Click „Noch jemanden anmelden" → blank form returns.
4. Fill and submit again → second success card with a new reference.
