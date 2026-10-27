# Feature Specification: Anmeldung in Schritten

**Feature Branch**: `003-multi-step-form`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Die Anmeldemaske soll nicht so aufgebläht sein und mit jedem neuen Feld länger werden. Besser in Schritten mit schönen Animationen."

**Kontext**: Das öffentliche Anmeldeformular (Spec 001) zeigt heute alle Felder des aktuellen Camps
untereinander: zuerst Vorname, Nachname und Mail, danach jede Frage, die der Admin im Feldeditor
anlegt. Mit jedem Jahr kommen Fragen dazu (Gesundheit, Allergien, Notfallkontakt, Einverständnisse),
und das Formular wird zu einer langen Wand, die abschreckt, bevor man anfängt. Diese Spec teilt das
Formular in kurze, überschaubare Schritte mit ruhigen Übergängen, einer Fortschrittsanzeige und einer
Übersicht zum Prüfen vor dem Absenden. Die fachlichen Regeln aus Spec 001 bleiben unverändert.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Anmeldung Schritt für Schritt ausfüllen (Priority: P1)

Eine Person öffnet die Anmeldung und sieht nicht mehr alle Fragen auf einmal, sondern nur den ersten
Schritt mit Vorname, Nachname und Mail. Oben zeigt eine Fortschrittsanzeige, wie viele Schritte es
gibt und wo sie gerade steht. Mit „Weiter“ gleitet der nächste Schritt ruhig herein; mit „Zurück“
kehrt sie jederzeit zurück, ohne dass Eingaben verloren gehen.

**Why this priority**: Das ist der Kern der Anfrage. Ein kurzer erster Schritt senkt die Hürde
anzufangen, und wer angefangen hat, macht eher weiter.

**Independent Test**: Ein Camp mit mindestens acht Fragen anlegen, die Anmeldung öffnen und prüfen,
dass nie alle Fragen gleichzeitig zu sehen sind, Weiter und Zurück funktionieren und eingegebene
Werte beim Hin und Herspringen erhalten bleiben.

**Acceptance Scenarios**:

1. **Given** das aktuelle Camp hat Fragen, **When** die Anmeldung angezeigt wird, **Then** ist nur
   der erste Schritt mit Vorname, Nachname und Mail sichtbar, und die Fortschrittsanzeige nennt die
   Gesamtzahl der Schritte.
2. **Given** ein Pflichtfeld im aktuellen Schritt ist leer oder ungültig, **When** die Person
   „Weiter“ wählt, **Then** bleibt sie im Schritt, die Fehler erscheinen an den betroffenen Feldern
   und der Fokus springt auf das erste fehlerhafte Feld.
3. **Given** alle Felder des Schritts sind gültig, **When** die Person „Weiter“ wählt, **Then**
   erscheint der nächste Schritt mit einem ruhigen Übergang, und der Fokus liegt auf dessen Titel.
4. **Given** die Person ist in Schritt 3, **When** sie „Zurück“ wählt, **Then** erscheint Schritt 2
   mit allen zuvor eingegebenen Werten.
5. **Given** die Person drückt in einem Textfeld Enter, **When** der Schritt gültig ist, **Then**
   geht es wie mit „Weiter“ zum nächsten Schritt, statt das Formular abzuschicken.
6. **Given** die Person hat im Gerät „Bewegung reduzieren“ eingestellt, **When** sie den Schritt
   wechselt, **Then** wechselt der Inhalt ohne Gleit oder Zoombewegung, höchstens mit einer kurzen
   Überblendung.

---

### User Story 2 · Angaben prüfen und absenden (Priority: P1)

Nach dem letzten Fragenschritt sieht die Person eine kompakte Übersicht aller Angaben, gruppiert nach
Schritten. Fällt ihr ein Fehler auf, tippt sie auf „Ändern“ beim jeweiligen Schritt, korrigiert ihn
und kommt direkt zur Übersicht zurück. Erst dort schickt sie die Anmeldung ab.

**Why this priority**: Ohne Übersicht kann man in einem Formular mit Schritten nicht mehr alles auf
einen Blick kontrollieren. Die Übersicht ersetzt diesen Überblick und verhindert Tippfehler in der
Mailadresse, über die später Bestätigung und Zahlungslink kommen.

**Independent Test**: Alle Schritte ausfüllen, in der Übersicht beim zweiten Schritt „Ändern“
wählen, einen Wert ändern, zurück zur Übersicht und absenden; die gespeicherte Anmeldung enthält den
geänderten Wert.

**Acceptance Scenarios**:

