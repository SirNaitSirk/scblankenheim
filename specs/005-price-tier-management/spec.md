# Feature Specification: Preisstufen verwalten im Tab „Preise“

**Feature Branch**: `005-price-tier-management`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Es gibt im Admin bereich unter "Finanzen" noch keine möglichkeit Preisstufen zu erstellen. Zudem macht der Name "Finanzen" für diesen Tab nicht wirklich sinn"

**Kontext**: Preisstufen existieren bereits als Daten und werden bei der Anmeldung schon ausgewertet:
Wer über einen persönlichen Einladungslink kommt, zahlt den Preis der zugehörigen Stufe, alle anderen
den Standardpreis des Camps. Anlegen lassen sich Preisstufen bisher aber nur direkt in der Datenbank.
Der Tab „Finanzen“ zeigt heute nur Kennzahlen zu Zahlungen und eine Aufschlüsselung nach Preisstufe.
Auf Wunsch heißt der Tab künftig „Preise“ und wird zum Ort, an dem Preisstufen verwaltet werden.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Preisstufe anlegen und Einladungslink weitergeben (Priority: P1)

Ein Admin öffnet den Tab „Preise“, legt für das aktuelle Camp eine neue Preisstufe an (zum Beispiel
„Mitarbeitende“ für 120 €) und kopiert den zugehörigen Einladungslink, um ihn per Mail oder Messenger
an die betreffenden Personen zu schicken. Wer den Link öffnet und sich anmeldet, zahlt 120 €.

**Why this priority**: Ohne diese Möglichkeit sind Sonderpreise praktisch nicht nutzbar. Das ist der
Kern der Anfrage.

**Independent Test**: Preisstufe anlegen, Link kopieren, im privaten Fenster öffnen, anmelden. Die
Anmeldung erscheint mit dem Betrag der Stufe und zählt in der Aufschlüsselung bei dieser Stufe.

**Acceptance Scenarios**:

1. **Given** ein aktuelles Camp ist gesetzt, **When** der Admin Name und Preis eingibt und speichert,
   **Then** erscheint die Stufe sofort in der Liste mit 0 Anmeldungen und einem kopierbaren Einladungslink.
2. **Given** eine Stufe existiert, **When** der Admin auf „Link kopieren“ klickt, **Then** liegt der
   vollständige Link in der Zwischenablage und eine kurze Bestätigung erscheint.
3. **Given** jemand öffnet den Einladungslink, **When** er sich anmeldet, **Then** beträgt der zu
   zahlende Betrag den Preis der Stufe, und die öffentliche Seite zeigt diesen Preis nirgends an.
4. **Given** der Admin gibt keinen Namen oder einen ungültigen Preis ein, **When** er speichert,
   **Then** erscheint eine deutsche Fehlermeldung am Feld und nichts wird gespeichert.
5. **Given** es ist kein aktuelles Camp gesetzt, **When** der Tab geöffnet wird, **Then** erscheint
   ein Hinweis, zuerst ein aktuelles Camp festzulegen, und das Anlegen ist nicht möglich.

---

### User Story 2 · Tab heißt „Preise“ (Priority: P1)

Die Seitenleiste zeigt statt „Finanzen“ den Eintrag „Preise“. Der Tab enthält oben weiterhin die
Kennzahlen zu Zahlungen (Eingegangen, Offen, Zahlungsquote, Bezahlte Anmeldungen) und darunter die
Preisstufen mit ihrer Aufschlüsselung.

**Why this priority**: Ausdrücklich gewünscht und Voraussetzung dafür, dass Admins die Preisstufen dort
überhaupt erwarten.

**Independent Test**: Adminbereich öffnen, Eintrag „Preise“ in der Seitenleiste anklicken, Überschrift
und Adresse prüfen. Die alte Adresse aufrufen und die Weiterleitung prüfen.

**Acceptance Scenarios**:

1. **Given** ein Admin mit Zugriff auf den früheren Tab „Finanzen“, **When** er sich anmeldet,
   **Then** sieht er den Tab „Preise“, ohne dass ein Superadmin seine Freigaben neu setzen muss.
2. **Given** jemand ruft ein altes Lesezeichen auf `/admin/finanzen` auf, **When** die Seite lädt,
   **Then** landet er auf `/admin/preise`.
3. **Given** die Benutzerverwaltung, **When** ein Superadmin die sichtbaren Tabs eines Admins
   bearbeitet, **Then** heißt der Eintrag dort ebenfalls „Preise“.

---

### User Story 3 · Preisstufe bearbeiten, beenden, Link erneuern, löschen (Priority: P2)

