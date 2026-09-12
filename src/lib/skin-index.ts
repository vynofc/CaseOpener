import { CaseData, Skin } from "./types";

export interface SkinIndexOccurrence {
  caseId: string;
  caseName: string;
  id: string;
}

export interface SkinIndexEntry {
  key: string;
  skin: Skin;
  basePrice: number;
  id: string;
  occurrences: SkinIndexOccurrence[];
}

export function skinKey(s: Pick<Skin, "weapon" | "name">): string {
  return `${s.weapon}|${s.name}`.toLowerCase();
}

export function buildSkinIndex(cases: CaseData[]): SkinIndexEntry[] {
  const map = new Map<string, SkinIndexEntry>();
  for (const c of cases) {
    for (const s of c.skins) {
      const key = skinKey(s);
      const existing = map.get(key);
      if (existing) {
        if (!existing.occurrences.some((o) => o.caseId === c.id)) {
          existing.occurrences.push({ caseId: c.id, caseName: c.name, id: s.id });
        }
        if (s.basePrice > existing.basePrice) existing.basePrice = s.basePrice;
      } else {
        map.set(key, {
          key,
          skin: s,
          basePrice: s.basePrice,
          id: s.id,
          occurrences: [{ caseId: c.id, caseName: c.name, id: s.id }],
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => b.basePrice - a.basePrice || a.key.localeCompare(b.key));
}
