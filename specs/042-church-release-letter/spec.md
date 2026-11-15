# Feature Specification: Schulbefreiung im Gemeindebriefkopf

**Feature Branch**: `042-church-release-letter`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "Bezüglich der Schulbefreiung habe ich jetzt eine Befreiung bekommen, wie wir sie die letzten Jahre immer hatten. Hier ist diese, mach bitte einen Plan." Vorlage: `template-2026.pdf` in diesem Ordner (Teilnehmer Bescheinigung der Freien Christengemeinde Blankenheim für das Summercamp 2026).

**Kontext**: Feature 020 erzeugt heute einen selbst formulierten Brief „Bitte um Unterrichtsbefreiung“
an eine Lehrkraft, mit Schuladresse, Adresse der Person und Klasse, in schlichtem Layout. Die
Gemeinde hat in den letzten Jahren aber immer ein anderes Schreiben verwendet: eine „Teilnehmer
Bescheinigung“ auf Briefpapier der Gemeinde, gerichtet an die Schule, mit Verweis auf die
Regelung der Schulpflicht zu Kirchentagen, mit Stempel und Unterschrift. Schulen kennen dieses
Schreiben. Die Befreiung soll künftig genau so aussehen.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-11-15 getroffen)**:

- Teilnehmende geben nur noch den Namen der Schule und den Ort der Schule an. Lehrkraft,
  Schuladresse, eigene Adresse und Klasse entfallen im Formular und im Brief. Die Anrede lautet
  „Sehr geehrte Damen und Herren,“.
- Der Brief nennt den ganzen Campzeitraum (erster bis letzter Camptag) und den Camport. Die pro
  Camp eingestellten Befreiungstage bleiben, dienen aber nur noch den Hinweisen auf der Website
  (Landingpage, Teilnehmerseite, Mails).
- Das PDF bildet den vollen Briefkopf der Vorlage nach: Logo, Absenderzeile, Fußzeile und Stempel
  mit Unterschrift.
- Unverändert bleiben: Freigabe erst nach Zahlung, Versand nur an die Mailadresse der Anmeldung,
  Bearbeitung durch Admins, kein Texteditor, das PDF wird nie gespeichert.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Bescheinigung mit zwei Angaben erstellen (Priority: P1)

Eine angemeldete und bezahlte Teilnehmerin öffnet ihre Teilnehmerseite, Reiter Dokumente. Im
Abschnitt Schulbefreiung trägt sie nur „Gesamtschule Eifel“ und „Nettersheim“ ein und sendet ab.
Sie erhält sofort ein PDF zum Herunterladen und dasselbe PDF per Mail.

**Why this priority**: Das ist der eigentliche Nutzen. Weniger Felder senken die Hürde, und die
Schule bekommt das Schreiben, das sie aus den Vorjahren kennt.

**Independent Test**: Auf einer Testanmeldung mit Zahlung die zwei Felder ausfüllen, PDF laden und
neben die Vorlage legen.

**Acceptance Scenarios**:

1. **Given** eine aktive, mindestens teilweise bezahlte Anmeldung und eine eingeschaltete
   Befreiung, **When** die Person Schulname und Schulort einträgt und absendet, **Then** entsteht
   sofort das PDF und eine Mail mit dem PDF geht an die Adresse der Anmeldung.
2. **Given** das Formular, **When** die Person es öffnet, **Then** sieht sie ihren Namen
   (nicht änderbar) und genau zwei Eingabefelder: Name der Schule und Ort der Schule.
3. **Given** ein leeres Feld, **When** die Person absendet, **Then** erscheint am Feld „Bitte
   ausfüllen.“ und es entsteht kein PDF.
4. **Given** eine bereits erstellte Bescheinigung, **When** die Person die Angaben ändert,
   **Then** zeigt der neue Download die neuen Angaben.

---

### User Story 2 · Das PDF sieht aus wie das gewohnte Schreiben (Priority: P1)

Die Schule erhält ein Schreiben, das inhaltlich und optisch der Vorlage von 2026 entspricht.

**Why this priority**: Die Akzeptanz durch Schulen hängt am bekannten Schreiben der Gemeinde.

**Independent Test**: Admin Vorschau PDF mit Beispieldaten öffnen und Abschnitt für Abschnitt mit
`template-2026.pdf` vergleichen.

**Acceptance Scenarios**:

