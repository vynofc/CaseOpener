import { describe, expect, it } from "vitest";
import { CASES } from "./cases";
import {
  buildItemFromSkin,
  buildStrip,
  buildTradeUpItem,
  buildUpgradeItem,
  getLuckMultiplier,
  nextRarity,
  pickUpgradeTarget,
  rollDrop,
  rollRarity,
  rollSkin,
  rollTradeUp,
  setLuckMultiplier,
  tradeUpOutcomeSkins,
  tradeUpRequirement,
  upgradeChance,
  upgradeTargetPrice,
  UPGRADE_MAX_CHANCE,
} from "./game";
import { InventoryItem, RARITIES, RarityId, Skin, WEARS, formatMoney, rarityById } from "./types";

const testCase = CASES[0];
const allSkins: Skin[] = [...new Map(CASES.flatMap((c) => c.skins).map((s) => [s.id, s])).values()];

describe("rollRarity", () => {
  it("returns only known rarities across many rolls", () => {
    const valid = new Set(RARITIES.map((r) => r.id));
    for (let i = 0; i < 5000; i++) {
      expect(valid.has(rollRarity())).toBe(true);
    }
  });

  it("rolls milspec most often", () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 20000; i++) {
      const r = rollRarity();
      counts[r] = (counts[r] ?? 0) + 1;
    }
    for (const [rarity, count] of Object.entries(counts)) {
      if (rarity !== "milspec") expect(counts.milspec).toBeGreaterThan(count);
    }
  });
});

describe("luck multiplier", () => {
  it("defaults to 1 and rejects invalid values", () => {
    expect(getLuckMultiplier()).toBe(1);
    setLuckMultiplier(5);
    expect(getLuckMultiplier()).toBe(5);
    setLuckMultiplier(0);
    expect(getLuckMultiplier()).toBe(1);
    setLuckMultiplier(Number.NaN);
    expect(getLuckMultiplier()).toBe(1);
  });

  it("forces gold on every roll when the multiplier is huge", () => {
    setLuckMultiplier(10000);
    try {
      for (let i = 0; i < 100; i++) {
        expect(rollRarity()).toBe("rare");
      }
    } finally {
      setLuckMultiplier(1);
    }
  });

  it("boosts rare drops noticeably with a moderate multiplier", () => {
    setLuckMultiplier(20);
    try {
      let rares = 0;
      for (let i = 0; i < 20000; i++) {
        if (rollRarity() === "rare") rares++;
      }
      expect(rares / 20000).toBeGreaterThan(0.03);
    } finally {
      setLuckMultiplier(1);
    }
  });
});

describe("rollSkin", () => {
  it("always returns a skin from the case", () => {
    for (let i = 0; i < 200; i++) {
      const skin = rollSkin(testCase);
      expect(testCase.skins.some((s) => s.id === skin.id)).toBe(true);
    }
  });
});

describe("rollDrop", () => {
  it("produces consistent items", () => {
    for (let i = 0; i < 200; i++) {
      const item = rollDrop(testCase, `t-${i}`);
      expect(item.uid).toBe(`t-${i}`);
      expect(item.caseId).toBe(testCase.id);
      expect(item.floatValue).toBeGreaterThanOrEqual(item.wear.min);
      expect(item.floatValue).toBeLessThanOrEqual(item.wear.max);
      expect(item.price).toBeGreaterThanOrEqual(0.03);
      expect(Math.round(item.price * 100) / 100).toBe(item.price);
      if (item.skin.rarity === "rare") expect(item.stattrak).toBe(false);
    }
  });

  it("uses only defined wears", () => {
    for (let i = 0; i < 200; i++) {
      const item = rollDrop(testCase, `w-${i}`);
      expect(WEARS.some((w) => w.short === item.wear.short)).toBe(true);
    }
  });
});

describe("buildStrip", () => {
  it("places the winner at winIndex and fills the strip", () => {
    const winner = rollDrop(testCase, "winner");
    const strip = buildStrip(testCase, winner, 80, 60);
    expect(strip).toHaveLength(80);
    expect(strip[60]).toBe(winner);
    expect(strip.every((s, i) => i === 60 || s.uid !== "winner")).toBe(true);
  });
});

