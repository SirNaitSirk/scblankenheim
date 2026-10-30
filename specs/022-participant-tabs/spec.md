# Feature Specification: Tabs auf der Teilnehmerseite

**Feature Branch**: `022-participant-tabs`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Die Teilnehmerseite /meine-anmeldung/<token> ist zu lang geworden und wird in Tabs aufgeteilt. Tab Übersicht (Standard): Status, Beträge, Bezahlknopf, Camp mit Daten und Kalenderlinks, Link zum Packzettel. Tab Meine Angaben: eigene Antworten plus Kontaktformular für Nachricht oder Änderungswunsch. Tab Dokumente: Busticket und Schulbefreiung, nur sichtbar wenn mindestens eins davon für die Anmeldung angezeigt wird. Begrüßung und ein kompakter Statushinweis bleiben über den Tabs immer sichtbar. Der aktive Tab steht im URL Fragment, damit Mails direkt verlinken können. Wechsel ohne Neuladen, halb ausgefüllte Formulare bleiben erhalten. Ohne JavaScript werden alle Abschnitte untereinander gezeigt. Mobil gut bedienbar, barrierefrei. Reine Layout Änderung, keine Daten oder Serveränderung."

**Kontext**: Die Teilnehmerseite (specs/017-participant-page) ist mit jedem Feature gewachsen:
Status und Beträge, Busticket (specs/021-bus-ticket), Schulbefreiung (specs/020-school-release),
Camp mit Kalender (specs/019-calendar-file), eigene Angaben, Kontakt und Änderungswunsch
(specs/018-participant-messages) und Packzettel. Auf dem Handy sind das bis zu acht Karten
untereinander. Wer nur schnell den offenen Betrag oder das Busticket sucht, muss lange scrollen.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-30 getroffen)**:

- Drei Tabs: „Übersicht“, „Meine Angaben“, „Dokumente“.
- „Dokumente“ erscheint nur, wenn Busticket oder Schulbefreiung für die Anmeldung angezeigt werden.
- Begrüßung und ein kompakter Statushinweis stehen immer über den Tabs.
- Inhalte, Daten und Mails ändern sich nicht, nur die Anordnung auf der Seite.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Das Wichtigste sofort sehen (Priority: P1)

Eine Mutter öffnet den Link aus der Bestätigungsmail auf dem Handy. Sie sieht oben die Begrüßung,
darunter die Tabs und im Tab „Übersicht“ sofort Status, Beträge, den Bezahlknopf und die Eckdaten
des Camps. Sie muss nicht an Antworten, Formularen oder Dokumenten vorbeiscrollen.

**Why this priority**: Das ist der häufigste Grund, die Seite zu öffnen, und der Kern der Änderung.

**Independent Test**: Den Link einer aktiven, teilweise bezahlten Anmeldung ohne Fragment öffnen.
Der Tab „Übersicht“ ist aktiv und zeigt Status, Beträge, Bezahlknopf, Camp mit Kalenderlinks und
den Packzettel Link. Antworten, Kontaktformular, Busticket und Schulbefreiung sind nicht sichtbar.

**Acceptance Scenarios**:

1. **Given** eine Anmeldung, **When** die Person den Link ohne Fragment öffnet, **Then** ist der Tab
   „Übersicht“ aktiv.
2. **Given** der Tab „Übersicht“ ist aktiv, **Then** zeigt er Status, Gesamtbetrag, bezahlten und
   offenen Betrag, den Bezahlknopf oder den passenden Zahlungshinweis, Name, Zeitraum und Ort des
   Camps, die Kalenderlinks und den Link zum Packzettel.
3. **Given** eine Anmeldung ohne Kosten, **When** die Übersicht angezeigt wird, **Then** erscheinen
   wie bisher keine Beträge, nur der Hinweis.

---

### User Story 2 · Zwischen den Bereichen wechseln (Priority: P1)

