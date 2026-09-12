"use client";

import { useEffect } from "react";
import { CaseData, InventoryItem, formatMoney, rarityById } from "@/lib/types";
import { playWin } from "@/lib/audio";
import SkinImage from "./SkinImage";

export default function WinModal({
  item,
  caseData,
  canOpenAgain,
  onKeep,
  onSell,
  onOpenAgain,
}: {
  item: InventoryItem;
  caseData: CaseData;
  canOpenAgain: boolean;
  onKeep: () => void;
  onSell: () => void;
  onOpenAgain: () => void;
}) {
  const rarity = rarityById(item.skin.rarity);

  useEffect(() => {
    playWin(item.skin.rarity);
  }, [item]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="win-pop relative w-full max-w-sm rounded-2xl border bg-[#12161f] p-6 text-center overflow-hidden"
        style={{ borderColor: rarity.color, boxShadow: `0 0 60px -10px ${rarity.color}aa` }}
      >
        <div
          className="absolute inset-0 opacity-25 win-shine"
          style={{ background: `radial-gradient(circle at 50% 30%, ${rarity.color}, transparent 65%)` }}
        />
        <div className="relative">
          <div className="text-xs uppercase tracking-widest font-bold" style={{ color: rarity.color }}>
            {rarity.name}
          </div>
          <div className="my-4 rounded-xl p-4 bg-[#0d1119]" style={{ boxShadow: `inset 0 0 40px ${rarity.color}22` }}>
          <SkinImage skin={item.skin} className="w-56 h-40 object-contain mx-auto drop-shadow-lg" />
          </div>
          <div className="text-sm text-zinc-400">{item.skin.weapon}</div>
          <div className="text-2xl font-extrabold text-white">
            {item.stattrak && <span className="text-orange-400">StatTrak™ </span>}
            {item.skin.name}
          </div>
          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-zinc-400">
            <span className="rounded bg-zinc-800 px-2 py-0.5">{item.wear.name} ({item.wear.short})</span>
            <span className="rounded bg-zinc-800 px-2 py-0.5">Float: {item.floatValue.toFixed(4)}</span>
          </div>
          <div className="mt-3 text-3xl font-black" style={{ color: rarity.color }}>
            {formatMoney(item.price)}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={onSell}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition px-3 py-2.5 text-sm font-bold text-white cursor-pointer"
            >
              Verkaufen (+{formatMoney(item.price)})
            </button>
            <button
              onClick={onKeep}
              className="rounded-lg bg-zinc-700 hover:bg-zinc-600 active:scale-95 transition px-3 py-2.5 text-sm font-bold text-white cursor-pointer"
            >
              Behalten
            </button>
          </div>
          <button
            onClick={onOpenAgain}
            disabled={!canOpenAgain}
            className="mt-2 w-full rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition px-3 py-2.5 text-sm font-bold text-amber-300 cursor-pointer"
          >
            Nochmal öffnen ({formatMoney(caseData.price)})
          </button>
        </div>
      </div>
    </div>
  );
}
