# Feature Specification: Echte Campfotos auf der Landingpage

**Feature Branch**: `027-camp-photos`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Echte Campfotos auf der Landingpage: Die drei Platzhalterfotos (Worship Kachel im Programm, Jugendgruppen Fotoband, Lagerfeuer Band vor der Anmeldung) werden durch ausgewählte Fotos vom Summercamp 2026 ersetzt; die beiden Programmkacheln ohne Bild (Inputs, Sport/Lagerfeuer/Geländespiel) bekommen passende Fotos. Nur Bilder ohne klar erkennbare Personen, kein Motto \"Born to Win\" sichtbar (das Motto 2027 ist noch offen). Hero bleibt unverändert (Video läuft parallel in specs/026-hero-video). Bilder werden für das Web verkleinert und im Projekt ausgeliefert, nicht mehr von externen Bilddiensten geladen. Kandidaten: _MG_3631/_MG_3632/_MG_3633 Lagerfeuer, _MG_3076 erhobene Hände, IMG_3330 Volleyball vor Wolken, _MG_2258 Lichtschwerter, IMG_3265 Umarmung am Netz, _MG_2528 gestalteter Raum, IMG_3500/IMG_3491/IMG_4139 Lobpreis neutral, IMG_3450 Strand, IMG_3901 Eiswaffel. Quelle: ZIP ~/Downloads/20260607 Summercamp-20261031T115053Z-1-001.zip"

**Kontext**: Unterhalb des Hero zeigt die Landingpage heute drei Stockfotos (Anbetung, Jugendliche
draußen, Lagerfeuer) und zwei Programmkacheln nur mit Symbol. Aus den 224 Fotos vom Summercamp 2026
wurde am 2026-10-31 eine Auswahl ohne klar erkennbare Personen getroffen. Echte Bilder vom eigenen
Camp wirken glaubwürdiger als Stockfotos. Der Hero ist nicht Teil dieses Features (specs/026-hero-video).

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Echte Fotos statt Stockfotos (Priority: P1)

Eine Jugendliche oder ein Elternteil scrollt über die Landingpage und sieht in Programm, Jugendgruppen
und Lagerfeuer Abschnitt Fotos vom echten Camp: Anbetung in der Scheune, Lagerfeuer bei Nacht und
Gemeinschaft beim Lobpreis.

**Why this priority**: Die Stockfotos sind der sichtbarste Platzhalter der Seite. Ohne diesen Tausch
bringt das Feature keinen Wert.

**Independent Test**: Landingpage öffnen und die drei bisherigen Bildstellen ansehen. Jede zeigt ein
Campfoto aus der Auswahl, keine lädt von einem fremden Bilddienst.

**Acceptance Scenarios**:

1. **Given** die Landingpage, **When** der Programmabschnitt sichtbar ist, **Then** zeigt die große
   Worship Kachel das Foto mit erhobenen Händen von hinten in der Scheune.
2. **Given** die Landingpage, **When** der Jugendgruppen Abschnitt sichtbar ist, **Then** zeigt das
   Fotoband die Lobpreisgemeinschaft als Silhouetten vor der Bühne.
3. **Given** die Landingpage, **When** der Abschnitt vor der Anmeldung sichtbar ist, **Then** zeigt
   das Band das Lagerfeuer bei Nacht mit Silhouetten.
4. **Given** die Seite ist geladen, **When** die geladenen Bilder geprüft werden, **Then** stammt keines
   von einem fremden Bilddienst.

---

### User Story 2 · Programmkacheln mit Fotos (Priority: P2)

Die beiden kleineren Programmkacheln (Inputs sowie Sport, Lagerfeuer und Geländespiel) zeigen
ebenfalls ein passendes Campfoto, sodass das Programm auf einen Blick lebendig wirkt.

**Why this priority**: Wertet den Programmabschnitt auf, ist aber ohne Story 1 nur halb so wirksam.

**Independent Test**: Programmabschnitt auf Handy und Desktop ansehen. Beide kleinen Kacheln zeigen
ein Foto, Überschrift und Text bleiben gut lesbar.

**Acceptance Scenarios**:

1. **Given** der Programmabschnitt, **When** er angezeigt wird, **Then** zeigt die Kachel „Inspirierende
   Inputs“ den gestalteten Raum mit dem Bibelvers an der Decke.
2. **Given** der Programmabschnitt, **When** er angezeigt wird, **Then** zeigt die Kachel zu Sport,
   Lagerfeuer und Geländespiel den Volleyball vor dem Wolkenhimmel.