Ein Vater will prüfen, ob die Allergie seines Sohnes richtig eingetragen ist. Er tippt auf
„Meine Angaben“, sieht seine Antworten und darunter das Formular für einen Änderungswunsch. Er
beginnt zu schreiben, wechselt kurz zur Übersicht, um den Campzeitraum nachzusehen, und kehrt
zurück. Sein angefangener Text steht noch da.

**Why this priority**: Ohne funktionierenden Wechsel ist die Aufteilung wertlos; verlorene Eingaben
würden Frust und Rückfragen erzeugen.

**Independent Test**: Im Tab „Meine Angaben“ Text in das Kontaktformular tippen, zu „Übersicht“
und zurück wechseln. Der Text ist unverändert, die Seite wurde nicht neu geladen.

**Acceptance Scenarios**:

1. **Given** die Seite ist offen, **When** die Person einen Tab wählt, **Then** erscheint dessen
   Inhalt ohne Neuladen der Seite und der gewählte Tab ist sichtbar als aktiv markiert.
2. **Given** angefangene Eingaben in einem Formular, **When** die Person den Tab wechselt und
   zurückkehrt, **Then** sind die Eingaben unverändert.
3. **Given** die Person sendet im Tab „Meine Angaben“ eine Nachricht ab, **When** die Antwort
   erscheint, **Then** bleibt der Tab „Meine Angaben“ aktiv und zeigt die Bestätigung oder
   Fehlermeldung.
4. **Given** die Person speichert im Tab „Dokumente“ die Schulbefreiung, **When** das Ergebnis
   erscheint, **Then** bleibt der Tab „Dokumente“ aktiv.
5. **Given** die Person hat einen Tab gewählt, **When** sie die Seite neu lädt oder die Adresse
   teilt, **Then** öffnet sich derselbe Tab.
6. **Given** die Person hat mehrmals gewechselt, **When** sie im Browser zurück geht, **Then**
   verlässt sie die Seite nicht durch jeden Tabwechsel einzeln, sondern der Verlauf bleibt
   übersichtlich (Tabwechsel ersetzen den aktuellen Verlaufseintrag).

---

### User Story 3 · Aus einer Mail direkt beim Dokument landen (Priority: P2)

Drei Tage vor der Abfahrt bekommt eine Teilnehmerin die Anreisemail mit dem Link zum Busticket.
Sie tippt darauf, der Tab „Dokumente“ öffnet sich und das Busticket ist direkt im Blick. Genauso
landet ein Vater über den Hinweis zur Schulbefreiung direkt beim Formular.

**Why this priority**: Busticket und Schulbefreiung werden fast immer aus einer Mail heraus
aufgerufen. Die Links in bereits verschickten Mails müssen weiter funktionieren.

**Independent Test**: Die Seite mit `#busticket`, `#schulbefreiung` und `#dokumente` öffnen. Jedes
Mal ist „Dokumente“ aktiv; bei den ersten beiden ist der jeweilige Abschnitt im Blick.

**Acceptance Scenarios**:

1. **Given** ein Link mit `#dokumente`, **When** er geöffnet wird, **Then** ist „Dokumente“ aktiv.
2. **Given** ein Link mit `#busticket` (bisheriger Link aus Anreisemail und Busticketmail),
   **When** er geöffnet wird, **Then** ist „Dokumente“ aktiv und das Busticket ist sichtbar im Blick.
3. **Given** ein Link mit `#schulbefreiung` (bisheriger Link aus Befreiungshinweis und
   Linkanforderung), **When** er geöffnet wird, **Then** ist „Dokumente“ aktiv und das Formular
   der Schulbefreiung ist im Blick.
4. **Given** ein Link mit `#angaben`, **When** er geöffnet wird, **Then** ist „Meine Angaben“ aktiv.
5. **Given** ein Link mit `#uebersicht` oder einem unbekannten Fragment, **When** er geöffnet wird,
   **Then** ist „Übersicht“ aktiv.

---

### User Story 4 · Offenen Betrag nie übersehen (Priority: P2)

