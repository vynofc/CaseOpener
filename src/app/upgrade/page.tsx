"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { CASES } from "@/lib/cases";
import { InventoryItem, Skin, formatMoney, rarityById } from "@/lib/types";
import { buildUpgradeItem, rollUpgradeWin, upgradeChance } from "@/lib/game";
import { useGame } from "@/lib/game-context";
import { playClick, playLose, playOpen, playWin } from "@/lib/audio";
import Header from "@/components/Header";
import MenuBackdrop from "@/components/MenuBackdrop";
import SkinImage from "@/components/SkinImage";
import UpgradeWheel from "@/components/UpgradeWheel";

type Phase = "idle" | "spinning" | "result";

const ALL_SKINS: Skin[] = (() => {
  const map = new Map<string, Skin>();
  for (const c of CASES) {
    for (const s of c.skins) {
      if (!map.has(s.id)) map.set(s.id, s);
    }
  }
  return [...map.values()];
})();

const MAX_TARGETS = 60;

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function UpgradePage() {
  const { hydrated, inventory, removeItem, addItem } = useGame();
  const [stakeUid, setStakeUid] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [search, setSearch] = useState("");
  const [sortDesc, setSortDesc] = useState(false);
  const [outcome, setOutcome] = useState<{ win: boolean; item: InventoryItem | null; stake: InventoryItem; chance: number } | null>(null);

  const stake = inventory.find((i) => i.uid === stakeUid) ?? null;
  const target = ALL_SKINS.find((s) => s.id === targetId) ?? null;
  const valid = stake !== null && target !== null && target.basePrice > stake.price;
  const chance = valid ? upgradeChance(stake.price, target.basePrice) : 0;

  const targets = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = ALL_SKINS;
    if (stake) list = list.filter((s) => s.basePrice > stake.price);
    if (q) list = list.filter((s) => `${s.weapon} ${s.name}`.toLowerCase().includes(q));
    list = [...list].sort((a, b) => (sortDesc ? b.basePrice - a.basePrice : a.basePrice - b.basePrice));
    return list;
  }, [stake, search, sortDesc]);

  const shownTargets = targets.slice(0, MAX_TARGETS);

  const startUpgrade = useCallback(() => {
    if (phase !== "idle" || !valid || !stake || !target) return;
    const c = upgradeChance(stake.price, target.basePrice);
    const win = rollUpgradeWin(c);
    const item = win ? buildUpgradeItem(target, uid()) : null;
    setOutcome({ win, item, stake, chance: c });
    setPhase("spinning");
    playOpen();
  }, [phase, valid, stake, target]);

  const handleWheelDone = useCallback(() => {
    if (!outcome) return;
    removeItem(outcome.stake.uid);
    if (outcome.win && outcome.item) {
      addItem(outcome.item);
      playWin(outcome.item.skin.rarity);
    } else {
      playLose();
    }
    setPhase("result");
  }, [outcome, removeItem, addItem]);

  const reset = useCallback(() => {
    setPhase("idle");
    setOutcome(null);
    setStakeUid(null);
    setTargetId(null);
  }, []);

  const busy = phase !== "idle";

  return (
    <div className="min-h-full flex flex-col">
      <MenuBackdrop />
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 flex flex-col gap-6">
        <section className="panel p-5">
          <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
            <div>
              <h1 className="panel-heading">Upgrader</h1>
              <p className="text-xs text-zinc-500 mt-1">
                Stake an item from your inventory and win a more expensive one with a bit of luck.
              </p>
            </div>
            {valid && (
              <span className="text-xs text-zinc-400 tabular-nums">
                Multiplier: <span className="text-cs-gold font-bold">×{(target.basePrice / stake.price).toFixed(2)}</span>
              </span>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px_1fr]">
            <div className="rounded-sm border border-white/10 bg-cs-950/60 p-3 flex flex-col min-h-64">
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Your stake</div>
              {!hydrated ? null : inventory.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center my-auto py-6">
                  Your inventory is empty.{" "}
                  <Link href="/" className="text-cs-green hover:underline" onClick={() => playClick()}>
                    Open some cases first
                  </Link>
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 overflow-y-auto max-h-96 pr-1">
                  {inventory.map((item) => {
                    const rarity = rarityById(item.skin.rarity);
                    const selected = stakeUid === item.uid;
                    return (
                      <button
                        key={item.uid}
                        disabled={busy}
                        onClick={() => {
                          setStakeUid(selected ? null : item.uid);
                          playClick();
                        }}
                        className={`relative rounded-sm border bg-cs-900/80 p-2 text-left transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                          selected ? "ring-2 ring-cs-green" : "hover:bg-cs-800/60"
                        }`}
                        style={{ borderColor: selected ? "#44c987" : rarity.color + "55" }}
                      >
                        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-sm" style={{ background: rarity.color }} />
                        {item.stattrak && (
                          <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-orange-400">ST™</span>
                        )}
                        <SkinImage skin={item.skin} className="w-full h-14 object-contain mt-1" />
                        <div className="text-[10px] text-zinc-500 truncate mt-1">{item.skin.weapon}</div>
                        <div className="text-xs font-semibold text-zinc-100 truncate">{item.skin.name}</div>
                        <div className="text-[10px] text-zinc-500">{item.wear.short}</div>
                        <div className="text-xs font-bold mt-0.5" style={{ color: rarity.color }}>
                          {formatMoney(item.price)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-sm border border-white/10 bg-cs-950/60 p-4 flex flex-col items-center justify-center gap-4 min-h-64">
              {phase === "spinning" && outcome ? (
                <UpgradeWheel
                  chance={outcome.chance}
                  win={outcome.win}
                  onDone={handleWheelDone}
                />
              ) : phase === "result" && outcome ? (
                <div className="text-center flex flex-col items-center gap-3">
                  {outcome.win && outcome.item ? (
                    <>
                      <div
                        className="text-sm font-bold uppercase tracking-widest"
                        style={{ color: rarityById(outcome.item.skin.rarity).color }}
                      >
                        Upgrade successful!
                      </div>
                      <SkinImage skin={outcome.item.skin} className="w-40 h-28 object-contain drop-shadow-lg" />
                      <div className="text-xs text-zinc-400">{outcome.item.skin.weapon}</div>
                      <div className="text-lg font-extrabold text-white uppercase">
                        {outcome.item.stattrak && <span className="text-orange-400">StatTrak™ </span>}
                        {outcome.item.skin.name}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {outcome.item.wear.name} · Float {outcome.item.floatValue.toFixed(4)}
                      </div>
                      <div className="text-xl font-black" style={{ color: rarityById(outcome.item.skin.rarity).color }}>
                        {formatMoney(outcome.item.price)}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Staked: {outcome.stake.skin.weapon} | {outcome.stake.skin.name} ({formatMoney(outcome.stake.price)})
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-bold uppercase tracking-widest text-red-400">Upgrade failed</div>
                      <div className="text-xs text-zinc-400">
                        {outcome.stake.skin.weapon} | {outcome.stake.skin.name} ({formatMoney(outcome.stake.price)}) lost.
                      </div>
                    </>
                  )}
                  <button onClick={reset} className="btn-primary px-6 py-2.5 text-xs mt-2">
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 w-full justify-center">
                    <div className="flex-1 text-center">
                      {stake ? (
                        <>
                          <SkinImage skin={stake.skin} className="w-20 h-14 object-contain mx-auto" />
                          <div className="text-[10px] text-zinc-500 truncate mt-1">{stake.skin.weapon}</div>
                          <div className="text-xs font-semibold text-zinc-100 truncate">{stake.skin.name}</div>
                          <div className="text-xs font-bold text-zinc-300 tabular-nums">{formatMoney(stake.price)}</div>
                        </>
                      ) : (
                        <div className="text-xs text-zinc-600 border border-dashed border-white/15 rounded-sm px-2 py-6">Select stake</div>
                      )}
                    </div>
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-cs-green shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                    <div className="flex-1 text-center">
                      {target ? (
                        <>
                          <SkinImage skin={target} className="w-20 h-14 object-contain mx-auto" />
                          <div className="text-[10px] text-zinc-500 truncate mt-1">{target.weapon}</div>
                          <div className="text-xs font-semibold text-zinc-100 truncate">{target.name}</div>
                          <div className="text-xs font-bold text-cs-gold tabular-nums">{formatMoney(target.basePrice)}</div>
                        </>
                      ) : (
                        <div className="text-xs text-zinc-600 border border-dashed border-white/15 rounded-sm px-2 py-6">Select target</div>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-3xl font-bold text-white tabular-nums">
                      {valid ? `${(chance * 100).toFixed(1)}%` : "–"}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Win chance</div>
                  </div>
                  <button onClick={startUpgrade} disabled={!valid || busy} className="btn-primary px-8 py-3 text-sm w-full">
                    Upgrade
                  </button>
                  {stake && target && target.basePrice <= stake.price && (
                    <p className="text-[11px] text-red-400 text-center -mt-1">The target must be worth more than your stake.</p>
                  )}
                </>
              )}
            </div>

            <div className="rounded-sm border border-white/10 bg-cs-950/60 p-3 flex flex-col min-h-64">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Select target</div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search skins…"
                  disabled={busy}
                  className="ml-auto w-32 rounded-sm border border-white/10 bg-black/40 px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cs-green/60"
                />
                <button
                  onClick={() => {
                    setSortDesc((v) => !v);
                    playClick();
                  }}
                  disabled={busy}
                  className="rounded-sm border border-white/10 bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-50"
                  title="Reverse sort order"
                >
                  Price {sortDesc ? "↓" : "↑"}
                </button>
              </div>
              {shownTargets.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center my-auto py-6">No matching skins found.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 overflow-y-auto max-h-96 pr-1">
                    {shownTargets.map((skin) => {
                      const rarity = rarityById(skin.rarity);
                      const selected = targetId === skin.id;
                      return (
                        <button
                          key={skin.id}
                          disabled={busy}
                          onClick={() => {
                            setTargetId(selected ? null : skin.id);
                            playClick();
                          }}
                          className={`relative rounded-sm border bg-cs-900/80 p-2 text-left transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                            selected ? "ring-2 ring-cs-gold" : "hover:bg-cs-800/60"
                          }`}
                          style={{ borderColor: selected ? "#e4ae39" : rarity.color + "55" }}
                        >
                          <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-sm" style={{ background: rarity.color }} />
                          <SkinImage skin={skin} className="w-full h-14 object-contain mt-1" />
                          <div className="text-[10px] text-zinc-500 truncate mt-1">{skin.weapon}</div>
                          <div className="text-xs font-semibold text-zinc-100 truncate">{skin.name}</div>
                          <div className="text-xs font-bold mt-0.5" style={{ color: rarity.color }}>
                            {formatMoney(skin.basePrice)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {targets.length > MAX_TARGETS && (
                    <p className="text-[10px] text-zinc-600 text-center mt-2">
                      Showing {MAX_TARGETS} of {targets.length} - use the search to filter.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
