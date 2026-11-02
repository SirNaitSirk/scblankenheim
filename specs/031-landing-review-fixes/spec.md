# Feature Specification: Landingpage Review Fixes (Countdown, Rückversicherung, Schulbefreiung)

**Feature Branch**: `031-landing-review-fixes`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Landingpage: die drei P1 Punkte aus dem Impeccable Review vom 2026-11-02 beheben. (1) Countdown Zustand ruhiger und ehrlicher, keine tickenden Sekunden. (2) Rückversicherung am Abschluss der Anmeldung, Bezahltext korrigieren, Kopierknopf für die Referenznummer. (3) Schulbefreiung konkurriert nicht mehr mit der Anmeldung. Kein neues Datenmodell."

**Kontext**: Das Review `.impeccable/critique/2026-11-02T12-35-26Z__app-page-tsx.md` (22/32) nennt
drei P1 Probleme. Entscheidungen der Nutzerin bzw. des Nutzers vom 2026-11-02: bei Rücktritt nur den
Kontakt nennen, keine Storno oder Erstattungsregeln erfinden; Schulbefreiung erst ab einer aktiven
Anmeldung zeigen; im Countdown nur die Sekunden entfernen, kein Kalendereintrag für die Öffnung und
kein Teilen Knopf.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Ruhiger Countdown statt tickender Sekunden (Priority: P1)

Eine Jugendliche öffnet die Seite drei Monate vor der Öffnung der Anmeldung. Statt vier Kacheln, in
denen die Sekunden laufen, sieht sie im Anmeldebereich klar, an welchem Tag und um welche Uhrzeit die
Anmeldung öffnet und wie viele Tage es noch sind. Der Knopf in der Navigation sagt „Anmeldung ab 1.2.“
statt nur „Ab 01.02.“.

**Why this priority**: Der Sekundenzähler erzeugt falsche Dringlichkeit, dominiert auf dem Handy den
Bildschirm und wird von Screenreadern jede Sekunde neu vorgelesen. Das ist zugleich ein
Barrierefreiheitsfehler.

**Independent Test**: Camp mit Öffnung in der Zukunft, Landingpage öffnen: keine Sekunden, Datum mit
Uhrzeit und Tage sichtbar; mit Screenreader keine wiederkehrenden Ansagen.

**Acceptance Scenarios**:

1. **Given** die Anmeldung öffnet in mehr als einem Tag, **When** der Anmeldebereich angezeigt wird,
   **Then** steht dort das Öffnungsdatum mit Wochentag und Uhrzeit in deutscher Zeit (z. B. „Samstag,
   1. Februar 2027, 18:00 Uhr“) und die Zahl der verbleibenden Tage; Sekunden werden nirgends angezeigt.
2. **Given** die Anmeldung öffnet in weniger als einem Tag, **When** der Bereich angezeigt wird,
   **Then** zeigt er statt der Tage die verbleibenden Stunden (bzw. „unter einer Stunde“), weiterhin ohne
   Sekunden.
3. **Given** ein Screenreader, **When** die Seite eine Minute offen bleibt, **Then** wird der Countdown
   nicht automatisch erneut angesagt.
4. **Given** die Öffnungszeit ist erreicht, **When** die Seite offen ist, **Then** lädt sie wie bisher
   einmal neu und zeigt das Formular.
5. **Given** der Countdown Zustand, **When** die Navigation angezeigt wird, **Then** lautet der kurze
   Knopf „Anmeldung ab 1.2.“ (Tag und Monat ohne führende Null).

---

### User Story 2 · Rückversicherung vor dem verbindlichen Absenden (Priority: P1)

Ein Elternteil meldet die Tochter an und steht auf dem Prüfschritt vor „Verbindlich anmelden“. Direkt
über dem Knopf steht kurz, was als Nächstes passiert: weiter zur sicheren Bezahlseite, eine
Bestätigungsmail mit persönlichem Link kommt, Bezahlen geht auch später über diesen Link, und wer doch
nicht kann, schreibt an info@fcg-blankenheim.de. Nach dem Absenden kann die Referenznummer mit einem
Knopf kopiert werden, und es steht dabei, dass sie auch per Mail kommt.

**Why this priority**: Der Moment mit dem höchsten Einsatz hatte keinerlei Rückversicherung, und der
Bezahltext unter „Gut zu wissen“ widerspricht dem erlaubten späteren Bezahlen.

**Independent Test**: Formular bis zum Prüfschritt ausfüllen, Hinweis lesen; Bezahlblock lesen; eine
kostenlose Anmeldung absenden und die Referenznummer kopieren.

