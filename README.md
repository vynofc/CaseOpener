# CS2 Case Opener

> **Important notice — please read first**
>
> This project is a **non-commercial demo and learning project**, published publicly on GitHub for demonstration purposes only.
>
> - **No real-money gambling:** All currencies, prices and winnings are purely virtual and have no real-world value. The built-in "Visa" checkout is a simulation — no real payment data is ever processed, transmitted or stored, and no money changes hands.
> - **No real market prices:** All skin and case prices are generated algorithmically and do not reflect actual market values.
> - **Not affiliated with Valve:** This project is in no way affiliated with, endorsed by, or connected to Valve Corporation or Counter-Strike 2. All trademarks, skin names and images are the property of their respective owners (Valve Corporation).
> - **Educational purpose:** The project demonstrates web technologies (Next.js, React, animations, state management) — it is not a gambling service.

A complete CS2 case opener built as a Next.js app with real case data, opening animation and sounds.

## Features

- **42 real cases** (Kilowatt, Revolution, Chroma, Operation Bravo, ...) with the original skins and images
- **Opening cinematic** (`public/assets/video/opening.mp4`) before every spin, skippable
- **Roulette animation** with 80 cards, physical deceleration, tick sounds and winner highlight
- **Real drop odds**: Mil-Spec 79.92%, Restricted 15.98%, Classified 3.2%, Covert 0.64%, Rare Special 0.26%
- **Knives & gloves** as Rare Specials (0.26%) in every case
- **Wear/float system** (Factory New to Battle-Scarred) and **StatTrak™** (10% chance)
- **Balance system** with a simulated Visa checkout for deposits (freely chosen amount)
- **Inventory** with single-item selling and "sell all"
- **Statistics**: cases opened, money spent, money earned, net result, best drop
- **Persistence** via LocalStorage (balance, inventory, statistics)
- Sounds from `public/assets/sounds` (tick, start, rarity win sounds) with a mute toggle

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Regenerating case data

The case data (`src/lib/cases.ts`) is generated from `data/database.js`:

```bash
node scripts/generate-cases.mjs
```

## License

This project is **dual-licensed** — see [LICENSE](LICENSE):

- **Source code** (everything except `data/database.js`): **MIT License** — free to use, modify and distribute, even commercially, with attribution.
- **Case data** (`data/database.js`): third-party content under **CC BY-NC 4.0** — **non-commercial use only**, attribution required.

Additionally:

- Skin images, trademarks and names from Counter-Strike 2 are the property of **Valve Corporation** and are not covered by either license.
