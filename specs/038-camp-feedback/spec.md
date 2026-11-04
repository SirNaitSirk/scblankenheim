# Feature Specification: Campfeedback mit Historie

**Feature Branch**: `038-camp-feedback`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "wir sammeln jedes jahr feedback ein, ich hatte immer seperat dafür was gemacht aber eigentlich können wir das auch hier machen und für jedes camp speichern sodass man auch eine historie hat."

**Kontext**: Das Feedback nach dem Camp läuft heute über ein externes Tool. Die Ergebnisse liegen
getrennt pro Jahr und lassen sich nicht vergleichen. Künftig gibt es pro Camp eine eigene
Feedbackseite. Am Ende des Camps wird ihr QR Code gezeigt, die Leute scannen ihn mit dem Handy und
antworten direkt. Jedes Camp behält seine Antworten, so entsteht eine Historie über die Jahre.

**Produktentscheidungen (mit dem Projektverantwortlichen geklärt am 2026-11-03 und 2026-11-04)**:

- Ergänzung 2026-11-04: Bewertungs und Auswahlfragen können ein freiwilliges Kommentarfeld bekommen, etwa „Lobpreis 1 bis 5“ plus „Magst du etwas dazu schreiben?“. Allgemeines Feedback ohne Bewertung ist eine eigene Frage vom Typ Freitext.

- Feedback ist anonym. Eine Antwort gehört nur zu einem Camp. Es gibt keinerlei Bezug zu
  Anmeldungen oder Personen, auch nicht als Vermerk „hat geantwortet“.
- Der Zugang läuft über einen QR Code, der am Ende des Camps gezeigt wird (etwa per Beamer oder
  ausgedruckt). Er führt auf eine Feedbackseite des Camps. Kein Login, kein persönlicher Link.
- Keine Mail und keine Änderung an der Teilnehmerseite. Die Dankesmail bleibt wie sie ist.
- Das Feedback dient der Orientierung und muss nicht streng reguliert sein. Doppelte Antworten
  werden nur leicht erschwert, nicht verhindert.
- Admins öffnen und schließen das Feedback eines Camps selbst per Schalter.
- Die Fragen stellen Admins pro Camp ein. Es gibt vier Fragetypen: Bewertung 1 bis 5,
  Einfachauswahl, Mehrfachauswahl und Freitext. Jede Frage hat einen festen Schlüssel, über den
  sich Antworten über die Jahre vergleichen lassen. Alle Fragen eines früheren Camps lassen sich
  übernehmen.
- Ein Import der Ergebnisse früherer Jahre aus dem externen Tool ist vorerst nicht dabei.
- Die Datenschutzseite wird um die neuen Daten ergänzt.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Feedback per QR Code geben (Priority: P1)

Am letzten Abend zeigt das Team den QR Code per Beamer. Eine Teilnehmerin scannt ihn, landet auf
der Feedbackseite des Camps, bewertet das Camp, kreuzt an, was ihr gefallen hat, schreibt zwei
Sätze und schickt ab. Danach sieht sie einen Dank.

**Why this priority**: Ohne Antworten gibt es nichts auszuwerten. Das ist der Kern.

**Independent Test**: Für ein Camp zwei Fragen anlegen, Feedback öffnen, den Link am Handy aufrufen,
ausfüllen und absenden. Die Antwort zählt in der Auswertung.

**Acceptance Scenarios**:

1. **Given** ein Camp mit geöffnetem Feedback und mindestens einer Frage, **When** jemand den Link
   des QR Codes öffnet, **Then** zeigt die Seite Campname, einen kurzen Hinweis auf Anonymität und
   alle Fragen in der eingestellten Reihenfolge, gut bedienbar am Handy.
2. **Given** die Seite ist offen, **When** Pflichtfragen fehlen, **Then** wird das Absenden mit einer
   deutschen Meldung an der jeweiligen Frage abgelehnt.
3. **Given** alle Pflichtfragen sind beantwortet, **When** die Person absendet, **Then** wird die
   Antwort gespeichert und die Seite zeigt einen Dank.
4. **Given** jemand hat in diesem Browser schon geantwortet, **When** er die Seite erneut öffnet,
   **Then** zeigt sie den Dank mit dem Hinweis, dass schon geantwortet wurde. Ein doppelter Klick
   auf Absenden erzeugt keine zweite Antwort.
5. **Given** das Feedback des Camps ist geschlossen, **When** jemand den Link öffnet, **Then** zeigt
   die Seite einen freundlichen Hinweis, dass gerade kein Feedback möglich ist, und nimmt keine
   Antwort an.
