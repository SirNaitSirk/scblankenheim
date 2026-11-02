# Feature Specification: Bedingte Formularfelder

**Feature Branch**: `037-conditional-form-fields`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Da das Camp für einen bestimmten Personenkreis ist und Leute eingeladen werden können, möchten wir wissen, wer von wem eingeladen wurde, falls man das anklickt. Ich werde bei Jugend die Auswahl „Eingeladen“ mit einbringen, hier sollte dann noch ein Pflichtfeld aufploppen, wo man den Namen der jeweiligen Person eingeben kann."

**Kontext**: Das Anmeldeformular eines Camps besteht aus festen Grundfeldern und den eigenen Feldern
des Camps. Heute ist jedes Feld immer sichtbar. Ein Feld, das nur bei einer bestimmten Antwort
erscheint und nur dann Pflicht ist, lässt sich nicht abbilden. Statt eines Sonderfalls nur für
„Eingeladen von“ bekommt jedes Feld eine optionale Regel „nur anzeigen, wenn“. Damit lassen sich
später auch andere Rückfragen abbilden (etwa „Welche Allergien?“ nur bei „Ja“).

**Produktentscheidungen (mit dem Projektverantwortlichen geklärt am 2026-11-02)**:

- Admins stellen die Bedingung im Feldeditor ein: ein Auswahlfeld desselben Camps und eine oder
  mehrere seiner Antworten.
- Das Feld erscheint im Formular nur bei erfüllter Bedingung und verschwindet wieder, wenn die
  Antwort geändert wird.
- Ein bedingtes Pflichtfeld ist nur Pflicht, solange es sichtbar ist. Der Server prüft die
  Bedingung selbst und verwirft Werte ausgeblendeter Felder.
- Hängt ein Feld an einer Antwort, verhindert der Feldeditor das Umbenennen oder Löschen dieser
  Antwort und das Löschen des Auslöserfelds und nennt das abhängige Feld.
- Im Anmeldedialog der Admins gilt dieselbe Bedingung wie im öffentlichen Formular.
- Auf der Teilnehmerseite erscheint ein ausgefülltes bedingtes Feld unter „Meine Angaben“ und kann
  wie andere eigene Angaben zur Änderung angefragt werden.
- „Eingeladen von“ ist ein freies Textfeld. Es gibt keine Auswahl aus bestehenden Anmeldungen, damit
  im öffentlichen Formular keine Namen anderer Personen erscheinen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Bedingung im Feldeditor einstellen (Priority: P1)

Eine Admin ergänzt beim Feld „Jugend“ die Antwort „Eingeladen“. Dann legt sie das Textfeld
„Eingeladen von“ als Pflichtfeld an und stellt im Feldeditor ein: „Nur anzeigen, wenn Jugend ist
Eingeladen“. In der Feldliste ist am Feld „Eingeladen von“ erkennbar, dass es bedingt ist und
woran es hängt.

**Why this priority**: Ohne diese Einstellung gibt es kein bedingtes Feld.

**Independent Test**: Auf der Felderseite eines Camps ein Textfeld anlegen, die Bedingung auf ein
Auswahlfeld und eine Antwort setzen, speichern, Dialog erneut öffnen: Die Bedingung ist erhalten
und in der Feldliste sichtbar.

**Acceptance Scenarios**:

1. **Given** der Feldeditor eines Feldes, **When** die Admin ihn öffnet, **Then** gibt es die
   Einstellung „Nur anzeigen, wenn“, standardmäßig aus.
2. **Given** die Einstellung ist an, **When** die Admin das Auslöserfeld wählt, **Then** stehen nur
   Auswahlfelder desselben Camps zur Wahl, die selbst keine Bedingung haben, und nicht das Feld
   selbst.
3. **Given** ein gewähltes Auslöserfeld, **When** die Admin Antworten wählt, **Then** kann sie
   eine oder mehrere seiner Antworten ankreuzen. Speichern ohne mindestens eine Antwort wird mit
   einer deutschen Meldung abgelehnt.
4. **Given** ein bedingtes Feld, **When** die Feldliste angezeigt wird, **Then** steht am Feld ein
   Hinweis wie „Nur bei Jugend: Eingeladen“.
5. **Given** ein bedingtes Feld, **When** die Admin die Einstellung wieder ausschaltet und
   speichert, **Then** ist das Feld wieder immer sichtbar.
6. **Given** ein Feld, an dem schon ein anderes Feld hängt, **When** die Admin diesem Feld selbst
   eine Bedingung geben will, **Then** wird das abgelehnt und das abhängige Feld genannt.

---

### User Story 2 · Bedingtes Feld im öffentlichen Formular (Priority: P1)

