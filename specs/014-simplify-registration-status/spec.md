# Feature Specification: Anmeldestatus vereinfachen

**Feature Branch**: `014-simplify-registration-status`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Bei der Anmeldung gibt es einen Status Offen, Bestätigt, Storniert. Offen und Bestätigt verhalten sich überall gleich, Bestätigt wird nie automatisch gesetzt, auch nicht nach voller Zahlung. Das ist irreführend. Es soll nur noch Aktiv und Storniert geben. Ob eine Anmeldung erledigt ist, zeigt die Zahlung."

**Kontext**: Heute hat jede Anmeldung einen Status mit drei Werten: „Offen“, „Bestätigt“ und
„Storniert“. Nur „Storniert“ hat eine Wirkung: Die Person zählt nicht mehr für Kapazität, Summen,
Zahlungserinnerungen, Bezahlung, Zimmerplanung und Zeltkreise. „Offen“ und „Bestätigt“ verhalten sich
überall gleich. „Bestätigt“ wird nie automatisch gesetzt, auch nicht nach vollständiger Zahlung. Das
Admin Team liest „Offen“ deshalb fälschlich als „noch nicht erledigt“ und erwartet, dass sich der Wert
von selbst ändert.

Getroffene Entscheidung (vom Projektinhaber bestätigt): Der Status kennt künftig nur noch zwei Werte,
„Aktiv“ und „Storniert“. Ob bei einer Anmeldung noch etwas zu tun ist, zeigt allein der Zahlungsstatus.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Eindeutiger Status in der Anmeldeliste (Priority: P1)

Ein Admin öffnet die Anmeldungen. In der Spalte „Status“ steht bei jeder Anmeldung entweder „Aktiv“
oder „Storniert“. Die Werte „Offen“ und „Bestätigt“ tauchen nirgends mehr auf. Alle bisherigen
Anmeldungen, die vorher „Offen“ oder „Bestätigt“ waren, stehen jetzt auf „Aktiv“. Stornierte bleiben
„Storniert“.

**Why this priority**: Das ist der Kern der Änderung. Ohne sie bleibt die Verwirrung bestehen.

**Independent Test**: Vorher je eine Anmeldung mit „Offen“, „Bestätigt“ und „Storniert“ anlegen. Nach
der Umstellung die Liste öffnen: zwei zeigen „Aktiv“, eine zeigt „Storniert“. Zahlen auf dem Dashboard,
im Finanztab, in der Zimmerplanung und bei den Zeltkreisen sind unverändert.

**Acceptance Scenarios**:

1. **Given** eine Anmeldung hatte den Status „Offen“, **When** der Admin die Liste nach der Umstellung
   öffnet, **Then** zeigt sie „Aktiv“.
2. **Given** eine Anmeldung hatte den Status „Bestätigt“, **When** der Admin die Liste öffnet,
   **Then** zeigt sie „Aktiv“.
3. **Given** eine Anmeldung war „Storniert“, **When** der Admin die Liste öffnet, **Then** zeigt sie
   weiterhin „Storniert“ und hat dieselben Folgen wie vorher.
4. **Given** die Umstellung ist erfolgt, **When** der Admin Kennzahlen, Finanzsummen, belegte Plätze,
   Zimmer und Zeltkreise vergleicht, **Then** ist keine Zahl gegenüber vorher verändert.

---

### User Story 2 · Neue Anmeldungen starten als „Aktiv“ (Priority: P1)

Eine Person meldet sich über das öffentliche Formular an, oder ein Admin legt eine Anmeldung im
Adminbereich an. Die neue Anmeldung steht sofort auf „Aktiv“, unabhängig davon, ob schon bezahlt wurde.

**Why this priority**: Sonst entstünden nach der Umstellung wieder Anmeldungen mit einem alten Wert.

**Independent Test**: Eine Anmeldung über das öffentliche Formular und eine im Adminbereich anlegen.
Beide zeigen „Aktiv“.

**Acceptance Scenarios**:

1. **Given** das Anmeldeformular ist geöffnet, **When** eine Person sich anmeldet, **Then** steht die
   Anmeldung im Adminbereich auf „Aktiv“.
2. **Given** ein Admin öffnet den Dialog „Anmeldung hinzufügen“, **When** er das Statusfeld ansieht,
   **Then** ist „Aktiv“ vorausgewählt und es gibt nur „Aktiv“ und „Storniert“ zur Auswahl.

---

### User Story 3 · Stornieren und Stornierung aufheben (Priority: P2)

Eine Person sagt ab. Der Admin öffnet ihre Anmeldung und setzt den Status auf „Storniert“. Ruft die
Person später doch noch an, setzt der Admin den Status zurück auf „Aktiv“.

**Why this priority**: Stornieren ist der einzige Grund, den Status überhaupt zu ändern.

**Independent Test**: Eine aktive Anmeldung stornieren und prüfen, dass sie aus Kapazität, Summen,
Zimmer und Zeltkreisen herausfällt. Danach wieder auf „Aktiv“ setzen und prüfen, dass sie wieder zählt.

**Acceptance Scenarios**:

1. **Given** eine aktive Anmeldung, **When** der Admin sie auf „Storniert“ setzt, **Then** gelten alle
   bisherigen Folgen einer Stornierung unverändert.
2. **Given** eine stornierte Anmeldung, **When** der Admin sie auf „Aktiv“ setzt, **Then** zählt sie
   wieder für Kapazität und Summen.

---

### User Story 4 · Filtern und Export (Priority: P2)