describe("upgradeChance", () => {
  it("scales with the stake/target value ratio", () => {
    expect(upgradeChance(5, 10)).toBeCloseTo(0.475, 5);
    expect(upgradeChance(1, 100)).toBeCloseTo(0.0095, 5);
  });

  it("caps at the max chance and handles invalid input", () => {
    expect(upgradeChance(10, 10)).toBe(UPGRADE_MAX_CHANCE);
    expect(upgradeChance(100, 10)).toBe(UPGRADE_MAX_CHANCE);
    expect(upgradeChance(0, 10)).toBe(0);
    expect(upgradeChance(10, 0)).toBe(0);
  });
});

describe("upgradeTargetPrice", () => {
  it("inverts upgradeChance", () => {
    for (const chance of [0.5, 0.3, 0.1, 0.05, 0.01]) {
      const price = upgradeTargetPrice(10, chance);
      expect(upgradeChance(10, price)).toBeCloseTo(chance, 5);
    }
  });

  it("handles invalid input", () => {
    expect(upgradeTargetPrice(0, 0.5)).toBe(0);
    expect(upgradeTargetPrice(10, 0)).toBe(0);
  });
});

describe("pickUpgradeTarget", () => {
  it("always picks a skin worth more than the stake", () => {
    for (let i = 0; i < 200; i++) {
      const skin = pickUpgradeTarget(allSkins, 5, 0.3);
      expect(skin).not.toBeNull();
      expect(skin!.basePrice).toBeGreaterThan(5);
    }
  });

  it("picks skins near the ideal target price", () => {
    for (let i = 0; i < 200; i++) {
      const ideal = upgradeTargetPrice(10, 0.1);
      const skin = pickUpgradeTarget(allSkins, 10, 0.1)!;
      expect(Math.abs(skin.basePrice - ideal) / ideal).toBeLessThan(0.5);
    }
  });

  it("returns null when no skin beats the stake", () => {
    expect(pickUpgradeTarget(allSkins, Number.MAX_VALUE, 0.5)).toBeNull();
    expect(pickUpgradeTarget([], 5, 0.5)).toBeNull();
  });
});

describe("buildUpgradeItem", () => {
  it("builds a valid item for the chosen skin", () => {
    const skin = testCase.skins[0];
    for (let i = 0; i < 200; i++) {
      const item = buildUpgradeItem(skin, `u-${i}`);
      expect(item.uid).toBe(`u-${i}`);
      expect(item.skin).toBe(skin);
      expect(item.floatValue).toBeGreaterThanOrEqual(item.wear.min);
      expect(item.floatValue).toBeLessThanOrEqual(item.wear.max);
      expect(item.price).toBeGreaterThanOrEqual(0.03);
      expect(Math.round(item.price * 100) / 100).toBe(item.price);
    }
  });

  it("never makes rare skins StatTrak", () => {
    const rare = CASES.flatMap((c) => c.skins).find((s) => s.rarity === "rare");
    expect(rare).toBeDefined();
    for (let i = 0; i < 100; i++) {
      expect(buildUpgradeItem(rare!, `r-${i}`).stattrak).toBe(false);
    }
  });
});

describe("tradeUpRequirement", () => {
  it("requires 10 for regular rarities and 5 for covert", () => {
    expect(tradeUpRequirement("milspec")).toBe(10);
    expect(tradeUpRequirement("restricted")).toBe(10);
    expect(tradeUpRequirement("classified")).toBe(10);
    expect(tradeUpRequirement("covert")).toBe(5);
    expect(tradeUpRequirement("rare")).toBe(0);
  });
});

describe("nextRarity", () => {
  it("walks the rarity ladder and stops at rare", () => {
    expect(nextRarity("milspec")).toBe("restricted");
    expect(nextRarity("restricted")).toBe("classified");
    expect(nextRarity("classified")).toBe("covert");
    expect(nextRarity("covert")).toBe("rare");
    expect(nextRarity("rare")).toBeNull();
  });
});

