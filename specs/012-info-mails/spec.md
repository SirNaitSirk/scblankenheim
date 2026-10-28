# Feature Specification: Infomails an Angemeldete

**Feature Branch**: `012-info-mails`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Infomails an Angemeldete (Teaser und kleine Erinnerungen). Vier codedefinierte Mails an alle aktiven Anmeldungen des aktuellen Camps, automatisch über den bestehenden täglichen Cron: 1) Vorfreude Teaser 8 Wochen vor Campstart. 2) Packliste 3 Wochen vor Campstart. 3) Letzte Infos zur Anreise 5 Tage vor Campstart. 4) Danke und Rückblick 5 Tage nach Campende. Verpasste Stufen werden übersprungen; am Tag einer Zahlungserinnerung keine Infomail; am Anmeldetag nur die Bestätigung; abgemeldete oder gelöschte Anmeldungen bekommen nichts; jede Mail höchstens einmal pro Anmeldung. Tageskontingent des Mailanbieters beachten. Vorschau in /admin/mail. Keine Werbemails, keine Einwilligungsliste, kein Vorlageneditor. Inhalte wie Adresse, Zeiten und Notfallnummer pro Camp pflegbar."

**Kontext**: Seit Feature 007 bekommen Teilnehmende eine Anmeldebestätigung und, falls nötig,
Zahlungserinnerungen. Zwischen Anmeldung und Camp hören sie danach nichts mehr vom Team. Fragen wie
„Was muss ich mitbringen?“ oder „Wann genau sollen wir da sein?“ landen dann per Telefon oder
Messenger bei der Leitung. Dieses Feature schickt vier feste Infomails zu sinnvollen Zeitpunkten
rund ums Camp und baut die Vorfreude auf.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-28 getroffen)**:

- Nur Mails an Personen mit Anmeldung. Keine Werbemails an Interessierte und keine
  Einwilligungsliste.
- Vier Mails mit festen Zeitpunkten: Vorfreude 8 Wochen vor Campstart, Packliste 3 Wochen vor
  Campstart, Anreise 5 Tage vor Campstart, Danke 5 Tage nach Campende.
- Texte stehen fest im Code wie bei Feature 007. Was sich pro Jahr ändert (Motto, Highlights,
  Anreisezeiten, Adresse, Notfallnummer, Links), pflegen Admins pro Camp.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Packliste rechtzeitig vor dem Camp (Priority: P1)

Drei Wochen vor Campstart bekommt jede angemeldete Person eine Mail mit dem Link zur Packliste, den
wichtigsten Dingen zum Mitbringen und dem Hinweis, Medikamente und Besonderheiten beim Essen
mitzuteilen. Drei Wochen reichen, um fehlende Dinge noch zu besorgen.

**Why this priority**: Die Packliste ist die häufigste Frage vor dem Camp. Die Mail braucht kaum
Pflege, weil die Packliste schon auf der Website steht, und zeigt den Nutzen der Infomails sofort.

**Independent Test**: Im Testbetrieb ein Camp mit Start in 21 Tagen und zwei aktiven Anmeldungen
anlegen, die Packlistenmail für das Camp aktivieren und den täglichen Lauf auslösen. Beide Personen
bekommen genau eine Packlistenmail, der Link öffnet die Packliste. Ein zweiter Lauf schickt nichts
mehr.

**Acceptance Scenarios**:

1. **Given** die Packlistenmail ist für das aktuelle Camp aktiviert und der Campstart ist in 21 Tagen
   oder weniger, **When** der tägliche Lauf startet, **Then** bekommt jede aktive Anmeldung mit
   Mailadresse, die diese Mail noch nicht hat, eine deutsche Mail mit Vorname, Campname, Zeitraum,
   den wichtigsten Packpunkten und einem Knopf zur Packliste.
2. **Given** eine Anmeldung ist storniert oder gelöscht, **When** der Lauf startet, **Then** bekommt
   sie keine Infomail.
3. **Given** eine Person hat die Packlistenmail schon bekommen, **When** weitere Läufe starten,
   **Then** bekommt sie diese Mail nicht noch einmal.
4. **Given** die Packlistenmail ist für das Camp nicht aktiviert, **When** der Lauf startet, **Then**
   wird sie an niemanden verschickt.

---

### User Story 2 · Letzte Infos zur Anreise (Priority: P1)

