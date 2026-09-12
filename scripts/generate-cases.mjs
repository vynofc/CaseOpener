import { createRequire } from "module";
import { writeFileSync } from "fs";

const require = createRequire(import.meta.url);
const CASE_DB = require("../data/database.js");

const CASE_NAMES = {
  kilowatt_case: "Kilowatt Case",
  dreams_nightmares_case: "Dreams & Nightmares Case",
  fracture_case: "Fracture Case",
  revolution_case: "Revolution Case",
  revolver_case: "Revolver Case",
  recoil_case: "Recoil Case",
  fever_case: "Fever Case",
  gallery_case: "Gallery Case",
  glove_case: "Glove Case",
  snakebite_case: "Snakebite Case",
  prisma_case: "Prisma Case",
  prisma_2_case: "Prisma 2 Case",
  clutch_case: "Clutch Case",
  spectrum_case: "Spectrum Case",
  spectrum_2_case: "Spectrum 2 Case",
  chroma_case: "Chroma Case",
  chroma_2_case: "Chroma 2 Case",
  chroma_3_case: "Chroma 3 Case",
  gamma_case: "Gamma Case",
  gamma_2_case: "Gamma 2 Case",
  horizon_case: "Horizon Case",
  shadow_case: "Shadow Case",
  falchion_case: "Falchion Case",
  huntsman_weapon_case: "Huntsman Weapon Case",
  danger_zone_case: "Danger Zone Case",
  shattered_web_case: "Shattered Web Case",
  cs20_case: "CS20 Case",
  csgo_weapon_case: "CS:GO Weapon Case",
  csgo_weapon_case_2: "CS:GO Weapon Case 2",
  csgo_weapon_case_3: "CS:GO Weapon Case 3",
  esports_2013_case: "eSports 2013 Case",
  esports_2013_winter_case: "eSports 2013 Winter Case",
  esports_2014_summer_case: "eSports 2014 Summer Case",
  winter_offensive_weapon_case: "Winter Offensive Case",
  operation_bravo_case: "Operation Bravo Case",
  operation_phoenix_weapon_case: "Operation Phoenix Case",
  operation_breakout_weapon_case: "Operation Breakout Case",
  operation_vanguard_weapon_case: "Operation Vanguard Case",
  operation_wildfire_case: "Operation Wildfire Case",
  operation_hydra_case: "Operation Hydra Case",
  operation_riptide_case: "Operation Riptide Case",
  operation_broken_fang_case: "Operation Broken Fang Case",
};

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function priceFor(rarity, name) {
  const h = hash(name);
  switch (rarity) {
    case "milspec":
      return Math.round((0.08 + h * 0.55) * 100) / 100;
    case "restricted":
      return Math.round((0.5 + h * 3.5) * 100) / 100;
    case "classified":
      return Math.round((3 + h * 13) * 100) / 100;
    case "covert":
      return Math.round((15 + h * 75) * 100) / 100;
    case "rare":
      return Math.round((400 + h * 4200) * 100) / 100;
    default:
      return 1;
  }
}

const ACCENTS = ["#5ac8fa", "#fa5a7a", "#a55afa", "#5afad2", "#fa5ae0", "#fada5a", "#7afa5a", "#fa8a5a", "#5a7afa", "#fa5ab0"];
const GRADIENTS = [
  ["#1a2a4a", "#0d1526"],
  ["#4a1a2a", "#260d15"],
  ["#2a1a4a", "#150d26"],
  ["#1a3a3a", "#0d1c1c"],
  ["#3a1a4a", "#1c0d26"],
  ["#4a3a1a", "#261c0d"],
  ["#1a4a2a", "#0d2615"],
  ["#4a2a1a", "#26150d"],
];

const rarePool = CASE_DB["special_items"] || [];

let out = `import { CaseData } from "./types";

export const CASES: CaseData[] = [
`;

const keys = Object.keys(CASE_DB).filter((k) => k !== "special_items");
keys.forEach((key, ci) => {
  const entries = CASE_DB[key].filter((e) => e.name !== "★ Rare Special Item ★");
  const name = CASE_NAMES[key] || key.replace(/_/g, " ");
  const price = Math.round((1.5 + hash(key) * 6.5) * 100) / 100;
  const accent = ACCENTS[ci % ACCENTS.length];
  const gradient = GRADIENTS[ci % GRADIENTS.length];

  const skins = entries.map((e, si) => {
    const idx = e.name.indexOf(" | ");
    const weapon = idx >= 0 ? e.name.slice(0, idx) : e.name;
    const skinName = idx >= 0 ? e.name.slice(idx + 3) : e.name;
    const rarity = e.rarity === "ancient" ? "rare" : e.rarity;
    const basePrice = priceFor(rarity, e.name);
    const image = e.image ? JSON.stringify(e.image) : "undefined";
    return `    { id: ${JSON.stringify(key + "-" + si)}, weapon: ${JSON.stringify(weapon)}, name: ${JSON.stringify(skinName)}, rarity: "${rarity}", basePrice: ${basePrice}, image: ${image} },`;
  });

  const rareCount = 20;
  const offset = Math.floor(hash(key) * rarePool.length);
  const rares = [];
  for (let i = 0; i < rareCount && rarePool.length > 0; i++) {
    const r = rarePool[(offset + i * 7) % rarePool.length];
    const full = r.name.replace(/^★\s*/, "");
    const widx = full.indexOf(" | ");
    const weapon = widx >= 0 ? full.slice(0, widx) : full;
    const skinName = widx >= 0 ? full.slice(widx + 3) : "Vanilla";
    rares.push(
      `    { id: ${JSON.stringify(key + "-rare-" + i)}, weapon: ${JSON.stringify("★ " + weapon)}, name: ${JSON.stringify(skinName)}, rarity: "rare", basePrice: ${priceFor("rare", r.name)}, image: ${JSON.stringify(r.image)} },`
    );
  }

  out += `  {
    id: ${JSON.stringify(key)},
    name: ${JSON.stringify(name)},
    price: ${price},
    gradient: ${JSON.stringify(gradient)},
    accent: "${accent}",
    skins: [
${skins.join("\n")}
${rares.join("\n")}
    ],
  },
`;
});

out += `];

export function caseById(id: string): CaseData {
  return CASES.find((c) => c.id === id)!;
}
`;

writeFileSync(new URL("../src/lib/cases.ts", import.meta.url), out, "utf8");
console.log(`Generated ${keys.length} cases.`);
