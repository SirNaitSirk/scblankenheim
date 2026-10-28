# Quickstart: Preisstufen verwalten im Tab „Preise“

## Vorbereitung

1. Migration `0006_rename_finances_tab.sql` auf die Supabase Datenbank anwenden.
2. `npm run dev`, als Superadmin unter http://localhost:3000/admin anmelden.

## Manuelle Tests

1. Seitenleiste zeigt „Preise“. Klick öffnet `/admin/preise` mit Überschrift „Preise“.
2. Entfällt seit specs/009-finance-tab: `/admin/finanzen` ist der eigene Tab „Finanzen“.
3. Benutzerverwaltung: ein Admin, der vorher „Finanzen“ sah, hat jetzt „Preise“ freigegeben.
   Als dieser Admin anmelden: Tab ist sichtbar.
4. „Preisstufe anlegen“: Name leer speichern → Fehlermeldung am Feld. Dann „Test“, 120 € speichern →
   Zeile mit Status „Aktiv“, 0 Anmeldungen.
5. „Link kopieren“ → Toast. Link im privaten Fenster öffnen und anmelden. Im Dashboard hat die
   Anmeldung 120 € offen; in „Preise“ zeigt „Test“ 1 Anmeldung. Die öffentliche Seite zeigt 120 € nirgends.
6. Preis auf 130 € ändern → Hinweis im Dialog; bestehende Anmeldung bleibt bei 120 €.
7. „Link erneuern“ bestätigen → alter Link führt zum Standardpreis, neuer zu 130 €.
8. „Gültigkeit beenden“ → Status „Abgelaufen“, Link führt zum Standardpreis.
9. „Löschen“ bei „Test“ nicht möglich (Hinweis). Neue Stufe ohne Anmeldungen anlegen und löschen.
10. Gültig ab in der Zukunft setzen → Status „Geplant“.
11. Logs Tab zeigt alle Aktionen ohne Link.
12. Mobilbreite (375 px): Tabelle scrollt in der Karte, Dialog nutzt volle Breite.

## Checks

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```
