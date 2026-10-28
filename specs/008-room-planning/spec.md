# Feature Specification: Zimmerplanung

**Feature Branch**: `008-room-planning`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Es gibt 2 Häuser wo die ganzen Jugendlichen schlafen können, momentan verteilt die Planerin alles auf Papier was sehr aufwendig und unübersichtlich sein kann. Ich möchte einen extra Tab haben, wo sie diese Zuordnung machen kann. Es gibt mehrere Häuser, unterschiedliche Zimmergrößen und Jungen und Mädchen schlafen getrennt. Es soll sehr übersichtlich sein und schön visualisiert."

**Kontext**: Die Zimmerverteilung passiert heute auf Papier. Im Adminbereich gibt es dafür nichts, und
im Anmeldeformular wird das Geschlecht bisher nicht abgefragt. Housing stand in AGENTS.md und in der
Constitution (Prinzip III) bisher ausdrücklich auf der Liste der Dinge, die nicht gebaut werden. Der
Projektinhaber wünscht die Zimmerplanung jetzt ausdrücklich. Vor der Umsetzung werden daher
Constitution und AGENTS.md angepasst (siehe Abhängigkeiten). Eine Warteliste bleibt weiterhin
ausgeschlossen.

Getroffene Entscheidungen:

1. Das Anmeldeformular bekommt ein festes Pflichtfeld „Geschlecht“ mit den Werten „Weiblich“ und
   „Männlich“. Bei bestehenden Anmeldungen ohne Angabe trägt die Planerin es nach.
2. Häuser und Zimmer werden einmal angelegt und gelten für alle Camps. Die Zuordnung der Personen
   gilt jeweils für ein Camp.
3. Ob ein Zimmer weiblich oder männlich belegt wird, wird pro Zimmer und pro Camp festgelegt.
4. Bedienung per Drag and Drop und zusätzlich per Klick, damit es auch auf Tablet und Handy geht.
5. Ein leeres Zimmer übernimmt automatisch das Geschlecht der ersten Person, die hineingezogen wird.
6. Personen lassen sich suchen und filtern, vor allem nach Geschlecht, Alter und den Feldern des
   Anmeldeformulars (zum Beispiel Jugendgruppe).

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Teilnehmende auf Zimmer verteilen (Priority: P1)

Die Planerin öffnet im Adminbereich den Tab „Zimmerplanung“. Sie sieht für das aktuelle Camp alle
Häuser nebeneinander, darin die Zimmer als Karten mit Name, Bettenzahl, Belegung (zum Beispiel „3 von
4 Betten belegt“) und der Farbe für weiblich oder männlich. Daneben steht die Liste der noch nicht
verteilten Teilnehmenden, getrennt nach weiblich und männlich. Sie zieht eine Person auf ein passendes
Zimmer oder tippt die Person an und wählt dann ein Zimmer. Die Person erscheint sofort im Zimmer, die
Belegung zählt hoch, und die Person verschwindet aus der Liste der Unverteilten.

**Why this priority**: Das ist der eigentliche Wunsch. Ohne die Verteilung bringt der Tab keinen Nutzen.

**Independent Test**: Mit angelegten Häusern, Zimmern und Anmeldungen den Tab öffnen, eine Person per
Drag and Drop und eine per Klick zuordnen, Seite neu laden. Beide Zuordnungen sind gespeichert.

**Acceptance Scenarios**:

1. **Given** ein aktuelles Camp mit Anmeldungen und Zimmern, **When** die Planerin den Tab öffnet,
   **Then** sieht sie alle Häuser mit ihren Zimmern, die Belegung jedes Zimmers und die Liste der
   unverteilten Personen, getrennt nach weiblich und männlich, mit Gesamtzahlen.
2. **Given** eine weibliche Person ist unverteilt und ein weibliches Zimmer hat freie Betten, **When**
   die Planerin die Person auf das Zimmer zieht, **Then** steht die Person im Zimmer, die Belegung
   steigt um eins und die Änderung ist gespeichert.
3. **Given** dasselbe auf einem Touchgerät, **When** die Planerin die Person antippt und „Zimmer
   wählen“ nutzt, **Then** werden nur passende Zimmer mit freien Betten angeboten, und nach der Auswahl
   ist die Person zugeordnet.