Ein Admin ändert Name, Preis oder Gültigkeitszeitraum einer Stufe, beendet ihre Gültigkeit sofort,
erzeugt bei Bedarf einen neuen Link (etwa weil der alte zu weit gestreut wurde) oder löscht eine
Stufe, die nie benutzt wurde.

**Why this priority**: Wichtig für den laufenden Betrieb, aber erst sinnvoll, wenn Anlegen funktioniert.

**Independent Test**: Jede Aktion an einer Teststufe ausführen und danach den Link im privaten
Fenster prüfen.

**Acceptance Scenarios**:

1. **Given** eine Stufe mit bestehenden Anmeldungen, **When** der Admin den Preis ändert, **Then** gilt
   der neue Preis nur für künftige Anmeldungen; bereits gespeicherte Beträge bleiben unverändert, und
   der Dialog weist darauf hin.
2. **Given** eine Stufe, **When** der Admin „Link erneuern“ bestätigt, **Then** funktioniert der alte
   Link nicht mehr (Anmeldung zum Standardpreis) und der neue Link wird angezeigt.
3. **Given** eine Stufe, **When** der Admin „Gültigkeit beenden“ bestätigt, **Then** endet der
   Zeitraum jetzt, die Stufe wird als „Abgelaufen“ markiert und der Link gilt nicht mehr.
4. **Given** eine Stufe ohne Anmeldungen, **When** der Admin löschen bestätigt, **Then** verschwindet
   sie aus der Liste.
5. **Given** eine Stufe mit Anmeldungen, **When** der Admin löschen möchte, **Then** ist Löschen nicht
   möglich und ein Hinweis empfiehlt stattdessen „Gültigkeit beenden“.

### Edge Cases

* Gültigkeitsende liegt vor dem Gültigkeitsbeginn: Speichern wird mit Fehlermeldung abgelehnt.
* Gültigkeitsbeginn liegt in der Zukunft: Die Stufe wird als „Geplant“ angezeigt, der Link führt bis
  dahin zum Standardpreis.
* Preis 0 €: erlaubt (zum Beispiel für Freiplätze).
* Zwei Stufen mit gleichem Namen: erlaubt, aber nicht empfohlen; die Links unterscheiden sich.
* Ältere Stufen ohne Einladungslink (aus der Datenbank angelegt): werden angezeigt; über „Link erneuern“
  erhalten sie einen Link.
* Ein Admin ohne Zugriff auf den Tab ruft die Seite oder eine Änderung direkt auf: wird abgewiesen.
* Kopieren in die Zwischenablage nicht möglich (Browser blockiert): der Link wird markierbar angezeigt.
* Wechsel des aktuellen Camps: Der Tab zeigt dann die Stufen des neuen Camps; Stufen gehören immer zu
  genau einem Camp.

## Requirements *(mandatory)*

### Functional Requirements

* **FR-001**: Der Tab „Finanzen“ MUSS überall in „Preise“ umbenannt werden (Seitenleiste, Überschrift,
  Tabfreigaben in der Benutzerverwaltung) und unter `/admin/preise` erreichbar sein.
* **FR-002**: Die alte Adresse `/admin/finanzen` MUSS dauerhaft auf `/admin/preise` weiterleiten. *Ersetzt durch specs/009-finance-tab: `/admin/finanzen` ist jetzt der eigene Tab „Finanzen“, die Weiterleitung entfällt.*
* **FR-003**: Bestehende Freigaben für den alten Tab MÜSSEN ohne manuelles Zutun für den neuen Tab gelten.
* **FR-004**: Der Tab MUSS weiterhin die vier Zahlungskennzahlen und die Aufschlüsselung nach
  Preisstufe (Preis, Anmeldungen, Einnahmen, Summe) zeigen.
* **FR-005**: Admins mit Zugriff auf den Tab MÜSSEN für das aktuelle Camp Preisstufen anlegen können:
  Name (Pflicht, höchstens 80 Zeichen), Preis in ganzen Euro (Pflicht, 0 bis 9999), optional
  Gültigkeitsbeginn und Gültigkeitsende.
* **FR-006**: Jede neu angelegte Preisstufe MUSS versteckt sein und automatisch einen geheimen, nicht
  erratbaren Einladungslink erhalten. Der öffentliche Preis bleibt der Standardpreis des Camps.
* **FR-007**: Zu jeder Stufe MUSS der vollständige Einladungslink angezeigt und mit einem Klick
  kopiert werden können.