Eine Person öffnet direkt „Dokumente“, um die Schulbefreiung auszufüllen, hat aber noch nicht
bezahlt. Über den Tabs steht ein kurzer Hinweis mit dem offenen Betrag und einem Bezahlknopf. Sie
muss nicht erst zur Übersicht wechseln, um zu sehen, dass noch etwas offen ist.

**Why this priority**: Die Zahlung ist für das Camp entscheidend. Durch Tabs darf sie nicht aus dem
Blick geraten.

**Independent Test**: Eine Anmeldung mit offenem Betrag in jedem Tab ansehen: der Hinweis mit
Betrag und Bezahlknopf steht immer über den Tabs. Eine vollständig bezahlte Anmeldung zeigt keinen
Zahlungshinweis über den Tabs.

**Acceptance Scenarios**:

1. **Given** eine aktive Anmeldung mit offenem Betrag und Bezahlmöglichkeit, **When** ein beliebiger
   Tab aktiv ist, **Then** steht über den Tabs ein kompakter Hinweis mit dem offenen Betrag und
   einem Bezahlknopf.
2. **Given** eine stornierte Anmeldung, **When** ein beliebiger Tab aktiv ist, **Then** steht über
   den Tabs ein kompakter Hinweis „storniert“ und kein Bezahlknopf.
3. **Given** eine aktive Anmeldung ohne offenen Betrag (bezahlt, kostenlos, in Bearbeitung oder
   erstattet), **When** die Seite angezeigt wird, **Then** erscheint über den Tabs kein
   Zahlungshinweis.

---

### Edge Cases

- **Keine Dokumente**: Ist weder Busticket noch Schulbefreiung für die Anmeldung sichtbar, gibt es
  nur zwei Tabs. Ein Link mit `#dokumente`, `#busticket` oder `#schulbefreiung` öffnet dann die
  Übersicht.
- **Ohne JavaScript**: Alle Abschnitte stehen wie bisher untereinander, in der Reihenfolge der Tabs.
  Bezahlknopf, Links und Formulare funktionieren.
- **Fragment ändert sich bei offener Seite** (z. B. ein Link innerhalb der Seite oder manuelle
  Eingabe): der passende Tab wird aktiv.
- **Unbekannter, erneuerter oder gelöschter Link**: unverändert der neutrale Hinweis ohne Tabs.
- **Gesperrt durch zu viele Fehlversuche**: unverändert der Hinweis ohne Tabs.
- **Unbezahlte Anmeldung bei aktiver Schulbefreiung**: der Tab „Dokumente“ erscheint wie bisher mit
  dem Hinweis samt Bezahlknopf statt des Formulars.
- **Sehr schmale Bildschirme (ab 320 Pixel)**: alle Tabnamen passen ohne waagrechtes Scrollen der
  Seite.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Teilnehmerseite MUSS ihren Inhalt in die Tabs „Übersicht“, „Meine Angaben“ und
  „Dokumente“ aufteilen, in dieser Reihenfolge.
- **FR-002**: „Übersicht“ MUSS Status mit Beträgen und Bezahlknopf oder Zahlungshinweis, das Camp
  mit Zeitraum, Ort und Kalenderlinks sowie den Packzettel Link enthalten.
- **FR-003**: „Meine Angaben“ MUSS die eigenen Antworten mit dem Hinweis zu Korrekturen und darunter
  den Bereich für Nachricht oder Änderungswunsch samt bisherigen Anliegen enthalten.
- **FR-004**: „Dokumente“ MUSS Busticket und Schulbefreiung enthalten, jeweils nur unter den
  Bedingungen, unter denen sie heute angezeigt werden. Ist keins von beiden sichtbar, MUSS der Tab
  fehlen.
- **FR-005**: Begrüßung und Einleitung MÜSSEN immer über den Tabs stehen.
- **FR-006**: Über den Tabs MUSS ein kompakter Statushinweis stehen, wenn die Anmeldung storniert ist
  (Hinweis „storniert“) oder ein Betrag offen und bezahlbar ist (offener Betrag plus Bezahlknopf).
  In allen anderen Fällen entfällt er.
