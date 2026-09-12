import { describe, expect, it } from "vitest";
import { CASES } from "./cases";
import {
  buildStrip,
  buildUpgradeItem,
  getLuckMultiplier,
  pickUpgradeTarget,
  rollDrop,
  rollRarity,
  rollSkin,
  setLuckMultiplier,
  upgradeChance,
  upgradeTargetPrice,
  UPGRADE_MAX_CHANCE,
} from "./game";
import { RARITIES, Skin, WEARS, formatMoney, rarityById } from "./types";

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