4. **Given** eine Person ist einem Zimmer zugeordnet, **When** die Planerin sie in ein anderes passendes
   Zimmer zieht oder „Aus Zimmer entfernen“ wählt, **Then** wechselt sie das Zimmer beziehungsweise
   steht wieder in der Liste der Unverteilten.
5. **Given** eine männliche Person wird über ein weibliches Zimmer gezogen, in dem schon mindestens eine
   Person liegt, **When** sie dort losgelassen
   wird, **Then** wird sie nicht zugeordnet, das Zimmer zeigt während des Ziehens sichtbar, dass es
   nicht passt, und ein kurzer Hinweis erklärt den Grund.
6. **Given** ein Zimmer ist voll, **When** eine weitere Person darauf gezogen wird, **Then** wird sie
   nicht zugeordnet und ein Hinweis „Zimmer ist voll“ erscheint.
7. **Given** das Speichern schlägt fehl (zum Beispiel keine Verbindung), **When** eine Zuordnung
   gemacht wird, **Then** springt die Person an ihren vorherigen Platz zurück und eine deutsche
   Fehlermeldung erscheint.
8. **Given** ein leeres Zimmer (nicht festgelegt oder mit dem anderen Geschlecht festgelegt), **When**
   die Planerin eine männliche Person hineinzieht, **Then** wird das Zimmer für dieses Camp
   automatisch männlich, die Person ist zugeordnet und ein kurzer Hinweis „Zimmer ist jetzt
   männlich“ erscheint.

---

### User Story 2 · Häuser und Zimmer anlegen (Priority: P1)

Die Planerin legt die Häuser (zum Beispiel „Haupthaus“ und „Gästehaus“) und darin die Zimmer mit Name
und Bettenzahl an. Sie kann Häuser und Zimmer umbenennen, die Bettenzahl ändern, die Reihenfolge
festlegen und Zimmer oder Häuser löschen. Diese Angaben gelten für alle Camps und müssen jedes Jahr nur
angepasst werden, wenn sich vor Ort etwas ändert.

**Why this priority**: Ohne Häuser und Zimmer gibt es nichts zu verteilen. Gehört zusammen mit Story 1
zum ersten nutzbaren Stand.

**Independent Test**: Zwei Häuser mit je drei Zimmern unterschiedlicher Größe anlegen, ein Zimmer
umbenennen, eins löschen. Ein anderes Camp als aktuell setzen: dieselben Häuser und Zimmer erscheinen.

**Acceptance Scenarios**:

1. **Given** noch keine Häuser, **When** die Planerin den Tab öffnet, **Then** erklärt ein leerer
   Zustand, dass zuerst Häuser und Zimmer angelegt werden, mit einer Schaltfläche „Haus anlegen“.
2. **Given** ein Haus existiert, **When** die Planerin ein Zimmer mit Name und Bettenzahl anlegt,
   **Then** erscheint es sofort als Karte in diesem Haus.
3. **Given** ein Zimmer ist im aktuellen Camp mit 3 Personen belegt, **When** die Planerin die
   Bettenzahl auf 2 senkt, **Then** wird das abgelehnt mit dem Hinweis, dass zuerst Personen umverteilt
   werden müssen.
4. **Given** ein Zimmer ist in irgendeinem Camp belegt, **When** die Planerin es löschen will, **Then**
   fragt eine Bestätigung nach, nennt die Zahl der betroffenen Zuordnungen, und nach Bestätigung stehen
   die betroffenen Personen wieder in der Liste der Unverteilten.
5. **Given** ungültige Eingaben (kein Name, Bettenzahl kleiner als 1), **When** gespeichert wird,
   **Then** erscheint eine deutsche Fehlermeldung am Feld und nichts wird gespeichert.

---

### User Story 3 · Zimmer als weiblich oder männlich festlegen (Priority: P1)

Für das aktuelle Camp legt die Planerin bei jedem Zimmer fest, ob es ein Zimmer für weibliche oder
männliche Teilnehmende ist. Die Karten zeigen das klar über Farbe und Beschriftung. Im nächsten Jahr
kann sie die Verteilung anders festlegen, ohne das Vorjahr zu verändern.