* **FR-008**: Admins MÜSSEN Name, Preis und Gültigkeitszeitraum einer Stufe bearbeiten können. Eine
  Preisänderung DARF bereits gespeicherte Anmeldungen NICHT verändern.
* **FR-009**: Admins MÜSSEN den Link einer Stufe nach Bestätigung erneuern können; der alte Link MUSS
  danach ungültig sein.
* **FR-010**: Admins MÜSSEN die Gültigkeit einer Stufe nach Bestätigung sofort beenden können.
* **FR-011**: Löschen MUSS nur für Stufen ohne Anmeldungen möglich sein und eine Bestätigung verlangen.
* **FR-012**: Jede Stufe MUSS ihren Status zeigen: „Aktiv“, „Geplant“ oder „Abgelaufen“.
* **FR-013**: Alle Änderungen MÜSSEN auf dem Server geprüft werden: angemeldeter Admin mit Zugriff auf
  den Tab, gültige Eingaben, Stufe gehört zum aktuellen Camp. Andere Anfragen werden abgewiesen.
* **FR-014**: Anlegen, Bearbeiten, Link erneuern, Beenden und Löschen MÜSSEN im Aktivitätslog
  erscheinen (ohne den Link selbst).
* **FR-015**: Einladungslinks und Preise versteckter Stufen DÜRFEN auf öffentlichen Seiten nie
  erscheinen.
* **FR-016**: Alle sichtbaren Texte MÜSSEN deutsch sein, einschließlich Lade, Leer und Fehlerzuständen.
  Der Tippfehler „Preistufe“ in der bestehenden Ansicht wird zu „Preisstufe“ korrigiert.

### UI Anforderungen

* Aufbau: Kopfbereich mit Titel „Preise“, Camp Badge und Beschreibung; darunter die vier Kennzahlen;
  darunter eine Karte „Preisstufen“ mit Button „Preisstufe anlegen“ und der Tabelle (Name mit Status,
  Preis, Gültigkeit, Anmeldungen, Einnahmen, Aktionen). Über der Tabelle steht der Standardpreis des
  Camps als Bezugspunkt.
* Anlegen und Bearbeiten in einem Dialog im Stil der bestehenden Admin Dialoge (Camp, Felder).
* Aktionen pro Zeile: „Link kopieren“ direkt sichtbar; Bearbeiten, Link erneuern, Gültigkeit beenden,
  Löschen in einem Menü.
* Leerer Zustand: kurzer Text, was Preisstufen sind, und der Button zum Anlegen.
* Mobil: die Tabelle scrollt horizontal innerhalb der Karte, Dialoge sind volle Breite.
* Typografie, Farben, Abstände und Badges folgen dem bestehenden Admin Design.

### Key Entities

* **Preisstufe**: gehört zu genau einem Camp. Name, Preis in ganzen Euro, versteckt, geheimer
  Einladungsschlüssel, optionaler Gültigkeitszeitraum. Wird von Anmeldungen referenziert.
* **Tabfreigabe eines Admins**: Liste der sichtbaren Tabs; der Eintrag für den alten Tab wird auf
  den neuen übertragen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

* **SC-001**: Ein Admin legt eine Preisstufe an und hat den Einladungslink in unter 1 Minute in der
  Zwischenablage.
* **SC-002**: 100 % der Anmeldungen über einen gültigen Link erhalten den Preis der Stufe; 100 % der
  Anmeldungen über einen erneuerten, beendeten oder gelöschten Link erhalten den Standardpreis.
* **SC-003**: Nach dem Umbenennen sehen alle Admins, die vorher „Finanzen“ sahen, „Preise“, ohne
  Nacharbeit.
* **SC-004**: Keine öffentliche Seite enthält einen Einladungsschlüssel oder versteckten Preis.

## Assumptions

* Preisstufen dienen ausschließlich als versteckte Sonderpreise über Einladungslinks. Öffentlich
  sichtbare Stufen werden nicht angeboten; der öffentliche Preis bleibt der Standardpreis, der wie
  bisher beim Camp gepflegt wird.
* Verwaltet werden nur die Stufen des aktuellen Camps, passend zu den übrigen Kennzahlen im Tab.
* Für Änderungen gilt die bestehende Bereichsberechtigung des Tabs (bisher „Finanzen“, künftig
  „Preise“), wie bei allen anderen Tabs. Eine zusätzliche Berechtigung gibt es nicht.
* Die bestehende Logik bei der Anmeldung (Link prüft Camp und Gültigkeit) bleibt unverändert.
* Einladungslinks werden nicht automatisch verschickt; Admins geben sie selbst weiter.
