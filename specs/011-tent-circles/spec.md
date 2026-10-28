# Feature Specification: Zeltkreise

**Feature Branch**: `011-tent-circles`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Im Summercamp haben wir immer Zeltkreise. Das sind kleine Gruppen, in denen wir uns treffen und Themen besprechen. Hier möchte ich auch eine Art Zuweisung haben wie in der Zimmerzuweisung. Es gibt immer einen Zeltkreisleiter, der beliebig viele Teilnehmer haben kann. Setz das bitte so ähnlich um."

**Kontext**: Zeltkreise werden heute außerhalb der Plattform eingeteilt. Die Zimmerplanung
(specs/008-room-planning) hat gezeigt, wie die Planerin Personen übersichtlich per Drag and Drop und
per Klick zuordnet. Zeltkreise sollen sich genauso anfühlen, mit zwei Unterschieden: Es gibt keine
Bettenzahl, also keine Obergrenze, und jeder Zeltkreis hat genau einen Leiter.

Getroffene Entscheidungen (vom Projektinhaber bestätigt):

1. Der Zeltkreisleiter ist selbst eine angemeldete Person des Camps und wird aus den Anmeldungen
   gewählt. Wer einen Zeltkreis leitet, ist nicht gleichzeitig Teilnehmer eines Zeltkreises.
2. Pro Zeltkreis ist einstellbar, ob er gemischt, nur weiblich oder nur männlich ist.
3. Zeltkreise gehören zu genau einem Camp und werden jedes Jahr neu angelegt (Name und Leiter).
4. Die Bedienung folgt der Zimmerplanung: Drag and Drop und Klick, Suche und Filter, Druckansicht.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Zeltkreise mit Leiter anlegen (Priority: P1)

Die Planerin öffnet im Adminbereich den Tab „Zeltkreise“. Für das aktuelle Camp legt sie Zeltkreise
an: Sie gibt einen Namen ein (zum Beispiel „Zeltkreis Senfkorn“), wählt den Leiter aus den Anmeldungen
und legt fest, ob der Zeltkreis gemischt, nur weiblich oder nur männlich ist. Jeder Zeltkreis erscheint
als Karte mit Name, Leiter, Art und Zahl der Teilnehmer. Sie kann Name, Leiter und Art später ändern,
die Reihenfolge festlegen und Zeltkreise löschen.

**Why this priority**: Ohne Zeltkreise gibt es nichts zuzuordnen.

**Independent Test**: Drei Zeltkreise mit je einem Leiter anlegen, einen umbenennen, bei einem den
Leiter wechseln, einen löschen. Seite neu laden: alles ist gespeichert. Ein anderes Camp als aktuell
setzen: dort gibt es keine Zeltkreise.

**Acceptance Scenarios**:

1. **Given** im aktuellen Camp gibt es noch keine Zeltkreise, **When** die Planerin den Tab öffnet,
   **Then** erklärt ein leerer Zustand, was Zeltkreise sind, mit einer Schaltfläche „Zeltkreis anlegen“.
2. **Given** der Dialog „Zeltkreis anlegen“, **When** die Planerin Name, Leiter und Art angibt und
   speichert, **Then** erscheint die Karte sofort, der Leiter steht hervorgehoben oben auf der Karte
   und verschwindet aus der Liste der Unverteilten.
3. **Given** die Leiterauswahl, **When** die Planerin sie öffnet, **Then** kann sie per Namen suchen
   und sieht nur aktive Anmeldungen des aktuellen Camps, die noch keinen anderen Zeltkreis leiten und
   zur Art des Zeltkreises passen.
4. **Given** die gewählte Person ist bereits Teilnehmer eines anderen Zeltkreises, **When** sie als
   Leiter gespeichert wird, **Then** wird sie dort als Teilnehmer entfernt und ein Hinweis nennt das.
5. **Given** ein Zeltkreis mit Teilnehmern, **When** die Planerin ihn löschen will, **Then** fragt eine
   Bestätigung nach und nennt die Zahl der Teilnehmer. Nach Bestätigung sind Leiter und Teilnehmer
   wieder unverteilt.
6. **Given** ungültige Eingaben (kein Name, kein Leiter), **When** gespeichert wird, **Then** erscheint
   eine deutsche Fehlermeldung am Feld und nichts wird gespeichert.

---

### User Story 2 · Teilnehmer auf Zeltkreise verteilen (Priority: P1)

