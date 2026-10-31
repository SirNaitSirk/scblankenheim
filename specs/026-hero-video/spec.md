# Feature Specification: Hero Video aus dem Summercamp Recap

**Feature Branch**: `026-hero-video`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Hero Video auf der Landingpage: Der Hero zeigt statt des Unsplash Bergfotos ein kurzes, stummes Video aus dem Recap des letzten Summercamps (Quelle ~/Downloads/SC2026_Recap.MOV, 3:14, 4K). Der Schnitt ist bereits mit dem Nutzer abgestimmt. Verhalten: Video startet automatisch, stumm, in Schleife, inline auch auf iPhone; ein Standbild erscheint sofort und bleibt, bis das Video spielt; bei reduzierter Bewegung und ohne JavaScript nur das Standbild; Text bleibt lesbar; kleine Dateigröße; Ladezeit darf sich nicht spürbar verschlechtern; auf schwacher Verbindung oder im Datensparmodus wenn möglich nur Standbild. Die Überschrift „Ein Sommer in den Bergen“ passt nicht mehr zum Ort und wird zusammen mit dem Video angepasst. Erkennbare Teilnehmende inklusive Minderjähriger: Veröffentlichungseinwilligung muss geklärt sein. Kein Ton, keine Steuerelemente außer Pause für Barrierefreiheit. Bezug: specs/024-landing-structure."

**Kontext**: Der Hero der Landingpage zeigt heute ein Stockfoto mit Bergen und die Überschrift
„Ein Sommer in den Bergen“. Das Camp findet aber in Belgien statt, mit Strand, Dünen und einer
großen Scheune. Echte Bilder vom letzten Camp vermitteln Gemeinschaft, Abenteuer und Glaube
glaubwürdiger als ein Stockfoto. Aus dem Recap Video (3:14 Minuten) wurde am 2026-10-31 ein
kurzer Schnitt ausgewählt und mit dem Projektverantwortlichen abgestimmt.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-31 getroffen)**:

- Der Schnitt besteht aus diesen 8 Szenen in dieser Reihenfolge, zusammen etwa 14 Sekunden
  (Zeiten im Original):
  1. Kreisspiel vor den Reisebussen, 0:39 bis 0:42
  2. Volleyball auf der Wiese unter blauem Himmel, 2:07 bis 2:10
  3. Salto am Strand mit Meer und Küste, 2:06 bis 2:07
  4. Salto von der Düne, weite Einstellung, 2:52 bis 2:53
  5. Worship in der Scheune, ganzer Saal mit erhobenen Händen, 1:05 bis 1:07
  6. Bühne mit Band und Leinwand, 1:24 bis 1:26
  7. Party in der Scheune, 2:53 bis 2:55
  8. Seilziehen am Auto vor den Häusern, 2:58 bis 2:59
- Das Gruppenfoto aller Teilnehmenden am Ende des Recaps kommt **nicht** in den Hero; an seine
  Stelle tritt eine schnelle Szene (Seilziehen).
- Nicht verwendet werden: Szenen mit eingebranntem „Born to Win“ Logo, Selfies mit starker
  Verzerrung und Nahaufnahmen von Gesichtern, dunkle Nachtszenen, Collagen mit geteiltem Bild
  und Schwarzbilder.
- Das Video hat keinen Ton.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Echte Campstimmung beim ersten Blick (Priority: P1)

Jemand öffnet die Landingpage auf Handy oder Computer. Im Hero laufen sofort und ohne Zutun kurze
Szenen vom letzten Camp: Spiele, Strand, Dünen, Worship, Party. Überschrift, Text und Buttons
liegen gut lesbar darüber.

**Why this priority**: Der Hero ist der erste Eindruck. Echte Bilder zeigen, was einen im Camp
erwartet, und überzeugen Jugendliche und Eltern stärker als ein Stockfoto. Das ist der Kern des
Features.

**Independent Test**: Landingpage auf einem iPhone, einem Android Handy und einem Desktop Browser
öffnen und prüfen, dass das Video ohne Klick stumm startet, in Schleife läuft und der Text
lesbar bleibt.