**Why this priority**: Die Trennung ist eine feste Regel des Camps. Ein leeres Zimmer übernimmt beim ersten
Zuordnen automatisch das passende Geschlecht.

**Independent Test**: Ein Zimmer auf „Weiblich“ setzen, eine weibliche Person zuordnen, eine männliche
abgelehnt sehen. Anderes Camp als aktuell setzen: dort ist das Zimmer noch nicht festgelegt.

**Acceptance Scenarios**:

1. **Given** ein Zimmer ist im aktuellen Camp noch nicht festgelegt, **When** die Planerin es ansieht,
   **Then** zeigt die Karte neutral „Nicht festgelegt“. Sobald die erste Person hineingezogen oder
   per Klick zugeordnet wird, übernimmt das Zimmer deren Geschlecht.
2. **Given** ein leeres Zimmer, **When** die Planerin es auf „Männlich“ setzt, **Then** zeigt die Karte
   die Farbe und Beschriftung für männlich und nimmt nur männliche Personen auf.
3. **Given** ein Zimmer ist mit mindestens einer Person belegt, **When** die Planerin das Geschlecht des
   Zimmers ändern will, **Then** wird das abgelehnt mit dem Hinweis, dass zuerst alle Personen aus dem
   Zimmer entfernt werden müssen.
4. **Given** die Planerin möchte ein ganzes Haus auf einmal festlegen, **When** sie am Haus
   „Alle Zimmer weiblich“ oder „Alle Zimmer männlich“ wählt, **Then** werden alle leeren, noch nicht
   passend festgelegten Zimmer dieses Hauses entsprechend gesetzt und belegte Zimmer bleiben unverändert.

---

### User Story 4 · Geschlecht bei der Anmeldung abfragen und nachtragen (Priority: P2)

Wer sich für das Camp anmeldet, gibt im Formular verpflichtend das Geschlecht an (Weiblich oder
Männlich). Für ältere Anmeldungen ohne Angabe zeigt die Zimmerplanung eine eigene Gruppe „Geschlecht
fehlt“, in der die Planerin das Geschlecht direkt nachtragen kann. Auch im bestehenden Bearbeiten
Dialog einer Anmeldung lässt es sich ändern.

**Why this priority**: Nötig, damit die Trennung funktioniert. P2, weil die Planerin es zur Not auch
von Hand nachtragen kann.

**Independent Test**: Öffentliche Anmeldung ohne Geschlecht abschicken (wird abgelehnt), mit
Geschlecht abschicken (erscheint in der Zimmerplanung in der richtigen Gruppe). Eine Altanmeldung in
der Gruppe „Geschlecht fehlt“ auf „Weiblich“ setzen.

**Acceptance Scenarios**:

1. **Given** das öffentliche Anmeldeformular, **When** jemand kein Geschlecht wählt, **Then** erscheint
   eine deutsche Fehlermeldung und die Anmeldung wird nicht abgeschickt.
2. **Given** ein Admin konfiguriert die Formularfelder eines Camps, **When** er die Felder ansieht,
   **Then** ist das Feld Geschlecht immer vorhanden und kann weder gelöscht noch optional gemacht werden.
3. **Given** eine Anmeldung ohne Geschlecht, **When** die Planerin in der Gruppe „Geschlecht fehlt“
   „Weiblich“ wählt, **Then** wandert die Person in die Liste der unverteilten weiblichen Personen.
4. **Given** eine Person ist einem Zimmer zugeordnet, **When** ihr Geschlecht so geändert wird, dass es
   nicht mehr zum Zimmer passt, **Then** wird die Zuordnung aufgehoben und die Person steht wieder in
   der Liste der Unverteilten, mit einem Hinweis an die Planerin.

---

### User Story 5 · Überblick und Ausdruck (Priority: P3)

Oben im Tab sieht die Planerin auf einen Blick: Betten gesamt, belegt und frei, jeweils für weiblich
und männlich, sowie wie viele Personen noch unverteilt sind. Sie kann die fertige Verteilung als
übersichtliche Druckansicht ausgeben (Haus, Zimmer, Namen), um sie vor Ort aufzuhängen.

