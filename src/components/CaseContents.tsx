"use client";

import { CaseData, RARITIES, formatMoney, rarityById } from "@/lib/types";
import SkinImage from "./SkinImage";

export default function CaseContents({ caseData }: { caseData: CaseData }) {
  const sorted = [...caseData.skins].sort((a, b) => b.basePrice - a.basePrice);

  return (
    <section className="panel p-5">
      <h2 className="panel-heading">Contains one of the following items</h2>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 mb-4">
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
              className="relative rounded-sm border bg-cs-950/70 p-2 flex flex-col items-center transition hover:bg-cs-800/60"
              style={{ borderColor: rarity.color + "44" }}
              title={`${skin.weapon} | ${skin.name} · ~${formatMoney(skin.basePrice)}`}
            >
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-sm" style={{ background: rarity.color }} />
              <div className="item-plate absolute inset-x-1.5 top-3 bottom-9 rounded-sm" />
              <SkinImage skin={skin} className="relative w-full h-12 object-contain mt-1" />
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