Neben den Zeltkreiskarten steht die Liste der noch nicht verteilten Teilnehmer. Die Planerin zieht
eine Person auf einen Zeltkreis oder tippt sie an und wählt dann einen Zeltkreis. Die Person erscheint
sofort im Zeltkreis, die Teilnehmerzahl zählt hoch, und die Person verschwindet aus der Liste der
Unverteilten. Ein Zeltkreis hat keine Obergrenze.

**Why this priority**: Das ist der eigentliche Wunsch.

**Independent Test**: Eine Person per Drag and Drop und eine per Klick zuordnen, eine verschieben, eine
entfernen, Seite neu laden. Alle Änderungen sind gespeichert.

**Acceptance Scenarios**:

1. **Given** ein aktuelles Camp mit Zeltkreisen und Anmeldungen, **When** die Planerin den Tab öffnet,
   **Then** sieht sie alle Zeltkreise mit Leiter, Art und Teilnehmern sowie die Liste der Unverteilten,
   gruppiert nach weiblich, männlich und „Geschlecht fehlt“, mit Anzahl je Gruppe.
2. **Given** eine unverteilte Person, **When** die Planerin sie auf einen passenden Zeltkreis zieht,
   **Then** steht sie im Zeltkreis, die Teilnehmerzahl steigt um eins und die Änderung ist gespeichert.
3. **Given** dasselbe auf einem Touchgerät, **When** die Planerin die Person antippt und „Zeltkreis
   wählen“ nutzt, **Then** werden nur Zeltkreise angeboten, deren Art zur Person passt, und nach der
   Auswahl ist die Person zugeordnet.
4. **Given** eine zugeordnete Person, **When** die Planerin sie auf einen anderen passenden Zeltkreis
   zieht oder „Aus Zeltkreis entfernen“ wählt, **Then** wechselt sie den Zeltkreis beziehungsweise steht
   wieder in der Liste der Unverteilten.
5. **Given** eine männliche Person wird über einen Zeltkreis „nur weiblich“ gezogen, **When** sie
   losgelassen wird, **Then** wird sie nicht zugeordnet, der Zeltkreis zeigt während des Ziehens
   sichtbar, dass er nicht passt, und ein kurzer Hinweis erklärt den Grund.
6. **Given** eine Person ohne Geschlechtsangabe, **When** sie zugeordnet werden soll, **Then** kann sie
   nur in gemischte Zeltkreise. Das Geschlecht lässt sich direkt in der Gruppe „Geschlecht fehlt“
   nachtragen, wie in der Zimmerplanung.
7. **Given** das Speichern schlägt fehl, **When** eine Zuordnung gemacht wird, **Then** springt die
   Person an ihren vorherigen Platz zurück und eine deutsche Fehlermeldung erscheint.

---

### User Story 3 · Art und Leiter ändern (Priority: P2)

Die Planerin stellt fest, dass ein Zeltkreis doch gemischt sein soll, oder dass ein anderer Leiter
besser passt. Sie ändert das im Bearbeiten Dialog der Karte.

**Why this priority**: Kommt im Laufe der Planung regelmäßig vor, die Grundfunktion geht aber ohne.

**Independent Test**: Einen gemischten Zeltkreis mit Personen beider Geschlechter auf „nur weiblich“
stellen wollen (wird abgelehnt). Leiter wechseln: der alte Leiter ist danach unverteilt.

**Acceptance Scenarios**:

1. **Given** ein gemischter Zeltkreis enthält Personen beider Geschlechter, **When** die Planerin ihn
   auf „nur weiblich“ stellen will, **Then** wird das abgelehnt mit dem Hinweis, wie viele Personen
   zuerst umverteilt werden müssen.
2. **Given** ein Zeltkreis hat einen Leiter, **When** die Planerin einen anderen Leiter wählt, **Then**
   ist der neue Leiter gesetzt und der bisherige Leiter steht wieder in der Liste der Unverteilten.
3. **Given** ein Zeltkreis „nur männlich“, **When** die Planerin eine weibliche Person als Leiterin
   wählen will, **Then** wird sie nicht angeboten.

---

### User Story 4 · Personen suchen und filtern (Priority: P2)

Bei vielen Teilnehmern sucht die Planerin gezielt: per Name oder per Filter nach Geschlecht, Alter
(von bis) und jedem Feld des Anmeldeformulars, zum Beispiel „Jugendgruppe“. So kann sie Personen aus
derselben Jugendgruppe gezielt auf verschiedene Zeltkreise verteilen oder Gleichaltrige zusammenlegen.

**Why this priority**: Macht das Verteilen schnell, ist aber für die Grundfunktion nicht zwingend.

**Independent Test**: Filter Alter 15 bis 16 und ein Formularfeld setzen. Nur passende Personen
bleiben in der Liste, passende Personen in Zeltkreisen sind hervorgehoben.