6. **Given** ein ungültiger oder erneuerter Link, **When** er geöffnet wird, **Then** zeigt die Seite
   denselben Hinweis wie bei geschlossenem Feedback und verrät nicht, welches Camp gemeint war.

---

### User Story 2 · Fragen einstellen und QR Code zeigen (Priority: P1)

Eine Admin öffnet im Juni die Feedbackseite des neuen Camps im Adminbereich. Sie übernimmt mit einem
Klick alle Fragen des Vorjahres, ändert den Text einer Frage, ergänzt eine neue und löscht eine
alte. Am letzten Campabend schaltet sie das Feedback an und zeigt den QR Code im Vollbild per
Beamer. Eine Woche später schaltet sie es wieder aus.

**Why this priority**: Ohne Fragen und QR Code kann niemand antworten. Das Übernehmen aus dem
Vorjahr macht die Historie erst vergleichbar.

**Independent Test**: In einem Camp ohne Fragen die Fragen eines anderen Camps übernehmen, eine
Frage ändern, eine anlegen, eine löschen, sortieren. Feedback öffnen, QR Code im Vollbild zeigen und
mit dem Handy scannen: Die Feedbackseite öffnet sich.

**Acceptance Scenarios**:

1. **Given** die Feedbackseite eines Camps im Adminbereich, **When** die Admin eine Frage anlegt,
   **Then** gibt sie Fragetext, Typ (Bewertung 1 bis 5, Einfachauswahl, Mehrfachauswahl,
   Freitext), Pflicht ja oder nein, bei Auswahl die Antworten und einen Schlüssel an. Der Schlüssel
   wird aus dem Text vorgeschlagen und ist innerhalb des Camps eindeutig.
2. **Given** ein anderes Camp mit Fragen, **When** die Admin „Fragen übernehmen“ wählt und das Camp
   aussucht, **Then** werden alle Fragen mit Text, Typ, Antworten, Pflicht und Schlüssel kopiert,
   nur solche mit einem im Camp noch fehlenden Schlüssel. Antworten werden nicht kopiert.
3. **Given** eine Frage, **When** die Admin Text, Pflicht oder Reihenfolge ändert, **Then** gilt das
   für künftige Antworten. Gespeicherte Antworten behalten den Text, mit dem sie gegeben wurden.
4. **Given** eine Frage hat schon Antworten, **When** die Admin Typ oder Schlüssel ändern will,
   **Then** wird das mit einem Hinweis abgelehnt. Antworten einer Auswahlfrage lassen sich dann nur
   noch ergänzen.
5. **Given** eine Frage hat schon Antworten, **When** die Admin sie löscht, **Then** fragt die Seite
   nach und nennt die Zahl der Antworten. Die gespeicherten Antworten bleiben in der Auswertung.
6. **Given** ein Camp mit mindestens einer Frage, **When** die Admin den Schalter „Feedback offen“
   umlegt, **Then** nimmt die Feedbackseite sofort Antworten an oder eben nicht mehr. Ohne Fragen
   lässt sich das Feedback nicht öffnen.
7. **Given** die Feedbackseite im Adminbereich, **When** die Admin „QR Code zeigen“ wählt, **Then**
   erscheint der QR Code groß im Vollbild mit Campname und der Adresse in Klarschrift. Er lässt sich
   außerdem als Bild herunterladen und drucken.
8. **Given** der Link wurde weitergegeben, wo er nicht hin soll, **When** die Admin „Link erneuern“
   wählt und bestätigt, **Then** funktioniert der alte Link und alte QR Code nicht mehr, und ein neuer
   wird angezeigt.

---

### User Story 3 · Ergebnisse eines Camps auswerten (Priority: P1)

Nach dem Camp öffnet das Leitungsteam die Auswertung. Oben steht die Zahl der Antworten, darunter
pro Frage das Ergebnis: Durchschnitt und Verteilung bei Bewertungen, Anzahl pro Antwort bei
Auswahlfragen und alle Freitexte als Liste. Für die Sitzung lädt jemand alles als CSV herunter.

**Why this priority**: Das Feedback dient der Planung des nächsten Camps. Ohne Auswertung hilft es
niemandem.

**Independent Test**: Für ein Camp mit mehreren Antworten die Auswertung öffnen und die Zahlen von
Hand nachrechnen. Den CSV Export öffnen: eine Zeile pro Antwort, eine Spalte pro Frage.

**Acceptance Scenarios**:

1. **Given** ein Camp mit Antworten, **When** die Auswertung geöffnet wird, **Then** steht oben die
   Zahl der Antworten und zur Orientierung die Zahl der aktiven Anmeldungen.
2. **Given** eine Bewertungsfrage, **When** sie angezeigt wird, **Then** stehen Durchschnitt mit
   einer Nachkommastelle, Zahl der Antworten und die Verteilung auf 1 bis 5 dabei.
3. **Given** eine Auswahlfrage, **When** sie angezeigt wird, **Then** steht pro Antwort die Anzahl
   und der Anteil. Bei Mehrfachauswahl ist erkennbar, dass sich die Anteile nicht zu 100 Prozent
   addieren.
4. **Given** eine Freitextfrage, **When** sie angezeigt wird, **Then** stehen alle nicht leeren
   Texte als Liste, ohne Bezug zu einer Person.
5. **Given** ein Camp ohne Antworten, **When** die Auswertung geöffnet wird, **Then** zeigt sie einen
   leeren Zustand mit dem Hinweis, ob das Feedback gerade offen ist.
6. **Given** die Auswertung, **When** der CSV Export gewählt wird, **Then** enthält die Datei eine
   Zeile pro Antwort und eine Spalte pro Frage, ohne Angaben zu Personen.
7. **Given** eine gelöschte Frage mit Antworten, **When** die Auswertung angezeigt wird, **Then**
   erscheint sie mit dem gespeicherten Text und dem Hinweis „gelöscht“.

---

### User Story 4 · Historie über die Jahre (Priority: P2)

Die Leitung will wissen, ob sich das Essen seit dem letzten Jahr verbessert hat. In der Historie
sieht sie für die Frage zum Essen pro Camp den Durchschnitt und die Zahl der Antworten.

**Why this priority**: Der Grund für den Umzug ins System. Es braucht dafür aber mindestens zwei
Camps mit Antworten, darum nach den P1 Geschichten.

**Independent Test**: Zwei Camps mit einer Bewertungsfrage mit gleichem Schlüssel und Antworten
anlegen. In der Historie erscheinen beide Camps mit dem richtigen Durchschnitt.

**Acceptance Scenarios**:

1. **Given** mehrere Camps mit Antworten, **When** die Historie geöffnet wird, **Then** gibt es pro
   Schlüssel einer Bewertungsfrage eine Zeile mit Durchschnitt und Zahl der Antworten je Camp,
   ältestes Camp zuerst.
2. **Given** ein Schlüssel kommt nicht in jedem Camp vor, **When** die Historie angezeigt wird,
   **Then** bleibt das Feld dieses Camps leer und wird nicht als 0 gezeigt.
3. **Given** der Fragetext hat sich über die Jahre geändert, **When** die Historie angezeigt wird,
   **Then** steht der neueste Text als Name der Zeile, und die älteren Texte lassen sich anzeigen.
4. **Given** Auswahlfragen mit gleichem Schlüssel, **When** die Historie angezeigt wird, **Then**
   steht pro Camp der Anteil je Antwort.
5. **Given** die Historie, **When** eine Admin auf ein Camp klickt, **Then** öffnet sich dessen
   Auswertung.

---

### User Story 5 · Zugriff nur mit Berechtigung (Priority: P2)

Nur wer die neue Berechtigung „Feedback“ hat, sieht den Tab Feedback im Adminbereich, darf Fragen
bearbeiten, das Feedback öffnen und schließen, den QR Code zeigen und die Ergebnisse sehen.
Superadmins haben sie immer.

**Why this priority**: Freitexte können persönliche Kritik enthalten und sollen nicht jedem
Teammitglied offenliegen.

**Independent Test**: Eine Admin ohne die Berechtigung ruft die Feedbackseite direkt per Adresse
auf und bekommt keinen Zugriff. Mit der Berechtigung klappt es.

**Acceptance Scenarios**:

1. **Given** eine Admin ohne Berechtigung „Feedback“, **When** sie den Adminbereich öffnet, **Then**
   gibt es keinen Tab Feedback, und der direkte Aufruf der Seite und des Exports wird abgelehnt.
2. **Given** die Benutzerverwaltung, **When** ein Superadmin eine Admin bearbeitet, **Then** kann er
   die Berechtigung „Feedback“ wie die anderen vergeben und entziehen.

### User Story 6 · Kommentar zu einer Bewertung (Priority: P2)

