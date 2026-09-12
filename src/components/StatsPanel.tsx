"use client";

import { useGame } from "@/lib/game-context";
import { formatMoney, rarityById } from "@/lib/types";

export default function StatsPanel() {
  const { stats, resetAll } = useGame();
  const net = stats.earned - stats.spent;

  return (
    <section id="stats" className="panel p-5 scroll-mt-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="panel-heading">Statistik</h2>
        <button
          onClick={() => {
            if (window.confirm("Wirklich alles zurücksetzen? Inventar und Statistik gehen verloren.")) resetAll();
          }}
          className="text-xs text-zinc-500 hover:text-red-400 transition cursor-pointer"
        >
          Zurücksetzen
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Geöffnet" value={String(stats.opened)} />
        <Stat label="Ausgegeben" value={formatMoney(stats.spent)} className="text-red-400" />
        <Stat label="Eingenommen" value={formatMoney(stats.earned)} className="text-emerald-400" />
        <Stat
          label="Bilanz"
          value={(net >= 0 ? "+" : "") + formatMoney(net)}
          className={net >= 0 ? "text-emerald-400" : "text-red-400"}
        />
      </div>
      {stats.bestDrop && (
        <div className="mt-4 rounded-sm bg-cs-950/70 border border-white/10 p-3 flex items-center gap-3">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: rarityById(stats.bestDrop.skin.rarity).color, boxShadow: `0 0 8px 2px ${rarityById(stats.bestDrop.skin.rarity).color}88` }}
          />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Bester Drop</div>
            <div className="text-sm font-semibold text-zinc-100 truncate">
              {stats.bestDrop.stattrak && <span className="text-orange-400">ST™ </span>}
              {stats.bestDrop.skin.weapon} | {stats.bestDrop.skin.name}
            </div>
          </div>
          <div className="ml-auto text-sm font-bold shrink-0" style={{ color: rarityById(stats.bestDrop.skin.rarity).color }}>
            {formatMoney(stats.bestDrop.price)}
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, className = "text-white" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-sm bg-cs-950/70 border border-white/10 p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`text-base font-bold ${className}`}>{value}</div>
    </div>
  );
}
