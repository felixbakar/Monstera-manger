# Monstera Manager – modulär version

Monstera Manager är ett växtregister byggt som en vanlig webbapp för GitHub Pages.

## Struktur

- index.html
- css/style.css
- css/components.css
- css/responsive.css
- js/database.js
- js/plants.js
- js/ui.js
- js/modals.js
- js/backup.js
- js/diagnostics.js
- js/app.js

## Automatiska namn

Monstera-varianter får automatiska namn:

- M1, M2, M3... för vanliga plantor
- S1, S2, S3... för sticklingar

Numreringen är separat per variant.

Exempel:

Monstera Albo M1
Monstera Albo M2
Monstera Albo S1
Monstera Albo S2

## Data

Appen använder IndexedDB i webbläsaren.

Bilder och växtdata lagras lokalt på enheten.

Backup kan exporteras och återställas via Verktyg.

## Växtidentifiering

Ingen API-nyckel eller extern växtidentifiering finns i denna version.