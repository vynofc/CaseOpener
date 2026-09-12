"use client";

import { CaseData, RARITIES, formatMoney, rarityById } from "@/lib/types";
import SkinImage from "./SkinImage";

export default function CaseContents({ caseData }: { caseData: CaseData }) {
  const sorted = [...caseData.skins].sort((a, b) => b.basePrice - a.basePrice);

  return (
    <section className="rounded-xl border border-zinc-800 bg-[#12161f] p-4">
      <h2 className="text-lg font-bold text-white mb-1">Mögliche Drops</h2>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {RARITIES.filter((r) => caseData.skins.some((s) => s.rarity === r.id)).map((r) => (
          <span key={r.id} className="text-xs font-semibold" style={{ color: r.color }}>
            {r.name}: {r.odds}%
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {sorted.map((skin) => {
          const rarity = rarityById(skin.rarity);
          return (
            <div
              key={skin.id}
              className="relative rounded-lg border bg-[#0d1119] p-2 flex flex-col items-center"
              style={{ borderColor: rarity.color + "44" }}
              title={`${skin.weapon} | ${skin.name} · ~${formatMoney(skin.basePrice)}`}
            >
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-lg" style={{ background: rarity.color }} />
              <SkinImage skin={skin} className="w-full h-12 object-contain mt-1" />
              <div className="text-[9px] text-zinc-500 truncate w-full text-center">{skin.weapon}</div>
              <div className="text-[10px] font-semibold text-zinc-200 truncate w-full text-center leading-tight">{skin.name}</div>
              <div className="text-[9px] font-bold" style={{ color: rarity.color }}>{formatMoney(skin.basePrice)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
