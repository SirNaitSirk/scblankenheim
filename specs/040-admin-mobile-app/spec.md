# Feature Specification: Admin am Handy und als Homescreen App

**Feature Branch**: `040-admin-mobile-app`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "Analysiere die Bedienbarkeit der Adminoberfläche am Handy, mir sind immer wieder mal 1 bis 2 Dinge aufgefallen. Zudem noch, was man machen kann, wenn man auf dem iPhone die Seite als Lesezeichen auf dem Homebildschirm speichert, damit es wie eine native App wirkt." Auftrag nach der Analyse: "Ja, Spec anlegen".

**Kontext**: Das Team nutzt den Adminbereich oft unterwegs am Handy, vor allem im Camp
(Busscanner, Anmeldungen nachschlagen, Zahlungen eintragen). Heute hakt es an mehreren Stellen:

- Tippt man am iPhone in ein Eingabefeld, vergrößert Safari die Seite und bleibt oft vergrößert.
- Dialoge schweben als kleines Fenster mitten im Bild, die Knöpfe in der Fußleiste werden gequetscht,
  das Schließen ist schwer zu treffen.
- Mehrere Bedienelemente sind kleiner als eine Fingerkuppe.
- Die Anmeldungen lassen sich am Handy nur als breite Tabelle mit seitlichem Wischen lesen.
- Ist das Seitenmenü offen, scrollt die Seite dahinter weiter.

Legt man den Adminbereich auf dem iPhone Homescreen ab, öffnet er sich heute wie ein gewöhnliches
Lesezeichen: mit Safari Leisten, auf der öffentlichen Startseite und mit dem öffentlichen Icon.

**Produktentscheidungen**:

- Alles gilt nur für den Adminbereich. Öffentliche Seiten, Teilnehmerseite und Landingpage bleiben
  unverändert.
- Ab Tabletbreite sieht der Adminbereich aus wie heute. Die Änderungen greifen bei Handybreite und
  im Homescreen Modus.
- Die Homescreen App startet direkt im Adminbereich, heißt „Summercamp Admin“ und hat ein eigenes
  Icon, das sich vom öffentlichen Icon unterscheidet.
- Kein Offline Betrieb: Ohne Verbindung zeigt die App wie heute eine Fehlermeldung. Die Daten sind
  vertraulich und live.
- Keine Pushnachrichten, keine Startbilder pro Gerät.
- Benutzer und Preise dürfen am Handy weiter seitlich scrollen, sie werden selten unterwegs genutzt.
- Untere Leiste (Antwort 2026-11-09: „Ja, Übersicht Finanzen Bus“): Im Homescreen Modus bei
  Handybreite gibt es unten eine feste Leiste mit Übersicht, Finanzen und Bus, jeweils nur wenn die
  Admin den Bereich sehen darf, und als letztem Eintrag „Menü“, der das Seitenmenü öffnet. In Safari
  und ab Tabletbreite gibt es die Leiste nicht.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Eingaben ohne Hineinzoomen (Priority: P1)

Eine Admin trägt am iPhone im Finanztab einen bezahlten Betrag ein. Sie tippt ins Feld, die Seite
bleibt in ihrer Größe, sie tippt die Zahl und speichert. Danach muss sie nichts zurückzoomen.

**Why this priority**: Das ist der häufigste und störendste Fehler, und er betrifft jedes Formular
im Adminbereich.

**Independent Test**: Am iPhone jedes Eingabefeld, Auswahlfeld und Textfeld in Anmeldedialog,
Finanztab und Camp Einstellungen antippen. Die Seite darf sich nie vergrößern.

**Acceptance Scenarios**:

1. **Given** der Adminbereich ist am iPhone offen, **When** eine Admin in ein Eingabefeld, ein
   Auswahlfeld oder ein Textfeld tippt, **Then** bleibt die Seite in ihrer Größe.
2. **Given** der Adminbereich ist am Rechner offen, **When** er erscheint, **Then** sind die Felder
   so groß wie heute.
3. **Given** eine Admin möchte bewusst vergrößern, **When** sie mit zwei Fingern zieht, **Then**
   funktioniert das weiterhin.

---

### User Story 2 · Dialoge, die aufs Handy passen (Priority: P1)

Eine Admin öffnet am Handy eine Anmeldung. Der Dialog füllt den Bildschirm, der Inhalt scrollt, die
Fußleiste mit Löschen, Abbrechen und Speichern bleibt unten sichtbar und alle Knöpfe sind lesbar und
gut zu treffen. Das Schließen sitzt oben und ist groß genug.