**Acceptance Scenarios**:

1. **Given** der Prüfschritt, **When** er angezeigt wird, **Then** steht direkt über „Verbindlich
   anmelden“ ein kurzer Hinweis mit den drei Punkten Bezahlseite, Bestätigungsmail mit persönlichem
   Link und späteres Bezahlen, plus der Kontakt für einen Rücktritt als anklickbare Mailadresse.
2. **Given** der Hinweis, **When** er gelesen wird, **Then** enthält er keine Fristen, Gebühren oder
   Erstattungszusagen.
3. **Given** der Block „Bezahlen“ unter „Gut zu wissen“, **When** er gelesen wird, **Then** sagt er, dass
   man direkt nach der Anmeldung oder später über den persönlichen Link aus der Bestätigungsmail
   bezahlen kann.
4. **Given** die Erfolgsansicht mit Referenznummer, **When** jemand den Kopierknopf drückt, **Then**
   liegt die Nummer in der Zwischenablage und der Knopf bestätigt das sichtbar und für Screenreader.
5. **Given** die Erfolgsansicht, **When** sie angezeigt wird, **Then** steht dort, dass die
   Referenznummer auch in der Bestätigungsmail steht.

---

### User Story 3 · Schulbefreiung tritt zurück (Priority: P1)

Eine Besucherin im Countdown Zustand sieht keine Schulbefreiung in der Navigation und keinen
Schulbefreiungsblock, denn es kann noch niemand angemeldet sein. Sobald es die erste aktive Anmeldung
für das aktuelle Camp gibt, erscheinen Block und Footerlink wie bisher, der Absendeknopf im Block ist
aber ein zurückhaltender Outline Knopf statt des amberfarbenen Hauptknopfs.

**Why this priority**: Der Block hatte den lautesten Knopf der unteren Seitenhälfte und stand in der
Navigation gleichrangig neben der Anmeldung, obwohl er nur Angemeldeten hilft.

**Independent Test**: Camp mit eingeschalteter Schulbefreiung ohne Anmeldungen: kein Block, kein
Navigations und Footereintrag. Eine Anmeldung anlegen: Block und Footerlink erscheinen, Navigation
bleibt ohne Eintrag, Knopf ist Outline.

**Acceptance Scenarios**:

1. **Given** jede Landingpage, **When** die Navigation angezeigt wird (Desktop und Handymenü), **Then**
   enthält sie keinen Eintrag „Schulbefreiung“.
2. **Given** die Schulbefreiung ist für das aktuelle Camp aktiv und es gibt keine aktive Anmeldung,
   **When** die Seite angezeigt wird, **Then** fehlen der Block in „Gut zu wissen“ und der Footerlink, und
   der Packlistenblock füllt die Breite wie heute ohne Schulbefreiung.
3. **Given** die Schulbefreiung ist aktiv und es gibt mindestens eine aktive Anmeldung, **When** die
   Seite angezeigt wird, **Then** erscheinen Block und Footerlink.
4. **Given** der sichtbare Block, **When** er angezeigt wird, **Then** ist sein Absendeknopf als Outline
   Knopf gestaltet und klar weniger auffällig als jeder Anmeldeknopf.
5. **Given** Links aus Mails auf `#schulbefreiung`, **When** der Block gerade nicht sichtbar ist, **Then**
   landet die Person ohne Fehler oben auf der Seite.

### Edge Cases

- Öffnungszeit fehlt oder ist ungültig: der Anmeldebereich zeigt wie heute den neutralen Text ohne
  Datum; die Navigation zeigt „Anmeldung“.
- Öffnung genau heute in wenigen Minuten: Anzeige „unter einer Stunde“, keine negative Zahl.
- Server und Gerät haben leicht verschiedene Uhrzeiten: der einmalige Neuladevorgang bleibt wie heute.
- Zwischenablage nicht verfügbar (alter Browser, keine Berechtigung): der Knopf meldet, dass Kopieren
  nicht ging; die Nummer bleibt markierbar sichtbar.
- Anmeldungen nur storniert: zählen nicht als aktive Anmeldung, Block bleibt verborgen.
- Abfrage der Anmeldezahl schlägt fehl: Block bleibt verborgen, die Seite bricht nicht.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Der Countdown Bereich MUSS das Öffnungsdatum mit Wochentag, Datum und Uhrzeit in der
  Zeitzone Europe/Berlin anzeigen.