Fünf Tage vor Campstart bekommt jede angemeldete Person die praktischen Infos: Adresse, wann sie
ankommen und wann sie abgeholt werden soll, wie der erste Tag abläuft, eine Notfallnummer der
Leitung und die Regeln zum Handy. Die Mail verweist noch einmal auf die Packliste. Ist noch ein
Betrag offen, steht dort ein freundlicher Satz mit dem Zahlungslink.

**Why this priority**: Ohne diese Infos klappt die Anreise nicht. Sie ist die wichtigste der vier
Mails und erreicht auch Personen, die sich spät angemeldet haben.

**Independent Test**: Im Camp Adresse, Ankunftszeit, Abholzeit und Notfallnummer eintragen, die
Anreisemail aktivieren, Campstart auf in 5 Tagen setzen, eine bezahlte und eine offene Anmeldung
anlegen und den Lauf auslösen. Beide bekommen die Mail mit allen Angaben, nur die offene enthält den
Zahlungshinweis mit Link.

**Acceptance Scenarios**:

1. **Given** die Anreisemail ist aktiviert und der Campstart ist in 5 Tagen oder weniger, aber noch
   nicht erreicht, **When** der Lauf startet, **Then** bekommt jede aktive Anmeldung mit Mailadresse
   die Anreisemail mit Adresse, Ankunftszeit, Abholzeit, Notfallnummer und einem Link zur Packliste.
2. **Given** eine Anmeldung hat einen offenen Betrag größer als 0 €, **When** ihre Anreisemail
   erstellt wird, **Then** enthält sie einen freundlichen Hinweis mit dem offenen Betrag und dem Link
   zur Bezahlseite mit ihrer Referenznummer.
3. **Given** eine Anmeldung ist bezahlt oder kostenlos, **When** ihre Anreisemail erstellt wird,
   **Then** enthält sie keinen Zahlungshinweis.
4. **Given** Ablauf des ersten Tages oder Handyregeln sind für das Camp nicht eingetragen, **When**
   die Mail erstellt wird, **Then** fehlt der jeweilige Abschnitt, der Rest der Mail bleibt
   vollständig.
5. **Given** Adresse, Ankunftszeit oder Notfallnummer fehlen, **When** ein Admin die Anreisemail
   aktivieren will, **Then** ist das nicht möglich, und ein deutscher Hinweis nennt die fehlenden
   Angaben.
6. **Given** eine Person meldet sich 3 Tage vor Campstart an, **When** der Lauf am nächsten Tag
   startet, **Then** bekommt sie die Anreisemail. Die Packlistenmail bekommt sie nicht, der
   Packlistenlink steckt in der Anreisemail.
7. **Given** der Campstart ist erreicht, **When** der Lauf startet, **Then** gehen keine Anreisemails
   mehr raus.

---

### User Story 3 · Vorfreude acht Wochen vorher (Priority: P2)

Acht Wochen vor Campstart bekommen alle Angemeldeten eine kurze Mail mit dem Motto des Jahres, zwei
oder drei Highlights aus dem Programm und einem Gruß vom Team.

**Why this priority**: Baut Vorfreude auf, ist für den Ablauf des Camps aber nicht nötig.

**Independent Test**: Highlights und Gruß im Camp eintragen, Vorfreudemail aktivieren, Campstart auf
in 56 Tagen setzen, Lauf auslösen. Die Mail zeigt Motto, Highlights und Gruß.

**Acceptance Scenarios**:

1. **Given** die Vorfreudemail ist aktiviert und der Campstart ist in 56 Tagen oder weniger, **When**
   der Lauf startet, **Then** bekommt jede aktive Anmeldung mit Mailadresse die Mail mit Motto,
   Highlights und Gruß des Teams.
2. **Given** Highlights oder Gruß sind nicht eingetragen, **When** die Mail erstellt wird, **Then**
   fehlt nur der jeweilige Abschnitt.
3. **Given** die Packlistenmail ist für eine Anmeldung schon fällig, **When** der Lauf startet,
   **Then** wird die Vorfreudemail für diese Anmeldung übersprungen und nie mehr verschickt.
4. **Given** die Mail wird erstellt, **When** sie verschickt wird, **Then** enthält sie keinen
   Aufruf, Freunde einzuladen, und nennt nie versteckte Preise oder Einladungslinks.

---

### User Story 4 · Danke und Rückblick (Priority: P2)

Fünf Tage nach Campende bekommen alle Teilnehmenden ein Dankeschön mit einem Link zu den Fotos,
einem Link für Feedback und, falls schon bekannt, dem Termin fürs nächste Jahr.

**Why this priority**: Schöner Abschluss und Grundlage fürs nächste Jahr, aber ohne Einfluss auf das
laufende Camp.