1. **Given** alle Fragenschritte sind gültig, **When** die Person den letzten Fragenschritt mit
   „Weiter“ verlässt, **Then** erscheint die Übersicht mit allen Angaben, gruppiert und betitelt wie
   die Schritte; leere optionale Felder erscheinen als „Keine Angabe“, Kontrollkästchen als „Ja“ oder
   „Nein“.
2. **Given** die Übersicht ist sichtbar, **When** die Person bei einem Schritt „Ändern“ wählt,
   **Then** erscheint genau dieser Schritt, und sein Hauptknopf heißt „Zurück zur Übersicht“.
3. **Given** die Person korrigiert einen Schritt aus der Übersicht heraus, **When** sie „Zurück zur
   Übersicht“ wählt und der Schritt gültig ist, **Then** erscheint wieder die Übersicht mit dem neuen
   Wert, ohne die Schritte dazwischen erneut zu durchlaufen.
4. **Given** die Übersicht ist sichtbar, **When** die Person „Verbindlich anmelden“ wählt, **Then**
   wird die Anmeldung wie in Spec 001 gesendet, und danach erscheint die bekannte Erfolgsmeldung mit
   Referenz und „Noch jemanden anmelden“.
5. **Given** der Server meldet einen Fehler zu einem bestimmten Feld, **When** die Antwort ankommt,
   **Then** springt das Formular zum Schritt mit diesem Feld und zeigt den Fehler dort an; meldet er
   einen allgemeinen Fehler, bleibt die Übersicht sichtbar und zeigt den Hinweis über dem Knopf.
6. **Given** „Noch jemanden anmelden“ wird gewählt, **When** das Formular neu startet, **Then** ist
   es leer und steht wieder auf Schritt 1; ein Einladungslink bleibt erhalten wie in Spec 001.

---

### User Story 3 · Admin legt die Schritte fest (Priority: P2)

Der Admin ordnet im Feldeditor des Camps die Fragen wie bisher und kann zusätzlich an beliebigen
Stellen einen Schrittwechsel mit Titel einfügen, etwa „Über dich“, „Gesundheit“ und
„Einverständnis“. Alle Fragen nach einem Schrittwechsel bis zum nächsten bilden einen Schritt.
Die Vorschau im Feldeditor zeigt die Schritte so, wie sie öffentlich erscheinen.

**Why this priority**: Sinnvoll benannte Schritte machen das Formular verständlich. Ohne diese Story
funktioniert das Formular trotzdem dank automatischer Aufteilung (FR-010), deshalb P2.

**Independent Test**: Im Feldeditor zwei Schrittwechsel mit Titel einfügen und verschieben; die
öffentliche Anmeldung zeigt danach genau diese Schritte mit diesen Titeln in dieser Reihenfolge.

**Acceptance Scenarios**:

1. **Given** der Admin fügt im Feldeditor einen Schrittwechsel mit Titel „Gesundheit“ vor der Frage
   „Allergien“ ein, **When** die öffentliche Anmeldung geladen wird, **Then** beginnt mit „Allergien“
   ein neuer Schritt mit dem Titel „Gesundheit“.
2. **Given** ein Schrittwechsel hat einen optionalen Untertitel, **When** der Schritt angezeigt
   wird, **Then** erscheint der Untertitel als kurze Erklärung unter dem Titel.
3. **Given** der Admin verschiebt oder löscht einen Schrittwechsel, **When** die Anmeldung neu
   geladen wird, **Then** folgen die Schritte der neuen Anordnung; Fragen gehen dabei nie verloren.
4. **Given** zwei Schrittwechsel stehen direkt hintereinander oder ein Schrittwechsel steht ganz am
   Ende, **When** die Anmeldung angezeigt wird, **Then** entstehen keine leeren Schritte.
5. **Given** ein Schrittwechsel ist angelegt, **When** Anmeldungen im Adminbereich angezeigt oder als
   CSV exportiert werden, **Then** erscheint der Schrittwechsel weder als Spalte noch als Wert.

---

### Edge Cases

- **Camp ohne eigene Fragen**: Es gibt nur Schritt 1 und die Übersicht; die Fortschrittsanzeige
  zeigt entsprechend zwei Stationen.
- **Kein Schrittwechsel gesetzt**: Die Fragen werden automatisch in Schritte von höchstens vier
  Fragen geteilt (FR-010); diese Schritte tragen den neutralen Titel „Weitere Angaben“.