1. **Given** ein Camp vom 03.06.2026 bis 07.06.2026 in „Nieuwpoort/Belgien“ und eine Anmeldung
   „John Hacatrian“ mit Schule „Gesamtschule Eifel“ in „Nettersheim“, erstellt am 01.06.2026,
   **When** das PDF entsteht, **Then** enthält es von oben nach unten:
   - oben links das Logo der Gemeinde mit der grünen Linie über die Seitenbreite,
   - die kleine Absenderzeile „Freie Christengemeinde Blankenheim, Bahnhofstr. 18 , 53945 Blankenheim“,
   - links die Empfängerzeilen „Gesamtschule Eifel“ und „Nettersheim“,
   - rechts „Blankenheim, 01.06.2026“ und darunter die Telefonnummer der Gemeinde,
   - die Überschrift „Teilnehmer Bescheinigung“,
   - fett „Summercamp vom 03.06. bis 07.06.2026 in Nieuwpoort/Belgien“,
   - „Sehr geehrte Damen und Herren,“,
   - den Absatz zur AV Schulpflicht zu §128 Schulgesetz mit dem kursiven Quellenhinweis
     „(AV Schulpflicht Nr. 2 Abs. 7)“,
   - den Absatz „Da die Teilnahme aus religiösen Gründen bedingt ist (Zeitraum **03.06. bis
     07.06.2026**), bitten wir den Teilnehmer John Hacatrian, vom Unterricht zu befreien.“,
   - „Wir bitten um Ihr Verständnis.“,
   - „Für Fragen oder Erläuterungen stehe ich Ihnen selbstverständlich gerne zur Verfügung.“,
   - „Mit freundlichen Segensgrüßen“, „FCG Blankenheim eV“ und darunter Stempel mit Unterschrift,
   - die vierspaltige Fußzeile: Anschrift der Gemeinde, Büro Öffnungszeiten mit Telefon, Fax und
     Mail, Gemeindeleiter mit Mobilnummer, Bankverbindung mit Registereintrag.
2. **Given** eine Anmeldung mit Geschlecht weiblich, **When** das PDF entsteht, **Then** lautet
   die Bitte „bitten wir die Teilnehmerin <Name>, vom Unterricht zu befreien“.
3. **Given** eine Anmeldung ohne Geschlecht, **When** das PDF entsteht, **Then** lautet die Bitte
   „bitten wir die teilnehmende Person <Name>, vom Unterricht zu befreien“.
4. **Given** ein Camp ohne Ort, **When** das PDF entsteht, **Then** endet der fette Betreff nach
   dem Zeitraum, ohne „in“.
5. **Given** ein Camp innerhalb eines Jahres, **When** der Zeitraum geschrieben wird, **Then**
   steht die Jahreszahl nur am Enddatum („03.06. bis 07.06.2026“); bei einem Camp über den
   Jahreswechsel steht sie an beiden Daten.
6. **Given** sehr lange Schulnamen oder Namen, **When** das PDF entsteht, **Then** bleibt es eine
   Seite, Text bricht sauber um und überdeckt weder Stempel noch Fußzeile.

---

### User Story 3 · Admins pflegen die Bescheinigung mit denselben zwei Feldern (Priority: P2)

Ein Admin öffnet im Anmeldedialog den Bereich Schulbefreiung, trägt Schulname und Schulort ein
oder korrigiert sie, lädt das PDF herunter oder schickt es erneut.

**Why this priority**: Manche melden sich weiter per Mail; das Team braucht denselben Weg.

**Independent Test**: Im Admin Dialog einer Testanmeldung die zwei Felder füllen, PDF laden.

**Acceptance Scenarios**:

1. **Given** der Anmeldedialog, **When** der Admin den Bereich öffnet, **Then** sieht er nur
   Schulname und Schulort als Eingaben.
2. **Given** die Camp Einstellungen der Befreiung, **When** der Admin die Vorschau öffnet,
   **Then** zeigt sie das neue Schreiben mit Beispieldaten und dem hinterlegten Stempelbild.

---

### User Story 4 · Bestehende Einträge bleiben nutzbar (Priority: P3)

Wer vor der Umstellung schon eine Befreiung erstellt hat, kann ohne neue Eingabe das neue PDF laden.

**Why this priority**: Vermeidet Rückfragen von Personen, die schon eingetragen haben.

**Independent Test**: Einen alten Eintrag mit Schuladresse „Schulweg 1, 53940 Hellenthal“ nach der
Umstellung herunterladen.

**Acceptance Scenarios**:

1. **Given** ein alter Eintrag, **When** die Umstellung läuft, **Then** behält er den Schulnamen
   und erhält als Schulort den Ort aus der letzten Zeile der alten Schuladresse ohne Postleitzahl.
2. **Given** ein alter Eintrag ohne erkennbaren Ort, **When** die Umstellung läuft, **Then** wird
   die ganze letzte Adresszeile als Schulort übernommen.

### Edge Cases

- Camp ohne Start oder Enddatum: Die Befreiung lässt sich für dieses Camp nicht einschalten; der
  Schalter nennt den fehlenden Zeitraum als Grund.
- Kein Stempelbild hinterlegt: Einschalten weiterhin nicht möglich (wie bisher); die Admin
  Vorschau zeigt einen markierten Platzhalter.
- Zeichen außerhalb des Schriftsatzes (z. B. kyrillische Namen): Verhalten wie bisher, Akzente
  werden vereinfacht, Unbekanntes wird ersetzt.
- Stornierte oder noch unbezahlte Anmeldungen: unverändert wie Feature 020.
- Befreiungstage liegen nur auf der Website: Wer an keinem dieser Tage Schule hat, braucht die
  Bescheinigung nicht; das Schreiben selbst nennt trotzdem den ganzen Zeitraum.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Das Formular auf der Teilnehmerseite MUSS genau zwei Eingaben haben: Name der Schule
  und Ort der Schule, beide Pflicht, je eine Zeile.