**Independent Test**: Fotolink und Feedbacklink im Camp eintragen, Dankmail aktivieren, Campende auf
vor 5 Tagen setzen, Lauf auslösen. Die Mail enthält beide Links. Ohne eingetragenen Termin fürs
nächste Jahr fehlt dieser Satz.

**Acceptance Scenarios**:

1. **Given** die Dankmail ist aktiviert und das Campende liegt 5 bis 30 Tage zurück, **When** der Lauf
   startet, **Then** bekommt jede aktive Anmeldung mit Mailadresse die Dankmail.
2. **Given** Fotolink, Feedbacklink oder Termin fürs nächste Jahr fehlen, **When** die Mail erstellt
   wird, **Then** fehlt nur der jeweilige Abschnitt.
3. **Given** das Campende liegt mehr als 30 Tage zurück, **When** der Lauf startet, **Then** geht
   keine Dankmail mehr raus.
4. **Given** das aktuelle Camp wurde schon auf das nächste Jahr umgestellt, **When** der Lauf startet,
   **Then** bekommen die Anmeldungen des vorherigen Camps trotzdem ihre Dankmail, solange das Fenster
   von 30 Tagen nicht vorbei ist.

---

### User Story 5 · Inhalte pflegen und Vorschau ansehen (Priority: P2)

Eine Admin trägt beim Camp die Angaben für die Infomails ein: Highlights, Gruß des Teams,
Anreiseadresse, Ankunfts und Abholzeit, Ablauf des ersten Tages, Notfallnummer, Handyregeln,
Fotolink, Feedbacklink und den Termin fürs nächste Jahr. Pro Infomail schaltet sie den Versand für
dieses Camp ein oder aus. Im Tab „Mail“ sieht sie die vier neuen Mails mit Vorschau, so wie sie mit
den echten Angaben des aktuellen Camps aussehen, und für jede Infomail, an wie viele Anmeldungen sie
schon verschickt wurde und an wie viele noch nicht.

**Why this priority**: Ohne gepflegte Angaben enthalten die Mails nur Grundinfos. Die Vorschau
verhindert, dass falsche Zeiten an alle gehen.

**Independent Test**: Als Admin mit Berechtigung für Camps die Angaben eintragen und speichern, dann
im Tab „Mail“ die Anreisemail auswählen: die Vorschau zeigt genau die eingetragene Adresse und Zeit.
Die Zähler stimmen mit den verschickten Mails überein.

**Acceptance Scenarios**:

1. **Given** ein Admin mit Berechtigung für Camps, **When** er die Angaben für die Infomails speichert,
   **Then** gelten sie für alle Infomails dieses Camps, die ab dann verschickt werden.
2. **Given** ein Admin ohne Berechtigung für Camps, **When** er die Angaben ändern will, **Then** wird
   das abgelehnt.
3. **Given** der Tab „Mail“, **When** ein Admin ihn öffnet, **Then** stehen die vier Infomails mit je
   einem Satz zum Versandzeitpunkt in der Liste, zusätzlich zu den Mails aus Feature 007.
4. **Given** eine Infomail ist ausgewählt, **When** die Vorschau erscheint, **Then** zeigt sie
   Betreff und Inhalt mit Beispielperson und den echten Angaben des aktuellen Camps, und daneben,
   ob die Mail für das Camp aktiviert ist und wie viele Anmeldungen sie bekommen haben und noch
   bekommen.
5. **Given** eine Angabe fehlt, **When** die Vorschau erscheint, **Then** fehlt der Abschnitt wie in
   der echten Mail, und ein Hinweis nennt die fehlende Angabe.
6. **Given** die Vorschau, **When** der Admin darin klickt, **Then** wird keine Mail und keine Zahlung
   ausgelöst.

---

### Edge Cases

- **Tageskontingent reicht nicht**: Bestätigungen und Zahlungserinnerungen gehen vor. Infomails
  nutzen nur, was vom Tageskontingent übrig bleibt, und gehen dann am nächsten Tag weiter. Ältere
  Anmeldungen kommen zuerst dran. Bei einigen Hundert Anmeldungen dauert eine Infomail so mehrere
  Tage; die Zähler im Tab „Mail“ zeigen den Fortschritt.
- **Zahlungserinnerung am selben Tag**: Bekommt eine Anmeldung an einem Tag eine
  Zahlungserinnerung, bekommt sie an diesem Tag keine Infomail. Die Infomail folgt frühestens am
  nächsten Tag.