Eine Admin legt die Frage „Wie fandest du den Lobpreis?“ als Bewertung 1 bis 5 an und schaltet
„Kommentar erlauben“ an. Eine Teilnehmerin tippt auf die 4. Darunter erscheint ein Textfeld
„Magst du etwas dazu schreiben?“ mit dem Hinweis „freiwillig“. Sie schreibt einen Satz und schickt
ab. In der Auswertung steht der Satz unter den Balken der Lobpreisfrage.

**Why this priority**: Zahlen allein sagen nicht, warum etwas gut oder schlecht war. Ohne
Kommentar wäre das Feedback trotzdem nutzbar, darum P2.

**Independent Test**: Eine Bewertungsfrage mit Kommentar anlegen, auf der Feedbackseite mit und ohne
Kommentar antworten. Die Auswertung zeigt den Kommentar bei dieser Frage, der CSV Export hat eine
eigene Spalte dafür.

**Acceptance Scenarios**:

1. **Given** der Fragedialog, **When** der Typ Bewertung, Einfachauswahl oder Mehrfachauswahl ist,
   **Then** gibt es den Schalter „Kommentar erlauben“, standardmäßig aus. Beim Typ Freitext fehlt er.
2. **Given** eine Frage mit Kommentar, **When** die Person noch nichts gewählt hat, **Then** ist das
   Kommentarfeld nicht zu sehen.
3. **Given** eine Frage mit Kommentar, **When** die Person eine Antwort wählt, **Then** erscheint
   darunter das freiwillige Kommentarfeld mit Zeichenzähler.
4. **Given** ein Kommentar ist geschrieben, **When** abgeschickt wird, **Then** wird er zusammen mit
   der Antwort dieser Frage gespeichert. Ein leerer Kommentar wird nicht gespeichert.
5. **Given** die Auswertung, **When** eine Frage Kommentare hat, **Then** stehen sie als Liste unter
   dem Ergebnis der Frage mit ihrer Anzahl.
6. **Given** der CSV Export, **When** eine Frage Kommentare erlaubt oder hat, **Then** gibt es direkt
   nach ihrer Spalte eine Spalte „<Frage> · Kommentar“.
7. **Given** Fragen werden aus einem anderen Camp übernommen, **When** die Quelle Kommentare erlaubt,
   **Then** erlaubt auch die Kopie Kommentare.

### Edge Cases

- **Mehrfach antworten**: Wer den Browser wechselt oder die Browserdaten löscht, kann erneut
  antworten. Das ist bewusst hingenommen. Gegen massenhaftes Absenden (etwa durch Bots) gibt es
  einen einfachen Schutz, der keine Angaben zur Person an der Antwort speichert.
- **Link wird weitergeleitet**: Wer den Link hat, kann antworten, solange das Feedback offen ist.
  Das ist hingenommen. Admins können den Link erneuern oder das Feedback schließen.
- **Fragen werden geändert, während jemand die Seite offen hat**: Beim Absenden zählt der Stand der
  Fragen zum Zeitpunkt des Absendens. Antworten auf gelöschte Fragen werden verworfen. Fehlt eine
  neue Pflichtfrage, gibt es eine Meldung und die Seite zeigt die neue Frage.
- **Feedback wird geschlossen, während jemand ausfüllt**: Das Absenden wird mit einem freundlichen
  Hinweis abgelehnt.
- **Inhalt verrät die Person**: Wer im Freitext seinen Namen schreibt, ist nicht anonym. Der Hinweis
  auf der Seite bittet darum, keine Namen zu nennen. Das System prüft den Text nicht.
- **Kommentar ohne Antwort**: Ohne gewählte Antwort ist das Kommentarfeld nicht sichtbar. Schickt jemand trotzdem einen Kommentar ohne Antwort, verwirft der Server ihn.
- **Kommentar nachträglich ausgeschaltet**: Schon gespeicherte Kommentare bleiben in Auswertung und Export.
- **Sehr lange Freitexte**: Freitext und Kommentar sind auf 2000 Zeichen begrenzt. Die Begrenzung wird beim
  Schreiben angezeigt.
- **Prelaunch Sperre**: Die Feedbackseite folgt den Regeln der bestehenden Sperre „demnächst“ wie
  andere öffentliche Seiten.
- **Rechnen mit Pflicht und Freiwillig**: Durchschnitte und Anteile beziehen sich nur auf die
  Antworten, die die jeweilige Frage beantwortet haben, und nennen diese Zahl.

## Requirements *(mandatory)*

### Functional Requirements

**Öffentliche Feedbackseite**

