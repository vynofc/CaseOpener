import { CaseData, InventoryItem, RarityId, Skin, WEARS } from "./types";

let luckMultiplier = 1;

export function setLuckMultiplier(mult: number): void {
  luckMultiplier = Number.isFinite(mult) && mult > 0 ? mult : 1;
}

export function getLuckMultiplier(): number {
  return luckMultiplier;
}

export function rollRarity(): RarityId {
  const r = Math.random() * 100;
  const rareCut = Math.min(100, 0.26 * luckMultiplier);
  if (r < rareCut) return "rare";
  if (r < 0.9) return "covert";
  if (r < 4.1) return "classified";
  if (r < 20.08) return "restricted";
  return "milspec";
}

export function rollSkin(caseData: CaseData): Skin {
  let rarity = rollRarity();
  const available = caseData.skins.filter((s) => s.rarity === rarity);
  if (available.length === 0) {
    const rarities: RarityId[] = ["rare", "covert", "classified", "restricted", "milspec"];
    rarity = rarities.find((r) => caseData.skins.some((s) => s.rarity === r))!;
    return pickWeighted(caseData.skins.filter((s) => s.rarity === rarity));
  }
  return pickWeighted(available);
}

function pickWeighted(skins: Skin[]): Skin {
  const weights = skins.map((s) => 1 / Math.sqrt(s.basePrice));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < skins.length; i++) {
    r -= weights[i];
    if (r <= 0) return skins[i];
  }
  return skins[skins.length - 1];
}

export function rollDrop(caseData: CaseData, uid: string): InventoryItem {
  return rollItemFromSkin(rollSkin(caseData), caseData.id, uid);
}

function rollItemFromSkin(skin: Skin, caseId: string, uid: string): InventoryItem {
  const wear = WEARS[Math.floor(Math.random() * WEARS.length)];
  const floatValue = wear.min + Math.random() * (wear.max - wear.min);
  const stattrak = skin.rarity !== "rare" && Math.random() < 0.1;
  let price = skin.basePrice * wear.mult;
  if (stattrak) price *= 1.8;
  price = Math.max(0.03, price * (0.9 + Math.random() * 0.2));
  return {
    uid,
    skin,
    caseId,
    wear,
    floatValue,
    stattrak,
    price: Math.round(price * 100) / 100,
    wonAt: Date.now(),
  };
}

export const UPGRADE_HOUSE_EDGE = 0.95;
export const UPGRADE_MAX_CHANCE = 0.95;

export function upgradeChance(stakePrice: number, targetPrice: number): number {
  if (stakePrice <= 0 || targetPrice <= 0) return 0;
  return Math.min(UPGRADE_MAX_CHANCE, (stakePrice / targetPrice) * UPGRADE_HOUSE_EDGE);
}

export function rollUpgradeWin(chance: number): boolean {
  return Math.random() < chance;
}

export function upgradeTargetPrice(stakePrice: number, chance: number): number {
  if (stakePrice <= 0 || chance <= 0) return 0;
  return (stakePrice * UPGRADE_HOUSE_EDGE) / Math.min(chance, UPGRADE_MAX_CHANCE);
}

export function pickUpgradeTarget(skins: Skin[], stakePrice: number, chance: number, poolSize = 8): Skin | null {
  const ideal = upgradeTargetPrice(stakePrice, chance);
  if (ideal <= 0) return null;
  const candidates = skins
    .filter((s) => s.basePrice > stakePrice)
    .sort((a, b) => Math.abs(a.basePrice - ideal) - Math.abs(b.basePrice - ideal));
  if (candidates.length === 0) return null;
  const pool = candidates.slice(0, Math.max(1, poolSize));
  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildItemFromSkin(skin: Skin, caseId: string, uid: string): InventoryItem {
  return rollItemFromSkin(skin, caseId, uid);
}

export function buildUpgradeItem(skin: Skin, uid: string): InventoryItem {
  return buildItemFromSkin(skin, "upgrade", uid);
}

export const TRADE_UP_REQUIREMENTS: Record<RarityId, number> = {
  milspec: 10,
  restricted: 10,
  classified: 10,
  covert: 5,
  rare: 0,
};

export function tradeUpRequirement(rarity: RarityId): number {
  return TRADE_UP_REQUIREMENTS[rarity];
}

export function nextRarity(rarity: RarityId): RarityId | null {
  const order: RarityId[] = ["milspec", "restricted", "classified", "covert", "rare"];
  const i = order.indexOf(rarity);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : null;
}

export function tradeUpOutcomeSkins(inputs: InventoryItem[], cases: CaseData[], allSkins: Skin[]): Skin[] {
  if (inputs.length === 0) return [];
  const target = nextRarity(inputs[0].skin.rarity);
  if (!target) return [];
  const caseIds = new Set(inputs.map((i) => i.caseId));
  const pool = new Map<string, Skin>();
  for (const c of cases) {
    if (!caseIds.has(c.id)) continue;
    for (const s of c.skins) {
      if (s.rarity === target) pool.set(s.id, s);
    }
  }
  if (pool.size === 0) {
    for (const s of allSkins) {
      if (s.rarity === target) pool.set(s.id, s);
    }
  }
  return [...pool.values()];
}

export function rollTradeUp(inputs: InventoryItem[], cases: CaseData[], allSkins: Skin[], uid: string): InventoryItem | null {
  if (inputs.length === 0) return null;
  const rarity = inputs[0].skin.rarity;
  const required = tradeUpRequirement(rarity);
  if (required === 0 || inputs.length !== required) return null;
  if (!inputs.every((i) => i.skin.rarity === rarity)) return null;
  const pool = tradeUpOutcomeSkins(inputs, cases, allSkins);
  if (pool.length === 0) return null;
  const skin = pickWeighted(pool);
  return buildTradeUpItem(skin, uid, inputs.every((i) => i.stattrak));
}

export function buildTradeUpItem(skin: Skin, uid: string, stattrak: boolean): InventoryItem {
  const wear = WEARS[Math.floor(Math.random() * WEARS.length)];
  const floatValue = wear.min + Math.random() * (wear.max - wear.min);
  const st = stattrak && skin.rarity !== "rare";
  let price = skin.basePrice * wear.mult;
  if (st) price *= 1.8;
  price = Math.max(0.03, price * (0.9 + Math.random() * 0.2));
  return {
    uid,
    skin,
    caseId: "tradeup",
    wear,
    floatValue,
    stattrak: st,
    price: Math.round(price * 100) / 100,
    wonAt: Date.now(),
  };
}

export function buildStrip(caseData: CaseData, winner: InventoryItem, length = 80, winIndex = 60): InventoryItem[] {
  const strip: InventoryItem[] = [];
  for (let i = 0; i < length; i++) {
    if (i === winIndex) {
      strip.push(winner);
    } else {
      strip.push(rollDrop(caseData, `strip-${i}-${Date.now()}`));
    }
  }
  return strip;
}