**Why this priority**: Macht den Überblick, der heute auf Papier mühsam ist, sofort sichtbar. Nützlich,
aber die Verteilung funktioniert auch ohne.

**Independent Test**: Kennzahlen mit der tatsächlichen Belegung vergleichen. Druckansicht öffnen und
prüfen, dass jedes Zimmer mit allen Namen erscheint.

**Acceptance Scenarios**:

1. **Given** 40 weibliche Betten und 25 zugeordnete weibliche Personen, **When** die Planerin den Tab
   öffnet, **Then** zeigen die Kennzahlen 25 von 40 belegt und 15 frei für weiblich.
2. **Given** es gibt mehr weibliche Anmeldungen als weibliche Betten, **When** die Planerin den Tab
   öffnet, **Then** weist ein deutlicher Hinweis auf die fehlenden Betten hin.
3. **Given** eine fertige Verteilung, **When** die Planerin „Drucken“ wählt, **Then** erscheint eine
   schlichte Druckansicht je Haus mit allen Zimmern und den Namen darin.

---

### User Story 6 · Personen suchen und filtern (Priority: P2)

Bei vielen Teilnehmenden sucht die Planerin gezielt nach Personen: per Name, oder per Filter nach
Geschlecht, Alter (von bis) und nach jedem Feld des Anmeldeformulars des aktuellen Camps, zum
Beispiel „Jugendgruppe“ oder „Gemeinde“. So kann sie etwa alle 13 bis 14 jährigen Mädchen aus
derselben Jugendgruppe finden und gemeinsam in ein Zimmer legen.

**Why this priority**: Macht das Verteilen nach sinnvollen Gruppen schnell, ist aber für die
Grundfunktion nicht zwingend.

**Independent Test**: Filter Geschlecht „Weiblich“, Alter 13 bis 14 und ein Formularfeld setzen. Nur
passende Personen bleiben in der Liste, passende Personen in Zimmern sind hervorgehoben.

**Acceptance Scenarios**:

1. **Given** die Liste der Unverteilten, **When** die Planerin einen Namen eintippt, **Then** bleiben
   nur Personen, deren Vor oder Nachname den Text enthält.
2. **Given** der Filter Alter 13 bis 14, **When** er gesetzt ist, **Then** bleiben nur Personen, die zum
   Campbeginn 13 oder 14 Jahre alt sind. Personen ohne Geburtsdatum fallen heraus.
3. **Given** ein Formularfeld mit Auswahlmöglichkeiten (zum Beispiel Jugendgruppe), **When** die
   Planerin es als Filter wählt, **Then** kann sie einen der Werte aus einer Liste auswählen. Bei
   Freitextfeldern gibt sie einen Text ein, bei Ja/Nein Feldern wählt sie Ja oder Nein.
4. **Given** mehrere Filter, **When** sie gesetzt sind, **Then** müssen Personen alle erfüllen, und die
   Zahl der Treffer steht sichtbar am Filter.
5. **Given** aktive Filter, **When** die Planerin auf die Zimmer schaut, **Then** sind passende Personen
   in den Zimmern hervorgehoben und alle anderen abgeschwächt.
6. **Given** aktive Filter, **When** die Planerin „Filter zurücksetzen“ wählt, **Then** ist wieder
   alles sichtbar.

---

### Edge Cases

- Kein Treffer für die gesetzten Filter: Die Liste zeigt „Keine passenden Personen“ mit der
  Möglichkeit, die Filter zurückzusetzen.
- Das Camp hat kein Feld für das Geburtsdatum: Der Altersfilter und die Altersangabe entfallen.

- Eine Anmeldung wird storniert oder gelöscht, während die Person einem Zimmer zugeordnet ist: Sie
  erscheint nicht mehr in der Zimmerplanung, ihr Bett zählt als frei. Wird die Anmeldung wieder
  aktiv, steht sie in der Liste der Unverteilten.
- Zwei Admins verteilen gleichzeitig: Wer zuletzt auf ein volles Zimmer zuordnet, bekommt den Hinweis
  „Zimmer ist voll“, und die Ansicht aktualisiert sich. Ein Zimmer ist nie überbelegt.