- **FR-002**: Der Countdown Bereich MUSS die verbleibende Zeit als ganze Tage anzeigen, unter einem Tag
  als ganze Stunden, unter einer Stunde als „unter einer Stunde“; Sekunden und Minuten DÜRFEN NICHT
  angezeigt werden.
- **FR-003**: Die verbleibende Zeit DARF Screenreadern NICHT als fortlaufende Live Ansage gemeldet
  werden.
- **FR-004**: Beim Erreichen der Öffnungszeit MUSS die Seite wie bisher einmal neu laden.
- **FR-005**: Das kurze Navigationslabel im Countdown MUSS „Anmeldung ab T.M.“ lauten (Tag und Monat
  ohne führende Nullen).
- **FR-006**: Der Prüfschritt MUSS direkt über dem Absendeknopf einen Hinweis zeigen: Weiterleitung zur
  sicheren Bezahlseite, Bestätigungsmail mit persönlichem Link, Bezahlen auch später über diesen Link,
  Kontakt bei Rücktritt über info@fcg-blankenheim.de. Ist für die Anmeldung kein Beitrag fällig, ist das
  aus dem Formular nicht vorab bekannt; der Hinweis formuliert die Bezahlung daher als „falls ein
  Beitrag anfällt“.
- **FR-007**: Der Hinweis DARF KEINE Fristen, Gebühren oder Erstattungszusagen enthalten.
- **FR-008**: Der Text im Block „Bezahlen“ MUSS das spätere Bezahlen über den persönlichen Link nennen
  und DARF NICHT behaupten, die Bezahlung laufe nur direkt bei der Anmeldung.
- **FR-009**: Die Erfolgsansicht MUSS einen Knopf zum Kopieren der Referenznummer mit sichtbarer und
  angesagter Bestätigung bieten, sowie den Hinweis, dass die Nummer auch per Mail kommt. Gilt für die
  Ansicht mit und ohne Beitrag.
- **FR-010**: Die Navigation DARF auf keiner Seite einen Eintrag „Schulbefreiung“ enthalten.
- **FR-011**: Block und Footerlink der Schulbefreiung DÜRFEN NUR erscheinen, wenn die bisherigen
  Bedingungen aus specs/020-school-release erfüllt sind UND das aktuelle Camp mindestens eine aktive
  (nicht stornierte) Anmeldung hat.
- **FR-012**: Der Absendeknopf im Schulbefreiungsblock MUSS als sekundärer Outline Knopf erscheinen.
- **FR-013**: Alle neuen Texte MÜSSEN deutsch sein, im zentralen Textmodul liegen und ohne
  Gedankenstriche und Bindestriche in Wörtern auskommen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Im Countdown Zustand ändert sich innerhalb einer Minute auf der Seite keine sichtbare
  Zahl, und ein Screenreader macht in dieser Minute keine automatische Ansage.
- **SC-002**: Eine Person erkennt auf dem Prüfschritt in unter 10 Sekunden, ob sie später bezahlen
  kann und an wen sie sich bei einem Rücktritt wendet.
- **SC-003**: Kein Text der Landingpage behauptet mehr, die Bezahlung sei nur direkt bei der Anmeldung
  möglich.
- **SC-004**: Ohne aktive Anmeldung erscheint das Wort „Schulbefreiung“ null Mal auf der Landingpage;
  mit aktiver Anmeldung ist der auffälligste Knopf der unteren Seitenhälfte wieder ein Anmeldeknopf
  oder der Lagerfeuer Knopf.
- **SC-005**: Ein erneutes Impeccable Review führt keinen dieser drei Punkte mehr als P1.

## Assumptions

- Die Bestätigungsmail enthält bereits die Referenznummer und den persönlichen Link
  (specs/007-transactional-emails, specs/017-participant-page); daran ändert sich nichts.
- Die Kontaktadresse ist info@fcg-blankenheim.de, wie bereits im Anmeldebereich verwendet.
- Die Öffnungszeit hat eine Uhrzeit (Zeitpunkt in der Datenbank); wird sie auf volle Stunden gesetzt,
  zeigt die Seite „18:00 Uhr“.
- Kalendereintrag für die Öffnung und Teilen Knopf sind ausdrücklich nicht Teil dieser Änderung.
- Hero und Lagerfeuer Knopf behalten ihre bisherigen Beschriftungen („Anmeldung ab 1. Februar“).
- Kein neues Datenmodell und keine Migration; die Zahl aktiver Anmeldungen wird bereits an anderer
  Stelle für die Kapazität ermittelt.
- Die Schulbefreiungsseite für Angemeldete (Teilnehmerseite) bleibt unverändert.