**Why this priority**: Fast jede Bearbeitung im Adminbereich läuft über einen Dialog.

**Independent Test**: Am Handy den Anmeldedialog, den Camp Dialog und den Feld Dialog öffnen,
bis zum Ende scrollen, ein Feld bearbeiten, speichern und schließen.

**Acceptance Scenarios**:

1. **Given** Handybreite, **When** ein Dialog öffnet, **Then** nutzt er die ganze Breite und die
   verfügbare Höhe statt als kleines Fenster mit Rand zu schweben.
2. **Given** ein Dialog hat drei oder mehr Knöpfe in der Fußleiste, **When** der Platz nicht reicht,
   **Then** brechen die Knöpfe in eine weitere Zeile um, statt gequetscht oder abgeschnitten zu werden.
3. **Given** ein Dialog ist offen und die Bildschirmtastatur erscheint, **When** eine Admin in ein
   Feld weiter unten tippt, **Then** bleibt das Feld sichtbar und die Fußleiste verdeckt es nicht.
4. **Given** ein Dialog ist offen, **When** eine Admin das Schließen antippt, **Then** schließt er,
   und die Tippfläche ist mindestens 44 mal 44 Punkte groß.
5. **Given** Tabletbreite oder größer, **When** ein Dialog öffnet, **Then** sieht er aus wie heute.

---

### User Story 3 · Anmeldungen am Handy als Liste (Priority: P2)

Eine Admin sucht am Handy schnell eine Person. Statt einer breiten Tabelle sieht sie eine Liste mit
Karten: Name, Status, Zahlungsstand und offener Betrag. Antippen öffnet den Anmeldedialog. Suche,
Filter und Sortierung wirken wie in der Tabelle.

**Why this priority**: Nachschlagen ist der häufigste Anlass, unterwegs in den Adminbereich zu
schauen. Ohne diese Liste bleibt es mühsam, ist aber möglich.

**Independent Test**: Am Handy die Anmeldungen öffnen, nach einem Namen suchen, nach Zahlungsstand
filtern, eine Karte antippen und eine Änderung speichern.

**Acceptance Scenarios**:

1. **Given** Handybreite, **When** die Anmeldungen erscheinen, **Then** zeigen sie eine Kartenliste
   ohne seitliches Scrollen.
2. **Given** eine Suche oder ein Filter ist gesetzt, **When** die Liste erscheint, **Then** zeigt sie
   genau dieselben Anmeldungen in derselben Reihenfolge wie die Tabelle am Rechner.
3. **Given** eine Karte, **When** eine Admin sie antippt, **Then** öffnet der Anmeldedialog dieser
   Anmeldung.
4. **Given** keine Anmeldung passt, **When** die Liste erscheint, **Then** zeigt sie denselben
   leeren Zustand mit Knopf zum Zurücksetzen der Filter wie die Tabelle.
5. **Given** Tabletbreite oder größer, **When** die Anmeldungen erscheinen, **Then** zeigen sie die
   Tabelle wie heute, inklusive Verschieben der Spalten.

---

### User Story 4 · Bedienelemente und Menü für den Finger (Priority: P2)

Eine Admin bedient die Kopfleiste und das Seitenmenü am Handy mit dem Daumen. Alle Tippflächen sind
groß genug, die Kopfleiste ist aufgeräumt, und bei offenem Menü bewegt sich nur das Menü.

**Why this priority**: Kleine Tippflächen führen zu Fehltippern, das Mitscrollen wirkt kaputt.

**Independent Test**: Am Handy Menü öffnen, darin scrollen, einen Bereich wählen, das Design
wechseln, das Menü per Tippen daneben schließen.

**Acceptance Scenarios**:

1. **Given** Handybreite, **When** die Kopfleiste erscheint, **Then** zeigt sie Menüknopf und
   Kontoknopf; der Umschalter für hell, dunkel und System sitzt im Menü.
2. **Given** das Menü ist offen, **When** eine Admin wischt, **Then** scrollt nur das Menü, die
   Seite dahinter bleibt stehen.
3. **Given** das Menü ist offen, **When** eine Admin mit Tastatur oder Bildschirmleser navigiert,
   **Then** bleibt der Fokus im Menü, und nach dem Schließen kehrt er zum Menüknopf zurück.