- **FR-002**: Der Bereich Schulbefreiung im Admin Anmeldedialog MUSS dieselben zwei Eingaben haben.
- **FR-003**: Lehrkraft, Schuladresse, Adresse der Person und Klasse DÜRFEN weder abgefragt noch
  gespeichert noch im Brief gezeigt werden. Bereits gespeicherte Werte dieser Felder werden bei
  der Umstellung gelöscht.
- **FR-004**: Das PDF MUSS Inhalt, Reihenfolge und Aufbau der Vorlage `template-2026.pdf`
  wiedergeben (siehe User Story 2, Szenario 1). Der feste Text steht nur an einer Stelle im Code.
- **FR-005**: Der Brief MUSS den Campzeitraum aus Start und Ende des Camps und den Camport aus den
  Campdaten nehmen; die Befreiungstage erscheinen im Brief nicht.
- **FR-006**: Die Bitte MUSS nach dem Geschlecht der Anmeldung formuliert sein (Teilnehmer,
  Teilnehmerin, ohne Angabe neutral).
- **FR-007**: Das PDF MUSS Logo, grüne Linie, Absenderzeile und vierspaltige Fußzeile der Gemeinde
  tragen. Die Angaben der Gemeinde (Anschrift, Telefon, Fax, Mail, Öffnungszeiten,
  Gemeindeleiter, Bank, Register) stehen an genau einer Stelle im Code.
- **FR-008**: Das hochgeladene Unterschriftsbild MUSS unter „FCG Blankenheim eV“ in Stempelgröße
  wie in der Vorlage erscheinen. Der Upload bleibt der bestehende; die Admin Oberfläche weist
  darauf hin, dass Stempel und Unterschrift zusammen als ein Bild hochgeladen werden.
- **FR-009**: Das Datum oben rechts MUSS das Erstelldatum im Format TT.MM.JJJJ mit „Blankenheim,“
  davor sein.
- **FR-010**: Einschalten der Befreiung MUSS zusätzlich einen Campzeitraum voraussetzen.
  Name und Funktion der unterzeichnenden Person erscheinen im neuen Schreiben nicht und sind keine
  Voraussetzung mehr.
- **FR-011**: Freigaberegeln, Versand, Drosselung, Linkanforderung über die Landingpage und
  Mailhinweise bleiben unverändert, außer dass Texte, die Lehrkraft oder Adresse erwähnen, auf die
  neuen Angaben angepasst werden.
- **FR-012**: Alte Einträge MUSS die Umstellung nach User Story 4 übernehmen.
- **FR-013**: Die Datenschutzerklärung MUSS die verarbeiteten Angaben der Schulbefreiung auf
  Schulname und Schulort anpassen, falls sie die alten Felder nennt.

### Key Entities

- **Schulbefreiung einer Anmeldung**: Schulname, Schulort, wer zuletzt geändert hat, wann.
- **Befreiungseinstellungen eines Camps**: Schalter, Befreiungstage (nur Website), Stempelbild,
  Adressfelder zur Vorbelegung entfallen.
- **Gemeindebriefkopf**: feste Angaben der Gemeinde für Kopf und Fußzeile, Logo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eine bezahlte Person erstellt die Bescheinigung in unter einer Minute mit zwei Eingaben.
- **SC-002**: Das PDF mit den Daten der Vorlage (John Hacatrian, Gesamtschule Eifel, Nettersheim,
  01.06.2026) ist beim Nebeneinanderlegen inhaltlich wortgleich zur Vorlage und optisch im Aufbau
  nicht zu unterscheiden (Logo, Positionen, Fußzeile, Stempel).
- **SC-003**: Das PDF bleibt bei allen erlaubten Eingabelängen eine Seite.
- **SC-004**: Nach der Umstellung lassen sich alle bestehenden Einträge ohne neue Eingabe als neues
  PDF herunterladen.

## Assumptions

- Das Logo wird aus der Vorlage übernommen und als Bild im Projekt abgelegt; eine bessere
  Druckvorlage kann später einfach ersetzt werden.
- Stempel und Unterschrift kommen wie bisher als ein hochgeladenes Bild; der Admin lädt dafür das
  Stempelbild aus der Vorlage (oder einen sauberen Scan) hoch.
- „Ich“ im Rückfragesatz und die Telefonnummer oben beziehen sich auf das Gemeindebüro; es gibt
  keinen Namen unter der Unterschrift, wie in der Vorlage.
- Der Satz „bitten wir den Teilnehmer … vom Unterricht zu befreien“ wird wörtlich aus der Vorlage
  übernommen, inklusive Komma.
- Die Gemeindeangaben der Fußzeile stimmen mit `lib/legal/operator.ts` überein, wo sie sich
  überschneiden; abweichende Angaben (Öffnungszeiten, Fax, Gemeindeleiter, Bank) kommen aus der
  Vorlage.
- AGENTS.md Abschnitt 4 und 5 werden vor der Umsetzung auf die neuen Felder angepasst.