Eine Person meldet sich an. Bei „Jugend“ wählt sie „Eingeladen“. Direkt darunter erscheint
„Eingeladen von“ als Pflichtfeld. Sie trägt den Namen ein und sendet ab. Die Anmeldung speichert
den Namen. Wählt jemand eine andere Jugend, erscheint das Feld nicht und muss nicht ausgefüllt
werden.

**Why this priority**: Das ist der eigentliche Zweck: wissen, wer von wem eingeladen wurde.

**Independent Test**: Mit der Formular Testansicht (specs/036) oder der Landingpage beide Wege
durchspielen: mit „Eingeladen“ ohne Namen absenden (Fehler), mit Namen (gültig), mit anderer
Antwort ohne Namen (gültig).

**Acceptance Scenarios**:

1. **Given** das Formular, **When** bei „Jugend“ noch nichts oder etwas anderes als „Eingeladen“
   gewählt ist, **Then** ist „Eingeladen von“ nicht zu sehen.
2. **Given** das Formular, **When** die Person „Eingeladen“ wählt, **Then** erscheint „Eingeladen
   von“ sofort, ohne Neuladen, mit Pflichtkennzeichnung.
3. **Given** „Eingeladen von“ ist sichtbar und leer, **When** die Person weitergehen oder absenden
   will, **Then** erscheint die übliche Pflichtfeldmeldung an diesem Feld.
4. **Given** die Person hat einen Namen eingetragen, **When** sie danach eine andere Jugend wählt,
   **Then** verschwindet das Feld, blockiert das Absenden nicht mehr, und der eingetragene Name
   wird nicht gespeichert.
5. **Given** eine Anfrage an den Server, die bei anderer Jugend trotzdem einen Namen mitschickt,
   **When** sie verarbeitet wird, **Then** wird der Name verworfen und nicht gespeichert.
6. **Given** eine Anfrage an den Server mit „Eingeladen“ und ohne Namen, **When** sie verarbeitet
   wird, **Then** wird sie mit der Pflichtfeldmeldung an „Eingeladen von“ abgelehnt, auch wenn die
   Prüfung im Browser umgangen wurde.
7. **Given** das Formular mit Tastatur oder Bildschirmleser, **When** das Feld erscheint oder
   verschwindet, **Then** bleibt das Formular bedienbar und das Erscheinen wird angesagt.

---

### User Story 3 · Angabe im Adminbereich sehen und bearbeiten (Priority: P2)

Das Team sieht in der Anmeldetabelle eine Spalte „Eingeladen von“, kann danach filtern und sie
exportieren. Im Anmeldedialog erscheint das Feld nur, wenn bei der Anmeldung „Eingeladen“ gewählt
ist. Ändert eine Admin die Jugend dort auf eine andere Antwort und speichert, wird der Name
entfernt.

**Why this priority**: Die Information soll beim Team ankommen, aber die Erfassung (Story 1 und 2)
kommt zuerst.

**Independent Test**: Eine Anmeldung mit „Eingeladen“ und Namen anlegen, Tabelle, Filter, CSV
Export und Anmeldedialog prüfen, dann im Dialog die Jugend ändern und speichern.

**Acceptance Scenarios**:

1. **Given** die Anmeldetabelle, **When** die Spaltenauswahl geöffnet wird, **Then** steht
   „Eingeladen von“ wie jedes andere Feld zur Wahl, und Filter und CSV Export enthalten es.
2. **Given** der Anmeldedialog einer Anmeldung mit „Eingeladen“, **When** er geöffnet wird,
   **Then** ist „Eingeladen von“ sichtbar und bearbeitbar.
3. **Given** der Anmeldedialog einer Anmeldung mit anderer Jugend, **When** er geöffnet wird,
   **Then** ist „Eingeladen von“ nicht sichtbar.
4. **Given** der Anmeldedialog, **When** die Admin die Jugend auf „Eingeladen“ setzt und den Namen
   leer lässt, **Then** wird das Speichern mit der Pflichtfeldmeldung abgelehnt.
5. **Given** der Anmeldedialog, **When** die Admin die Jugend von „Eingeladen“ auf eine andere
   Antwort ändert und speichert, **Then** wird der gespeicherte Name entfernt.
6. **Given** eine Admin legt eine Anmeldung neu an, **When** sie das Formular ausfüllt, **Then**
   gelten dieselben Regeln wie im öffentlichen Formular.

---

### User Story 4 · Angabe auf der Teilnehmerseite (Priority: P3)

Die angemeldete Person sieht auf ihrer Teilnehmerseite unter „Meine Angaben“ auch „Eingeladen
von“, wenn es ausgefüllt ist, und kann wie bei anderen Angaben eine Änderung anfragen.

**Why this priority**: Nützlich für Korrekturen, aber nicht nötig für den Kern.

**Independent Test**: Teilnehmerseite einer Anmeldung mit und ohne „Eingeladen“ öffnen und eine
Änderungsanfrage zu „Eingeladen von“ stellen.

