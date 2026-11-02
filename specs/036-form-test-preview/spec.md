# Feature Specification: Anmeldeformular testen

**Feature Branch**: `036-form-test-preview`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Im Adminbereich, wo ich das Anmeldeformular als Vorschau sehe, möchte ich das Formular wirklich so sehen, wie es final auf der Landingpage wäre, damit ich es testen und sehen kann."

**Kontext**: Auf der Felderseite eines Camps (`Camps › Felder`) zeigt eine Vorschaukarte heute nur
eine vereinfachte Liste der Felder: deaktiviert, ohne die Schritte, ohne Prüfung, ohne die Optik
der Landingpage. Wer Felder anlegt oder ändert, kann also nicht ausprobieren, wie sich das Formular
für Teilnehmende anfühlt, solange die Anmeldung nicht offen ist. Und eine echte Testanmeldung auf
der Landingpage würde eine echte Anmeldung mit Mail und Zahlung erzeugen.

**Produktentscheidungen (Annahmen, vom Projektverantwortlichen bei der Freigabe zu bestätigen)**:

- Die Testansicht nutzt dasselbe Formular wie die Landingpage. Es gibt keine zweite Nachbildung.
- Absenden im Test speichert nichts, verschickt nichts und startet keine Zahlung. Der Server
  prüft die Eingaben trotzdem mit derselben Prüfung wie bei einer echten Anmeldung.
- Die Testansicht funktioniert für jedes Camp, auch wenn es nicht das aktuelle ist und die
  Anmeldung geschlossen, noch nicht offen oder ausgebucht ist.
- Der Einstieg ist ein Button „Formular testen“ in der bestehenden Vorschaukarte. Die bestehende
  kompakte Vorschau bleibt daneben erhalten.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Formular wie auf der Landingpage sehen (Priority: P1)

Eine Admin hat für das Camp 2027 neue Felder angelegt. Auf der Felderseite klickt sie in der
Vorschaukarte auf „Formular testen“. Es öffnet sich eine Ansicht, in der das Anmeldeformular genau
so aussieht wie im Abschnitt „Anmelden“ der Landingpage: gleicher Hintergrund, gleiche Schrift,
gleiche Schritte mit Fortschrittsanzeige, gleiche Feldtypen, gleiche Hilfetexte.

**Why this priority**: Das ist der Kern der Anfrage: sehen, wie das Formular wirklich wirkt.

**Independent Test**: Für ein Camp mit mindestens einem eigenen Feld „Formular testen“ öffnen und
die Ansicht neben den Abschnitt „Anmelden“ der Landingpage (bei offener Anmeldung desselben Camps)
legen: Aufbau, Schritte und Optik stimmen überein.

**Acceptance Scenarios**:

1. **Given** die Felderseite eines Camps, **When** eine Admin mit Zugang zum Bereich Camps sie
   öffnet, **Then** steht in der Vorschaukarte ein Button „Formular testen“.
2. **Given** der Button, **When** die Admin ihn klickt, **Then** öffnet sich die Testansicht mit
   dem Formular dieses Camps, aufgeteilt in dieselben Schritte wie auf der Landingpage.
3. **Given** die Testansicht, **When** sie angezeigt wird, **Then** steht oben gut sichtbar ein
   Hinweis „Testmodus: Es wird nichts gespeichert und nichts verschickt.“ und ein Weg zurück zur
   Felderseite.
4. **Given** ein Camp, dessen Anmeldung geschlossen, noch nicht offen oder ausgebucht ist,
   **When** die Admin die Testansicht öffnet, **Then** sieht sie trotzdem das ausfüllbare Formular.
5. **Given** ein Camp ohne eigene Felder, **When** die Admin die Testansicht öffnet, **Then**
   sieht sie das Formular mit den festen Grundfeldern (Vorname, Nachname, Mail, Geschlecht).
6. **Given** die Testansicht auf einem Handy, **When** sie angezeigt wird, **Then** verhält sie
   sich wie die Landingpage auf dem Handy, ohne seitliches Scrollen.

---

### User Story 2 · Formular durchklicken und Prüfung ausprobieren (Priority: P1)