- Es ist kein aktuelles Camp gesetzt: Der Tab zeigt einen Hinweis, zuerst ein aktuelles Camp
  festzulegen. Häuser und Zimmer lassen sich trotzdem pflegen.
- Es gibt Häuser, aber noch keine Anmeldungen: Die Zimmer werden angezeigt, die Liste der
  Unverteilten zeigt einen freundlichen leeren Zustand.
- Ein Haus wird gelöscht: Es gilt dasselbe wie beim Löschen eines Zimmers, für alle Zimmer des Hauses.
- Schmaler Bildschirm (Handy): Häuser stehen untereinander, die Liste der Unverteilten ist über eine
  ein und ausklappbare Leiste erreichbar, Zuordnung geht per Antippen und Auswahl.

## Requirements *(mandatory)*

### Functional Requirements

**Tab und Zugriff**

- **FR-001**: Der Adminbereich MUSS einen neuen Tab „Zimmerplanung“ haben, der wie die anderen Tabs
  über die sichtbaren Tabs und Berechtigungen eines Admins freigeschaltet wird. Superadmins sehen ihn
  immer.
- **FR-002**: Alle Lese und Schreibvorgänge der Zimmerplanung MÜSSEN serverseitig prüfen, ob der
  angemeldete Admin den Tab nutzen darf, und andernfalls abgelehnt werden.

**Häuser und Zimmer**

- **FR-003**: Admins MÜSSEN Häuser anlegen, umbenennen, sortieren und löschen können.
- **FR-004**: Admins MÜSSEN je Haus Zimmer mit Name und Bettenzahl (ganze Zahl, mindestens 1) anlegen,
  ändern, sortieren und löschen können.
- **FR-005**: Häuser und Zimmer MÜSSEN für alle Camps gelten. Änderungen an Name oder Reihenfolge
  wirken in allen Camps.
- **FR-006**: Die Bettenzahl eines Zimmers DARF NICHT unter die aktuelle Belegung im aktuellen Camp
  gesenkt werden.
- **FR-007**: Beim Löschen eines belegten Zimmers oder Hauses MUSS eine Bestätigung die Zahl der
  betroffenen Zuordnungen nennen. Nach dem Löschen sind die betroffenen Personen unverteilt.

**Geschlecht der Zimmer**

- **FR-008**: Jedes Zimmer MUSS pro Camp genau einen der Zustände „Nicht festgelegt“, „Weiblich“ oder
  „Männlich“ haben. Neu angelegte Zimmer und Zimmer in einem neuen Camp starten mit „Nicht festgelegt“.
- **FR-009**: Das Geschlecht eines Zimmers DARF nur geändert werden, solange das Zimmer im betreffenden
  Camp leer ist.
- **FR-010**: Admins MÜSSEN alle leeren Zimmer eines Hauses in einem Schritt auf „Weiblich“ oder
  „Männlich“ setzen können.

**Zuordnung**

- **FR-011**: Verteilt werden MÜSSEN alle Anmeldungen des aktuellen Camps, die weder storniert noch
  gelöscht sind, unabhängig vom Zahlungsstatus.
- **FR-012**: Eine Person DARF pro Camp höchstens einem Zimmer zugeordnet sein.
- **FR-013**: Eine Person DARF nur einem Zimmer zugeordnet werden, dessen Geschlecht im aktuellen Camp
  ihrem Geschlecht entspricht, oder einem Zimmer, das im aktuellen Camp leer ist (siehe FR-031).
  Personen ohne Geschlecht können nicht zugeordnet werden.
- **FR-014**: Ein Zimmer DARF NICHT mehr Personen aufnehmen, als es Betten hat. Das MUSS auch bei
  gleichzeitiger Bearbeitung durch mehrere Admins gelten.
- **FR-015**: Zuordnen, Verschieben und Entfernen MÜSSEN per Drag and Drop mit Maus und zusätzlich per
  Antippen oder Klick mit anschließender Zimmerauswahl möglich sein. Die Zimmerauswahl bietet nur
  passende Zimmer mit freien Betten und leere Zimmer an.
