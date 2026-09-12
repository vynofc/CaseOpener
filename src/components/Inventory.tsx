"use client";

import { useGame } from "@/lib/game-context";
import { formatMoney, rarityById } from "@/lib/types";
import SkinImage from "./SkinImage";

export default function Inventory() {
  const { inventory, sellItem, sellAll } = useGame();
  const total = inventory.reduce((sum, i) => sum + i.price, 0);

  return (
    <section id="inventory" className="panel p-5 scroll-mt-20">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="panel-heading">
          Inventory <span className="text-zinc-600 normal-case tracking-normal">({inventory.length})</span>
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-emerald-400 font-semibold">{formatMoney(total)}</span>
          <button
            onClick={sellAll}
            disabled={inventory.length === 0}
            className="btn-primary px-3 py-1.5 text-[10px]"
          >
            Sell all
          </button>
        </div>
      </div>
      {inventory.length === 0 ? (
        <p className="text-sm text-zinc-500 py-6 text-center">No items yet. Open a case!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {inventory.map((item) => {
            const rarity = rarityById(item.skin.rarity);
            return (
              <div
                key={item.uid}
                className="group relative rounded-sm border bg-cs-950/70 p-2 flex flex-col transition hover:bg-cs-800/60"
                style={{ borderColor: rarity.color + "55" }}
              >
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-sm" style={{ background: rarity.color }} />
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
                    className="text-[10px] uppercase tracking-wider rounded-sm bg-cs-700 hover:bg-emerald-600/40 hover:text-emerald-300 text-zinc-400 px-2 py-1 font-semibold transition cursor-pointer"
                  >
                    Sell
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
