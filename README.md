# CS2 Case Opener

Ein vollständiger CS2-Case-Opener als Next.js-App mit echten Case-Daten, Öffnungs-Animation und Sounds.

## Features

- **42 echte Cases** (Kilowatt, Revolution, Chroma, Operation Bravo, ...) mit den original Skins und Bildern
- **Öffnungs-Cinematic** (`public/assets/video/opening.mp4`) vor jedem Spin, überspringbar
- **Roulette-Animation** mit 80 Karten, physikalischem Abbremsen, Tick-Sounds und Gewinner-Highlight
- **Echte Drop-Chancen**: Mil-Spec 79,92 %, Restricted 15,98 %, Classified 3,2 %, Covert 0,64 %, Rare Special 0,26 %
- **Messer & Handschuhe** als Rare Specials (0,26 %) pro Case
- **Wear/Float-System** (Factory New bis Battle-Scarred) und **StatTrak™** (10 % Chance)
- **Guthaben-System** mit Startkapital, Aufladen per Knopfdruck
- **Inventar** mit Einzelverkauf und „Alles verkaufen“
- **Statistik**: geöffnete Cases, Ausgaben, Einnahmen, Bilanz, bester Drop
- **Persistenz** via LocalStorage (Guthaben, Inventar, Statistik)
- Sounds aus `public/assets/sounds` (Tick, Start, Rarity-Win-Sounds) mit Mute-Schalter

## Starten

```bash
npm install
npm run dev
```

Dann http://localhost:3000 öffnen.

## Cases neu generieren

Die Case-Daten (`src/lib/cases.ts`) werden aus `data/database.js` generiert:

```bash
node scripts/generate-cases.mjs
```
