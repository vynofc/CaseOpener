"use client";

import { useGame } from "@/lib/game-context";
import { formatMoney, rarityById } from "@/lib/types";
import SkinImage from "./SkinImage";

export default function Inventory() {
  const { inventory, sellItem, sellAll } = useGame();
  const total = inventory.reduce((sum, i) => sum + i.price, 0);

  return (
    <section className="rounded-xl border border-zinc-800 bg-[#12161f] p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-white">
          Inventar <span className="text-zinc-500 text-sm font-normal">({inventory.length})</span>
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-emerald-400 font-semibold">{formatMoney(total)}</span>
          <button
            onClick={sellAll}
            disabled={inventory.length === 0}
            className="rounded-lg bg-emerald-600/20 border border-emerald-600/50 text-emerald-300 hover:bg-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            Alles verkaufen
          </button>
        </div>
      </div>
      {inventory.length === 0 ? (
        <p className="text-sm text-zinc-500 py-6 text-center">Noch keine Items. Öffne eine Kiste!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {inventory.map((item) => {
            const rarity = rarityById(item.skin.rarity);
            return (
              <div
                key={item.uid}
                className="group relative rounded-lg border bg-[#0d1119] p-2 flex flex-col"
                style={{ borderColor: rarity.color + "55" }}
              >
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-lg" style={{ background: rarity.color }} />
                {item.stattrak && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-orange-400">ST™</span>
                )}
                <SkinImage skin={item.skin} className="w-full h-16 object-contain mt-1" />
                <div className="text-[10px] text-zinc-500 truncate mt-1">{item.skin.weapon}</div>
                <div className="text-xs font-semibold text-zinc-100 truncate">{item.skin.name}</div>
                <div className="text-[10px] text-zinc-500">{item.wear.short} · {item.floatValue.toFixed(3)}</div>
                <div className="mt-auto pt-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: rarity.color }}>{formatMoney(item.price)}</span>
                  <button
                    onClick={() => sellItem(item.uid)}
                    className="text-[10px] rounded bg-zinc-800 hover:bg-emerald-600/40 hover:text-emerald-300 text-zinc-400 px-2 py-1 font-semibold transition cursor-pointer"
                  >
                    Verkaufen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