**Acceptance Scenarios**:

1. **Given** die Liste der Unverteilten, **When** die Planerin Filter setzt, **Then** verhalten sich
   Suche und Filter genauso wie in der Zimmerplanung (gleiche Filterarten, gleiche Bedienung).
2. **Given** aktive Filter, **When** die Planerin auf die Zeltkreise schaut, **Then** sind passende
   Personen hervorgehoben (auch Leiter) und alle anderen abgeschwächt.

---

### User Story 5 · Überblick und Ausdruck (Priority: P3)

Oben im Tab sieht die Planerin auf einen Blick: Zahl der Zeltkreise, verteilte und unverteilte
Personen sowie die durchschnittliche Größe eines Zeltkreises. Jede Karte zeigt zusätzlich, wie viele
weibliche und männliche Personen darin sind. Die fertige Einteilung kann sie als Druckansicht ausgeben
(Zeltkreis, Leiter, Teilnehmer), um sie vor Ort aufzuhängen oder den Leitern mitzugeben.

**Why this priority**: Hilft, die Gruppen ausgewogen zu halten, ist aber nicht zwingend.

**Independent Test**: Kennzahlen mit der tatsächlichen Einteilung vergleichen. Druckansicht öffnen
und prüfen, dass jeder Zeltkreis mit Leiter und allen Namen erscheint.

**Acceptance Scenarios**:

1. **Given** 4 Zeltkreise mit 30 verteilten Teilnehmern, 4 Leitern und 6 unverteilten Personen,
   **When** die Planerin den Tab öffnet, **Then** zeigen die Kennzahlen 4 Zeltkreise, 30 verteilt,
   6 unverteilt und durchschnittlich 7,5 Teilnehmer je Zeltkreis.
2. **Given** eine fertige Einteilung, **When** die Planerin „Drucken“ wählt, **Then** erscheint eine
   schlichte Druckansicht mit jedem Zeltkreis, seinem Leiter und den Teilnehmern, alphabetisch sortiert.

---

### Edge Cases

- Die Anmeldung eines Leiters wird storniert oder gelöscht: Der Zeltkreis bleibt bestehen, die Karte
  zeigt deutlich „Leiter fehlt“ und bietet „Leiter wählen“ an. Die Teilnehmer bleiben zugeordnet.
- Eine Anmeldung eines Teilnehmers wird storniert oder gelöscht: Die Person erscheint nicht mehr und
  zählt nicht mit. Wird die Anmeldung wieder aktiv, steht sie wieder in ihrem Zeltkreis, sofern der
  noch existiert und die Art passt, sonst in der Liste der Unverteilten.
- Das Geschlecht einer zugeordneten Person ändert sich so, dass es nicht mehr zum Zeltkreis passt: Die
  Zuordnung wird aufgehoben, die Person steht in der Liste der Unverteilten. Betrifft das einen Leiter,
  zeigt der Zeltkreis „Leiter fehlt“.
- Zwei Admins arbeiten gleichzeitig: Eine Person ist nie in zwei Zeltkreisen und nie zugleich Leiter
  und Teilnehmer. Wer zu spät kommt, bekommt einen Hinweis, und die Ansicht aktualisiert sich.
- Es ist kein aktuelles Camp gesetzt: Der Tab zeigt einen Hinweis, zuerst ein aktuelles Camp
  festzulegen.
- Es gibt Zeltkreise, aber noch keine Anmeldungen: Die Karten werden angezeigt, die Liste der
  Unverteilten zeigt einen freundlichen leeren Zustand.
- Kein Treffer für die gesetzten Filter: Die Liste zeigt „Keine passenden Personen“ mit der
  Möglichkeit, die Filter zurückzusetzen.
- Schmaler Bildschirm (Handy): Zeltkreise stehen untereinander, die Liste der Unverteilten ist über eine
  ein und ausklappbare Leiste erreichbar, Zuordnung geht per Antippen und Auswahl.

## Requirements *(mandatory)*

### Functional Requirements

**Tab und Zugriff**

- **FR-001**: Der Adminbereich MUSS einen neuen Tab „Zeltkreise“ haben, der wie die anderen Tabs über
  die sichtbaren Tabs und Berechtigungen eines Admins freigeschaltet wird. Superadmins sehen ihn immer.
- **FR-002**: Alle Lese und Schreibvorgänge der Zeltkreise MÜSSEN serverseitig prüfen, ob der
  angemeldete Admin den Tab nutzen darf, und andernfalls abgelehnt werden.

