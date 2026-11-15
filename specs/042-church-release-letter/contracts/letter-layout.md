# Contract: Letter layout (A4, one page)

Positions in pt from the top left, measured on `template-2026.pdf` (595 × 842). Tolerance a few pt.

| Element | Position | Style |
|---|---|---|
| Logo with green line | top 30, left 40, width about 530 | image `church-logo.png` |
| Sender line | top 152, left 70 | Helvetica 5.5, grey: "Freie Christengemeinde Blankenheim,  Bahnhofstr. 18 , 53945 Blankenheim" |
| Recipient | top 185, left 70 | 10.5, two lines: school name, school location |
| Place and date | top 200, right 74 | 10.5: "Blankenheim, DD.MM.YYYY" |
| Phone | top 222, right 74 | 10.5: "+49(0)2449 7945" (template number, space instead of the dash) |
| Title | top 352, left 70 | 14: "Teilnehmer Bescheinigung" |
| Subject | top 380, left 70 | bold 10.5: "Summercamp vom {start} bis {end} in {location}" |
| Salutation | top 427 | "Sehr geehrte Damen und Herren," |
| Paragraph 1 | | "laut AV Schulpflicht zu §128 Schulgesetz wird bestimmt, dass Schülerinnen und Schüler die Teilnahme an den Kirchentagen ihres Glaubens eine Beurlaubung vom Besuch des Unterrichts für die Dauer des Kirchentages gewährt werden können, soweit nicht vorrangige schulische Belange (z.B. Klausuren, Abschlussprüfung) dem entgegenstehen." followed by oblique "(AV Schulpflicht Nr. 2 Abs. 7)" |
| Paragraph 2 | | "Da die Teilnahme aus religiösen Gründen bedingt ist (Zeitraum **{start} bis {end}**), bitten wir {den Teilnehmer / die Teilnehmerin / die teilnehmende Person} {Name}, vom Unterricht zu befreien." |
| Paragraph 3 | | "Wir bitten um Ihr Verständnis." |
| Paragraph 4 | | "Für Fragen oder Erläuterungen stehe ich Ihnen selbstverständlich gerne zur Verfügung." |
| Closing | | "Mit freundlichen Segensgrüßen", then "FCG Blankenheim eV" |
| Stamp | right under the closing, left 70 | uploaded image about 170 × 135, placeholder box "Stempel und Unterschrift fehlen" without upload |
| Footer | top 765, four columns at left 38, 145, 267, 381 | Helvetica 7, grey, contents below |

Footer columns:

1. Freie Christengemeinde / Blankenheim e.V. / Bahnhofstr. 18 / 53945 Blankenheim
2. Büro Öffnungszeiten / Mo. bis Fr. 9.00 Uhr bis 13.00 Uhr / Tel.: 0 24 49 79 45 / Fax: 0 24 49 20 70 50 / olga.bormann@fcg-blankenheim.de
3. Gemeindeleiter: / Johannes Neufeld / Mobil: 0177 7994051
4. Bankverbindung / VR Bank Nordeifel eG / BIC: GENODED1SLE / IBAN: DE77 3706 9720 1002 2080 12 / Eingetr. AG Düren: VR30551

Notes on dashes: the template writes time and phone spans and the bank name with dashes. Following
the user's writing rule, the letter uses "bis" and spaces instead; the bank's proper name
"VR Bank Nordeifel eG" is written with a space. Open point for approval (see quickstart).

Layout rules: body text wraps at 455 pt width; when long names push text down, the stamp moves
with it, the footer never moves, and the body never enters the footer area (minimum 20 pt gap).
