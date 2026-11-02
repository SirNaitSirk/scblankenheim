# Data Model: Schnellere erste Antwort der Startseite

Keine Änderung. Kein neues Feld, keine Tabelle, keine Migration, keine neuen DB Typen.

Die Startseite liest weiter pro Anfrage dieselben Daten (siehe research.md R1):
`camp_settings`, `camps`, `camp_form_fields`, `camp_mail_info` (Schulbefreiung), die Anzahl aktiver
`registrations`, die Platzgrenzen pro Feld und bei Bedarf `price_tiers` für eine Einladung.
