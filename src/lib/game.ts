import { CaseData, InventoryItem, RarityId, Skin, WEARS } from "./types";

export function rollRarity(): RarityId {
  const r = Math.random() * 100;
  if (r < 0.26) return "rare";
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
  const skin = rollSkin(caseData);
  const wear = WEARS[Math.floor(Math.random() * WEARS.length)];
  const floatValue = wear.min + Math.random() * (wear.max - wear.min);
  const stattrak = skin.rarity !== "rare" && Math.random() < 0.1;
  let price = skin.basePrice * wear.mult;
  if (stattrak) price *= 1.8;
  price = Math.max(0.03, price * (0.9 + Math.random() * 0.2));
  return {
    uid,
    skin,
    caseId: caseData.id,
    wear,
    floatValue,
    stattrak,
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
