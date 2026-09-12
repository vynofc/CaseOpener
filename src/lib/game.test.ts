import { describe, expect, it } from "vitest";
import { CASES } from "./cases";
import { buildStrip, buildUpgradeItem, rollDrop, rollRarity, rollSkin, upgradeChance, UPGRADE_MAX_CHANCE } from "./game";
import { RARITIES, WEARS, formatMoney, rarityById } from "./types";

const testCase = CASES[0];

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