- **FR-001**: Jedes Camp MUSS eine eigene öffentliche Feedbackseite unter einer schwer zu ratenden
  Adresse haben. Der QR Code führt genau dorthin.
- **FR-002**: Die Seite MUSS Antworten nur annehmen, solange das Feedback des Camps offen ist und
  das Camp mindestens eine Frage hat.
- **FR-003**: Die Seite MUSS alle Fragen in der eingestellten Reihenfolge zeigen, Pflicht
  kennzeichnen, auf Anonymität hinweisen und am Handy gut bedienbar sein.
- **FR-004**: Das System MUSS jede Antwort auf dem Server prüfen: Feedback offen, Pflichtfragen
  beantwortet, Werte passen zum Fragetyp (Bewertung ganze Zahl 1 bis 5, Auswahl nur vorhandene
  Antworten, Freitext höchstens 2000 Zeichen).
- **FR-005**: Nach dem Absenden MUSS die Seite einen Dank zeigen und im selben Browser beim erneuten
  Öffnen auf die schon gegebene Antwort hinweisen. Doppeltes Absenden durch schnelles Klicken DARF
  keine zweite Antwort erzeugen.
- **FR-006**: Bei geschlossenem Feedback oder ungültigem Link MUSS die Seite einen freundlichen
  Hinweis zeigen, ohne das Camp zu verraten.
- **FR-007**: Das System MUSS massenhaftes Absenden einfach begrenzen, ohne Angaben zur Person an der
  Antwort zu speichern.

**Anonymität**

- **FR-008**: Eine Antwort DARF nur dem Camp zugeordnet sein. Sie DARF keine Anmeldung, keinen Namen,
  keine Mail, keine IP Adresse und keinen anderen Bezug zu einer Person enthalten.
- **FR-009**: Es DARF keinen Vermerk geben, welche Anmeldung oder Person geantwortet hat.
- **FR-010**: Jede Antwort MUSS den Fragetext, den Typ und den Schlüssel jeder beantworteten Frage
  zum Zeitpunkt des Absendens mitspeichern.

**Verwaltung**

- **FR-011**: Admins mit Berechtigung MÜSSEN pro Camp Fragen anlegen, ändern, löschen und sortieren
  können. Jede Frage hat Text, Typ, Pflicht, bei Auswahl die Antworten und einen im Camp eindeutigen
  Schlüssel.
- **FR-012**: Admins MÜSSEN alle Fragen eines anderen Camps übernehmen können. Ergänzt werden nur
  Fragen mit einem im Zielcamp noch fehlenden Schlüssel.
- **FR-013**: Typ und Schlüssel einer Frage DÜRFEN nicht mehr geändert werden, sobald sie Antworten
  hat. Antworten einer Auswahlfrage mit Antworten DÜRFEN ergänzt, aber nicht umbenannt oder entfernt
  werden.
- **FR-014**: Das Löschen einer Frage mit Antworten MUSS bestätigt werden. Die gespeicherten
  Antworten bleiben erhalten.
- **FR-015**: Admins MÜSSEN das Feedback eines Camps per Schalter öffnen und schließen können.
  Standard ist geschlossen.
- **FR-016**: Admins MÜSSEN den QR Code im Vollbild zeigen, als Bild herunterladen und drucken
  können, jeweils mit Campname und der Adresse in Klarschrift.
- **FR-017**: Admins MÜSSEN den Link eines Camps nach Bestätigung erneuern können. Danach führt der
  alte Link nicht mehr zur Feedbackseite.

**Auswertung und Historie**

- **FR-018**: Die Auswertung eines Camps MUSS die Zahl der Antworten und zur Orientierung die Zahl
  der aktiven Anmeldungen zeigen.
- **FR-019**: Die Auswertung MUSS pro Bewertungsfrage Durchschnitt, Zahl und Verteilung, pro
  Auswahlfrage Anzahl und Anteil je Antwort und pro Freitextfrage alle nicht leeren Texte zeigen.
- **FR-020**: Fragen, die nicht mehr existieren, aber Antworten haben, MÜSSEN mit ihrem gespeicherten
  Text und dem Hinweis „gelöscht“ erscheinen.
- **FR-021**: Die Historie MUSS für jeden Schlüssel einer Bewertungs oder Auswahlfrage die Ergebnisse
  aller Camps nebeneinander zeigen, ältestes Camp zuerst, fehlende Werte leer.
- **FR-022**: Der CSV Export eines Camps MUSS eine Zeile pro Antwort und eine Spalte pro Frage
  enthalten, ohne Angaben zu Personen.