**Acceptance Scenarios**:

1. **Given** eine Anmeldung mit „Eingeladen“ und Namen, **When** die Person ihre Teilnehmerseite
   öffnet, **Then** steht „Eingeladen von“ mit dem Namen unter „Meine Angaben“.
2. **Given** eine Anmeldung mit anderer Jugend, **When** die Teilnehmerseite geöffnet wird,
   **Then** erscheint „Eingeladen von“ dort nicht.
3. **Given** eine Anmeldung mit sichtbarem „Eingeladen von“, **When** die Person dafür eine
   Änderung anfragt, **Then** läuft das wie bei jedem anderen eigenen Feld.
4. **Given** eine Änderungsanfrage, die die Jugend von „Eingeladen“ weg ändert, **When** eine
   Admin sie übernimmt, **Then** wird der gespeicherte Name entfernt.

---

### User Story 5 · Schutz vor kaputten Bedingungen (Priority: P2)

Eine Admin will die Antwort „Eingeladen“ umbenennen, löschen oder das Feld „Jugend“ löschen.
Weil „Eingeladen von“ daran hängt, lehnt der Feldeditor das ab und sagt, welches Feld betroffen
ist. Erst nach Entfernen oder Anpassen der Bedingung geht es.

**Why this priority**: Ohne den Schutz würde ein Pflichtfeld still nie mehr erscheinen.

**Independent Test**: Bei einem Auslöserfeld mit abhängigem Feld die betroffene Antwort umbenennen,
löschen und das Feld löschen: Jeder Versuch wird mit Nennung des abhängigen Feldes abgelehnt.

**Acceptance Scenarios**:

1. **Given** „Eingeladen von“ hängt an „Jugend: Eingeladen“, **When** die Admin die Antwort
   „Eingeladen“ umbenennt oder entfernt und speichert, **Then** wird das abgelehnt mit einer
   Meldung, die „Eingeladen von“ nennt.
2. **Given** dasselbe, **When** die Admin das Feld „Jugend“ löscht oder seinen Typ von Auswahl auf
   etwas anderes ändert, **Then** wird das ebenso abgelehnt.
3. **Given** dasselbe, **When** die Admin andere Antworten von „Jugend“ ändert, ergänzt oder
   umsortiert, **Then** ist das erlaubt.
4. **Given** die Bedingung wurde zuerst entfernt, **When** die Admin danach die Antwort umbenennt,
   **Then** ist das erlaubt.
5. **Given** die Schutzregel, **When** die Änderung auf anderem Weg als über den Feldeditor an den
   Server geschickt wird, **Then** prüft der Server dieselbe Regel.

---

### Edge Cases

- Ein Camp ohne bedingte Felder verhält sich genau wie heute.
- Bestehende Anmeldungen, die vor dem Anlegen einer Bedingung schon einen Wert im abhängigen Feld
  haben, behalten ihn. Erst beim nächsten Speichern über Dialog oder übernommene Änderungsanfrage
  gilt die Regel.
- Bestehende Anmeldungen mit „Eingeladen“, aber ohne Namen (etwa weil das Feld später angelegt
  wurde), bleiben gültig. Erst beim Speichern im Anmeldedialog wird der Name verlangt.
- Das bedingte Feld steht in der Reihenfolge vor seinem Auslöserfeld oder in einem anderen Schritt:
  Die Bedingung gilt trotzdem. Der Feldeditor weist darauf hin, dass ein bedingtes Feld sinnvoll
  nach seinem Auslöserfeld steht.
- Ein bedingtes Feld liegt in einem Schritt, in dem sonst nichts sichtbar ist: Der Schritt bleibt
  bestehen und zeigt nur die übrigen Felder bzw. ist leer. Die Testansicht macht das sichtbar.
- Ein Kontrollkästchen ist bedingt und Pflicht: Es muss nur angekreuzt sein, solange es sichtbar
  ist.
- Das feste Grundfeld Geschlecht ist ein Auswahlfeld und kann Auslöser sein. Grundfelder selbst
  können keine Bedingung bekommen.
- Schrittmarken können keine Bedingung bekommen und sind keine Auslöser.
- Ein bedingtes Feld wird als Busfrage (specs/021) oder als Adressfeld der Schulbefreiung
  (specs/020) gewählt: Das bleibt erlaubt. Ist es ausgeblendet, zählt es dort als nicht beantwortet.
- Ausgebuchte Antworten des Auslöserfelds (Kapazität pro Antwort) verhalten sich wie heute.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Jedes eigene Feld eines Camps außer Schrittmarken MUSS optional eine Bedingung haben
  können: ein Auslöserfeld und eine nicht leere Liste von dessen Antworten.