**Zeltkreise**

- **FR-003**: Admins MÜSSEN im aktuellen Camp Zeltkreise anlegen, umbenennen, sortieren und löschen
  können. Ein Zeltkreis gehört zu genau einem Camp.
- **FR-004**: Jeder Zeltkreis MUSS eine der Arten „Gemischt“, „Nur weiblich“ oder „Nur männlich“
  haben. Neue Zeltkreise starten mit „Gemischt“.
- **FR-005**: Beim Anlegen MUSS ein Leiter gewählt werden. Leiter kann nur eine aktive Anmeldung des
  Camps sein (weder storniert noch gelöscht), deren Geschlecht zur Art des Zeltkreises passt.
- **FR-006**: Eine Person DARF pro Camp höchstens einen Zeltkreis leiten und DARF NICHT zugleich Leiter
  und Teilnehmer sein. Wird eine Teilnehmerin oder ein Teilnehmer zum Leiter gewählt, endet die
  Teilnahme im bisherigen Zeltkreis mit einem Hinweis.
- **FR-007**: Die Art eines Zeltkreises DARF nur geändert werden, wenn alle aktuellen Mitglieder
  (Leiter und Teilnehmer) zur neuen Art passen. Andernfalls nennt die Ablehnung die Zahl der Personen,
  die nicht passen.
- **FR-008**: Beim Löschen eines Zeltkreises mit Teilnehmern MUSS eine Bestätigung die Zahl der
  Teilnehmer nennen. Nach dem Löschen sind Leiter und Teilnehmer unverteilt.

**Zuordnung**

- **FR-009**: Verteilt werden MÜSSEN alle Anmeldungen des aktuellen Camps, die weder storniert noch
  gelöscht sind, unabhängig vom Zahlungsstatus.
- **FR-010**: Eine Person DARF pro Camp höchstens einem Zeltkreis als Teilnehmer zugeordnet sein. Es
  gibt keine Obergrenze an Teilnehmern je Zeltkreis.
- **FR-011**: Eine Person DARF nur einem Zeltkreis zugeordnet werden, dessen Art zu ihrem Geschlecht
  passt. Personen ohne Geschlechtsangabe passen nur zu gemischten Zeltkreisen.
- **FR-012**: Zuordnen, Verschieben und Entfernen MÜSSEN per Drag and Drop mit Maus und zusätzlich per
  Antippen oder Klick mit anschließender Zeltkreisauswahl möglich sein, ebenso über die Tastatur. Die
  Auswahl bietet nur passende Zeltkreise an.
- **FR-013**: Jede Zuordnung MUSS sofort sichtbar und dauerhaft gespeichert sein. Schlägt das Speichern
  fehl, MUSS die Ansicht zum vorherigen Stand zurückkehren und eine deutsche Fehlermeldung zeigen.
- **FR-014**: Beim Ziehen MUSS sichtbar sein, welche Zeltkreise die Person aufnehmen können und welche
  nicht.
- **FR-015**: Stornierte oder gelöschte Anmeldungen DÜRFEN weder als Teilnehmer noch als Leiter
  angezeigt oder gezählt werden. Fehlt dadurch ein Leiter, MUSS die Karte „Leiter fehlt“ zeigen.
- **FR-016**: Ändert sich das Geschlecht einer zugeordneten Person so, dass es nicht mehr zur Art des
  Zeltkreises passt, MUSS ihre Teilnahme beziehungsweise Leitung aufgehoben werden.
- **FR-017**: Die Regeln aus FR-006, FR-010 und FR-011 MÜSSEN auch bei gleichzeitiger Bearbeitung durch
  mehrere Admins gelten.

**Darstellung**

- **FR-018**: Der Tab MUSS alle Zeltkreise des aktuellen Camps als Karten zeigen. Jede Karte zeigt
  Name, Art (Farbe und Text, nicht nur Farbe), den Leiter deutlich abgesetzt, die Teilnehmerzahl, die
  Verteilung weiblich und männlich sowie die Namen der Teilnehmer.
- **FR-019**: Die Liste der unverteilten Personen MUSS nach weiblich, männlich und „Geschlecht fehlt“
  gruppiert und mit Anzahl je Gruppe versehen sein. Das Geschlecht lässt sich in der Gruppe
  „Geschlecht fehlt“ direkt nachtragen. Leiter erscheinen nicht in der Liste.
- **FR-020**: Suche und Filter MÜSSEN denen der Zimmerplanung entsprechen (Name, Geschlecht, Alter zum
  Campbeginn, jedes Feld des Anmeldeformulars). Sie wirken auf die Liste der Unverteilten und heben
  passende Personen in den Zeltkreisen hervor.
