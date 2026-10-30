# Feature Specification: Busticket

**Feature Branch**: `021-bus-ticket`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Das Busfeld ist pro Camp auswählbar (eine Frage aus camp_form_fields und die Antwort(en), die „fährt mit dem Bus“ bedeuten, in den Camp Einstellungen; kein festes Kernfeld). Jede Busperson mit aktiver Anmeldung bekommt einen eigenen, signierten QR Code (nicht der Link zur Teilnehmerseite), sichtbar auf der Teilnehmerseite und per Mail. Scanseite für das Team im Adminbereich (Clerk Login, Handykamera): Ergebnis grün mit Name oder rot (kein Busticket, storniert, schon eingestiegen), Scans getrennt für Hinfahrt und Rückfahrt gespeichert, Liste wer noch fehlt. Ticket kann vom Admin ungültig gemacht und neu ausgestellt werden. Ohne Apple Wallet und Google Wallet."

**Kontext**: Ein Teil der Teilnehmenden reist mit einem gemeinsamen Bus an und ab. Bisher prüft
das Team beim Einstieg von Hand mit einer ausgedruckten Liste, ob jemand wirklich für den Bus
angemeldet ist. Das ist langsam, fehleranfällig, und am Ende weiß niemand sicher, wer noch fehlt.
Ob jemand mit dem Bus fährt, steht schon heute in den Antworten des Anmeldeformulars; die Frage
dazu wird aber jedes Jahr neu angelegt und kann anders heißen.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-30 getroffen)**:

- Die Busfrage wird nicht fest einprogrammiert. Pro Camp wird in den Einstellungen ausgewählt,
  welche Frage des Anmeldeformulars und welche Antwort oder Antworten „fährt mit dem Bus“
  bedeuten.
- Jede Busperson bekommt einen eigenen QR Code. Er ist nicht der Link zur Teilnehmerseite und
  gibt keinen Zugriff auf private Daten.
- Der QR Code steht auf der Teilnehmerseite und kommt per Mail.
- Das Team scannt mit dem Handy in einem geschützten Bereich des Adminbereichs.
- Hinfahrt und Rückfahrt werden getrennt erfasst.
- Admins können ein Ticket ungültig machen und neu ausstellen.
- Keine Apple Wallet und keine Google Wallet.
- Der Zahlungsstatus sperrt kein Ticket. Beim grünen Ergebnis steht nur ein Hinweis „Zahlung
  offen“, wenn noch ein Betrag offen ist.

**Voraussetzung für die Planung**: AGENTS.md Abschnitt 4 und 5 werden vor der Umsetzung ergänzt
(Verfassung, Prinzip III).

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Bus pro Camp einrichten (Priority: P1)

Eine Admin öffnet die Einstellungen des Camps, schaltet das Busticket ein, wählt die Frage
„Anreise“ aus dem Anmeldeformular und markiert die Antwort „Mit dem Bus“. Sie sieht sofort, wie
viele aktive Anmeldungen damit als Busperson gelten.

**Why this priority**: Ohne diese Zuordnung weiß das System nicht, wer ein Ticket bekommt. Alle
anderen Stories bauen darauf auf.

**Independent Test**: Für ein Camp mit einer Auswahlfrage zur Anreise die Busfrage und Busantwort
wählen und speichern. Die angezeigte Zahl der Buspersonen stimmt mit den Antworten der aktiven
Anmeldungen überein.

**Acceptance Scenarios**:

1. **Given** ein Camp, **When** eine Admin mit Berechtigung für Camps die Einstellungen öffnet,
   **Then** gibt es einen Bereich „Bus“ mit einem Schalter, einer Auswahl der Frage und einer
   Auswahl der Antworten.
2. **Given** die Auswahl der Frage, **When** sie geöffnet wird, **Then** stehen nur Fragen des
   Anmeldeformulars dieses Camps mit festen Antwortoptionen zur Wahl (Auswahl, Ja oder Nein).
3. **Given** eine gewählte Frage, **When** die Admin die Antworten wählt, **Then** kann sie eine
   oder mehrere Antwortoptionen dieser Frage als „fährt mit dem Bus“ markieren.
4. **Given** Frage und Antworten sind gewählt, **When** die Admin speichert, **Then** zeigt der
   Bereich die Zahl der aktiven Anmeldungen, die damit als Busperson gelten.
