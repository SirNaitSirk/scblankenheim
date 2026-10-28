# Quickstart: Zeltkreise

## Setup

```bash
npx supabase db reset        # applies 0010_tent_circles.sql and the seed
npm run dev
```

Sign in as superadmin, open http://localhost:3000/admin/zeltkreise.

## Scenarios

1. **Anlegen** (Story 1): „Zeltkreis anlegen“, Name „Senfkorn“, Art „Gemischt“, Leiter suchen und
   wählen. Karte erscheint, Leiter steht oben, ist aus „Noch ohne Zeltkreis“ verschwunden.
2. **Leader moved**: Eine Person, die Teilnehmer in einem anderen Zeltkreis ist, als Leiter eines
   neuen Zeltkreises wählen. Hinweis erscheint, sie ist dort nicht mehr Teilnehmer.
3. **Leader taken**: Leiterauswahl eines zweiten Zeltkreises zeigt den Leiter des ersten nicht an.
4. **Verteilen** (Story 2): eine Person ziehen, eine per Antippen und „Zeltkreis wählen“ zuordnen,
   eine verschieben, eine entfernen. Neu laden: alles gespeichert.
5. **Art**: Männliche Person auf „Nur weiblich“ ziehen: abgelehnt mit Hinweis. Gemischten Zeltkreis
   mit beiden Geschlechtern auf „Nur weiblich“ stellen: abgelehnt mit Anzahl.
6. **Geschlecht fehlt**: Person ohne Geschlecht passt nur zu gemischten Zeltkreisen; Geschlecht in der
   Gruppe nachtragen.
7. **Storno**: Im Dashboard den Leiter stornieren. Karte zeigt „Leiter fehlt“. Wieder aktivieren:
   Leiter ist zurück.
8. **Filter** (Story 4): Alter und ein Formularfeld filtern, Treffer in Karten hervorgehoben.
9. **Überblick und Druck** (Story 5): Kennzahlen prüfen, „Drucken“ öffnet
   `/admin/zeltkreise/druck` mit Leiter und alphabetischen Teilnehmern.
10. **Rechte**: Admin ohne Tab „Zeltkreise“ bekommt die Seite nicht; ohne Berechtigung
    `tentCircles` sind alle Schreibaktionen abgelehnt.
11. **Handy**: Viewport 375 px, Zuordnung per Antippen über die ausklappbare Leiste.

## Checks

```bash
npm run lint
npm test
npm run build
```
