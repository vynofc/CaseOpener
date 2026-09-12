"use client";

import { useGame } from "@/lib/game-context";
import { formatMoney } from "@/lib/types";
import { playClick } from "@/lib/audio";

export default function Header() {
  const { balance, addFunds, soundOn, toggleSound, hydrated } = useGame();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-[#0b0e14]/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📦</span>
          <span className="font-black text-white tracking-tight">
            CS2 <span className="text-amber-400">Case Opener</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="rounded-lg border border-zinc-700 hover:border-zinc-500 px-2.5 py-1.5 text-sm transition cursor-pointer"
            title={soundOn ? "Sound aus" : "Sound an"}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <div className="rounded-lg border border-emerald-700/60 bg-emerald-900/20 px-3 py-1.5 text-sm font-bold text-emerald-300 tabular-nums min-w-24 text-right">
            {hydrated ? formatMoney(balance) : "..."}
          </div>
          <button
            onClick={() => {
              addFunds(100);
              playClick();
            }}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-3 py-1.5 text-sm font-bold text-white transition cursor-pointer"
          >
            + $100
          </button>
        </div>
      </div>
    </header>
  );
}
