# Bilder-Assets (Platzhalter -> echte Bilder)

Die App laedt zuerst echte Dateien und faellt bei Fehlen automatisch auf die
mitgelieferten SVG-Platzhalter zurueck. Einfach die Dateien hier ablegen,
keine Code-Aenderung noetig.

## 1. Menue-Hintergrund

**Datei:** `public/assets/img/menu-bg.jpg`

Gesucht: ein CS2-Hauptmenue-/Map-Panorama (z. B. Screenshot aus dem CS2
Hauptmenue oder eine Map wie Mirage/Dust2 bei Sonnenuntergang).

- Aufloesung: mindestens 1920x1080, ideal 2560x1440
- Format: JPG (Qualitaet ~80)
- Quelle: eigener Vollbild-Screenshot aus CS2 (kontrastarme, dunkle Szene
  wirkt am besten, da das UI darueber liegt)

## 2. Kisten-Bilder

**Ordner:** `public/assets/img/cases/`

**Status: vollstaendig** — alle 42 Kisten-Bilder liegen bereits als WebP vor
(Quelle: csgodatabase.com). Das Mapping Case-ID -> Dateiname steht in
`src/lib/case-images.ts` (Dateinamen entsprechen NICHT immer der Case-ID,
z. B. `Dreams_&_Nightmares_Case.webp`, `CS_GO_Weapon_Case.webp`).

Fehlende Kisten zeigen automatisch die eingebaute SVG-Grafik.

### Case-IDs (42)

```
kilowatt_case
dreams_nightmares_case
fracture_case
revolution_case
revolver_case
recoil_case
operation_breakout_weapon_case
fever_case
csgo_weapon_case
glove_case
gallery_case
clutch_case
spectrum_2_case
snakebite_case
prisma_2_case
prisma_case
operation_hydra_case
gamma_case
chroma_2_case
operation_phoenix_weapon_case
gamma_2_case
spectrum_case
chroma_3_case
chroma_case
cs20_case
csgo_weapon_case_2
csgo_weapon_case_3
danger_zone_case
esports_2013_case
esports_2013_winter_case
esports_2014_summer_case
falchion_case
horizon_case
huntsman_weapon_case
operation_bravo_case
operation_broken_fang_case
operation_riptide_case
operation_vanguard_weapon_case
operation_wildfire_case
shadow_case
shattered_web_case
winter_offensive_weapon_case
```