- **FR-016**: Die Bedienung MUSS auch ohne Maus über die Tastatur möglich sein (Person fokussieren,
  Zimmer wählen).
- **FR-017**: Jede Zuordnung MUSS sofort sichtbar werden und dauerhaft gespeichert sein. Schlägt das
  Speichern fehl, MUSS die Ansicht zum vorherigen Stand zurückkehren und eine deutsche Fehlermeldung
  zeigen.
- **FR-018**: Beim Ziehen MUSS sichtbar sein, welche Zimmer die Person aufnehmen können und welche nicht
  (falsches Geschlecht, voll). Leere Zimmer, die
  ihr Geschlecht wechseln würden, sind als solche erkennbar.
- **FR-019**: Wird eine Anmeldung storniert oder gelöscht, DARF sie nicht mehr als belegtes Bett zählen
  und nicht mehr angezeigt werden.
- **FR-020**: Ändert sich das Geschlecht einer zugeordneten Person so, dass es nicht mehr zum Zimmer
  passt, MUSS die Zuordnung aufgehoben werden.

**Darstellung**

- **FR-021**: Der Tab MUSS alle Häuser mit ihren Zimmern als Karten zeigen. Jede Karte zeigt Name,
  Geschlecht (Farbe und Text, nicht nur Farbe), Belegung als Zahl und als Bettenanzeige sowie die Namen
  der zugeordneten Personen.
- **FR-022**: Die Liste der unverteilten Personen MUSS nach weiblich, männlich und „Geschlecht fehlt“
  gruppiert und mit Anzahl je Gruppe versehen sein. Suche und Filter regelt FR-032. Zu jeder Person wird
  zusätzlich das Alter beziehungsweise Geburtsdatum angezeigt, sofern im Formular erfasst.
- **FR-023**: Oben im Tab MÜSSEN Kennzahlen stehen: Betten gesamt, belegt und frei sowie unverteilte
  Personen, jeweils für weiblich und männlich. Gibt es mehr Personen eines Geschlechts als passende
  Betten, MUSS ein deutlicher Hinweis erscheinen.
- **FR-024**: Es MUSS eine Druckansicht geben, die je Haus alle Zimmer mit den Namen der Personen zeigt.
- **FR-025**: Der Tab MUSS Lade, Leer und Fehlerzustände haben und auf Handy, Tablet und Desktop gut
  bedienbar sein.
- **FR-026**: Alle sichtbaren Texte MÜSSEN deutsch sein.

**Anmeldeformular**

- **FR-027**: Das Anmeldeformular MUSS für jedes Camp ein Pflichtfeld „Geschlecht“ mit den Werten
  „Weiblich“ und „Männlich“ enthalten. Admins können es in der Feldkonfiguration nicht löschen und nicht
  optional machen.
- **FR-028**: Das Geschlecht MUSS im Bearbeiten Dialog einer Anmeldung änderbar sein und in der
  Zimmerplanung für Anmeldungen ohne Angabe nachgetragen werden können.
- **FR-029**: Bestehende Anmeldungen ohne Geschlecht MÜSSEN gültig bleiben. Es gibt keine automatische
  Zuordnung eines Geschlechts.

**Protokoll**

- **FR-030**: Anlegen, Ändern und Löschen von Häusern und Zimmern MÜSSEN im bestehenden Log
  festgehalten werden. Einzelne Zuordnungen werden nicht geloggt, um das Log nicht zu überfluten.

**Ergänzungen**

- **FR-031**: Wird eine Person einem Zimmer zugeordnet, das im aktuellen Camp leer ist, MUSS das Zimmer
  für dieses Camp automatisch das Geschlecht der Person übernehmen, auch wenn es vorher nicht
  festgelegt oder mit dem anderen Geschlecht festgelegt war. Ein kurzer Hinweis nennt das neue
  Geschlecht. Das gilt für Drag and Drop und Klick gleichermaßen und ist sicher bei gleichzeitiger
  Bearbeitung (zwei Personen unterschiedlichen Geschlechts landen nie im selben leeren Zimmer).