**Zugriff und Recht**

- **FR-023**: Es MUSS eine neue Berechtigung „Feedback“ geben. Nur mit ihr (oder als Superadmin)
  sind Verwaltung, QR Code, Auswertung, Historie und Export erreichbar. Der Server prüft das bei
  jedem Zugriff.
- **FR-024**: Die Datenschutzseite MUSS beschreiben, welche Feedbackdaten gespeichert werden, dass sie
  anonym sind und nur dem Camp zugeordnet werden, dass die Teilnahme freiwillig ist und dass im
  Browser ein Vermerk über die schon gegebene Antwort gesetzt wird.
- **FR-025**: Alle sichtbaren Texte MÜSSEN deutsch sein.
- **FR-026**: Bewertungs und Auswahlfragen MÜSSEN optional einen freiwilligen Kommentar erlauben
  können. Das Kommentarfeld erscheint erst nach Wahl einer Antwort, ist nie Pflicht und auf 2000
  Zeichen begrenzt.
- **FR-027**: Ein Kommentar MUSS zusammen mit der Antwort seiner Frage gespeichert werden und für ihn
  gelten dieselben Regeln zur Anonymität (FR-008). Ein Kommentar ohne Antwort wird verworfen.
- **FR-028**: Auswertung und CSV Export MÜSSEN Kommentare pro Frage zeigen; die Historie bleibt
  unverändert.

### Key Entities

- **Feedbackfrage**: gehört zu einem Camp. Text, Typ (Bewertung, Einfachauswahl, Mehrfachauswahl,
  Freitext), Pflicht, Antworten bei Auswahl, Reihenfolge, „Kommentar erlauben“ und ein im Camp
  eindeutiger Schlüssel, der über die Jahre gleich bleibt.
- **Feedbackantwort**: gehört zu einem Camp und zu nichts sonst. Enthält pro beantworteter Frage den
  Schlüssel, den damaligen Text, den Typ, den Wert und optional einen Kommentar.
- **Feedbackeinstellung**: pro Camp der Schalter „offen“ und der geheime Teil der Adresse für den QR
  Code.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Vom Scannen des QR Codes bis zum Absenden eines Fragebogens mit zehn Fragen braucht eine
  Person am Handy weniger als 3 Minuten.
- **SC-002**: Eine Admin kann die Fragen des Vorjahres in ein neues Camp übernehmen und anpassen,
  ohne eine Frage neu zu tippen, in unter 5 Minuten.
- **SC-003**: Kein gespeicherter Datensatz, keine Ansicht und kein Export enthält einen Bezug von einer
  Antwort zu einer Anmeldung oder Person.
- **SC-004**: Die Werte der Auswertung stimmen bei Nachrechnen von Hand für jede Frage exakt.
- **SC-005**: Ab dem zweiten Camp mit Antworten sieht die Leitung den Verlauf einer Frage über die
  Jahre auf einer Seite.
- **SC-006**: Das externe Feedbacktool wird für das nächste Camp nicht mehr gebraucht.

## Assumptions

- Das Team zeigt den QR Code selbst am Ende des Camps. Das System verschickt dafür nichts.
- Die Dankesmail und die Einstellung „Link für Feedback“ bleiben unverändert.
- Es gibt keine Prüfung, ob jemand am Camp teilgenommen hat. Wer den Link hat, kann antworten,
  solange das Feedback offen ist.
- Feedbackantworten werden wie die übrigen Campdaten aufbewahrt und nicht automatisch gelöscht. Weil
  sie anonym sind, betreffen sie keine einzelne Person.
- Die Fragen eines Camps sind unabhängig von den Feldern des Anmeldeformulars. Bedingte Fragen (wie
  bei specs/037) gibt es vorerst nicht.
- Diagramme sind keine Pflicht. Für Auswertung und Historie reicht eine übersichtliche Darstellung
  mit einfachen Balken.
- Feedback vom Team als eigene Gruppe und ein Import früherer Ergebnisse sind nicht Teil dieser
  Spec. Teammitglieder können aber über denselben QR Code antworten.
- **Abhängigkeit**: Laut Verfassung (Prinzip III) darf nur gebaut werden, was in AGENTS.md
  Abschnitt 4 steht. AGENTS.md wird deshalb vor der Umsetzung um „Campfeedback“ im Bereich Public
  (Feedbackseite per QR Code) und Admin (Tab Feedback) sowie um die neuen Tabellen in Abschnitt 5
  ergänzt.
