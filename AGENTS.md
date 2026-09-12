# AGENTS.md

CS2 Case Opener: a single-page Next.js app that simulates opening CS2 weapon cases (roulette animation, drop odds, inventory, stats). UI text and metadata are in **English** (`lang="en"`); keep new user-facing strings in English. Code identifiers and comments are English.

## Commands

```bash
npm install
npm run dev      # Next.js dev server on :3000
npm run build    # production build
npm run lint     # ESLint 9 flat config (eslint.config.mjs, eslint-config-next)
npm test         # Vitest unit tests (src/lib/*.test.ts)
node scripts/generate-cases.mjs   # regenerate src/lib/cases.ts from data/database.js
```

Verify changes with `npm run lint`, `npm test` and `npm run build` (build is the typecheck; `strict: true`, no `tsc` script). GitHub Actions (`.github/workflows/ci.yml`) runs lint + tests + build on every push to master/main and on PRs; `package-lock.json` is committed so CI can use `npm ci`.

## Stack

- Next.js **16.3.5** (App Router), React **19.2.8**, TypeScript 5.
- Tailwind CSS **v4** via `@tailwindcss/postcss`. There is no `tailwind.config`; theme customization lives in `src/app/globals.css` (`@import "tailwindcss"` + `@theme inline`). Custom animations (`.win-pop`, `.skin-highlight`, `.case-sheen`, `.pointer-won`) are hand-written keyframes in `globals.css`, referenced by class name from components.
- Path alias `@/*` -> `src/*` (tsconfig).
- No backend, no API routes, no server data fetching. Everything runs client-side; persistence is `localStorage` only.

## Architecture

Single route: `src/app/page.tsx` (client component) + `src/app/layout.tsx` (wraps everything in `GameProvider`). All components in `src/components/` are client components with default exports; shared logic and state live in `src/lib/`.

### State flow

- `src/lib/game-context.tsx` is the single source of truth: balance, inventory, stats, sound toggle. Components read/mutate it via `useGame()`; there is no prop drilling of game state.
- The whole `{ balance, inventory, stats, soundOn }` object is persisted to `localStorage` under key `cs2-case-opener-v1` on every change. **Hydration gotcha**: storage is read in a deferred `useEffect` after mount, so components must gate rendering of persisted values on the `hydrated` flag (see `Header.tsx`) to avoid SSR/CSR mismatch.
- Money is always rounded with `Math.round(x * 100) / 100` at mutation time; display goes through `formatMoney()` from `types.ts`.

### Opening flow (phase state machine in page.tsx)

`idle -> opening -> spinning -> result -> idle`

1. `openCase()` deducts the price, then **rolls the winner immediately** via `rollDrop()` in `src/lib/game.ts`. The outcome is decided *before* any animation.
2. `CaseIntro` plays `public/assets/video/opening.mp4` fullscreen (skippable; calls `onDone` on end, skip, or playback failure).
3. `Roulette` builds an 80-card strip via `buildStrip()` with the pre-rolled winner forced at index 60, then animates a `translateX` with `requestAnimationFrame` + `easeOutQuint` (~6.2s) so the winner lands under the center pointer. It is purely presentational.
4. `WinModal` offers keep / sell / open-again; "again" chains back into `openCase()` via `setTimeout`.

### Drop logic (`src/lib/game.ts`)

- `rollRarity()` hardcodes cumulative thresholds that must stay in sync with the `RARITIES` odds in `types.ts` (rare 0.26 / covert 0.64 / classified 3.2 / restricted 15.98 / milspec rest).
- Within a rarity, skins are picked weighted by `1/sqrt(basePrice)` (cheaper = more likely).
- Wear is uniform across the 5 `WEARS` tiers, float is uniform within the wear range, StatTrak is 10% but never for `rare`. Final price = `basePrice * wear.mult * (1.8 if StatTrak) * random(0.9..1.1)`, floored at $0.03.

### Case data pipeline (important)

- `src/lib/cases.ts` (~42 cases, very large) is **generated**; do not edit by hand. Source of truth is `data/database.js` (CJS module: one array per case key, plus a `special_items` knife/glove pool). Edit `data/database.js` or the generator, then run `node scripts/generate-cases.mjs`.
- Skin `basePrice` and case `price` are **synthetic**: the generator derives them from a FNV-1a hash of the item/case name. They are deterministic but are not real market prices.
- The generator maps database rarity `ancient` -> `rare` and injects 20 knives/gloves per case from the `special_items` pool.
- `data/database.js` is third-party content licensed **CC BY-NC 4.0** (non-commercial, attribution required); keep its header intact.
- Skin images are remote URLs (`community.akamai.steamstatic.com`, one GitHub raw URL for rares). Components use plain `<img>`, not `next/image` (no `remotePatterns` in `next.config.ts`); `SkinImage` falls back to the inline-SVG `WeaponIcon` on load error or missing URL.

### Audio (`src/lib/audio.ts`)

- Module-level singletons guarded by `typeof window === "undefined"` checks; safe to import anywhere but everything is a no-op during SSR.
- Two mechanisms: cached `HTMLAudioElement` samples from `public/assets/sounds/*.wav` (cloned per playback so ticks can overlap), and WebAudio oscillator blips for click/sell/fallback sounds.
- Sound file names are hardcoded; note `rare` rarity maps to `ancient.wav`. `playWin` falls back to oscillator blips for unknown rarities.
- The global mute flag lives in module state (`setSoundEnabled`), mirrored into React state by the context. Playback failures (autoplay policy, missing file) are swallowed silently by design.

## Conventions

- Every component: `"use client"`, default export, props typed inline in the signature.
- Heavy UI styling is inline Tailwind with arbitrary hex values (`bg-[#0d1119]`, `bg-[#12161f]` are the recurring panel/background colors); rarity-driven colors are applied via `style={{ ... }}` using `rarity.color` from `RARITIES`, including alpha-suffixed hex like `color + "44"`.
- Callbacks that change identity every render are stabilized with the ref pattern (`onDoneRef` in `Roulette`/`CaseIntro`) inside animation effects; follow it for new timer/RAF-driven components.
- New rarity-related behavior almost always needs coordinated edits in `types.ts` (`RARITIES`), `game.ts` (`rollRarity` thresholds), and `audio.ts` (`WIN_SOUNDS`).

## Repo extras

- `.agents/skills/anti-ui-slop/` contains a locally installed skill for grounding UI work in real reference screens; consult it before large UI redesigns.
- `public/assets/` contains the intro video and wav files referenced above; the svg files in `public/` root are unused Next.js scaffolding leftovers.
- `public/assets/img/` holds the UI imagery: `menu-bg.webp` (full-screen menu backdrop, loaded by `MenuBackdrop` with automatic fallback to the bundled `menu-bg.svg` placeholder) and `cases/*.webp` (real case renders from csgodatabase.com, already downloaded; the case-id to filename mapping lives in `src/lib/case-images.ts` because filenames do not always match the case id). `CaseImage` falls back to the inline-SVG `CaseArt` on error. See `public/assets/img/README.md` for details. Both loaders use the plain-`<img>` + `onError` fallback pattern from `SkinImage`.
