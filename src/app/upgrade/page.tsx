"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CASES } from "@/lib/cases";
import { InventoryItem, Skin, formatMoney, rarityById } from "@/lib/types";
import { buildUpgradeItem, pickUpgradeTarget, rollUpgradeWin } from "@/lib/game";
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

const CHANCE_PRESETS = [75, 50, 30, 10, 5, 1];

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function UpgradePage() {
  const { hydrated, inventory, removeItem, addItem } = useGame();
  const [stakeUid, setStakeUid] = useState<string | null>(null);
  const [chancePct, setChancePct] = useState(30);
  const [target, setTarget] = useState<Skin | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [outcome, setOutcome] = useState<{ win: boolean; item: InventoryItem | null; stake: InventoryItem; chance: number } | null>(null);

  const stake = inventory.find((i) => i.uid === stakeUid) ?? null;
  const valid = stake !== null && target !== null;

  const rollTarget = useCallback((stakePrice: number, pct: number): Skin | null => {
    return pickUpgradeTarget(ALL_SKINS, stakePrice, pct / 100);
  }, []);

  const selectStake = useCallback(
    (item: InventoryItem | null) => {
      setStakeUid(item ? item.uid : null);
      setTarget(item ? rollTarget(item.price, chancePct) : null);
      playClick();
    },
    [chancePct, rollTarget]
  );

  const selectChance = useCallback(
    (pct: number) => {
      setChancePct(pct);
      if (stake) setTarget(rollTarget(stake.price, pct));
      playClick();
    },
    [stake, rollTarget]
  );

  const rerollTarget = useCallback(() => {
    if (!stake) return;
    setTarget(pickUpgradeTarget(ALL_SKINS, stake.price, chancePct / 100, 16));
    playClick();
  }, [stake, chancePct]);

  const startUpgrade = useCallback(() => {
    if (phase !== "idle" || !valid || !stake || !target) return;
    const c = chancePct / 100;
    const win = rollUpgradeWin(c);
    const item = win ? buildUpgradeItem(target, uid()) : null;
    setOutcome({ win, item, stake, chance: c });
    setPhase("spinning");
    playOpen();
  }, [phase, valid, stake, target, chancePct]);

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
    setTarget(null);
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
                Stake an item from your inventory, pick your win chance, and win a more expensive item.
              </p>
            </div>
            {valid && (
              <span className="text-xs text-zinc-400 tabular-nums">
                Multiplier: <span className="text-cs-gold font-bold">×{(target.basePrice / stake.price).toFixed(2)}</span>
              </span>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_360px_1fr]">
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
                        onClick={() => selectStake(selected ? null : item)}
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
              {phase === "result" && outcome ? (
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
                  <button onClick={reset} className="btn-gold px-6 py-2.5 text-xs mt-2">
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  {phase === "spinning" && outcome ? (
                    <UpgradeWheel chance={outcome.chance} win={outcome.win} spinning onDone={handleWheelDone} />
                  ) : (
                    <UpgradeWheel chance={chancePct / 100} win={false} spinning={false} />
                  )}

                  {phase !== "spinning" && (
                    <>
                      <div className="grid grid-cols-3 gap-1.5 w-full">
                        {CHANCE_PRESETS.map((pct) => (
                          <button
                            key={pct}
                            disabled={busy}
                            onClick={() => selectChance(pct)}
                            className={`rounded-sm border px-2 py-2 text-xs font-bold tabular-nums tracking-wider transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                              chancePct === pct
                                ? "border-[#b99500] bg-[#19180f] text-[#fbd506]"
                                : "border-[#282b33] bg-[#121317] text-[#8f9298] hover:border-[#b99500]/60 hover:text-zinc-200"
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                      <button onClick={startUpgrade} disabled={!valid || busy} className="btn-gold px-8 py-3 text-sm w-full">
                        Upgrade
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="rounded-sm border border-white/10 bg-cs-950/60 p-4 flex flex-col min-h-64">
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">Target · auto-picked</div>
              {target && stake ? (
                <>
                  <div
                    className="relative rounded-sm border bg-cs-900/80 p-4 flex flex-col items-center text-center"
                    style={{
                      borderColor: rarityById(target.rarity).color + "66",
                      boxShadow: "0 0 35px rgba(251, 213, 6, 0.12), inset 0 0 18px rgba(255, 255, 255, 0.03)",
                    }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-0.5 rounded-t-sm"
                      style={{ background: rarityById(target.rarity).color }}
                    />
                    <SkinImage skin={target} className="w-full h-28 object-contain drop-shadow-lg" />
                    <div className="text-[10px] text-zinc-500 truncate mt-2">{target.weapon}</div>
                    <div className="text-sm font-semibold text-zinc-100 truncate w-full">{target.name}</div>
                    <div className="text-base font-black mt-0.5" style={{ color: rarityById(target.rarity).color }}>
                      {formatMoney(target.basePrice)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-3 tabular-nums">
                    <span>
                      Multiplier <span className="text-cs-gold font-bold">×{(target.basePrice / stake.price).toFixed(2)}</span>
                    </span>
                    <span>
                      Chance <span className="text-[#fbd506] font-bold">{chancePct}%</span>
                    </span>
                  </div>
                  <button
                    onClick={rerollTarget}
                    disabled={busy}
                    className="mt-3 rounded-sm border border-[#282b33] bg-[#121317] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#8f9298] hover:border-[#b99500]/60 hover:text-zinc-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reroll target
                  </button>
                  <p className="text-[11px] text-zinc-600 leading-relaxed mt-auto pt-3">
                    The lower the chance, the more expensive the target. It is picked automatically to match your chosen
                    chance.
                  </p>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                  <svg
                    viewBox="0 0 64 44"
                    className="w-14 opacity-40"
                    fill="none"
                    stroke="#3a3a3d"
                    strokeWidth="7"
                    strokeLinecap="square"
                    aria-hidden
                  >
                    <path d="M8 20 32 4l24 16" />
                    <path d="M8 40 32 24l24 16" />
                  </svg>
                  <p className="text-xs text-zinc-600">
                    Select a stake on the left.
                    <br />
                    The target is picked automatically to match your chance.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