- **Anmeldetag**: Am Tag der Anmeldung bekommt eine Person nur die Bestätigung, auch wenn eine
  Infomail schon fällig wäre.
- **Höchstens eine Infomail pro Tag** und Anmeldung, auch wenn mehrere fällig sind. Dann gilt nur die
  späteste fällige Stufe, die früheren werden übersprungen.
- **Späte Anmeldung**: Eine Stufe gilt als verpasst, sobald die nächste Stufe fällig ist. Verpasste
  Stufen werden nie nachgeschickt. Wer sich 7 Wochen vor dem Camp anmeldet, bekommt die Vorfreudemail
  am nächsten Tag; wer sich 2 Wochen vorher anmeldet, bekommt erst die Anreisemail.
- **Campdaten nachträglich verschoben**: die Zeitpunkte gelten immer zum aktuellen Start und Ende.
  Schon verschickte Infomails werden nicht wiederholt.
- **Campstart oder Campende fehlt**: dann gehen keine Infomails raus, die davon abhängen. Die Vorschau
  weist darauf hin.
- **Anmeldung ohne Mailadresse**: bekommt nichts, sie zählt in der Vorschau als „ohne Mailadresse“.
- **Versand schlägt fehl**: der Fehler steht im Protokoll; die Mail gilt erst nach erfolgreichem
  Versand als verschickt und wird beim nächsten Lauf erneut versucht, solange ihr Fenster offen ist.
- **Infomail wird erst spät aktiviert**: aktiviert eine Admin die Packlistenmail erst 10 Tage vor
  Campstart, geht sie noch an alle, die sie nicht haben, solange die Anreisemail noch nicht fällig
  ist.
- **Stornierung nach Versand**: bereits verschickte Mails bleiben verschickt, weitere Infomails gehen
  nicht mehr an diese Anmeldung.
- **Lauf fällt aus**: der nächste Lauf holt fällige Infomails nach, ohne doppelt zu senden.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Das System MUST vier Infomails mit fest definierten deutschen Texten anbieten:
  Vorfreude, Packliste, Anreise und Danke. Es gibt keinen Editor für die Texte.
- **FR-002**: Das System MUST für jede Infomail einen Fälligkeitstag aus den Campdaten berechnen:
  Vorfreude 56 Tage vor Campstart, Packliste 21 Tage vor Campstart, Anreise 5 Tage vor Campstart,
  Danke 5 Tage nach Campende. Alle Tage gelten nach deutscher Zeit.
- **FR-003**: Das System MUST Infomails nur an aktive Anmeldungen mit Mailadresse verschicken. Stornierte
  und gelöschte Anmeldungen bekommen keine Infomail.
- **FR-004**: Das System MUST jede Infomail höchstens einmal pro Anmeldung verschicken, auch bei
  wiederholten oder parallelen Läufen.
- **FR-005**: Das System MUST eine Stufe für eine Anmeldung überspringen, sobald die nächste Stufe für
  sie fällig ist, und übersprungene Stufen nie nachsenden.
- **FR-006**: Das System MUST Anreisemails nur bis zum Tag vor Campstart verschicken und Dankmails nur
  bis 30 Tage nach Campende.
- **FR-007**: Das System MUST am Tag der Anmeldung und an Tagen mit einer Zahlungserinnerung für
  dieselbe Anmeldung keine Infomail verschicken und pro Anmeldung höchstens eine Infomail pro Tag
  senden.
- **FR-008**: Das System MUST Infomails für das aktuelle Camp verschicken und Dankmails zusätzlich für
  das Camp, dessen Ende höchstens 30 Tage zurückliegt, auch wenn es nicht mehr das aktuelle ist.
- **FR-009**: Das System MUST das Tageskontingent des Mailanbieters einhalten, Bestätigungen und
  Zahlungserinnerungen Vorrang geben und nicht verschickte Infomails an den Folgetagen fortsetzen,
  ältere Anmeldungen zuerst.
- **FR-010**: Die Anreisemail MUST bei einem offenen Betrag größer als 0 € einen freundlichen Hinweis mit
  Betrag und Link zur Bezahlseite der Anmeldung enthalten und sonst keinen Zahlungshinweis.
- **FR-011**: Die Anreisemail MUST immer einen Link zur Packliste enthalten.
- **FR-012**: Keine Infomail MUST einen Aufruf zum Weitersagen an Freunde enthalten, und keine nennt
  versteckte Preise oder Einladungslinks.