**Acceptance Scenarios**:

1. **Given** jemand öffnet die Landingpage mit normaler Verbindung, **When** die Seite geladen
   ist, **Then** läuft im Hero das Video automatisch, ohne Ton und in Schleife.
2. **Given** die Seite wird auf einem iPhone geöffnet, **When** das Video startet, **Then** spielt
   es eingebettet im Hero und öffnet sich nicht im Vollbild.
3. **Given** das Video läuft, **When** helle Szenen (Himmel, Strand) zu sehen sind, **Then** sind
   Überschrift, Text und Buttons weiterhin gut lesbar.
4. **Given** das Video läuft, **When** das Ende erreicht ist, **Then** beginnt es ohne sichtbare
   Pause oder Schwarzbild von vorn.

---

### User Story 2 · Schnelle Seite trotz Video (Priority: P1)

Jemand öffnet die Seite mit einem langsamen Handy oder unterwegs mit schwacher Verbindung. Der
Hero ist sofort mit einem Standbild aus dem Video gefüllt, Text und Buttons sind sofort nutzbar.
Das Video übernimmt erst, wenn es spielbereit ist.

**Why this priority**: Eine langsame oder leere Startseite kostet Anmeldungen. Spec 024 hat
gerade sichergestellt, dass der Hero sofort sichtbar ist; das Video darf das nicht verschlechtern.

**Independent Test**: Seite mit stark gedrosseltem Netz laden und beobachten, was im Hero zu
sehen ist, bevor das Video geladen ist. Ladezeit der Seite vor und nach der Änderung vergleichen.

**Acceptance Scenarios**:

1. **Given** ein langsames Netz, **When** die Seite zu laden beginnt, **Then** zeigt der Hero
   sofort ein Standbild aus der ersten Szene, nie eine leere oder schwarze Fläche.
2. **Given** das Standbild ist zu sehen, **When** das Video spielbereit ist, **Then** geht das
   Standbild ohne sichtbaren Sprung in das laufende Video über.
3. **Given** der Browser meldet Datensparmodus oder eine sehr langsame Verbindung, **When** die
   Seite geladen wird, **Then** bleibt es beim Standbild und das Video wird nicht geladen.
4. **Given** das Video kann nicht geladen werden (Fehler, blockiert), **When** die Seite angezeigt
   wird, **Then** bleibt das Standbild stehen, ohne Fehlermeldung und ohne kaputtes Element.

---

### User Story 3 · Bewegung abschalten können (Priority: P2)

Jemand, dem Bewegung auf dem Bildschirm unangenehm ist, hat „Bewegung reduzieren“ eingestellt
oder möchte das laufende Video anhalten.

**Why this priority**: Barrierefreiheit. Automatisch laufende Bewegung über 5 Sekunden muss sich
anhalten lassen, und die Systemeinstellung muss respektiert werden.

**Independent Test**: Mit aktivierter Einstellung „Bewegung reduzieren“ die Seite öffnen. Ohne
diese Einstellung den Pausenschalter per Maus und per Tastatur bedienen.

**Acceptance Scenarios**:

1. **Given** „Bewegung reduzieren“ ist aktiv, **When** die Seite geladen wird, **Then** zeigt der
   Hero nur das Standbild, das Video startet nicht.
2. **Given** das Video läuft, **When** jemand den Pausenschalter betätigt, **Then** hält das Video
   an und der Schalter bietet „Abspielen“ an.
3. **Given** jemand bedient die Seite nur mit der Tastatur, **When** er zum Pausenschalter
   navigiert, **Then** ist der Schalter erreichbar, sichtbar fokussiert und mit einem deutschen
   Namen für Screenreader versehen.
4. **Given** JavaScript ist aus, **When** die Seite geladen wird, **Then** zeigt der Hero das
   Standbild und Text und Buttons sind vollständig nutzbar.

---

### User Story 4 · Überschrift passt zum Ort (Priority: P2)

