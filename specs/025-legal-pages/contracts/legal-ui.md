# UI Contract: Impressum und Datenschutzerklärung

## Routes

| Path | Title (browser tab) | Gate | Index |
|---|---|---|---|
| `/impressum` | „Impressum · FCG Summercamp“ | always open | allowed |
| `/datenschutz` | „Datenschutz · FCG Summercamp“ | always open | allowed |

Both are static server components without camp data, so they never fail on a missing camp.

## Page frame (`LegalPage`)

1. Top: text link „Zur Startseite“ to `/`, same style as the packing list.
2. `h1` in `font-display`, then „Stand: {updatedAt}“ in muted text.
3. Reading column `max-w-[46rem]`, body text `text-base leading-relaxed`, section headings `h2`,
   sub headings `h3`, lists with normal bullets.
4. `SiteFooter` at the bottom.
5. Print: header link and footer hidden, text black.

## Impressum sections (in this order)

1. „Angaben gemäß § 5 DDG“: association name, street, postal city.
2. „Vertreten durch“: board members.
3. „Registereintrag“: register court and number.
4. „Kontakt“: phone and mail (mail as `mailto:` link).
5. „Verantwortlich für den Inhalt“: person, address.
6. „Verbraucherstreitbeilegung“: not willing and not obliged to take part.
7. „Haftung für Inhalte“ and „Haftung für Links“: short standard paragraphs.

## Datenschutz sections (ids are anchors, order fixed)

| # | id | Heading |
|---|---|---|
| 1 | `verantwortlicher` | Verantwortlicher |
| 2 | `ueberblick` | Überblick |
| 3 | `website` | Besuch der Website |
| 4 | `anmeldung` | Anmeldung zum Camp |
| 5 | `bezahlung` | Bezahlung |
| 6 | `mails` | Mails an Teilnehmende |
| 7 | `teilnehmerseite` | Teilnehmerseite und Nachrichten |
| 8 | `schulbefreiung` | Schulbefreiung |
| 9 | `busticket` | Busticket |
| 10 | `organisation` | Organisation vor Ort |
| 11 | `team` | Konten des Teams |
| 12 | `dienstleister` | Dienstleister |
| 13 | `speicherdauer` | Speicherdauer |
| 14 | `rechte` | Deine Rechte |
| 15 | `stand` | Stand dieser Erklärung |

On top: „Inhalt“ with links `#<id>` to all 15 sections.

Address form: „du“ like the rest of the public site; parents are addressed where it concerns them.

## Gap marker

A `null` operator value renders as `<mark>` with the text „noch einzutragen: {label}“, warm
highlight (`bg-amber-100` with `text-amber-700`), readable in light and dark.

## Footer

`SiteFooter` gets a second row under the existing one: „Impressum“ (`/impressum`) and
„Datenschutz“ (`/datenschutz`), smaller and quieter than the main links, plus
„© {year} {brand.full}“. Appears on landing page, packing list, payment pages and participant
page.

Coming soon page: under „Teamzugang“ a row with the same two links, same muted style.