5. **Given** keine Frage oder keine Antwort ist gewählt, **When** die Admin das Busticket
   einschalten will, **Then** wird das abgelehnt mit einem Hinweis, was fehlt.
6. **Given** die gewählte Frage wurde später aus dem Formular gelöscht oder die gewählte Antwort
   existiert nicht mehr, **When** die Einstellungen oder die Scanseite geöffnet werden, **Then**
   erscheint ein deutlicher Hinweis, dass die Zuordnung neu gewählt werden muss, und es gelten
   keine Tickets als gültig, bis das geschehen ist.

---

### User Story 2 · Einstieg scannen (Priority: P1)

Am Abfahrtsort öffnet ein Teamer die Scanseite auf seinem Handy, wählt „Hinfahrt“ und richtet die
Kamera auf den QR Code, den ein Teilnehmer auf seinem Handy zeigt. Der Bildschirm wird grün und
zeigt den Namen. Beim nächsten erscheint rot „Kein Busticket“. Ein Dritter zeigt einen Screenshot,
der schon gescannt wurde: rot „Schon eingestiegen um 8:12“.

**Why this priority**: Das ist der eigentliche Zweck: Nur Buspersonen sitzen im Bus.

**Independent Test**: Mit einem gültigen QR Code, einem Code einer Person ohne Bus, einem Code
einer stornierten Anmeldung und einem zweiten Scan desselben Codes nacheinander scannen. Jedes
Ergebnis ist eindeutig richtig, und der erste Scan ist gespeichert.

**Acceptance Scenarios**:

1. **Given** ein angemeldetes Teammitglied mit Busberechtigung, **When** es die Scanseite öffnet,
   **Then** wählt es zuerst die Fahrt (Hinfahrt oder Rückfahrt) und sieht dann den Kamerabereich;
   die gewählte Fahrt ist dauerhaft gut sichtbar.
2. **Given** ein gültiges Ticket einer aktiven Busperson, die auf dieser Fahrt noch nicht
   eingestiegen ist, **When** der Code gescannt wird, **Then** erscheint ein grünes Ergebnis mit
   Vor und Nachname, und der Einstieg wird mit Fahrt, Zeit und scannender Person gespeichert.
   Ist für die Anmeldung noch ein Betrag offen, steht beim grünen Ergebnis zusätzlich „Zahlung
   offen“; der Einstieg wird trotzdem gespeichert.
3. **Given** der Code einer Anmeldung, die laut Busfrage nicht mit dem Bus fährt, **When** er
   gescannt wird, **Then** erscheint rot „Kein Busticket“ mit dem Namen.
4. **Given** der Code einer stornierten Anmeldung, **When** er gescannt wird, **Then** erscheint
   rot „Storniert“ mit dem Namen.
5. **Given** eine Busperson ist auf dieser Fahrt schon eingestiegen, **When** ihr Code erneut
   gescannt wird, **Then** erscheint rot „Schon eingestiegen“ mit Uhrzeit des ersten Scans, und es
   wird kein zweiter Einstieg gespeichert.
6. **Given** ein Code, der ungültig gemacht oder durch ein neues Ticket ersetzt wurde, **When** er
   gescannt wird, **Then** erscheint rot „Ticket ungültig“.
7. **Given** ein Code, der nicht vom System stammt oder verändert wurde, **When** er gescannt wird,
   **Then** erscheint rot „Unbekannter Code“ ohne weitere Angaben.
8. **Given** ein Ergebnis wird angezeigt, **When** einige Sekunden vergangen sind oder das
   Teammitglied tippt, **Then** ist die Seite bereit für den nächsten Scan, ohne neu zu laden.
9. **Given** jemand ohne Anmeldung im Adminbereich oder ohne Busberechtigung, **When** er die
   Scanseite oder den Link im QR Code öffnet, **Then** sieht er keine Daten zum Ticket, nur die
   Anmeldung oder einen Hinweis auf fehlende Rechte.
10. **Given** jemand scannt den QR Code mit der normalen Kamera seines Handys statt mit der
    Scanseite, **When** er bereits als Teammitglied mit Busberechtigung angemeldet ist, **Then**
    öffnet sich die Scanseite und prüft den Code wie ein Scan dort; die Fahrt muss dabei gewählt
    werden, falls noch keine gewählt ist.

---

### User Story 3 · Liste: wer fehlt noch (Priority: P1)