Wer die Seite sieht, liest eine Überschrift, die zu dem passt, was im Video zu sehen ist: ein
Sommercamp in Belgien mit Strand, Dünen, Gemeinschaft und Glaube, nicht „in den Bergen“.

**Why this priority**: Bild und Text dürfen sich nicht widersprechen. Sonst wirkt die Seite
unsorgfältig.

**Independent Test**: Hero ansehen und prüfen, dass Überschrift, Bildbeschreibung und Video
denselben Ort und dieselbe Stimmung transportieren.

**Acceptance Scenarios**:

1. **Given** die Landingpage, **When** der Hero angezeigt wird, **Then** erwähnt die Überschrift
   keine Berge mehr und passt zu Küste, Gemeinschaft oder Abenteuer.
2. **Given** ein Screenreader, **When** er den Hero vorliest, **Then** beschreibt der Alternativtext
   die gezeigten Szenen und nicht eine Berglandschaft.

---

### Edge Cases

- Der Browser blockiert automatisches Abspielen trotz Stummschaltung: Das Standbild bleibt stehen,
  der Pausenschalter zeigt „Abspielen“, nichts wirkt kaputt.
- Sehr breite oder sehr hohe Bildschirme (Handy im Hochformat, Ultrawide Monitor): Das Video füllt
  den Hero vollständig, wird beschnitten statt verzerrt, und das Hauptmotiv jeder Szene bleibt im
  Bild.
- Der Tab liegt im Hintergrund oder der Hero ist aus dem Bild gescrollt: Das Video verbraucht
  keine unnötige Leistung und darf pausieren; zurück im Bild läuft es weiter, sofern es nicht von
  Hand angehalten wurde.
- Jemand hat das Video angehalten und lädt die Seite neu: Ein Neustart des Videos ist akzeptabel
  (keine dauerhafte Speicherung der Wahl nötig).
- Die Vorankündigungsseite (Spec 023) ist aktiv: Sie bleibt unverändert, das Video gehört nur zur
  Landingpage.
- Das Vorschaubild für geteilte Links (Spec 024) bleibt unverändert.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Der Hero der Landingpage MUSS anstelle des bisherigen Stockfotos ein Video aus den
  8 festgelegten Szenen in der festgelegten Reihenfolge zeigen.
- **FR-002**: Das Video MUSS ohne Ton sein, automatisch starten, in Schleife laufen und auf
  Handys eingebettet im Hero abspielen.
- **FR-003**: Das Video MUSS keine der ausgeschlossenen Inhalte enthalten (Gruppenfoto,
  eingebranntes Logo, verzerrte Selfies und Nahaufnahmen von Gesichtern, dunkle Nachtszenen,
  Collagen, Schwarzbilder).
- **FR-004**: Der Hero MUSS sofort beim Laden ein Standbild aus der ersten Szene zeigen, das bis
  zum Start des Videos sichtbar bleibt und ohne sichtbaren Sprung in das Video übergeht.
- **FR-005**: Bei aktivierter Einstellung „Bewegung reduzieren“, ohne JavaScript, bei
  Datensparmodus oder sehr langsamer Verbindung (sofern der Browser dies meldet) und bei
  Ladefehlern MUSS der Hero nur das Standbild zeigen; in den ersten drei Fällen DARF das Video
  nicht heruntergeladen werden.
- **FR-006**: Der Hero MUSS einen gut sichtbaren, mit Tastatur bedienbaren Schalter zum Anhalten
  und Fortsetzen des Videos anbieten, mit deutscher Beschriftung für Screenreader.
- **FR-007**: Überschrift, Text, Buttons, Navigation und Scrollhinweis MÜSSEN über allen Szenen
  lesbar bleiben (Kontrast mindestens wie heute über dem Foto).
- **FR-008**: Die Überschrift im Hero MUSS so angepasst werden, dass sie nicht mehr von Bergen
  spricht und zum gezeigten Camp passt. Gewählt am 2026-10-31: „Strand, Scheune, Gemeinschaft“
  mit Betonung auf „Gemeinschaft“.