3. **Given** eine schmale Handyansicht, **When** die Kacheln untereinander stehen, **Then** sind Text
   und Bild nicht abgeschnitten und der Text hat ausreichend Kontrast.

---

### Edge Cases

- Ein Foto kann nicht geladen werden: die Kachel oder das Band zeigt die dunkle Grundfarbe, Text bleibt
  lesbar, das Layout springt nicht.
- Langsame Verbindung: Bilder unterhalb des sichtbaren Bereichs laden erst beim Scrollen und blockieren
  den Seitenaufbau nicht.
- Sehr breiter Bildschirm: das Fotoband wird beschnitten statt verzerrt, der wichtige Bildteil (Feuer,
  Hände) bleibt sichtbar.
- Ohne JavaScript: alle Fotos und Texte sind sichtbar.
- Bewegung reduziert: das Lagerfeuer Band verzichtet wie bisher auf Bewegungseffekte.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Worship Kachel MUSS das Foto `_MG_3076` (erhobene Hände von hinten) zeigen.
- **FR-002**: Das Jugendgruppen Fotoband MUSS das Foto `IMG_3491` (Lobpreis, alle von hinten)
  zeigen.
- **FR-003**: Das Lagerfeuer Band vor der Anmeldung MUSS das Foto `_MG_3632` (Lagerfeuer bei Nacht)
  zeigen.
- **FR-004**: Die Kachel „Inspirierende Inputs“ MUSS das Foto `_MG_2528` (gestalteter Raum) zeigen.
- **FR-005**: Die Kachel zu Sport, Lagerfeuer und Geländespiel MUSS das Foto `IMG_3330` (Volleyball vor
  Wolken) zeigen.
- **FR-006**: Auf keinem verwendeten Foto DÜRFEN Personen in der ausgelieferten Größe klar erkennbar
  sein, und kein Foto DARF das Motto „Born to Win“ zeigen.
- **FR-007**: Alle Fotos MÜSSEN von der eigenen Website ausgeliefert werden, nicht von einem fremden
  Bilddienst.
- **FR-008**: Die Fotos MÜSSEN für das Web verkleinert sein; die Originale (6000 × 4000) werden nicht
  ausgeliefert.
- **FR-009**: Jedes Foto MUSS einen deutschen Alternativtext haben, der das echte Motiv beschreibt.
- **FR-010**: Text über Fotos MUSS auf Handy und Desktop ausreichend Kontrast haben.
- **FR-011**: Hero, Abschnittsreihenfolge, Texte der Abschnitte und Anmeldebuttons bleiben unverändert.
- **FR-012**: Die Auswahl der Quellfotos MUSS im Feature dokumentiert sein, damit sie im nächsten Jahr
  nachvollziehbar ausgetauscht werden kann.

### Key Entities

- **Campfoto**: ein ausgewähltes Foto vom Summercamp 2026 mit Quelldatei, Einsatzort auf der Seite,
  Bildausschnitt und deutschem Alternativtext.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 5 von 5 Bildstellen unterhalb des Hero zeigen Campfotos, 0 Stockfotos sind übrig.
- **SC-002**: Beim Laden der Landingpage geht keine Bildanfrage an einen fremden Bilddienst.
- **SC-003**: Die fünf ausgelieferten Fotos sind zusammen kleiner als 1,5 MB in der größten
  Desktopvariante.
- **SC-004**: Die Ladezeit der Landingpage wird gegenüber heute nicht spürbar schlechter.
- **SC-005**: Bei einer Sichtprüfung in voller Ausgabegröße ist auf keinem Foto eine Person klar
  erkennbar und kein „Born to Win“ zu sehen.

## Assumptions

- Die Fotos stammen vom Summercamp 2026 und dürfen von der Gemeinde für die eigene Website genutzt
  werden. Da keine Person klar erkennbar ist, ist keine Einzeleinwilligung nötig.
- Die Zuordnung Foto zu Bildstelle oben ist ein Vorschlag aus der Sichtung vom 2026-10-31; Ersatzkandidaten
  sind `_MG_3633` und `_MG_3631` (Lagerfeuer), `IMG_3500` (Lobpreis, Sprecherin auf der Bühne erkennbar, daher nur Reserve), `_MG_2529` (Raum),
  `IMG_3265` (Volleyball Umarmung).
- Die Texte der Abschnitte bleiben, nur Bilder und Alternativtexte ändern sich.
- Die Datenschutzerklärung muss nicht geändert werden, da schon heute alle Bilder über die eigene Domain
  ausgeliefert werden (specs/025-legal-pages).
- Der Hero wird parallel in specs/026-hero-video bearbeitet und hier nicht angefasst.