Kurz vor der Abfahrt öffnet die Busverantwortliche die Liste für die Hinfahrt. Oben steht „38 von
42 eingestiegen“, darunter die vier Namen, die fehlen. Einer davon hat sein Handy vergessen; sie
sucht seinen Namen und hakt ihn von Hand ab.

**Why this priority**: Ohne diese Liste fährt der Bus womöglich ohne jemanden los. Der manuelle
Einstieg fängt vergessene oder leere Handys ab.

**Independent Test**: Einige Buspersonen scannen, eine von Hand abhaken. Die Liste zeigt die
richtige Zahl und genau die fehlenden Namen; der manuelle Einstieg ist als solcher erkennbar.

**Acceptance Scenarios**:

1. **Given** eine gewählte Fahrt, **When** die Liste geöffnet wird, **Then** zeigt sie die Zahl
   eingestiegen von allen Buspersonen und darunter zuerst die Fehlenden, alphabetisch, danach die
   Eingestiegenen mit Uhrzeit.
2. **Given** die Liste, **When** jemand anderes gerade scannt, **Then** aktualisiert sich die Liste
   innerhalb weniger Sekunden ohne Neuladen.
3. **Given** eine fehlende Busperson ohne Handy, **When** das Teammitglied sie in der Liste sucht
   und „Eingestiegen“ wählt, **Then** wird der Einstieg gespeichert und als „von Hand“ markiert.
4. **Given** ein Einstieg wurde versehentlich erfasst, **When** das Teammitglied ihn zurücknimmt,
   **Then** steht die Person wieder bei den Fehlenden, und die Rücknahme ist protokolliert.
5. **Given** Hinfahrt und Rückfahrt, **When** zwischen den Fahrten gewechselt wird, **Then** sind
   die Einstiege beider Fahrten vollständig getrennt.
6. **Given** die Liste, **When** sie auf einem Handy angezeigt wird, **Then** lässt sie sich mit
   einer Hand bedienen und durchsuchen.

---

### User Story 4 · Ticket auf der Teilnehmerseite und per Mail (Priority: P2)

Ein Teilnehmer öffnet fünf Tage vor dem Camp die Infomail zur Anreise. Darin steht sein QR Code
mit dem Hinweis, ihn beim Einstieg zu zeigen. Am Abreisetag findet er die Mail nicht und öffnet
stattdessen seine Teilnehmerseite, wo derselbe Code groß angezeigt wird.

**Why this priority**: Ohne Ticket beim Teilnehmer gibt es nichts zu scannen. P2, weil der
manuelle Einstieg aus Story 3 im Notfall ohne Ticket funktioniert.

**Independent Test**: Für eine aktive Busperson die Teilnehmerseite öffnen und die Infomail zur
Anreise auslösen. Beide zeigen denselben gültigen Code; eine Person ohne Bus sieht keinen Code.

**Acceptance Scenarios**:

1. **Given** eine aktive Busperson in einem Camp mit eingeschaltetem Busticket, **When** sie die
   Teilnehmerseite öffnet, **Then** sieht sie einen Abschnitt „Busticket“ mit großem QR Code, ihrem
   Namen, dem Campnamen und dem Hinweis, den Code beim Einstieg zu zeigen und die Helligkeit
   hochzudrehen.
2. **Given** eine Anmeldung, die nicht mit dem Bus fährt, eine stornierte Anmeldung oder ein Camp
   ohne eingeschaltetes Busticket, **When** die Teilnehmerseite angezeigt wird, **Then** gibt es
   keinen Abschnitt „Busticket“.
3. **Given** eine aktive Busperson, **When** die Infomail zur Anreise an sie geht, **Then** enthält
   die Mail ihren QR Code und den Hinweis zum Einstieg; Personen ohne Bus bekommen die Mail ohne
   diesen Teil.
4. **Given** ein Admin öffnet eine Busperson im Anmeldedialog, **When** er „Busticket senden“
   wählt, **Then** geht eine Mail mit dem aktuellen QR Code an die Mailadresse der Anmeldung und
   erscheint im Mailverlauf.
5. **Given** der Code in einer Mail wird angezeigt, **When** das Mailprogramm Bilder blockiert,
   **Then** enthält die Mail zusätzlich einen Link zur Teilnehmerseite, auf der der Code steht.

---