4. **Given** der Menüknopf am Handy, **When** ein Bildschirmleser ihn vorliest, **Then** heißt er
   „Menü öffnen“ bzw. „Menü schließen“.
5. **Given** Handybreite, **When** eine Admin Menüpunkte, Designumschalter, kleine Knöpfe oder das
   Schließen in Dialogen antippt, **Then** ist jede Tippfläche mindestens 44 mal 44 Punkte groß.

---

### User Story 5 · Auf den Homescreen legen (Priority: P1)

Eine Admin öffnet am iPhone den Adminbereich in Safari, wählt „Zum Home Bildschirm“ und bestätigt.
Auf dem Homescreen liegt das Icon „Summercamp Admin“. Tippt sie darauf, öffnet sich der Adminbereich
ohne Safari Leisten, wie eine eigene App. Beim ersten Start meldet sie sich einmal an, danach bleibt
sie angemeldet.

**Why this priority**: Das ist der Kern des zweiten Wunsches und mit wenig Aufwand sichtbar.

**Independent Test**: Auf einem iPhone den Adminbereich zum Homescreen hinzufügen, vom Icon starten,
anmelden, App schließen, erneut starten.

**Acceptance Scenarios**:

1. **Given** eine Admin fügt eine beliebige Adminseite zum Homescreen hinzu, **When** sie den Namen
   sieht, **Then** ist „Summercamp Admin“ vorgeschlagen und das Admin Icon zu sehen.
2. **Given** das Icon auf dem Homescreen, **When** eine Admin es antippt, **Then** startet der
   Adminbereich auf der Übersicht ohne Adressleiste und ohne Safari Leisten.
3. **Given** eine nicht angemeldete Person startet die App, **When** sie erscheint, **Then** sieht
   sie die Anmeldung und landet danach in der Übersicht.
4. **Given** jemand fügt die öffentliche Startseite zum Homescreen hinzu, **When** er das Icon sieht,
   **Then** verhält sie sich wie heute, mit öffentlichem Icon und als Lesezeichen.
5. **Given** die App läuft, **When** eine Admin einen Link nach außen antippt (Zahlungsseite,
   Mailprogramm, öffentliche Seite), **Then** öffnet er sich außerhalb der App und die App bleibt
   an ihrer Stelle.

---

### User Story 6 · Wirkt wie eine App (Priority: P2)

Im Homescreen Modus liegt die Kopfleiste sauber unter Uhrzeit und Notch, unten bleibt Abstand zum
Homeindikator. Die Statusleiste passt farblich zu hellem und dunklem Design. Ein Knopf in der
Kopfleiste lädt die Seite neu, weil es im App Modus kein Herunterziehen zum Aktualisieren gibt. Die
Seite federt am Rand nicht nach und Antippen erzeugt keinen grauen Blitz.

**Why this priority**: Macht den Unterschied zwischen Lesezeichen und App, ist aber nicht nötig,
damit die App funktioniert.

**Independent Test**: Auf einem iPhone mit Notch die App starten, hell und dunkel wechseln, auf der
Übersicht neu laden, an den Rand scrollen, im Busscanner die Kamera starten.

**Acceptance Scenarios**:

1. **Given** die App läuft auf einem iPhone mit Notch oder Dynamic Island, **When** sie erscheint,
   **Then** überdeckt nichts die Kopfleiste und nichts Bedienbares liegt unter dem Homeindikator.
2. **Given** helles oder dunkles Design, **When** die App erscheint, **Then** passen Statusleiste
   und Hintergrund dazu.
3. **Given** die App läuft im Homescreen Modus, **When** eine Admin den Neuladen Knopf antippt,
   **Then** lädt die aktuelle Seite mit frischen Daten neu.
4. **Given** der Adminbereich läuft in Safari, **When** die Kopfleiste erscheint, **Then** gibt es
   keinen Neuladen Knopf.
5. **Given** die App läuft, **When** eine Admin den Busscanner startet, **Then** funktioniert die
   Kamera wie in Safari.
6. **Given** die App läuft, **When** eine Admin über den Seitenrand hinaus wischt oder ein Element
   antippt, **Then** federt die Seite nicht nach und es erscheint kein grauer Tippblitz.
7. **Given** die App läuft bei Handybreite, **When** eine Seite erscheint, **Then** zeigt unten eine
   feste Leiste Übersicht, Finanzen und Bus (nur die erlaubten) und „Menü“; der aktive Bereich ist
   hervorgehoben.