- **FR-032**: Die Planerin MUSS Personen nach Name suchen und filtern können nach Geschlecht
  (Weiblich, Männlich, fehlt), Alter zum Campbeginn (von bis) und nach jedem Feld des
  Anmeldeformulars des aktuellen Camps. Auswahlfelder bieten ihre Werte als Liste, Ja/Nein Felder
  Ja oder Nein, alle anderen Felder eine Textsuche. Mehrere Filter gelten zusammen. Die Filter wirken
  auf die Liste der Unverteilten und heben passende Personen in den Zimmern hervor. Ein Klick setzt
  alle Filter zurück.

### Key Entities

- **Haus**: Ein Gebäude, in dem Teilnehmende schlafen. Name, Reihenfolge. Gilt für alle Camps.
- **Zimmer**: Gehört zu genau einem Haus. Name, Bettenzahl, Reihenfolge. Gilt für alle Camps.
- **Zimmerbelegung je Camp**: Verknüpft ein Zimmer mit einem Camp und hält fest, ob es in diesem Camp
  weiblich, männlich oder nicht festgelegt ist.
- **Zuordnung**: Verknüpft eine Anmeldung mit einem Zimmer innerhalb eines Camps. Höchstens eine je
  Anmeldung und Camp.
- **Anmeldung** (bestehend): Bekommt das Merkmal Geschlecht (Weiblich, Männlich oder fehlend bei
  Altdaten).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Die Planerin verteilt 100 Teilnehmende auf die Zimmer in unter 20 Minuten, ohne Papier.
- **SC-002**: Eine einzelne Zuordnung dauert höchstens zwei Handgriffe (Ziehen und Loslassen, oder
  Antippen und Zimmer wählen) und ist nach dem Loslassen sofort sichtbar.
- **SC-003**: In keinem Fall ist ein Zimmer überbelegt oder mit Personen des anderen Geschlechts belegt,
  auch nicht bei gleichzeitiger Bearbeitung durch zwei Admins.
- **SC-004**: Innerhalb von 5 Sekunden nach dem Öffnen des Tabs kann die Planerin ablesen, wie viele
  Betten je Geschlecht frei sind und wie viele Personen noch unverteilt sind.
- **SC-005**: Die komplette Verteilung lässt sich auf Handy, Tablet und Desktop durchführen.
- **SC-006**: Die Druckansicht passt je Haus auf möglichst wenige A4 Seiten und ist ohne Nacharbeit
  aushängbar.

## Assumptions

- Die Zimmerplanung arbeitet immer auf dem aktuellen Camp. Ältere Camps behalten ihre Zuordnungen,
  werden im Tab aber nicht bearbeitet.
- Es gibt nur zwei Geschlechtswerte, Weiblich und Männlich, wie vom Projektinhaber gewünscht.
- Betreuende und Mitarbeitende werden nur verteilt, sofern sie selbst eine Anmeldung haben. Eine
  getrennte Personengruppe für Betreuende ist nicht Teil dieser Spec.
- Wünsche wie „möchte mit X in ein Zimmer“ werden nicht abgefragt und nicht automatisch berücksichtigt.
  Es gibt keine automatische Verteilung, die Planerin verteilt von Hand.
- Eine Warteliste und eine Hausverwaltung über die Zimmerplanung hinaus (Schlüssel, Reinigung,
  Ausstattung) bleiben ausgeschlossen.
- Die Zahl der Häuser und Zimmer ist klein (unter 10 Häuser, unter 50 Zimmer), die Zahl der
  Teilnehmenden liegt unter 300.

## Dependencies

- **Scope Änderung**: Constitution Prinzip III und AGENTS.md Abschnitt 4 und 12 schließen Housing
  bisher aus. Vor der Umsetzung werden beide über `/speckit-constitution` angepasst: Zimmerplanung
  (Häuser, Zimmer, Zuordnung) wird in den Scope aufgenommen, die Warteliste bleibt ausgeschlossen.
- **Ein Formular**: Das Feld Geschlecht wird Teil des bestehenden, konfigurierbaren Anmeldeformulars.
  Es entsteht kein zweites Formular.
- Bestehende Bausteine: Admin Tabs und Berechtigungen, Log, Bearbeiten Dialog für Anmeldungen,
  aktuelles Camp.