- **FR-002**: Auslöser DÜRFEN nur Auswahlfelder desselben Camps sein (eigene oder das Grundfeld
  Geschlecht), nicht das Feld selbst und kein Feld, das selbst eine Bedingung hat. Bedingungen
  haben damit genau eine Ebene.
- **FR-003**: Ein bedingtes Feld MUSS genau dann sichtbar sein, wenn die aktuelle Antwort des
  Auslöserfelds in der Liste der Bedingung steht.
- **FR-004**: Das öffentliche Formular, die Formular Testansicht (specs/036) und der Anmeldedialog
  der Admins MÜSSEN bedingte Felder bei jeder Änderung des Auslöserfelds sofort ein oder
  ausblenden.
- **FR-005**: Die Pflichtangabe eines bedingten Feldes MUSS nur gelten, solange es sichtbar ist.
- **FR-006**: Der Server MUSS bei jeder öffentlichen Anmeldung und Testabsendung die Sichtbarkeit
  selbst bestimmen, Pflichtfelder nur bei Sichtbarkeit verlangen und Werte ausgeblendeter Felder
  verwerfen. Beim Bearbeiten im Anmeldedialog und beim Übernehmen einer Änderungsanfrage MUSS der
  Server Werte nun ausgeblendeter Felder entfernen; die Pflichtprüfung im Anmeldedialog bleibt wie
  heute für alle Felder im Dialog.
- **FR-007**: Der Feldeditor MUSS die Bedingung anlegen, ändern und entfernen lassen, und die
  Feldliste MUSS bedingte Felder mit ihrem Auslöser und den Antworten kennzeichnen.
- **FR-008**: Der Server MUSS das Speichern ablehnen, wenn eine Antwort, auf die sich eine
  Bedingung bezieht, umbenannt oder entfernt wird, wenn ein Auslöserfeld gelöscht oder sein Typ
  geändert wird, oder wenn ein Auslöserfeld selbst eine Bedingung bekommen soll. Die Meldung MUSS
  das abhängige Feld nennen.
- **FR-009**: Bedingte Felder MÜSSEN in Anmeldetabelle, Spaltenauswahl, Filtern und CSV Export wie
  jedes andere Feld erscheinen.
- **FR-010**: Die Teilnehmerseite MUSS ein bedingtes Feld unter „Meine Angaben“ nur zeigen, wenn
  es sichtbar ist und einen Wert hat, und Änderungsanfragen dazu wie bei anderen Feldern erlauben.
  Wird eine Änderung des Auslöserfelds übernommen, gilt FR-006.
- **FR-011**: Die Formulardarstellung MUSS beim Ein und Ausblenden für Tastatur und
  Bildschirmleser bedienbar bleiben; das Erscheinen eines Feldes wird angesagt.
- **FR-012**: Alle sichtbaren Texte MÜSSEN deutsch sein.
- **FR-013**: Camps ohne bedingte Felder MÜSSEN sich unverändert verhalten.

### Key Entities

- **Formularfeld** (bestehend): erhält eine optionale Bedingung aus Auslöserfeld (über seinen
  Schlüssel) und Liste der auslösenden Antworten. Keine neue Tabelle.
- **Anmeldung** (bestehend): speichert den Wert des bedingten Feldes wie jede andere Antwort; bei
  ausgeblendetem Feld keinen Wert.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eine Admin kann „Eingeladen von“ samt Bedingung in unter 2 Minuten anlegen.
- **SC-002**: In 100 % der Anmeldungen mit „Eingeladen“, die nach dem Start eingehen, ist ein Name
  gespeichert.
- **SC-003**: In 0 % der Anmeldungen mit anderer Jugend ist ein Wert in „Eingeladen von“
  gespeichert.
- **SC-004**: Das Team kann für jede eingeladene Person in der Anmeldetabelle ohne Umweg sehen,
  von wem sie eingeladen wurde, und die Liste exportieren.
- **SC-005**: Kein Umbenennen, Löschen oder Typwechsel lässt ein bedingtes Feld unbemerkt dauerhaft
  verschwinden.

## Assumptions

- Bedingungen haben genau eine Ebene: Ein Auslöser ist nie selbst bedingt. Ketten sind nicht Teil
  dieses Features.
- Eine Bedingung vergleicht nur auf „Antwort ist eine von“. Andere Vergleiche (ist nicht, Zahl
  größer als, Kontrollkästchen angekreuzt) sind nicht Teil dieses Features.
- Ein Feld hat höchstens eine Bedingung.
- Der Name in „Eingeladen von“ wird nicht gegen bestehende Anmeldungen geprüft.
- Die Datenschutzerklärung muss nicht angepasst werden, weil nur eine weitere Formularangabe der
  Person selbst gespeichert wird. Das wird im Plan gegen den Text geprüft.
- Mails zeigen bedingte Felder so, wie sie heute eigene Felder zeigen.
