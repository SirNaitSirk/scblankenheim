# Feature Specification: Schulbefreiung

**Feature Branch**: `020-school-release`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Das Summercamp fällt auf einen Brückentag. Wer an diesem Tag Schule hat, bekommt von uns eine Befreiung als PDF. Bisher lief das per Mailverkehr: gebraucht wurden Name und Adresse der angemeldeten Person sowie Name der Lehrkraft und Name und Adresse der Schule."

**Kontext**: Jedes Jahr schreiben Teilnehmende einzeln eine Mail, das Team fragt die fehlenden
Angaben nach, schreibt den Brief von Hand und schickt eine PDF zurück. Das kostet pro Person
mehrere Mails. Seit Feature 017 hat jede Anmeldung eine private Teilnehmerseite, über die das ohne
Team ablaufen kann. Die Sorge: Viele übersehen den Link in der Mail und schreiben trotzdem. Deshalb
gibt es zusätzlich einen Einstieg auf der Landingpage.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-29 getroffen)**:

- Die Befreiung entsteht automatisch und sofort, ohne Freigabe durch das Team.
- Jede aktive Anmeldung darf sie anfordern, sobald sie ganz oder teilweise bezahlt ist oder nichts
  zu zahlen hat. Noch unbezahlte Anmeldungen sehen statt des Formulars einen Hinweis „Nach der
  Zahlung verfügbar“ mit dem Zahlknopf. Stornierte nicht. (Geändert am 2026-10-30, vorher: auch
  ohne Zahlung.)
- Der Brief nennt nur die angemeldete Person, keine Erziehungsberechtigten.
- Der Brief trägt das Bild einer Unterschrift. Ohne hinterlegtes Bild lässt sich die Befreiung für
  ein Camp nicht einschalten.
- Die PDF geht nur an die Mailadresse der Anmeldung, nie direkt an Schule oder Lehrkraft.
- Auf der Landingpage gibt es einen Abschnitt Schulbefreiung, über den man sich den Link zur
  eigenen Teilnehmerseite per Mail schicken lässt. Dieser Mechanismus „Link zu meiner Anmeldung
  anfordern“ wird allgemein gebaut; die Befreiung ist der erste Anwendungsfall.
- Der Brieftext ist fest vorgegeben, es gibt keinen Editor.

**Voraussetzung für die Planung**: AGENTS.md Abschnitt 4 und 5 werden vor der Umsetzung ergänzt
(Verfassung, Prinzip III).

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Befreiung auf der Teilnehmerseite anfordern (Priority: P1)

Ein Schüler öffnet seine Teilnehmerseite und sieht den Abschnitt „Schulbefreiung“. Er trägt Name
seiner Klassenlehrerin, Name und Adresse der Schule und seine Klasse ein. Sein Name und seine
Adresse sind schon aus der Anmeldung vorausgefüllt. Er sendet ab, lädt die PDF direkt herunter und
findet sie kurz danach zusätzlich als Anhang in seinem Postfach. Er druckt sie aus und gibt sie in
der Schule ab.

**Why this priority**: Das ersetzt den ganzen bisherigen Mailverkehr.

**Independent Test**: Für ein Camp mit eingeschalteter Befreiung eine Teilnehmerseite öffnen,
Formular ausfüllen und absenden. Die PDF lässt sich herunterladen, eine Mail mit derselben PDF als
Anhang kommt an der Mailadresse der Anmeldung an.

**Acceptance Scenarios**:

1. **Given** eine aktive Anmeldung in einem Camp mit eingeschalteter Befreiung, **When** die
   Person die Teilnehmerseite öffnet, **Then** sieht sie den Abschnitt „Schulbefreiung“ mit kurzer
   Erklärung, den betroffenen Tagen und dem Formular.
2. **Given** das Formular, **When** es angezeigt wird, **Then** sind Vor und Nachname aus der
   Anmeldung übernommen und die Adresse der Person ist vorausgefüllt, sofern die Anmeldung eine
   Adresse enthält; sonst ist das Adressfeld leer und Pflicht.
3. **Given** alle Pflichtangaben (Name der Lehrkraft, Name der Schule, Adresse der Schule, Adresse
   der Person), **When** die Person absendet, **Then** werden die Angaben gespeichert, die PDF steht
   sofort zum Herunterladen bereit und eine Mail mit der PDF als Anhang geht an die Mailadresse der
   Anmeldung.