- **FR-013**: Admins mit Berechtigung für Camps MUST pro Camp diese Angaben pflegen können: Highlights,
  Gruß des Teams, Anreiseadresse, Ankunftszeit, Abholzeit, Ablauf des ersten Tages, Notfallnummer,
  Handyregeln, Fotolink, Feedbacklink und Termin fürs nächste Jahr. Das Motto kommt aus dem
  bestehenden Untertitel des Camps.
- **FR-014**: Admins mit Berechtigung für Camps MUST jede Infomail pro Camp aktivieren und deaktivieren
  können. Neue Camps starten mit allen Infomails deaktiviert.
- **FR-015**: Das System MUST verhindern, dass die Anreisemail aktiviert wird, solange Anreiseadresse,
  Ankunftszeit oder Notfallnummer fehlen, und die fehlenden Angaben auf Deutsch nennen.
- **FR-016**: Fehlt eine optionale Angabe, MUST der zugehörige Abschnitt in Mail und Vorschau fehlen,
  ohne leere Überschriften oder Platzhalter.
- **FR-017**: Der Tab „Mail“ MUST die vier Infomails mit Betreff, Versandzeitpunkt, Vorschau mit echten
  Campangaben, Aktivierungsstatus und den Zählern „verschickt“, „ausstehend“ und „ohne Mailadresse“
  für das aktuelle Camp zeigen.
- **FR-018**: Das System MUST jeden Versand und jeden Fehler einer Infomail protokollieren, wie bei den
  Mails aus Feature 007.
- **FR-019**: Alle Infomails MUST auf Deutsch sein, eine Textfassung haben und den Antwortweg an das Team
  wie die bestehenden Mails nutzen.

### Key Entities

- **Campinfos für Mails**: pro Camp die gepflegten Angaben aus FR-013 und je Infomail ein Schalter
  aktiviert oder deaktiviert.
- **Infomail Versand**: pro Anmeldung und Infomail höchstens ein erfolgreicher Versand mit Zeitpunkt und
  Status, im selben Versandprotokoll wie Bestätigungen und Zahlungserinnerungen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Jede aktive Anmeldung mit Mailadresse, die vor dem Fälligkeitstag der Packlistenmail
  eingegangen ist, bekommt bei bis zu 200 Anmeldungen ihre Packlistenmail spätestens 4 Tage nach dem
  Fälligkeitstag.
- **SC-002**: Jede aktive Anmeldung mit Mailadresse, die mindestens 2 Tage vor Campstart eingegangen
  ist, hat vor Campstart eine Anreisemail bekommen, sofern die Anreisemail aktiviert war.
- **SC-003**: Keine Anmeldung bekommt dieselbe Infomail zweimal, und keine stornierte oder gelöschte
  Anmeldung bekommt eine Infomail.
- **SC-004**: An keinem Tag übersteigt die Gesamtzahl verschickter Mails das Tageskontingent des
  Mailanbieters.
- **SC-005**: Eine Admin kann alle Angaben für die Infomails eines Camps in unter 10 Minuten eintragen
  und jede Infomail vor dem Versand in der Vorschau prüfen.
- **SC-006**: Rückfragen zu Packliste und Anreisezeit an die Leitung gehen im ersten Jahr spürbar zurück
  (Einschätzung der Leitung nach dem Camp).

## Assumptions

- „Aktive Anmeldung“ heißt: nicht storniert und nicht gelöscht, unabhängig vom Zahlungsstatus.
  Eine echte Anwesenheit beim Camp wird nicht erfasst; die Dankmail geht an alle aktiven Anmeldungen.
- Der bestehende tägliche Lauf am Morgen verschickt auch die Infomails. Ein eigener Zeitplan ist nicht
  nötig.
- Das Tageskontingent beträgt 100 Mails. Für Bestätigungen am selben Tag bleibt ein kleiner Puffer
  frei; die genaue Aufteilung legt der Plan fest.
- Die wichtigsten Packpunkte in der Packlistenmail kommen aus der bestehenden Packliste, nicht aus
  einer eigenen Eingabe.
- Alle Infomails sind pro Camp zunächst deaktiviert, damit nichts ungeprüft rausgeht. Das Team schaltet
  jede Mail ein, sobald die Angaben stimmen.
- Eine Abmeldung von Infomails gibt es nicht, weil die Mails zur Anmeldung gehören. Wer keine Mails
  möchte, meldet sich beim Team.
- Werbemails an Interessierte, eine Einwilligungsliste, ein Texteditor und ein Testversand sind nicht
  Teil dieses Features.