- **FR-009**: Der Alternativtext bzw. die Beschreibung des Hero Mediums MUSS die gezeigten Szenen
  beschreiben; alle neuen Texte sind deutsch und stehen im zentralen Textmodul.
- **FR-010**: Die übertragene Datenmenge für das Video MUSS klein bleiben (Ziel höchstens 4 MB
  auf dem Desktop, auf Handys weniger), damit Ladezeit und Datenverbrauch vertretbar sind.
- **FR-011**: Die Zeit bis zur Anzeige des größten sichtbaren Inhalts der Landingpage DARF sich
  durch das Video nicht spürbar verschlechtern.
- **FR-012**: Das Originalvideo (555 MB) DARF NICHT ins Repository oder auf die Seite gelangen;
  nur der fertige, verkleinerte Schnitt und das Standbild werden veröffentlicht.
- **FR-013**: Die bestehende Bewegung im Hero (Parallaxe, langsamer Zoom des Fotos) entfällt für
  das Video oder wird so angepasst, dass Video und Effekt sich nicht überlagern.

### Key Entities

- **Hero Video**: der fertige Schnitt aus 8 Szenen, etwa 14 Sekunden, ohne Ton, in mehreren
  Größen bzw. Formaten für Desktop und Handy.
- **Standbild**: ein einzelnes Bild aus der ersten Szene (Kreisspiel vor den Bussen), das sofort
  angezeigt wird und als Ersatz dient, wenn das Video nicht läuft.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Auf aktuellen iPhones, Android Handys und Desktop Browsern startet das Video in
  100 % der Testläufe ohne Klick, stumm und eingebettet.
- **SC-002**: Der Hero zeigt in keinem Testlauf (auch mit stark gedrosseltem Netz) eine leere oder
  schwarze Fläche; Text und Buttons sind sichtbar, bevor das Video geladen ist.
- **SC-003**: Die Zeit bis zum größten sichtbaren Inhalt der Landingpage liegt auf einem
  gedrosselten Handyprofil höchstens 10 % über dem Wert vor der Änderung.
- **SC-004**: Das Video ist auf dem Desktop höchstens 4 MB groß, auf Handys höchstens 2,5 MB.
- **SC-005**: Der Kontrast von Überschrift und Fließtext erreicht über jeder Szene mindestens das
  Verhältnis 4,5 zu 1 für Fließtext und 3 zu 1 für große Überschriften.
- **SC-006**: Mit „Bewegung reduzieren“ oder im Datensparmodus wird das Video in 100 % der
  Testläufe nicht heruntergeladen.
- **SC-007**: Der Pausenschalter ist per Tastatur in höchstens drei Tabulatorschritten nach der
  Navigation erreichbar und funktioniert per Maus, Touch und Tastatur.

## Assumptions

- **Einwilligung zur Veröffentlichung (Abhängigkeit)**: Im Video sind Teilnehmende, auch
  Minderjährige, erkennbar. Es wird angenommen, dass die Einwilligung zur Veröffentlichung von
  Foto und Videoaufnahmen auf der öffentlichen Website über die Anmeldung bzw. die Fotoregeln des
  Camps vorliegt. Der Projektverantwortliche bestätigt das vor der Veröffentlichung. Fehlt sie für
  einzelne Personen, wird die betroffene Szene ersetzt.
- Die Datenschutzerklärung (Spec 025) muss nur angepasst werden, wenn das Video von einem
  Drittanbieter ausgeliefert wird; geplant ist die Auslieferung über die eigene Seite.
- Die Szenenauswahl ist für dieses Jahr fest. Ein Austausch des Videos für kommende Camps
  geschieht durch Austausch der Dateien, ohne Adminoberfläche (keine Verwaltung im Dashboard).
- Das Standbild stammt aus dem Video selbst; ein zusätzliches Fotoshooting ist nicht nötig.
- Die übrigen Abschnitte der Landingpage, die Navigation und das Vorschaubild für geteilte Links
  bleiben unverändert.
- Das Video wird einmalig aus der Quelldatei erzeugt; die Quelldatei bleibt lokal beim
  Projektverantwortlichen.