4. **Given** eine fehlende Pflichtangabe, **When** die Person absendet, **Then** wird nichts
   gespeichert und das Feld zeigt einen Hinweis.
5. **Given** die Person hat schon eine Befreiung angefordert, **When** sie die Seite erneut öffnet,
   **Then** sieht sie ihre Angaben, kann die PDF erneut herunterladen und die Angaben ändern; nach
   einer Änderung entsteht die PDF mit den neuen Angaben.
6. **Given** das Tageskontingent für Mails ist erreicht oder der Versand schlägt fehl, **When** die
   Person absendet, **Then** werden die Angaben trotzdem gespeichert, der Download funktioniert und
   die Seite weist darauf hin, dass die Mail nicht verschickt werden konnte.
7. **Given** eine stornierte Anmeldung oder ein Camp ohne eingeschaltete Befreiung, **When** die
   Teilnehmerseite angezeigt wird, **Then** gibt es keinen Abschnitt „Schulbefreiung“ und keinen
   Abruf der PDF.
8. **Given** eine aktive, noch unbezahlte Anmeldung (nichts gezahlt, Zahlung offen oder in
   Bearbeitung) in einem Camp mit eingeschalteter Befreiung, **When** die Teilnehmerseite angezeigt
   wird, **Then** zeigt der Abschnitt „Schulbefreiung“ die betroffenen Tage und den Hinweis, dass
   die Befreiung nach der Zahlung verfügbar ist, mit dem Zahlknopf, aber kein Formular und keinen
   Download; auch Absenden und Abruf der PDF sind serverseitig gesperrt.
9. **Given** eine Anmeldung ist teilweise bezahlt, ganz bezahlt oder hat nichts zu zahlen, **When**
   die Teilnehmerseite angezeigt wird, **Then** steht das Formular wie in Szenario 1 bereit.

---

### User Story 2 · Link zur eigenen Anmeldung über die Landingpage (Priority: P1)

Eine Mutter findet die Mail mit dem Link zur Teilnehmerseite nicht mehr. Auf der Landingpage sieht
sie den Abschnitt „Schulbefreiung“, trägt die Mailadresse der Anmeldung ein und tippt auf „Link zur
Befreiung senden“. Die Seite sagt, dass eine Mail unterwegs ist, falls eine Anmeldung dazu
existiert. In der Mail führt ein Link direkt zum Abschnitt Schulbefreiung der Teilnehmerseite.

**Why this priority**: Ohne diesen Einstieg schreiben viele trotzdem eine Mail ans Team, und der
Nutzen von Story 1 geht verloren.

**Independent Test**: Auf der Landingpage eine Mailadresse mit aktiver Anmeldung eintragen. Die
Mail kommt an und ihr Link öffnet die Teilnehmerseite am Abschnitt Schulbefreiung. Mit einer
unbekannten Adresse zeigt die Seite dieselbe Antwort, und es geht keine Mail raus.

**Acceptance Scenarios**:

1. **Given** die Befreiung ist für das aktuelle Camp eingeschaltet, **When** jemand die
   Landingpage öffnet, **Then** gibt es einen Abschnitt „Schulbefreiung“ mit Erklärung, einem Feld
   für die Mailadresse und dem Button „Link zur Befreiung senden“.
2. **Given** die Befreiung ist für das aktuelle Camp ausgeschaltet, **When** jemand die
   Landingpage öffnet, **Then** gibt es diesen Abschnitt nicht.
3. **Given** eine Mailadresse, zu der im aktuellen Camp eine aktive Anmeldung existiert, **When**
   die Person absendet, **Then** geht an diese Adresse eine Mail mit dem Link zur Teilnehmerseite,
   der direkt beim Abschnitt Schulbefreiung landet.
4. **Given** mehrere aktive Anmeldungen im aktuellen Camp mit derselben Mailadresse, **When** die
   Person absendet, **Then** wird jede Anmeldung einzeln behandelt: Pro Anmeldung geht eine eigene
   Mail mit ihrem Link und dem Namen der angemeldeten Person raus. Eine gemeinsame Behandlung von
   Geschwistern gibt es in diesem Jahr nicht.
5. **Given** eine unbekannte Adresse oder nur stornierte Anmeldungen, **When** die Person absendet,
   **Then** zeigt die Seite genau dieselbe Antwort wie bei einer bekannten Adresse und es geht keine
   Mail raus.