### User Story 5 · Ticket ungültig machen und neu ausstellen (Priority: P2)

Eine Teilnehmerin meldet, dass ein Screenshot ihres Tickets in einer Gruppe herumgeschickt wurde.
Die Admin öffnet ihre Anmeldung, wählt „Neues Ticket ausstellen“ und schickt es ihr. Der alte Code
zeigt beim Scannen nur noch „Ticket ungültig“.

**Why this priority**: Schützt gegen weitergegebene Codes, wird aber selten gebraucht.

**Independent Test**: Für eine Busperson ein neues Ticket ausstellen. Der alte Code wird abgelehnt,
der neue akzeptiert, und die Teilnehmerseite zeigt den neuen.

**Acceptance Scenarios**:

1. **Given** eine Busperson im Anmeldedialog, **When** ein Admin mit Berechtigung für Anmeldungen
   den Bereich „Busticket“ öffnet, **Then** sieht er den Status des Tickets und die Einstiege auf
   Hinfahrt und Rückfahrt.
2. **Given** ein gültiges Ticket, **When** der Admin „Neues Ticket ausstellen“ bestätigt, **Then**
   wird der alte Code sofort ungültig, ein neuer gilt, und der Admin kann ihn direkt per Mail
   senden.
3. **Given** ein gültiges Ticket, **When** der Admin „Ticket sperren“ bestätigt, **Then** ist kein
   Code dieser Anmeldung mehr gültig, bis ein neues Ticket ausgestellt wird; die Teilnehmerseite
   zeigt dann keinen Code, sondern den Hinweis, sich beim Team zu melden.
4. **Given** schon erfasste Einstiege, **When** ein neues Ticket ausgestellt wird, **Then** bleiben
   diese Einstiege erhalten.

---

### Edge Cases

- Eine Busperson ändert ihre Antwort auf „kein Bus“ (durch Admin oder übernommene Änderungsanfrage
  aus Feature 018): ihr Code ergibt ab sofort „Kein Busticket“; ändert sie sie zurück, gilt
  derselbe Code wieder.
- Zwei Teamer scannen denselben Code fast gleichzeitig: genau ein Einstieg wird gespeichert, der
  zweite Scan zeigt „Schon eingestiegen“.
- Eine Anmeldung kommt nach dem Versand der Infomail zur Anreise dazu: das Ticket steht sofort auf
  der Teilnehmerseite; ein Admin kann es per „Busticket senden“ schicken.
- Zwei Buspersonen mit gleichem Namen: Ergebnis und Liste zeigen zusätzlich ein unterscheidendes
  Merkmal (etwa Geburtsjahr oder Mailadresse gekürzt), damit klar ist, wer gemeint ist.
- Der Code einer Busperson eines anderen Camps wird gescannt: rot „Ticket für ein anderes Camp“.
- Die Kamera ist nicht erlaubt oder nicht vorhanden: die Scanseite erklärt, wie man sie freigibt,
  und bietet die Suche nach Namen aus Story 3 als Ausweg.
- Schlechtes oder kein Netz am Abfahrtsort: der Scan zeigt nach kurzer Zeit „Keine Verbindung,
  bitte erneut versuchen“ statt eines falschen Ergebnisses; ein Ergebnis wird nie geraten.
- Die Busfrage ist ein Pflichtfeld nicht gewesen und viele haben sie leer gelassen: diese gelten
  nicht als Buspersonen; die Einstellungen zeigen die Zahl der Anmeldungen ohne Antwort als
  Hinweis.
- Das Busticket wird mitten im Camp ausgeschaltet: alle Scans ergeben „Busticket ist für dieses
  Camp ausgeschaltet“, gespeicherte Einstiege bleiben erhalten.
- Eine Anmeldung wird gelöscht: ihr Ticket und ihre Einstiege werden mit gelöscht.

## Requirements *(mandatory)*

### Functional Requirements

**Einrichtung pro Camp**

- **FR-001**: Das System MUSS pro Camp einen Schalter „Busticket“ sowie die Auswahl genau einer
  Frage des Anmeldeformulars dieses Camps und einer oder mehrerer ihrer Antwortoptionen speichern,
  die „fährt mit dem Bus“ bedeuten.
- **FR-002**: Zur Wahl stehen MÜSSEN nur Fragen mit festen Antwortoptionen. Freitextfragen sind
  nicht wählbar.
