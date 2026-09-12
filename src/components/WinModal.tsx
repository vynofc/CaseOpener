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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="win-pop relative w-full max-w-sm rounded-sm border bg-cs-900 p-6 text-center overflow-hidden"
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
          <div className="my-4 rounded-sm p-4 bg-cs-950" style={{ boxShadow: `inset 0 0 40px ${rarity.color}22` }}>
          <SkinImage skin={item.skin} className="w-56 h-40 object-contain mx-auto drop-shadow-lg" />
          </div>
          <div className="text-sm text-zinc-400">{item.skin.weapon}</div>
          <div className="text-2xl font-extrabold text-white uppercase tracking-wide">
            {item.stattrak && <span className="text-orange-400">StatTrak™ </span>}
            {item.skin.name}
          </div>
          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-zinc-400">
            <span className="rounded-sm bg-cs-800 px-2 py-0.5">{item.wear.name} ({item.wear.short})</span>
            <span className="rounded-sm bg-cs-800 px-2 py-0.5">Float: {item.floatValue.toFixed(4)}</span>
          </div>
          <div className="mt-3 text-3xl font-black" style={{ color: rarity.color }}>
            {formatMoney(item.price)}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={onSell}
              className="btn-primary px-3 py-2.5 text-xs"
            >
              Verkaufen (+{formatMoney(item.price)})
            </button>
            <button
              onClick={onKeep}
              className="rounded-sm bg-black/45 hover:bg-black/25 border border-white/10 active:scale-95 transition px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white cursor-pointer"
            >
              Behalten
            </button>
          </div>
          <button
            onClick={onOpenAgain}
            disabled={!canOpenAgain}
            className="mt-2 w-full rounded-sm border border-cs-gold/50 bg-cs-gold/10 hover:bg-cs-gold/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-cs-gold cursor-pointer"
          >
            Nochmal öffnen ({formatMoney(caseData.price)})
          </button>
        </div>
      </div>
    </div>
  );
}