6. **Given** viele Anfragen in kurzer Zeit von derselben Quelle oder für dieselbe Adresse, **When**
   die Grenze erreicht ist, **Then** wird keine weitere Mail verschickt und die Seite bittet, es
   später erneut zu versuchen.

---

### User Story 3 · Befreiung pro Camp einrichten (Priority: P1)

Ein Admin richtet für das neue Camp die Befreiung ein: Er trägt den Brückentag ein, Name und
Funktion der unterzeichnenden Person, lädt ein Bild der Unterschrift hoch und schaltet die
Befreiung ein. Über eine Vorschau prüft er, wie der Brief aussieht.

**Why this priority**: Ohne Einstellungen kann kein Brief entstehen.

**Independent Test**: In den Mail Einstellungen eines Camps die Befreiung einrichten. Ohne Bild ist
der Schalter gesperrt, mit Bild lässt er sich einschalten. Die Vorschau zeigt den Brief mit
Beispieldaten.

**Acceptance Scenarios**:

1. **Given** ein Admin mit Berechtigung für Camps, **When** er die Einstellungen eines Camps
   öffnet, **Then** sieht er den Bereich „Schulbefreiung“ mit Schalter, betroffenen Tagen, Name und
   Funktion der unterzeichnenden Person und Upload für das Unterschriftsbild.
2. **Given** kein Unterschriftsbild ist hinterlegt, **When** der Admin einschalten will, **Then**
   ist der Schalter gesperrt und ein Hinweis nennt den Grund.
3. **Given** ein hochgeladenes Bild, **When** der Admin speichert, **Then** ist das Bild im Bereich
   sichtbar und lässt sich ersetzen oder entfernen. Wird es entfernt, schaltet sich die Befreiung
   für das Camp aus.
4. **Given** fehlende betroffene Tage oder fehlender Name der unterzeichnenden Person, **When** der
   Admin einschalten will, **Then** ist der Schalter ebenfalls gesperrt.
5. **Given** die Einstellungen sind vollständig, **When** der Admin die Vorschau öffnet, **Then**
   sieht er den Brief als PDF mit Beispieldaten, Unterschrift und den eingetragenen Tagen.
6. **Given** ein Admin ohne Berechtigung für Camps, **When** er die Einstellungen ändern will,
   **Then** wird das abgelehnt.

---

### User Story 4 · Befreiung im Anmeldedialog verwalten (Priority: P2)

Eine Mutter ruft an, weil sie nicht weiß, wie das geht. Ein Admin öffnet die Anmeldung ihres
Sohnes, trägt im Bereich „Schulbefreiung“ Lehrkraft und Schule ein und klickt auf „Senden“. Bei
einer anderen Anmeldung korrigiert er einen Tippfehler im Schulnamen und schickt die PDF neu.

**Why this priority**: Der alte Weg über Telefon oder Mail bleibt möglich, ohne dass jemand den
Brief von Hand schreibt.

**Independent Test**: Im Anmeldedialog Schuldaten eintragen, PDF herunterladen und senden. Der
Versand erscheint in der Mailhistorie der Anmeldung.

**Acceptance Scenarios**:

1. **Given** eine aktive Anmeldung in einem Camp mit eingeschalteter Befreiung, **When** ein Admin
   den Anmeldedialog öffnet, **Then** sieht er den Bereich „Schulbefreiung“ mit den gespeicherten
   Angaben oder einem leeren Formular.
2. **Given** ein Admin mit Bearbeitungsrecht für Anmeldungen, **When** er Angaben einträgt oder
   ändert und speichert, **Then** sind sie gespeichert und auf der Teilnehmerseite sichtbar.
3. **Given** gespeicherte Angaben, **When** der Admin „PDF herunterladen“ wählt, **Then** bekommt
   er dieselbe PDF, die die Person bekäme.
4. **Given** gespeicherte Angaben, **When** der Admin „Per Mail senden“ wählt, **Then** geht die
   Mail mit Anhang an die Mailadresse der Anmeldung und erscheint in der Mailhistorie.
5. **Given** ein Admin ohne Bearbeitungsrecht für Anmeldungen, **When** er den Dialog öffnet,
   **Then** sieht er die Angaben, kann sie aber weder ändern noch senden.

---

### User Story 5 · Hinweis in Bestätigungsmail und Infomail (Priority: P2)