8. **Given** eine Admin darf Finanzen oder Bus nicht sehen, **When** die Leiste erscheint, **Then**
   fehlt dieser Eintrag, die übrigen teilen sich die Breite.
9. **Given** die untere Leiste ist sichtbar, **When** eine Admin bis zum Seitenende scrollt oder ein
   Dialog öffnet, **Then** verdeckt die Leiste keinen Inhalt und keine Dialogknöpfe.
10. **Given** der Adminbereich läuft in Safari oder ab Tabletbreite, **When** er erscheint, **Then**
    gibt es keine untere Leiste.

---

### Edge Cases

- Das iPhone wird gedreht: Dialoge, Kartenliste und sichere Abstände passen sich an, nichts wird
  abgeschnitten.
- Ein Dialog ist offen und die Tastatur erscheint: Der Inhalt bleibt scrollbar, das aktive Feld
  bleibt sichtbar.
- Sehr lange Namen oder Beträge in der Kartenliste brechen um oder werden gekürzt, ohne die Karte
  zu sprengen.
- Druckansichten (Zimmerplanung, Zeltkreise) bleiben unverändert, auch wenn sie aus der App
  geöffnet werden.
- Ohne Verbindung zeigt die App eine verständliche Fehlermeldung, kein weißes Bild; der Neuladen
  Knopf versucht es erneut.
- Die Anmeldung läuft in der App ab: Die App zeigt wieder die Anmeldung und danach die zuletzt
  geöffnete Adminseite.
- Eine Admin hat den Adminbereich schon als altes Lesezeichen auf dem Homescreen: Es wirkt erst
  nach erneutem Hinzufügen als App; ein Hinweis dazu steht in der Anleitung.
- Android und andere Browser: Bekommen dieselben Verbesserungen am Handy; die Homescreen Angaben
  wirken dort, soweit der Browser sie unterstützt.

## Requirements *(mandatory)*

### Functional Requirements

**Handybedienbarkeit**

- **FR-001**: Eingabefelder, Auswahlfelder und Textfelder im Adminbereich MUST bei Handybreite eine
  Schriftgröße haben, bei der iOS beim Antippen nicht vergrößert; ab Tabletbreite bleibt die heutige
  Größe.
- **FR-002**: Das Vergrößern mit zwei Fingern MUST weiterhin möglich bleiben.
- **FR-003**: Dialoge MUST bei Handybreite die volle Breite und die verfügbare Höhe nutzen; Kopf und
  Fußleiste bleiben sichtbar, nur der Inhalt scrollt.
- **FR-004**: Die Fußleiste von Dialogen MUST bei Platzmangel umbrechen; kein Knopf wird abgeschnitten
  oder unlesbar.
- **FR-005**: Bedienelemente im Adminbereich MUST bei Handybreite eine Tippfläche von mindestens
  44 mal 44 Punkten haben; das betrifft mindestens Menüpunkte, Designumschalter, Menüknopf, kleine
  Knöpfe und das Schließen von Dialogen.
- **FR-006**: Der Designumschalter MUST bei Handybreite im Menü statt in der Kopfleiste sitzen.
- **FR-007**: Die Anmeldungen MUST bei Handybreite als Kartenliste erscheinen mit mindestens Name,
  Status, Zahlungsstand und offenem Betrag; Antippen öffnet den Anmeldedialog.
- **FR-008**: Die Kartenliste MUST dieselben Such, Filter und Sortiereinstellungen wie die Tabelle
  verwenden und denselben leeren Zustand zeigen.
- **FR-009**: Das Verschieben von Spalten MUST nur in der Tabellenansicht angeboten werden.
- **FR-010**: Bei offenem Menü am Handy MUST die Seite dahinter stillstehen; der Fokus bleibt im
  Menü und kehrt nach dem Schließen zum Menüknopf zurück.
- **FR-011**: Der Menüknopf MUST am Handy mit „Menü öffnen“ bzw. „Menü schließen“ beschriftet sein,
  am Rechner wie heute mit der Beschriftung für Einklappen.
- **FR-012**: Ab Tabletbreite MUST der Adminbereich unverändert aussehen und funktionieren.

**Homescreen App**

- **FR-013**: Der Adminbereich MUST Angaben für eine Homescreen App liefern: Name „Summercamp Admin“,
  Kurzname, Start auf der Adminübersicht, Anzeige ohne Browserleisten, Hintergrundfarbe und
  Themefarbe.
- **FR-014**: Diese Angaben MUST nur auf Adminseiten gelten; öffentliche Seiten verhalten sich beim
  Hinzufügen zum Homescreen wie heute.