Die Admin füllt das Formular in der Testansicht aus, lässt absichtlich ein Pflichtfeld leer und
klickt auf „Weiter“. Sie sieht dieselbe Fehlermeldung wie Teilnehmende. Danach füllt sie alles aus,
springt zwischen den Schritten, sieht die Übersicht vor dem Absenden und ändert dort einen Wert.

**Why this priority**: Nur so lässt sich prüfen, ob Pflichtfelder, Auswahlmöglichkeiten und
Reihenfolge sinnvoll sind.

**Independent Test**: In der Testansicht ein Pflichtfeld leer lassen und „Weiter“ klicken: die
Meldung erscheint am Feld. Alles ausfüllen: die Übersicht zeigt alle Antworten.

**Acceptance Scenarios**:

1. **Given** ein leeres Pflichtfeld, **When** die Admin „Weiter“ klickt, **Then** erscheint dieselbe
   Meldung wie auf der Landingpage und der Fokus springt auf das Feld.
2. **Given** eine ungültige Mailadresse, **When** die Admin weitergeht, **Then** erscheint die
   gleiche Meldung wie auf der Landingpage.
3. **Given** alle Schritte ausgefüllt, **When** die Admin zur Übersicht kommt, **Then** sieht sie
   alle Antworten und kann einzelne Schritte zum Ändern öffnen.
4. **Given** eine Auswahlfrage, deren Antwortmöglichkeit im Camp schon voll ist, **When** die
   Testansicht angezeigt wird, **Then** ist diese Möglichkeit genauso gekennzeichnet wie auf der
   Landingpage.

---

### User Story 3 · Test absenden ohne Folgen (Priority: P1)

Die Admin klickt in der Übersicht auf den Absendebutton. Der Server prüft die Eingaben wie bei einer
echten Anmeldung. Ist alles gültig, erscheint eine Erfolgsmeldung, die deutlich als Test markiert
ist. Es entsteht keine Anmeldung, keine Mail, keine Zahlung.

**Why this priority**: Absenden ist der letzte Schritt des Formulars. Ohne diesen Schritt ist der
Test unvollständig, und ein echtes Absenden darf keine Daten erzeugen.

**Independent Test**: Testanmeldung absenden, danach die Anmeldungsliste, die Mailhistorie und das
Zahlungskonto prüfen: es gibt nichts Neues.

**Acceptance Scenarios**:

1. **Given** ein vollständig gültiges Formular, **When** die Admin absendet, **Then** erscheint eine
   Meldung „Test erfolgreich: So würde die Anmeldung angenommen. Es wurde nichts gespeichert.“
2. **Given** das Absenden im Test, **When** es abgeschlossen ist, **Then** gibt es keine neue
   Anmeldung, keinen Eintrag in der Mailhistorie, keine Zahlungssitzung und keinen Eintrag, der für
   Kapazität oder Missbrauchsschutz zählt.
3. **Given** der Server lehnt eine Eingabe ab, **When** die Admin absendet, **Then** erscheint die
   Meldung am betroffenen Feld wie auf der Landingpage, und die Admin wird zu dem Schritt geführt.
4. **Given** die Erfolgsmeldung im Test, **When** die Admin „Noch einmal testen“ klickt, **Then**
   beginnt das Formular leer von vorn.
5. **Given** die Erfolgsmeldung im Test, **When** sie angezeigt wird, **Then** enthält sie keine
   Referenznummer und keinen Zahlungsbutton, die mit echten verwechselt werden könnten.

---

### Edge Cases

- Ein Feld wird in einem anderen Browserfenster geändert, während die Testansicht offen ist: nach
  dem Neuladen der Testansicht gilt der neue Stand.
- Ein Camp existiert nicht (falscher Link): die Testansicht zeigt die übliche „nicht gefunden“
  Seite des Adminbereichs.
- Eine Admin ohne Zugang zum Bereich Camps ruft den Link direkt auf: Zugriff wird verweigert wie bei
  der Felderseite.
- Der Testabsendeweg wird ohne Anmeldung im Adminbereich aufgerufen: er wird abgelehnt.
- Die Seite läuft im Vorabmodus „Demnächst“: die Testansicht funktioniert trotzdem, weil sie im
  Adminbereich liegt.