Wer sich anmeldet, liest schon in der Bestätigungsmail einen deutlich abgesetzten Hinweis auf die
Befreiung mit einem Button, der direkt zum Abschnitt auf der Teilnehmerseite führt. Acht Wochen vor
dem Camp erinnert die Teaser Infomail noch einmal daran.

**Why this priority**: Je früher und direkter der Hinweis, desto weniger Mails ans Team.

**Independent Test**: In der Mail Vorschau zeigen Bestätigungsmail und Teaser Infomail den
Hinweis, wenn die Befreiung eingeschaltet ist, und keinen Hinweis, wenn sie aus ist.

**Acceptance Scenarios**:

1. **Given** die Befreiung ist für das Camp eingeschaltet, **When** eine Bestätigungsmail (bezahlt
   oder kostenlos) erzeugt wird, **Then** enthält sie einen abgesetzten Hinweis mit den betroffenen
   Tagen und einem Link direkt zum Abschnitt Schulbefreiung der Teilnehmerseite. Ist noch nichts
   bezahlt, sagt der Hinweis, dass die Befreiung nach der Zahlung bereitsteht.
2. **Given** die Befreiung ist eingeschaltet, **When** die Teaser Infomail erzeugt wird, **Then**
   enthält sie denselben Hinweis.
3. **Given** die Befreiung ist ausgeschaltet, **When** diese Mails erzeugt werden, **Then** fehlt
   der Hinweis.

---

### Edge Cases

- Die Befreiung wird für ein Camp ausgeschaltet, nachdem schon Befreiungen angefordert wurden: Die
  gespeicherten Angaben bleiben, aber Teilnehmerseite, Landingpage und Mails zeigen nichts mehr und
  die PDF lässt sich nicht mehr abrufen. Admins sehen die Angaben weiter im Anmeldedialog.
- Betroffene Tage oder unterzeichnende Person ändern sich: Jeder spätere Abruf erzeugt die PDF mit
  den neuen Werten. Bereits verschickte PDFs bleiben unverändert.
- Eine Anmeldung wird storniert: Kein Abschnitt und kein Abruf mehr; die Angaben bleiben, bis die
  Anmeldung gelöscht wird.
- Eine Anmeldung wird gelöscht: Die Schuldaten werden mit ihr gelöscht.
- Sehr lange Namen oder Adressen und Sonderzeichen wie Umlaute oder ß erscheinen vollständig und
  korrekt in der PDF; Eingaben sind in der Länge begrenzt.
- Mehrfaches schnelles Absenden auf der Teilnehmerseite erzeugt nur eine Mail.
- Die Mailadresse auf der Landingpage wird mit anderer Groß und Kleinschreibung oder Leerzeichen
  eingegeben: Sie wird trotzdem erkannt.
- Die Anmeldung hat keine Mailadresse: Download funktioniert, eine Mail gibt es nicht.
- Eine Anmeldung hat schon Angaben gespeichert (etwa vom Team eingetragen), ist aber noch
  unbezahlt: Die Person sieht den Hinweis „Nach der Zahlung verfügbar“, die PDF ist für sie nicht
  abrufbar; sobald eine Zahlung eingeht, erscheinen Angaben und Download ohne neues Absenden.
- Eine Zahlung wird erstattet: Die Befreiung ist für die Person nicht mehr verfügbar.
- Mehrere Anmeldungen teilen eine Mailadresse und nur ein Teil ist bezahlt: Jede bekommt ihre
  Linkmail; ob die Befreiung bereitsteht, entscheidet die jeweilige Anmeldung.
- Das aktuelle Camp liegt in der Vergangenheit: Der Abschnitt auf der Landingpage erscheint nur,
  solange das Camp noch nicht vorbei ist.

## Requirements *(mandatory)*

### Functional Requirements

**Befreiung und PDF**

- **FR-001**: Das System MUSS für eine aktive Anmeldung in einem Camp mit eingeschalteter
  Befreiung Angaben zur Befreiung speichern: Name der Lehrkraft, Name der Schule, Adresse der
  Schule, Adresse der angemeldeten Person und optional die Klasse. Höchstens ein Satz Angaben pro
  Anmeldung; neues Absenden überschreibt ihn.
- **FR-002**: Das System MUSS aus diesen Angaben und den Camp Einstellungen ein Schreiben als PDF
  erzeugen mit: Absender (Camp), Empfänger (Lehrkraft und Schule), Datum, Betreff, fest
  vorgegebenem Text mit Name der angemeldeten Person, Campname, Campzeitraum und den betroffenen
  Tagen, Bitte um Freistellung, Name und Funktion der unterzeichnenden Person und Unterschriftsbild.