- **FR-003**: Das Einschalten MUSS abgelehnt werden, solange Frage oder Antwort fehlen oder nicht
  mehr im Formular existieren.
- **FR-004**: Die Einstellungen MÜSSEN die aktuelle Zahl der aktiven Buspersonen und die Zahl der
  aktiven Anmeldungen ohne Antwort auf die Busfrage anzeigen.
- **FR-005**: Busperson ist eine Anmeldung genau dann, wenn sie aktiv ist, ihr Camp das Busticket
  eingeschaltet hat und ihre gespeicherte Antwort auf die gewählte Frage eine der gewählten
  Antworten ist. Es gibt keine zweite, getrennt gepflegte Markierung.
- **FR-006**: Die Einstellungen sind nur mit der bestehenden Berechtigung für Camps änderbar.

**Ticket**

- **FR-007**: Jede Anmeldung eines Camps mit eingeschaltetem Busticket MUSS einen eigenen Ticketcode
  haben, der nicht erratbar und nicht fälschbar ist und keinen Zugriff auf die Teilnehmerseite oder
  andere private Daten gibt.
- **FR-008**: Der QR Code MUSS so aufgebaut sein, dass das Scannen mit der normalen Handykamera die
  Scanseite mit diesem Code öffnet; ohne Busberechtigung zeigt diese Seite keine Daten.
- **FR-009**: Admins mit Berechtigung für Anmeldungen MÜSSEN ein Ticket sperren und ein neues
  ausstellen können. Ein neues Ticket macht jeden früheren Code dieser Anmeldung sofort ungültig.
- **FR-010**: Sperren und Neuausstellen MÜSSEN im Log stehen, mit Admin und Zeit.

**Anzeige und Versand**

- **FR-011**: Die Teilnehmerseite einer aktiven Busperson MUSS einen Abschnitt „Busticket“ mit
  großem, gut scanbarem QR Code, Namen und Campnamen zeigen; sonst gibt es diesen Abschnitt nicht.
- **FR-012**: Die Infomail zur Anreise (Feature 012) MUSS für Buspersonen den QR Code, einen
  Hinweis zum Einstieg und einen Link zur Teilnehmerseite enthalten; für alle anderen bleibt sie
  unverändert.
- **FR-013**: Der Anmeldedialog MUSS für Buspersonen „Busticket senden“ anbieten. Die Mail ist eine
  eigene, im Code definierte Vorlage, erscheint in der Mailvorschau (`/admin/mail`), im Mailverlauf
  der Anmeldung und zählt gegen das tägliche Mailkontingent.
- **FR-014**: Mails mit Ticket gehen nur an die Mailadresse der Anmeldung.

**Scannen**

- **FR-015**: Die Scanseite MUSS im Adminbereich liegen und nur für angemeldete Teammitglieder mit
  einer neuen Berechtigung „Bus“ nutzbar sein. Diese Berechtigung lässt sich wie die bestehenden
  einzeln vergeben, so dass Helfer nur scannen können.
- **FR-016**: Die Scanseite MUSS mit der Kamera eines Handys QR Codes lesen und vor dem ersten Scan
  die Wahl der Fahrt verlangen: Hinfahrt oder Rückfahrt.
- **FR-017**: Jeder Scan MUSS genau eines dieser Ergebnisse zeigen: „Eingestiegen“ (grün, Name),
  „Kein Busticket“, „Storniert“, „Schon eingestiegen“ (mit Uhrzeit), „Ticket ungültig“, „Ticket für
  ein anderes Camp“, „Busticket ist für dieses Camp ausgeschaltet“ oder „Unbekannter Code“ (jeweils
  rot). Grün und Rot MÜSSEN zusätzlich durch Symbol und Text unterscheidbar sein.
- **FR-018**: Nur ein grünes Ergebnis speichert einen Einstieg: Anmeldung, Fahrt, Zeitpunkt,
  scannende Person und Art (Scan oder von Hand). Pro Anmeldung und Fahrt gibt es höchstens einen
  Einstieg, auch bei gleichzeitigen Scans.
- **FR-019**: Das Ergebnis eines Scans zeigt außer Name, Status, Uhrzeit und dem Hinweis
  „Zahlung offen“ (FR-021) keine weiteren Daten der Anmeldung, insbesondere keine Beträge.
