import { describe, expect, it } from "vitest";
import { CASES, caseById } from "./cases";
import { buildSkinIndex, skinKey } from "./skin-index";

const index = buildSkinIndex(CASES);

describe("buildSkinIndex", () => {
  it("indexes every skin occurrence", () => {
    const totalSkins = CASES.reduce((sum, c) => sum + c.skins.length, 0);
    const totalOccurrences = index.reduce((sum, e) => sum + e.occurrences.length, 0);
    expect(totalOccurrences).toBeLessThanOrEqual(totalSkins);
    expect(index.length).toBeGreaterThan(0);
  });

  it("groups the same skin across multiple cases", () => {
    const glovesFade = index.find((e) => e.skin.weapon === "★ Specialist Gloves" && e.skin.name === "Fade");
    expect(glovesFade).toBeDefined();
    expect(glovesFade!.occurrences.length).toBeGreaterThan(1);
  });

  it("lists each case only once per skin and uses real case names", () => {
    for (const entry of index) {
      const caseIds = entry.occurrences.map((o) => o.caseId);
      expect(new Set(caseIds).size).toBe(caseIds.length);
      for (const o of entry.occurrences) {
        expect(caseById(o.caseId).name).toBe(o.caseName);
      }
    }
  });

  it("uses the first occurrence id as the command id", () => {
    for (const entry of index) {
      expect(entry.occurrences[0].id).toBe(entry.id);
      const firstCase = caseById(entry.occurrences[0].caseId);
      expect(firstCase.skins.some((s) => s.id === entry.id)).toBe(true);
    }
  });

  it("sorts by price descending", () => {
    for (let i = 1; i < index.length; i++) {
      expect(index[i - 1].basePrice).toBeGreaterThanOrEqual(index[i].basePrice);
    }
  });
});

describe("skinKey", () => {
  it("is case-insensitive", () => {
    expect(skinKey({ weapon: "AK-47", name: "Redline" })).toBe(skinKey({ weapon: "ak-47", name: "REDLINE" }));
  });
});
