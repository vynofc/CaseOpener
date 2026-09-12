export type RarityId = "milspec" | "restricted" | "classified" | "covert" | "rare";

export interface Rarity {
  id: RarityId;
  name: string;
  color: string;
  odds: number;
}

export interface Skin {
  id: string;
  weapon: string;
  name: string;
  rarity: RarityId;
  basePrice: number;
  image?: string;
  gradient?: [string, string];
}

export interface CaseData {
  id: string;
  name: string;
  price: number;
  gradient: [string, string];
  accent: string;
  skins: Skin[];
}

export interface Wear {
  name: string;
  short: string;
  min: number;
  max: number;
  mult: number;
}

export interface InventoryItem {
  uid: string;
  skin: Skin;
  caseId: string;
  wear: Wear;
  floatValue: number;
  stattrak: boolean;
  price: number;
  wonAt: number;
}

export interface Stats {
  opened: number;
  spent: number;
  earned: number;
  bestDrop: InventoryItem | null;
}

export const RARITIES: Rarity[] = [
  { id: "milspec", name: "Mil-Spec", color: "#4b69ff", odds: 79.92 },
  { id: "restricted", name: "Restricted", color: "#8847ff", odds: 15.98 },
  { id: "classified", name: "Classified", color: "#d32ce6", odds: 3.2 },
  { id: "covert", name: "Covert", color: "#eb4b4b", odds: 0.64 },
  { id: "rare", name: "Rare Special", color: "#ffd700", odds: 0.26 },
];

export const WEARS: Wear[] = [
  { name: "Factory New", short: "FN", min: 0.0, max: 0.07, mult: 1.6 },
  { name: "Minimal Wear", short: "MW", min: 0.07, max: 0.15, mult: 1.25 },
  { name: "Field-Tested", short: "FT", min: 0.15, max: 0.38, mult: 1.0 },
  { name: "Well-Worn", short: "WW", min: 0.38, max: 0.45, mult: 0.85 },
  { name: "Battle-Scarred", short: "BS", min: 0.45, max: 1.0, mult: 0.7 },
];

export function rarityById(id: RarityId): Rarity {
  return RARITIES.find((r) => r.id === id)!;
}

export function formatMoney(v: number): string {
  return "$" + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
