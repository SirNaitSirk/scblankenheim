# Quickstart: Finanzen Tab

## Vorbereitung

1. `npm run dev` starten und als Superadmin anmelden.
2. Unter „Benutzer“ ein Admin Konto anlegen oder bearbeiten: nur Tab „Finanzen“ freigeben,
   Berechtigung „Finanzen und Preise“ setzen. Ein zweites Konto mit Tab „Finanzen“, aber ohne
   diese Berechtigung.
3. Beim aktuellen Camp ein Zahlungsziel in der Vergangenheit setzen und einige Anmeldungen mit
   unterschiedlichen Beträgen haben (unbezahlt, teilweise, bezahlt, eine storniert).

## Prüfen

1. Mit dem Finanzkonto anmelden: Navigation zeigt Dashboard, Finanzen, Profil. `/admin/preise`
   direkt aufrufen leitet zum Dashboard.
2. Tab „Finanzen“: Summen stimmen mit dem Tab „Preise“ (als Superadmin) überein. Die stornierte
   Anmeldung fehlt.
3. In den Entwicklertools die Seite durchsuchen: keine Formularantworten (zum Beispiel Allergien)
   im HTML oder in den übertragenen Daten.
4. Bei einer unbezahlten Anmeldung auf „Bezahlt“ klicken, den vollen Betrag eintragen: Status springt
   auf „Bezahlt“, Enter speichert, Summen aktualisieren sich. Seite neu laden, Wert bleibt.
5. Teilbetrag eintragen: Vorschlag „Teilweise“. Status manuell auf „Unbezahlt“ ändern und speichern:
   gespeichert wird „Unbezahlt“.
6. `-5` oder `abc` eingeben: deutsche Fehlermeldung, nichts gespeichert.
7. Filter „Überfällig“: nur offene Anmeldungen. Zahlungsziel beim Camp entfernen: Filter leer.
8. Suche nach Teil einer Referenz und eines Nachnamens.
9. „Zahlungslink kopieren“ und „Zahlungslink senden“ bei einer offenen Anmeldung; bei einer
   bezahlten fehlen die Buttons.
10. „CSV Export“ mit aktivem Filter: Datei enthält nur die gefilterten Zeilen, Umlaute korrekt in
    Excel oder Numbers.
11. Im Tab „Logs“ steht für jede Änderung ein Eintrag mit alt und neu.
12. Mit dem Konto ohne Berechtigung: Tab ist sichtbar, aber ohne Editoren und Linkaktionen.
13. Fenster auf Handybreite: Karten statt Tabelle, Zahlung eintragen funktioniert.