Der Admin filtert die Anmeldungen nach Status und exportiert sie als CSV. Der Statusfilter bietet
„Alle“, „Aktiv“ und „Storniert“. In der CSV Datei steht in der Spalte „Status“ entsprechend „Aktiv“
oder „Storniert“.

**Why this priority**: Filter und Export müssen zur neuen Einteilung passen, sind aber nachgelagert.

**Independent Test**: Nach „Storniert“ filtern: nur stornierte erscheinen. CSV exportieren: die
Statusspalte enthält nur „Aktiv“ oder „Storniert“.

**Acceptance Scenarios**:

1. **Given** die Anmeldeliste, **When** der Admin den Statusfilter öffnet, **Then** sieht er genau
   „Alle“, „Aktiv“ und „Storniert“.
2. **Given** ein Admin hatte vor der Umstellung einen Filter auf „Offen“ oder „Bestätigt“ gesetzt,
   **When** er die Liste danach öffnet, **Then** zeigt sie ohne Fehler alle Anmeldungen.
3. **Given** der Admin exportiert die Liste, **When** er die Datei öffnet, **Then** stehen in der
   Statusspalte nur „Aktiv“ oder „Storniert“.

### Edge Cases

* Anmeldungen vergangener Camps werden genauso umgestellt wie die des aktuellen Camps.
* Gelöschte Anmeldungen werden ebenfalls umgestellt, damit sie beim Wiederherstellen einen gültigen
  Status haben.
* Ein gespeicherter Filter oder eine alte Adresse mit „Offen“ oder „Bestätigt“ führt nicht zu einem
  Fehler, sondern fällt auf „Alle“ zurück.
* Erreicht ein unbekannter oder alter Statuswert den Server, wird er abgelehnt und nicht gespeichert.
* Der Zahlungsstatus und die Kachel „Offen“ auf dem Dashboard (offene Zahlungen) bleiben unverändert.

## Requirements *(mandatory)*

### Functional Requirements

* **FR-001**: Eine Anmeldung MUSS genau einen von zwei Statuswerten haben: „Aktiv“ oder „Storniert“.
* **FR-002**: Alle bestehenden Anmeldungen mit „Offen“ oder „Bestätigt“ MÜSSEN einmalig auf „Aktiv“
  umgestellt werden, in allen Camps und auch gelöschte.
* **FR-003**: Neue Anmeldungen, ob über das öffentliche Formular oder den Adminbereich angelegt,
  MÜSSEN mit „Aktiv“ starten.
* **FR-004**: Der Anmeldedialog MUSS als Status nur „Aktiv“ und „Storniert“ anbieten, mit „Aktiv“ als
  Vorgabe für neue Anmeldungen.
* **FR-005**: Statusanzeige in der Tabelle, Statusfilter und CSV Export MÜSSEN nur „Aktiv“ und
  „Storniert“ verwenden. „Offen“ und „Bestätigt“ als Anmeldestatus DÜRFEN nirgends mehr erscheinen.
* **FR-006**: Der Server MUSS beim Speichern andere Statuswerte als „Aktiv“ und „Storniert“ ablehnen.
* **FR-007**: Alle Wirkungen von „Storniert“ (Kapazität, Finanzsummen, Zahlungserinnerungen,
  Bezahlbarkeit, Zimmerplanung, Zeltkreise, Bearbeitung im Finanztab) MÜSSEN unverändert bleiben.
* **FR-008**: Alle Kennzahlen und Summen MÜSSEN nach der Umstellung dieselben Werte zeigen wie vorher.
* **FR-009**: Ein alter Filterwert „Offen“ oder „Bestätigt“ MUSS ohne Fehler auf „Alle“ zurückfallen.
* **FR-010**: Der Status MUSS weiterhin nur von Hand durch Admins geändert werden. Eine Zahlung ändert
  ihn nicht.

### Key Entities

* **Anmeldung**: Erhält statt drei nur noch zwei Statuswerte (aktiv, storniert). Zahlungsstatus,
  Beträge und alle übrigen Angaben bleiben unverändert.

## Success Criteria *(mandatory)*

### Measurable Outcomes

* **SC-001**: Nach der Umstellung haben 100 % der Anmeldungen den Status „Aktiv“ oder „Storniert“.
* **SC-002**: Auf keiner Seite des Adminbereichs und in keinem Export erscheint „Bestätigt“ oder
  „Offen“ als Anmeldestatus.
* **SC-003**: Belegte Plätze, Finanzsummen, Dashboard Kennzahlen, Zimmerbelegung und Zeltkreise zeigen
  vor und nach der Umstellung exakt dieselben Werte.
* **SC-004**: Ein Admin kann ohne Erklärung sagen, was der Status einer Anmeldung bedeutet: Die Person
  kommt (Aktiv) oder kommt nicht (Storniert).

## Assumptions

* Die deutschen Bezeichnungen lauten „Aktiv“ und „Storniert“.
* Die Farbe für „Aktiv“ ist neutral und nicht grün, damit sie nicht mit „Bezahlt“ verwechselt wird.
  „Storniert“ bleibt rot.
* Die Umstellung ist endgültig. Die Unterscheidung zwischen „Offen“ und „Bestätigt“ wird nicht
  aufbewahrt, da sie nirgends eine Wirkung hatte.
* Mails an Teilnehmende nennen den Anmeldestatus nicht und bleiben unverändert.
* Der Status von Adminkonten („Aktiv“, „Eingeladen“) und von Preisstufen ist nicht betroffen.