- **FR-021**: Oben im Tab MÜSSEN Kennzahlen stehen: Zahl der Zeltkreise, verteilte und unverteilte
  Personen, durchschnittliche Teilnehmerzahl je Zeltkreis.
- **FR-022**: Es MUSS eine Druckansicht geben, die jeden Zeltkreis mit Leiter und alphabetisch
  sortierten Teilnehmern zeigt.
- **FR-023**: Der Tab MUSS Lade, Leer und Fehlerzustände haben und auf Handy, Tablet und Desktop gut
  bedienbar sein. Bedienung und Gestaltung folgen der Zimmerplanung, damit sich beide Tabs gleich
  anfühlen.
- **FR-024**: Alle sichtbaren Texte MÜSSEN deutsch sein.

**Protokoll**

- **FR-025**: Anlegen, Ändern (inklusive Leiterwechsel) und Löschen von Zeltkreisen MÜSSEN im
  bestehenden Log festgehalten werden. Einzelne Zuordnungen von Teilnehmern werden nicht geloggt.

### Key Entities

- **Zeltkreis**: Gehört zu genau einem Camp. Name, Art (gemischt, nur weiblich, nur männlich),
  Reihenfolge, Leiter.
- **Leiter**: Eine Anmeldung des Camps, die genau einen Zeltkreis leitet. Höchstens ein Zeltkreis je
  Person und Camp.
- **Teilnahme**: Verknüpft eine Anmeldung mit einem Zeltkreis. Höchstens eine je Anmeldung und Camp,
  nie zusammen mit einer Leitung.
- **Anmeldung** (bestehend): liefert Name, Geschlecht, Alter und Formularfelder.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Die Planerin teilt 100 Personen in unter 15 Minuten auf Zeltkreise ein, ohne Papier.
- **SC-002**: Eine einzelne Zuordnung dauert höchstens zwei Handgriffe (Ziehen und Loslassen, oder
  Antippen und Zeltkreis wählen) und ist sofort sichtbar.
- **SC-003**: In keinem Fall ist eine Person in zwei Zeltkreisen, zugleich Leiter und Teilnehmer, oder
  in einem Zeltkreis, dessen Art nicht zu ihr passt, auch nicht bei gleichzeitiger Bearbeitung.
- **SC-004**: Innerhalb von 5 Sekunden nach dem Öffnen des Tabs kann die Planerin ablesen, wie viele
  Personen noch unverteilt sind und wie groß die Zeltkreise sind.
- **SC-005**: Die komplette Einteilung lässt sich auf Handy, Tablet und Desktop durchführen.
- **SC-006**: Die Druckansicht ist ohne Nacharbeit aushängbar oder den Leitern mitzugeben.

## Assumptions

- Die Zeltkreise arbeiten immer auf dem aktuellen Camp. Ältere Camps behalten ihre Zeltkreise, werden
  im Tab aber nicht bearbeitet. Ein Kopieren von Zeltkreisen aus dem Vorjahr ist nicht Teil dieser Spec.
- Ein Leiter muss zur Art des Zeltkreises passen (eine Leiterin für „Nur weiblich“, ein Leiter für
  „Nur männlich“). Bei gemischten Zeltkreisen ist jedes Geschlecht möglich.
- Es gibt genau einen Leiter je Zeltkreis, keinen Co Leiter.
- Zeltkreise und Zimmerplanung sind unabhängig voneinander. Es gibt keine automatische Verteilung,
  die Planerin teilt von Hand ein.
- Treffpunkt, Uhrzeit oder Themen der Zeltkreise werden nicht erfasst.
- Die Zahl der Zeltkreise liegt unter 40, die Zahl der Teilnehmer unter 300.

## Dependencies

- **Scope Änderung**: Zeltkreise stehen noch nicht in AGENTS.md Abschnitt 4 (In scope). Constitution
  Prinzip III erlaubt nur Features aus diesem Abschnitt. Vor der Umsetzung wird AGENTS.md Abschnitt 4
  und 5 sowie die Kurzübersicht um Zeltkreise ergänzt. Die Constitution selbst muss nicht geändert
  werden, da Zeltkreise auf keiner MUST NOT Liste stehen.
- **Zimmerplanung** (specs/008-room-planning): Geschlecht der Anmeldung, Personenliste, Suche und
  Filter, Drag and Drop und Druckansicht werden wiederverwendet statt neu gebaut.
- Bestehende Bausteine: Admin Tabs und Berechtigungen, Log, aktuelles Camp.
