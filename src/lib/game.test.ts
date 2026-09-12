import { describe, expect, it } from "vitest";
import { CASES } from "./cases";
import { buildStrip, rollDrop, rollRarity, rollSkin } from "./game";
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