function makeInputs(rarity: RarityId, count: number, stattrak = false): InventoryItem[] {
  const skin = allSkins.find((s) => s.rarity === rarity)!;
  return Array.from({ length: count }, (_, i) => {
    const item = buildItemFromSkin(skin, testCase.id, `in-${rarity}-${i}`);
    return { ...item, stattrak };
  });
}

describe("tradeUpOutcomeSkins", () => {
  it("pools next-rarity skins from the input cases", () => {
    const inputs = makeInputs("milspec", 10);
    const pool = tradeUpOutcomeSkins(inputs, CASES, allSkins);
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((s) => s.rarity === "restricted")).toBe(true);
  });

  it("offers rare special skins for covert inputs", () => {
    const inputs = makeInputs("covert", 5);
    const pool = tradeUpOutcomeSkins(inputs, CASES, allSkins);
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((s) => s.rarity === "rare")).toBe(true);
  });

  it("falls back to the global pool when the case has no matching skins", () => {
    const inputs = makeInputs("classified", 10).map((i) => ({ ...i, caseId: "unknown-case" }));
    const pool = tradeUpOutcomeSkins(inputs, CASES, allSkins);
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((s) => s.rarity === "covert")).toBe(true);
  });
});

describe("rollTradeUp", () => {
  it("turns 10 milspec into 1 restricted", () => {
    for (let i = 0; i < 50; i++) {
      const result = rollTradeUp(makeInputs("milspec", 10), CASES, allSkins, `tu-${i}`);
      expect(result).not.toBeNull();
      expect(result!.uid).toBe(`tu-${i}`);
      expect(result!.skin.rarity).toBe("restricted");
      expect(result!.caseId).toBe("tradeup");
      expect(result!.price).toBeGreaterThanOrEqual(0.03);
    }
  });

  it("turns 5 covert into 1 rare special", () => {
    const result = rollTradeUp(makeInputs("covert", 5), CASES, allSkins, "tu-gold");
    expect(result).not.toBeNull();
    expect(result!.skin.rarity).toBe("rare");
    expect(result!.stattrak).toBe(false);
  });

  it("rejects wrong counts, mixed rarities and rare inputs", () => {
    expect(rollTradeUp(makeInputs("milspec", 9), CASES, allSkins, "x")).toBeNull();
    expect(rollTradeUp(makeInputs("covert", 10), CASES, allSkins, "x")).toBeNull();
    expect(rollTradeUp([...makeInputs("milspec", 9), ...makeInputs("restricted", 1)], CASES, allSkins, "x")).toBeNull();
    expect(rollTradeUp(makeInputs("rare", 10), CASES, allSkins, "x")).toBeNull();
    expect(rollTradeUp([], CASES, allSkins, "x")).toBeNull();
  });

  it("keeps StatTrak only when every input has it", () => {
    for (let i = 0; i < 20; i++) {
      const all = rollTradeUp(makeInputs("classified", 10, true), CASES, allSkins, `st-${i}`);
      expect(all!.stattrak).toBe(true);
      const mixed = makeInputs("classified", 10, true);
      mixed[3] = { ...mixed[3], stattrak: false };
      const partial = rollTradeUp(mixed, CASES, allSkins, `st-m-${i}`);
      expect(partial!.stattrak).toBe(false);
    }
  });
});

describe("buildTradeUpItem", () => {
  it("never makes rare skins StatTrak and tags the caseId", () => {
    const rare = allSkins.find((s) => s.rarity === "rare")!;
    for (let i = 0; i < 50; i++) {
      const item = buildTradeUpItem(rare, `b-${i}`, true);
      expect(item.stattrak).toBe(false);
      expect(item.caseId).toBe("tradeup");
      expect(item.floatValue).toBeGreaterThanOrEqual(item.wear.min);
      expect(item.floatValue).toBeLessThanOrEqual(item.wear.max);
    }
  });
});

describe("types", () => {
  it("formatMoney adds $ and thousands separators", () => {
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(1234.5)).toBe("$1,234.50");
    expect(formatMoney(1000000)).toBe("$1,000,000.00");
  });

  it("rarityById resolves every rarity", () => {
    for (const r of RARITIES) {
      expect(rarityById(r.id)).toBe(r);
    }
  });
});