- **FR-003**: Die PDF DARF nur die angemeldete Person nennen, keine Erziehungsberechtigten, keine
  Preise, keine Zahlungsangaben und keine weiteren Antworten aus der Anmeldung.
- **FR-004**: Die PDF MUSS bei jedem Abruf aus den aktuell gespeicherten Daten neu entstehen und
  wird nicht dauerhaft abgelegt.
- **FR-005**: Die PDF DARF nur über die Teilnehmerseite der Anmeldung (geheimer Link) und über den
  geschützten Admin Bereich abrufbar sein.

**Teilnehmerseite**

- **FR-006**: Die Teilnehmerseite MUSS bei aktiver Anmeldung und eingeschalteter Befreiung einen
  Abschnitt „Schulbefreiung“ zeigen, der über einen festen Sprunganker direkt erreichbar ist.
- **FR-006a**: Formular, Absenden und Abruf der PDF auf der Teilnehmerseite MÜSSEN nur verfügbar
  sein, wenn die Anmeldung ganz oder teilweise bezahlt ist oder nichts zu zahlen hat. Sonst zeigt
  der Abschnitt den Hinweis „Nach der Zahlung verfügbar“ mit dem Zahlknopf. Erstattete Anmeldungen
  bekommen keine Befreiung. Diese Regel gilt nur für die Person selbst; Admins können im
  Anmeldedialog unabhängig vom Zahlstand eintragen, herunterladen und senden.
- **FR-007**: Name der Person MUSS aus der Anmeldung übernommen und nicht editierbar sein; die
  Adresse MUSS vorausgefüllt sein, wenn die Anmeldung eine enthält, und bleibt änderbar.
- **FR-008**: Nach erfolgreichem Absenden MUSS die PDF sofort herunterladbar sein und eine Mail mit
  der PDF als Anhang an die Mailadresse der Anmeldung gehen.
- **FR-009**: Scheitert der Mailversand oder ist das Tageskontingent erreicht, MÜSSEN Angaben und
  Download trotzdem funktionieren und die Seite MUSS darauf hinweisen.
- **FR-010**: Absenden MUSS gegen Missbrauch und Doppelklick gedrosselt sein.

**Link zur eigenen Anmeldung anfordern**

- **FR-011**: Das System MUSS eine allgemeine Möglichkeit bieten, sich anhand der Mailadresse den
  Link zur eigenen Teilnehmerseite per Mail schicken zu lassen, mit einem optionalen Ziel innerhalb
  der Seite (hier: Abschnitt Schulbefreiung).
- **FR-012**: Berücksichtigt werden nur aktive Anmeldungen des aktuellen Camps, unabhängig vom
  Zahlstand. Jede Anmeldung wird einzeln behandelt: Mehrere Treffer ergeben je eine eigene Mail pro
  Anmeldung, keine Sammelmail. Bei noch unbezahlten Anmeldungen sagt die Mail, dass die Befreiung
  nach der Zahlung bereitsteht.
- **FR-013**: Die Antwort auf der Seite MUSS unabhängig davon gleich sein, ob eine Anmeldung
  existiert, damit niemand prüfen kann, wer angemeldet ist.
- **FR-014**: Anfragen MÜSSEN pro Quelle und pro Mailadresse gedrosselt sein.

**Landingpage**

- **FR-015**: Die Landingpage MUSS einen Abschnitt „Schulbefreiung“ mit Erklärung, betroffenen
  Tagen, Mailfeld und Button „Link zur Befreiung senden“ zeigen, solange die Befreiung für das
  aktuelle Camp eingeschaltet ist und das Camp noch nicht vorbei ist; sonst nicht.

**Einstellungen pro Camp**

- **FR-016**: Admins mit Berechtigung für Camps MÜSSEN pro Camp festlegen können: Befreiung an oder
  aus, betroffene Tage, Name und Funktion der unterzeichnenden Person, Unterschriftsbild.
- **FR-017**: Einschalten MUSS gesperrt sein, solange Unterschriftsbild, betroffene Tage oder Name
  der unterzeichnenden Person fehlen. Wird das Bild entfernt, MUSS die Befreiung ausgehen.