- **Sehr langer Schritt**: Setzt der Admin zwanzig Fragen in einen Schritt, wird dieser Schritt so
  angezeigt; die Vorschau im Feldeditor weist ab mehr als sechs Fragen in einem Schritt dezent darauf
  hin.
- **Anmeldefenster schließt während des Ausfüllens**: Wie in Spec 001 lehnt der Server ab; die
  Übersicht zeigt die Meldung des Servers, eingegebene Werte bleiben erhalten.
- **Platz in einer Auswahl wird während des Ausfüllens knapp**: Der Server meldet den Fehler zum
  Feld, das Formular springt zum Schritt dieses Felds (User Story 2, Szenario 5).
- **Admin ändert die Felder, während jemand ausfüllt**: Das offene Formular nutzt weiter den Stand
  beim Laden; der Server prüft beim Absenden gegen den aktuellen Stand wie in Spec 001.
- **Seite wird neu geladen**: Eingaben gehen verloren wie heute; Zwischenspeichern ist nicht Teil
  dieser Spec.
- **Zurück im Browser**: Die Browser Zurücktaste verlässt die Seite nicht unbemerkt mitten im
  Formular nur wegen eines Schrittwechsels; Schrittwechsel erzeugen keine eigenen Verlaufseinträge.
- **Schmaler Bildschirm**: Auf Smartphones bleibt die Fortschrittsanzeige lesbar (bei vielen
  Schritten als „Schritt 2 von 5“ mit Balken statt einzelner Titel), und Weiter und Zurück sind
  ohne Zielen mit dem Daumen erreichbar.
- **Tastatur und Screenreader**: Ein Schrittwechsel wird angesagt („Schritt 2 von 5: Gesundheit“),
  der Fokus wandert auf den Schritttitel, und alle Bedienelemente sind per Tastatur erreichbar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Das öffentliche Anmeldeformular MUSS seine Felder in Schritte aufteilen und immer nur
  einen Schritt gleichzeitig zeigen.
- **FR-002**: Schritt 1 MUSS immer aus Vorname, Nachname und Mail bestehen und den Titel „Deine
  Daten“ tragen; ein Einladungshinweis aus Spec 001 erscheint in diesem Schritt.
- **FR-003**: Nach dem letzten Fragenschritt MUSS eine Übersicht aller Angaben folgen, gruppiert nach
  Schritten, mit „Ändern“ je Schritt und dem Knopf zum verbindlichen Absenden.
- **FR-004**: Eine Fortschrittsanzeige MUSS die Anzahl der Schritte einschließlich Übersicht, den
  aktuellen Schritt und dessen Titel zeigen.
- **FR-005**: „Weiter“ MUSS nur die Felder des aktuellen Schritts mit denselben Regeln wie Spec 001
  prüfen und bei Fehlern im Schritt bleiben, Fehler am Feld zeigen und das erste fehlerhafte Feld
  fokussieren.
- **FR-006**: „Zurück“ MUSS ab Schritt 2 jederzeit möglich sein, ohne Prüfung und ohne Verlust
  eingegebener Werte.
- **FR-007**: Vor dem Absenden MÜSSEN alle Schritte erneut geprüft werden; ist einer ungültig,
  springt das Formular zum ersten ungültigen Schritt.
- **FR-008**: Feldbezogene Fehler des Servers MÜSSEN zum Schritt des ersten betroffenen Felds führen
  und dort angezeigt werden; allgemeine Fehler erscheinen in der Übersicht.
- **FR-009**: Admins MÜSSEN im Feldeditor Schrittwechsel mit Pflichttitel und optionalem Untertitel
  anlegen, umbenennen, verschieben und löschen können, genauso wie Fragen.
- **FR-010**: Enthält ein Camp keine Schrittwechsel, MÜSSEN seine Fragen automatisch in Schritte von
  höchstens vier Fragen in ihrer Reihenfolge geteilt werden, mit dem Titel „Weitere Angaben“.
- **FR-011**: Leere Schritte (aufeinanderfolgende Schrittwechsel, Schrittwechsel am Ende) MÜSSEN
  ausgelassen werden.
- **FR-012**: Schrittwechsel MÜSSEN reine Gliederung sein: Sie erzeugen keinen Wert in der
  Anmeldung, keine Spalte in der Tabelle, keinen Eintrag im CSV Export und keine Prüfregel.
- **FR-013**: Der Wechsel zwischen Schritten MUSS animiert sein: ruhig, kurz (höchstens etwa
  400 Millisekunden), in Richtung der Bewegung (vorwärts nach links, zurück nach rechts); die Höhe
  des Formulars passt sich weich an den neuen Inhalt an, ohne dass die Seite springt.