- **FR-020**: Ohne Verbindung zum Server MUSS die Scanseite das klar sagen und darf kein Ergebnis
  anzeigen.
- **FR-021**: Das Ticket gilt unabhängig vom Zahlungsstatus. Ist für die Anmeldung noch ein Betrag
  offen (nichts oder nur ein Teil gezahlt), zeigt das grüne Ergebnis zusätzlich den Hinweis
  „Zahlung offen“. Der Einstieg wird trotzdem gespeichert; der Hinweis ändert nichts am Ergebnis.

**Liste**

- **FR-022**: Pro Fahrt MUSS es eine Liste geben mit „X von Y eingestiegen“, den fehlenden
  Buspersonen zuerst und den eingestiegenen mit Uhrzeit und Art danach, durchsuchbar nach Namen.
- **FR-023**: Die Liste MUSS sich während der Nutzung innerhalb weniger Sekunden selbst
  aktualisieren.
- **FR-024**: Teammitglieder mit Busberechtigung MÜSSEN eine fehlende Busperson von Hand als
  eingestiegen markieren und einen Einstieg zurücknehmen können; beides steht im Log.
- **FR-025**: Alle Texte der Einstellungen, Scanseite, Liste, Teilnehmerseite und Mails sind
  Deutsch.

### Key Entities

- **Buseinstellung pro Camp**: Schalter, gewählte Frage des Anmeldeformulars, gewählte
  Antwortoptionen. Gehört zum Camp.
- **Busticket**: gehört zu genau einer Anmeldung; hat einen aktuellen Code und einen Zustand
  (gültig oder gesperrt); ein neues Ticket ersetzt den Code. Wird mit der Anmeldung gelöscht.
- **Einstieg**: Anmeldung, Fahrt (Hinfahrt oder Rückfahrt), Zeitpunkt, scannende Person, Art (Scan
  oder von Hand). Höchstens einer pro Anmeldung und Fahrt. Wird mit der Anmeldung gelöscht.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Vom Vorzeigen des Codes bis zum sichtbaren Ergebnis vergehen bei normalem Netz unter
  zwei Sekunden.
- **SC-002**: 50 Buspersonen lassen sich mit zwei scannenden Handys in unter zehn Minuten
  einsteigen lassen.
- **SC-003**: Kein selbst erzeugter, veränderter, gesperrter oder ersetzter Code ergibt jemals ein
  grünes Ergebnis.
- **SC-004**: Die Liste „wer fehlt noch“ stimmt vor der Abfahrt in jedem Test zu 100 Prozent mit den
  tatsächlich erfassten Einstiegen überein.
- **SC-005**: Ein Helfer ohne Vorwissen kann nach einer Erklärung von unter einer Minute selbständig
  scannen.
- **SC-006**: Der QR Code ist auf der Teilnehmerseite bei voller Helligkeit aus 20 bis 40
  Zentimetern zuverlässig lesbar.

## Assumptions

- Es gibt genau zwei Fahrten pro Camp, Hinfahrt und Rückfahrt, und alle Buspersonen gelten für
  beide. Wer nur eine Richtung fährt, fehlt auf der anderen Liste; das Team weiß das. Getrennte
  Antworten pro Richtung sind eine spätere Erweiterung.
- Mehrere Busse oder Haltestellen werden nicht unterschieden; alle Buspersonen stehen auf einer
  Liste pro Fahrt.
- Der Code beweist nicht, wer ihn vorzeigt. Der angezeigte Name erlaubt dem Team einen kurzen
  Abgleich; das genügt für ein Jugendcamp, in dem sich das Team und die Teilnehmenden kennen.
- Am Abfahrtsort gibt es mobiles Netz. Ein Betrieb ganz ohne Netz ist nicht Teil dieses Features.
- Gleich lautende Namen werden über ein vorhandenes Merkmal der Anmeldung unterschieden; welches,
  klärt der Plan.
- Das Busticket ist eigenständig: Schulbefreiung, Zimmerplanung und Zeltkreise bleiben unberührt.
- Unbezahlte Buspersonen dürfen einsteigen (Verfassung, Prinzip VI). Das Team klärt offene
  Zahlungen bei Bedarf vor Ort; die Scanseite kassiert nicht und zeigt keine Beträge.
- Ausgeschlossen sind Apple Wallet, Google Wallet, PDF Tickets und ausgedruckte Ticketbögen.
