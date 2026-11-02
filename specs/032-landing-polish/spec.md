# Feature Specification: Landingpage Polish

**Feature Branch**: `032-landing-polish`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "/impeccable polish" auf der Landingpage nach specs/031. Grundlage: Review `.impeccable/critique/2026-11-02T12-35-26Z__app-page-tsx.md` (kleinere Punkte) und ein eigener Durchgang.

**Kontext**: Polish verfeinert, ohne die Seite umzubauen. Keine neuen Abschnitte, keine neuen
Aussagen über das Camp. Inhaltliche Fragen (Elternblock, genauer Ort, Begriffe wie „Jugenden“ oder
„Inputs“, Formularentwurf bei Reload, letzter Aufruf am Seitenende) bleiben ausdrücklich außen vor.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Erster Blick mit Informationswert (Priority: P1)

Wer die Seite öffnet, liest über der großen Überschrift nicht noch einmal den Namen aus der
Navigation, sondern sofort den Termin des Camps. Das kaum lesbare, senkrechte Kleinstlabel am rechten
Rand verschwindet.

**Independent Test**: Landingpage öffnen: über der Überschrift steht der Zeitraum des aktuellen Camps;
ohne Termin steht dort wie bisher der Campname; kein senkrechtes Label.

**Acceptance Scenarios**:

1. **Given** ein aktuelles Camp mit Start und Ende, **When** der Hero lädt, **Then** zeigt die Zeile über
   der Überschrift den Zeitraum im selben Format wie die Faktenkarte.
2. **Given** kein Camp oder kein Termin, **When** der Hero lädt, **Then** steht dort der Campname.
3. **Given** eine breite Ansicht, **When** der Hero sichtbar ist, **Then** gibt es kein senkrechtes Label.

### User Story 2 · Einheitliche, saubere Texte (Priority: P2)

Alle sichtbaren Texte der Landingpage folgen der Schreibregel (kein Bindestrich in Wörtern, „und“
statt „&“) und liegen im zentralen Textmodul.

**Independent Test**: Programm und Faktenkarte lesen: „Sport, Lagerfeuer und Geländespiel bei Nacht“,
„Übernachtung und Verpflegung inklusive“; im Code keine fest eingetragenen deutschen Texte mehr in
Faktenkarte, Programm und Lagerfeuerband.

**Acceptance Scenarios**:

1. **Given** die Programmkachel Sport, **When** sie angezeigt wird, **Then** enthält der Titel weder
   Bindestrich noch „&“, der Inhalt bleibt gleich.
2. **Given** die Faktenkarte, **When** sie angezeigt wird, **Then** steht beim Beitrag „Übernachtung und
   Verpflegung inklusive“.
3. **Given** der Knopf „Bei Fragen schreib uns“, **When** er geklickt wird, **Then** öffnet er dieselbe
   Kontaktadresse wie der Anmeldebereich, aus einer gemeinsamen Quelle.

### User Story 3 · Ruhigere Details, bessere Tippziele (Priority: P2)

Die Zahlarten wirken nicht mehr wie anklickbare Filter, die Faktenkarte verliert den breiten Schatten
zum dünnen Rand, und die Links im Footer sind auf dem Handy gut zu treffen.

**Independent Test**: Block „Bezahlen“: Zahlarten als eine ruhige Zeile mit „·“; Faktenkarte ohne
breiten Schatten; Footerlinks auf 375 px mindestens 44 px hoch antippbar.

**Acceptance Scenarios**:

1. **Given** der Block „Bezahlen“, **When** er angezeigt wird, **Then** stehen die Zahlarten als eine
   Textzeile, getrennt durch „·“, nicht als Chips.
2. **Given** die Faktenkarte, **When** sie angezeigt wird, **Then** hat sie Rand, aber keinen breiten
   Schatten mehr.
3. **Given** eine Breite von 375 px, **When** jemand einen Footerlink oder Rechtslink antippt, **Then** ist
   die Trefffläche mindestens 44 px hoch, ohne dass der Footer sichtbar größer wird als nötig.

### Edge Cases

- Camp ohne Enddatum: der Zeitraum zeigt nur den Starttag, wie in der Faktenkarte.
- Sehr langer Zeitraum über einen Jahreswechsel: die Zeile bricht auf dem Handy sauber um.

## Requirements *(mandatory)*

- **FR-001**: Die Zeile über der Hero Überschrift MUSS den Zeitraum des aktuellen Camps zeigen, ohne
  Termin den Campnamen.
- **FR-002**: Das senkrechte Label im Hero MUSS entfallen.
- **FR-003**: Sichtbare Texte von Faktenkarte, Programm und Lagerfeuerband MÜSSEN im zentralen
  Textmodul liegen; der Inhalt bleibt bis auf die Schreibregel unverändert.
- **FR-004**: Kein sichtbarer Text der Landingpage DARF einen Bindestrich in einem Wort oder „&“
  enthalten.
- **FR-005**: Die Kontaktadresse des Lagerfeuerbands MUSS aus derselben Quelle kommen wie im
  Anmeldebereich.
- **FR-006**: Die Zahlarten im Block „Bezahlen“ MÜSSEN als eine Textzeile erscheinen.
- **FR-007**: Die Faktenkarte DARF NICHT gleichzeitig dünnen Rand und breiten Schatten haben.
- **FR-008**: Footer und Rechtslinks MÜSSEN auf dem Handy eine Trefffläche von mindestens 44 px Höhe
  haben.

## Success Criteria *(mandatory)*

- **SC-001**: Der Impeccable Detektor meldet im Browser keine Funde mehr zu kleiner Schrift, Eyebrow
  über der H1 und dünnem Rand mit breitem Schatten an der Faktenkarte.
- **SC-002**: Null Bindestriche in Wörtern und null „&“ im sichtbaren Text der Landingpage.
- **SC-003**: Alle Footerlinks haben auf 375 px eine Trefffläche von mindestens 44 px.
- **SC-004**: Sonst bleibt die Seite optisch und inhaltlich unverändert (Vergleich vorher und nachher).

## Assumptions

- Der Zeitraum nutzt die vorhandene Formatierung der Faktenkarte.
- Die Jahreszahl des Camps steht weiterhin im Footer und im Seitentitel; das senkrechte Label war nur
  Dekoration.
- Kein neues Datenmodell, keine Migration, keine neue Route.