- **FR-014**: Ist „Bewegung reduzieren“ eingestellt, MÜSSEN Gleit, Zoom und Höhenanimationen
  entfallen; erlaubt ist nur eine kurze Überblendung.
- **FR-015**: Beim Schrittwechsel MUSS der Fokus auf den Titel des neuen Schritts gehen, der Wechsel
  MUSS für Screenreader angesagt werden, und der Anfang des Formulars MUSS sichtbar sein, falls er
  aus dem Bild gescrollt war.
- **FR-016**: Enter in einem einzeiligen Feld MUSS „Weiter“ auslösen; nur in der Übersicht sendet
  der Hauptknopf die Anmeldung.
- **FR-017**: Die Vorschau im Feldeditor MUSS die Schritte so zeigen, wie sie öffentlich erscheinen.
- **FR-018**: Alle Regeln aus Spec 001 bleiben unverändert: Feldprüfung, Anmeldefenster, Plätze je
  Auswahl, Einladungslinks, Missbrauchsschutz, Erfolgsmeldung und „Noch jemanden anmelden“.
- **FR-019**: Alle neuen Texte (Knöpfe, Fortschritt, Übersicht, Ansagen, Feldeditor) MÜSSEN deutsch
  sein und im zentralen Textmodul stehen.
- **FR-020**: Es bleibt genau ein öffentliches Anmeldeformular; die Schrittlogik ersetzt die heutige
  lange Liste und entsteht nicht als zweite Variante daneben.

### Key Entities

- **Schritt**: Eine Gruppe von Fragen, die gemeinsam angezeigt wird. Hat Titel, optionalen
  Untertitel, Position und die zugehörigen Fragen. Wird aus der Feldliste des Camps abgeleitet, nicht
  separat gespeichert.
- **Schrittwechsel**: Ein Eintrag in der Feldliste des Camps, der einen neuen Schritt beginnt. Hat
  Titel, optionalen Untertitel und eine Position wie jede Frage, aber keinen Antwortwert.
- **Übersicht**: Der abschließende Schritt, der alle Angaben nach Schritten gruppiert zeigt.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Bei einem Camp mit zwölf Fragen zeigt kein Schritt mehr als die vom Admin gesetzten
  Fragen, ohne Schrittwechsel nie mehr als vier Fragen gleichzeitig; auf einem Smartphone passt
  Schritt 1 samt Knöpfen ohne Scrollen auf den Bildschirm.
- **SC-002**: Eine Testperson füllt eine Anmeldung mit zwölf Fragen auf dem Smartphone in unter
  4 Minuten aus.
- **SC-003**: 100 % der eingegebenen Werte bleiben beim Vor und Zurückspringen sowie beim Ändern aus
  der Übersicht erhalten.
- **SC-004**: Jeder Schrittwechsel ist in unter einer halben Sekunde abgeschlossen und ruckelt auf
  einem durchschnittlichen Smartphone nicht sichtbar.
- **SC-005**: Die gesamte Anmeldung ist allein per Tastatur ausfüllbar und absendbar, und jeder
  Schrittwechsel wird von einem Screenreader angesagt.
- **SC-006**: Ein Admin legt drei benannte Schritte in unter 2 Minuten im Feldeditor an.

## Assumptions

- Schritt 1 ist fest (Vorname, Nachname, Mail), weil diese Felder in jedem Camp gleich sind und die
  Mail für Bestätigung und Zahlungslink zuerst stimmen muss.
- Der Schrittwechsel ist ein weiterer Eintrag in der bestehenden Feldliste des Camps und wird dort
  mit denselben Mitteln angeordnet wie Fragen; eine separate Schrittverwaltung ist nicht nötig.
- Die Grenze von vier Fragen pro automatischem Schritt und der Hinweis ab sechs Fragen sind
  begründete Vorgaben für kurze Bildschirme und können später angepasst werden.
- Zwischenspeichern über ein Neuladen der Seite hinweg ist nicht Teil dieser Spec.
- Die Prüfung beim Absenden auf dem Server bleibt die maßgebliche; die Prüfung je Schritt im Browser
  dient nur der schnellen Rückmeldung.
- Das Aussehen folgt dem bestehenden Erscheinungsbild der Landingpage (Spec 002); diese Spec ändert
  nur Aufbau und Bewegung des Formulars.
- Admin Dialoge zum Anlegen und Bearbeiten von Anmeldungen bleiben einseitig; Schritte gelten nur für
  das öffentliche Formular.