- **FR-018**: Das Unterschriftsbild DARF nicht öffentlich abrufbar sein; es erscheint nur in der
  erzeugten PDF und in der Admin Ansicht.
- **FR-019**: Es MUSS eine Vorschau des Briefs mit Beispieldaten geben.

**Admin Bereich**

- **FR-020**: Der Anmeldedialog MUSS einen Bereich „Schulbefreiung“ zeigen, in dem Admins die
  Angaben sehen; Admins mit Bearbeitungsrecht für Anmeldungen MÜSSEN sie eintragen, ändern, die
  PDF herunterladen und per Mail senden können.
- **FR-021**: Jeder Versand der Befreiung und jede Linkmail MUSS in der Mailhistorie der Anmeldung
  erscheinen und zählt gegen das Tageskontingent.

**Mails**

- **FR-022**: Bestätigungsmail und Teaser Infomail MÜSSEN bei eingeschalteter Befreiung einen
  abgesetzten Hinweis mit den betroffenen Tagen und einem Link zum Abschnitt Schulbefreiung
  enthalten; die Mail Vorschau zeigt ihn ebenfalls. Ist die Anmeldung noch unbezahlt, nennt der
  Hinweis die Zahlung als Voraussetzung.
- **FR-023**: Die Befreiungsmail und die Linkmail sind fest vorgegebene Vorlagen und erscheinen in
  der Mail Vorschau des Admin Bereichs.

**Allgemein**

- **FR-024**: Schuldaten MÜSSEN mit der Anmeldung gelöscht werden. Mailadressen von Schulen oder
  Lehrkräften werden nicht erfasst.
- **FR-025**: Alle sichtbaren Texte, auch in PDF und Mails, MÜSSEN Deutsch sein.

### Key Entities

- **Befreiungsangaben**: gehören zu genau einer Anmeldung. Name der Lehrkraft, Name der Schule,
  Adresse der Schule, Adresse der Person, Klasse (optional), Zeitpunkt der letzten Änderung und wer
  sie vorgenommen hat (Person selbst oder Admin).
- **Befreiungseinstellungen pro Camp**: an oder aus, betroffene Tage, Name und Funktion der
  unterzeichnenden Person, Unterschriftsbild. Gehören zu den Mail Einstellungen des Camps.
- **Linkanfrage**: Mailadresse und Ziel innerhalb der Teilnehmerseite; wird nur für Drosselung und
  Mailhistorie festgehalten.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eine Person kommt von der Teilnehmerseite in unter zwei Minuten zur fertigen PDF.
- **SC-002**: Von der Landingpage bis zur geöffneten Teilnehmerseite am Abschnitt Schulbefreiung
  braucht es nur die Eingabe der Mailadresse und einen Klick in der Mail.
- **SC-003**: Im ersten Camp mit dieser Funktion sinkt die Zahl der Mails ans Team wegen
  Schulbefreiung um mindestens 80 Prozent gegenüber dem Vorjahr.
- **SC-004**: Die PDF zeigt alle Angaben vollständig und korrekt, auch mit Umlauten und langen
  Adressen, und lässt sich auf A4 ausdrucken.
- **SC-005**: Über die Landingpage lässt sich in keinem Fall erkennen, ob zu einer Mailadresse eine
  Anmeldung existiert.

## Assumptions

- Die Befreiung betrifft einen oder wenige Tage pro Camp; sie werden als Text oder Datumsliste in
  den Einstellungen gepflegt und sind für alle Anmeldungen eines Camps gleich.
- Die Adresse der angemeldeten Person steht, falls vorhanden, in den Antworten des
  Anmeldeformulars; welche Formularfelder als Adresse gelten, klärt der Plan.
- Absender im Briefkopf sind Campname und Kontaktangaben aus den bestehenden Mail Einstellungen.
- Für die Einstellungen gilt die bestehende Berechtigung für Camps, für den Anmeldedialog die
  bestehende Berechtigung für Anmeldungen.
- Der Mechanismus „Link zur Anmeldung anfordern“ bekommt in diesem Feature nur den Einstieg auf der
  Landingpage im Abschnitt Schulbefreiung; weitere Einstiege (etwa auf `/bezahlen`) sind spätere
  Erweiterungen.
- Eine Befreiung für ganze Klassen oder Gruppen gibt es nicht, nur pro Anmeldung. Auch Geschwister
  werden in diesem Jahr nicht zusammengefasst; jede Anmeldung läuft einzeln.