- **FR-015**: Die Homescreen App MUST ein eigenes Admin Icon in den Größen für iPhone und für
  Homescreen Apps allgemein haben, klar unterscheidbar vom öffentlichen Icon.
- **FR-016**: Im Homescreen Modus MUST die Statusleiste zum aktiven Design passen, hell wie dunkel.
- **FR-017**: Im Homescreen Modus MUST Kopfleiste, Seiteninhalt, Menü und Dialoge die sicheren
  Bereiche von Notch, Dynamic Island und Homeindikator freihalten.
- **FR-018**: Im Homescreen Modus MUST die Kopfleiste einen Knopf zum Neuladen der aktuellen Seite
  zeigen; in Safari erscheint er nicht.
- **FR-019**: Im Homescreen Modus MUST das Nachfedern am Seitenrand und der graue Tippblitz
  unterbleiben.
- **FR-019a**: Im Homescreen Modus bei Handybreite MUST unten eine feste Leiste erscheinen mit
  Übersicht, Finanzen und Bus, jeweils nur bei Sichtrecht, und „Menü“ als letztem Eintrag; der aktive
  Bereich ist hervorgehoben, jede Tippfläche misst mindestens 44 mal 44 Punkte, und die Leiste hält
  den Bereich des Homeindikators frei. Seiteninhalt und Dialoge werden davon nie verdeckt.
- **FR-020**: Links nach außerhalb des Adminbereichs MUST außerhalb der App öffnen, damit die App an
  ihrer Stelle bleibt.
- **FR-021**: Anmeldung, Busscanner mit Kamera, Druckansichten und Dateidownloads (CSV, PDF) MUST im
  Homescreen Modus funktionieren wie in Safari.
- **FR-022**: Die bestehende Zugriffskontrolle MUST unverändert gelten; die App zeigt nur, was die
  angemeldete Admin auch in Safari sieht.
- **FR-023**: Eine kurze Anleitung „Admin auf den Homescreen legen“ MUST in der Quickstart Doku
  dieses Features stehen, inklusive Hinweis auf die einmalige separate Anmeldung.
- **FR-024**: Alle neuen sichtbaren Texte MUST deutsch sein und an der zentralen Stelle für
  Admintexte liegen.

### Key Entities

Keine neuen Daten. Das Feature ändert nur Darstellung und Homescreen Angaben des Adminbereichs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Auf einem iPhone vergrößert sich die Seite beim Antippen von keinem einzigen Feld im
  Adminbereich (0 von allen geprüften Feldern in Anmeldedialog, Finanztab, Camp und Feld Dialogen).
- **SC-002**: Eine Admin findet am Handy eine bestimmte Anmeldung und öffnet sie in unter
  15 Sekunden, ohne seitlich zu wischen.
- **SC-003**: Alle Bedienelemente aus FR-005 messen bei Handybreite mindestens 44 mal 44 Punkte.
- **SC-004**: Eine Admin legt die App ohne Hilfe nach der Anleitung in unter 1 Minute auf den
  Homescreen, und sie startet beim ersten Versuch ohne Safari Leisten.
- **SC-005**: Ab Tabletbreite zeigen Vergleichsbilder vor und nach der Änderung keine Unterschiede
  im Adminbereich.
- **SC-006**: Öffentliche Seiten zeigen keine Änderung, weder im Aussehen noch beim Hinzufügen zum
  Homescreen.

## Assumptions

- Zielgerät ist vor allem das iPhone mit aktuellem iOS in Safari; Android profitiert von den
  Verbesserungen am Handy mit.
- Handybreite heißt: schmaler als die heutige Grenze, ab der die Seitenleiste fest erscheint.
- Die Kartenliste der Anmeldungen folgt dem Muster der bestehenden Kartenliste im Finanztab.
- Die Homescreen App hat in iOS eigene Cookies; eine einmalige Anmeldung in der App ist
  hingenommen und wird dokumentiert, nicht technisch umgangen.
- Das Admin Icon wird aus dem bestehenden Markenzeichen des Adminbereichs (Monogramm „SC“)
  abgeleitet; ein eigener Entwurf durch Dritte ist nicht nötig.
- Benutzer, Preise und weitere breite Tabellen behalten ihr seitliches Scrollen.
- Kein Offline Betrieb, keine Pushnachrichten, keine Startbilder pro Gerät, keine Änderungen an
  öffentlichen Seiten.