- Admins ohne Schreibrecht für Camps (nur Lesen) dürfen die Testansicht nutzen, da sie nichts
  verändert.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Vorschaukarte der Felderseite MUSS einen Button „Formular testen“ zeigen, der zur
  Testansicht des jeweiligen Camps führt.
- **FR-002**: Die Testansicht MUSS das Anmeldeformular mit derselben Darstellung, denselben
  Schritten, denselben Feldern (feste Grundfelder plus eigene Felder des Camps), denselben Texten und
  derselben Prüfung zeigen wie die Landingpage. Es DARF keine zweite, abweichende Nachbildung des
  Formulars entstehen.
- **FR-003**: Die Testansicht MUSS den Hintergrund und die Schrift des Abschnitts „Anmelden“ der
  Landingpage übernehmen.
- **FR-004**: Die Testansicht MUSS einen dauerhaft sichtbaren Hinweis auf den Testmodus und einen
  Link zurück zur Felderseite zeigen.
- **FR-005**: Die Testansicht MUSS unabhängig vom Anmeldezeitraum, der Kapazität und davon, ob das
  Camp das aktuelle ist, das ausfüllbare Formular zeigen.
- **FR-006**: Ausgebuchte Antwortmöglichkeiten MÜSSEN wie auf der Landingpage gekennzeichnet sein.
- **FR-007**: Absenden im Test MUSS die Eingaben auf dem Server mit derselben Prüfung wie bei einer
  echten Anmeldung prüfen und Fehler pro Feld zurückgeben.
- **FR-008**: Absenden im Test DARF keine Anmeldung anlegen, keine Mail verschicken, keine
  Zahlungssitzung erstellen, keinen Eintrag für Missbrauchsschutz oder Drosselung erzeugen und
  keine Kapazität verbrauchen.
- **FR-009**: Nach gültigem Absenden im Test MUSS eine als Test markierte Erfolgsmeldung ohne
  Referenznummer und ohne Zahlungsbutton erscheinen, mit der Möglichkeit, erneut zu testen.
- **FR-010**: Testansicht und Testabsendeweg MÜSSEN nur für angemeldete Admins mit Zugang zum
  Bereich Camps erreichbar sein. Andere werden abgewiesen.
- **FR-011**: Alle sichtbaren Texte MÜSSEN deutsch sein.
- **FR-012**: Die bestehende kompakte Vorschau auf der Felderseite MUSS erhalten bleiben.

### Key Entities

Keine neuen Daten. Die Testansicht liest das Camp und seine Formularfelder sowie die belegten
Antwortmöglichkeiten. Sie schreibt nichts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eine Admin kann von der Felderseite aus mit einem Klick ein Camp Formular vollständig
  durchklicken und absenden, in unter 2 Minuten bei 10 Feldern.
- **SC-002**: Nach 10 Testabsendungen ist die Zahl der Anmeldungen, Mails und Zahlungen des Camps
  unverändert.
- **SC-003**: Bei gleichem Camp zeigen Landingpage und Testansicht dieselben Schritte, Felder,
  Meldungen und dieselbe Optik des Formulars, ohne sichtbare Abweichung außer dem Testhinweis und
  der Erfolgsmeldung.
- **SC-004**: Jede Feldänderung auf der Felderseite ist nach dem Öffnen der Testansicht sofort
  sichtbar, ohne Veröffentlichen oder Warten.

## Assumptions

- Versteckte Preisstufen und Einladungslinks spielen im Test keine Rolle: die Testansicht zeigt das
  Formular ohne Preisstufe. Die Preiszeile der Landingpage gehört nicht zum Formular und wird nicht
  nachgebildet.
- Der Bot Schutz der Landingpage (Mindestzeit, Fangfeld) wird im Test nicht geprüft, da nur
  angemeldete Admins absenden.
- Die Testansicht ist eine eigene Seite im Adminbereich, nicht ein kleines Fenster in der Karte,
  damit das Formular in voller Breite wie auf der Landingpage wirkt.
- AGENTS.md Abschnitt 4 (Admin dashboard) wird vor der Umsetzung um einen Satz zur Testansicht
  ergänzt (Verfassung, Prinzip III).