- **FR-007**: Ohne Fragment MUSS „Übersicht“ aktiv sein.
- **FR-008**: Die Fragmente `#uebersicht`, `#angaben` und `#dokumente` MÜSSEN den jeweiligen Tab
  öffnen. Die bestehenden Fragmente `#busticket` und `#schulbefreiung` MÜSSEN „Dokumente“ öffnen
  und den jeweiligen Abschnitt in den Blick bringen. Unbekannte Fragmente oder Fragmente zu einem
  fehlenden Tab MÜSSEN „Übersicht“ öffnen.
- **FR-009**: Ein Tabwechsel MUSS ohne Neuladen erfolgen, das Fragment der Adresse auf den gewählten
  Tab setzen und den aktuellen Verlaufseintrag ersetzen statt neue anzulegen.
- **FR-010**: Eingaben in Formularen MÜSSEN beim Tabwechsel erhalten bleiben. Nach dem Absenden
  eines Formulars MUSS der Tab aktiv bleiben, in dem das Formular steht.
- **FR-011**: Ohne JavaScript MÜSSEN alle Abschnitte untereinander sichtbar und benutzbar sein.
- **FR-012**: Die Tabs MÜSSEN per Tastatur bedienbar sein (Pfeiltasten zwischen den Tabs, Tab Taste
  in den Inhalt) und für Screenreader als Tabliste mit zugehörigen Bereichen ausgezeichnet sein.
  Der aktive Tab MUSS auch ohne Farbe erkennbar sein.
- **FR-013**: Auf Bildschirmen ab 320 Pixel Breite MÜSSEN alle Tabs nebeneinander passen, ohne dass
  die Seite waagrecht scrollt; jeder Tab MUSS eine Trefferfläche von mindestens 44 Pixel Höhe haben.
- **FR-014**: Alle Beschriftungen MÜSSEN deutsch sein und zentral bei den übrigen Texten der
  Teilnehmerseite liegen.
- **FR-015**: Daten, Zugriffsschutz, Mails und Mailinhalte DÜRFEN sich NICHT ändern. Bereits
  verschickte Links MÜSSEN weiter zum richtigen Inhalt führen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Auf einem Handy mit 375 Pixel Breite sind Status, offener Betrag und Bezahlknopf beim
  Öffnen ohne Scrollen sichtbar.
- **SC-002**: Der längste Tab ist auf dem Handy höchstens halb so lang wie die bisherige Seite mit
  allen Abschnitten (gemessen an einer Anmeldung mit Busticket und Schulbefreiung).
- **SC-003**: Alle bestehenden Mail Links (`#busticket`, `#schulbefreiung` und der Link ohne
  Fragment) führen in 100 % der Fälle zum richtigen Tab und Abschnitt.
- **SC-004**: In keinem Testfall gehen beim Tabwechsel Formulareingaben verloren.
- **SC-005**: Die Seite ist vollständig nur mit der Tastatur bedienbar und hat in einer
  automatischen Barrierefreiheitsprüfung keine neuen Fehler.

## Assumptions

- Es gibt keine Admin Vorschau der Teilnehmerseite; die Seite wird nur unter
  `/meine-anmeldung/<token>` gezeigt. Sollte später eine Vorschau entstehen, nutzt sie dieselbe
  Darstellung.
- Mails behalten ihre Links unverändert. Die Fragmente `#busticket` und `#schulbefreiung` werden
  auf „Dokumente“ abgebildet, daher müssen keine Mailvorlagen angepasst werden.
- Der gewählte Tab wird nicht gespeichert, nur über das Fragment der Adresse transportiert.
- Der kompakte Statushinweis ersetzt nicht die Statuskarte in der Übersicht; dort bleiben alle
  Beträge vollständig.
- Die Reihenfolge innerhalb der Tabs entspricht der bisherigen Reihenfolge der Abschnitte.
- Der Umfang in AGENTS.md Abschnitt 4 (Teilnehmerseite) bleibt gültig; die Tabs werden dort in der
  Beschreibung der Teilnehmerseite ergänzt.
