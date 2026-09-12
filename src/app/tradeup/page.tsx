"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { CASES } from "@/lib/cases";
import { InventoryItem, RarityId, Skin, formatMoney, rarityById } from "@/lib/types";
import { nextRarity, rollTradeUp, tradeUpOutcomeSkins, tradeUpRequirement } from "@/lib/game";
import { useGame } from "@/lib/game-context";
import { playClick, playOpen, playWin } from "@/lib/audio";
import Header from "@/components/Header";
import MenuBackdrop from "@/components/MenuBackdrop";
import SkinImage from "@/components/SkinImage";

type Phase = "idle" | "signing" | "result";

const TRADEABLE: RarityId[] = ["milspec", "restricted", "classified", "covert"];

const ALL_SKINS: Skin[] = (() => {
  const map = new Map<string, Skin>();
  for (const c of CASES) {
    for (const s of c.skins) {
      if (!map.has(s.id)) map.set(s.id, s);
    }
  }
  return [...map.values()];
})();

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function TradeUpPage() {
  const { hydrated, inventory, removeItem, addItem } = useGame();
  const [rarity, setRarity] = useState<RarityId>("milspec");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<InventoryItem | null>(null);

  const required = tradeUpRequirement(rarity);
  const targetRarity = nextRarity(rarity);
  const busy = phase !== "idle";

  const candidates = useMemo(
    () =>
      inventory
        .filter((i) => i.skin.rarity === rarity)
        .sort((a, b) => b.price - a.price),
    [inventory, rarity]
  );

  const inputs = useMemo(
    () => candidates.filter((i) => selected.has(i.uid)),
    [candidates, selected]
  );

  const outcomePool = useMemo(() => {
    const basis = inputs.length > 0 ? inputs : candidates;
    if (basis.length === 0) return [];
    return tradeUpOutcomeSkins(basis, CASES, ALL_SKINS);
  }, [inputs, candidates]);

  const inputValue = inputs.reduce((sum, i) => sum + i.price, 0);
  const allStatTrak = inputs.length === required && inputs.every((i) => i.stattrak);
  const complete = inputs.length === required;

  const selectRarity = useCallback(
    (r: RarityId) => {
      if (busy || r === rarity) return;
      setRarity(r);
      setSelected(new Set());
      playClick();
    },
    [busy, rarity]
  );

  const toggleItem = useCallback(
    (item: InventoryItem) => {
      if (busy) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(item.uid)) {
          next.delete(item.uid);
        } else if (next.size < required) {
          next.add(item.uid);
        }
        return next;
      });
      playClick();
    },
    [busy, required]
  );

  const sign = useCallback(() => {
    if (busy || !complete) return;
    const rolled = rollTradeUp(inputs, CASES, ALL_SKINS, uid());
    if (!rolled) return;
    setPhase("signing");
    playOpen();
    setTimeout(() => {
      for (const i of inputs) removeItem(i.uid);
      addItem(rolled);
      playWin(rolled.skin.rarity);
      setResult(rolled);
      setSelected(new Set());
      setPhase("result");
    }, 1200);
  }, [busy, complete, inputs, removeItem, addItem]);

  const reset = useCallback(() => {
    setPhase("idle");
    setResult(null);
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <MenuBackdrop />
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 flex flex-col gap-6">
        <section className="panel p-5">
          <div className="mb-4">
            <h1 className="panel-heading">Trade-Up Contract</h1>
            <p className="text-xs text-zinc-500 mt-1">
              Trade skins of one rarity for a single skin of the next higher rarity: 10 for Mil-Spec, Restricted and
              Classified, 5 Covert for a Rare Special item.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-4">
            {TRADEABLE.map((r) => {
              const info = rarityById(r);
              const owned = inventory.filter((i) => i.skin.rarity === r).length;
              const need = tradeUpRequirement(r);
              const active = r === rarity;
              return (
                <button
                  key={r}
                  disabled={busy}
                  onClick={() => selectRarity(r)}
                  className={`rounded-sm border px-2 py-2 text-left transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                    active
                      ? "bg-cs-900"
                      : "border-[#282b33] bg-[#121317] hover:border-white/25"
                  }`}
                  style={active ? { borderColor: info.color } : undefined}
                >
                  <span className="block text-xs font-bold uppercase tracking-wider" style={{ color: info.color }}>
                    {info.name}
                  </span>
                  <span className={`block text-[10px] tabular-nums mt-0.5 ${owned >= need ? "text-cs-green" : "text-zinc-500"}`}>
                    {owned}/{need} owned
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="rounded-sm border border-white/10 bg-cs-950/60 p-3 flex flex-col min-h-64">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Your {rarityById(rarity).name} skins
                </div>
                <div className={`text-[10px] tabular-nums ${complete ? "text-cs-green" : "text-zinc-500"}`}>
                  {inputs.length}/{required} selected
                </div>
              </div>
              {!hydrated ? null : candidates.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center my-auto py-6">
                  No {rarityById(rarity).name} skins in your inventory.{" "}
                  <Link href="/" className="text-cs-green hover:underline" onClick={() => playClick()}>
                    Open some cases first
                  </Link>
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 overflow-y-auto max-h-[26rem] pr-1">
                  {candidates.map((item) => {
                    const info = rarityById(item.skin.rarity);
                    const isSelected = selected.has(item.uid);
                    const order = isSelected ? [...selected].indexOf(item.uid) + 1 : null;
                    return (
                      <button
                        key={item.uid}
                        disabled={busy}
                        onClick={() => toggleItem(item)}
                        className={`relative rounded-sm border bg-cs-900/80 p-2 text-left transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                          isSelected ? "ring-2 ring-cs-green" : "hover:bg-cs-800/60"
                        }`}
                        style={{ borderColor: isSelected ? "#44c987" : info.color + "55" }}
                      >
                        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-sm" style={{ background: info.color }} />
                        {order !== null && (
                          <span className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full bg-cs-green text-black text-[9px] font-bold flex items-center justify-center">
                            {order}
                          </span>
                        )}
                        {item.stattrak && (
                          <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-orange-400">ST™</span>
                        )}
                        <SkinImage skin={item.skin} className="w-full h-14 object-contain mt-1" />
                        <div className="text-[10px] text-zinc-500 truncate mt-1">{item.skin.weapon}</div>
                        <div className="text-xs font-semibold text-zinc-100 truncate">{item.skin.name}</div>
                        <div className="text-[10px] text-zinc-500">{item.wear.short}</div>
                        <div className="text-xs font-bold mt-0.5" style={{ color: info.color }}>
                          {formatMoney(item.price)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-sm border border-white/10 bg-cs-950/60 p-4 flex flex-col min-h-64">
              {phase === "result" && result ? (
                <div className="text-center flex flex-col items-center gap-3 my-auto">
                  <div
                    className="text-sm font-bold uppercase tracking-widest"
                    style={{ color: rarityById(result.skin.rarity).color }}
                  >
                    Contract fulfilled!
                  </div>
                  <div className="win-pop">
                    <SkinImage skin={result.skin} className="w-40 h-28 object-contain drop-shadow-lg" />
                  </div>
                  <div className="text-xs text-zinc-400">{result.skin.weapon}</div>
                  <div className="text-lg font-extrabold text-white uppercase">
                    {result.stattrak && <span className="text-orange-400">StatTrak™ </span>}
                    {result.skin.name}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {result.wear.name} · Float {result.floatValue.toFixed(4)}
                  </div>
                  <div className="text-xl font-black" style={{ color: rarityById(result.skin.rarity).color }}>
                    {formatMoney(result.price)}
                  </div>
                  <button onClick={reset} className="btn-gold px-6 py-2.5 text-xs mt-2">
                    New contract
                  </button>
                </div>
              ) : phase === "signing" ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                  <svg viewBox="0 0 24 24" className="w-12 h-12 text-cs-gold animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    <path d="M2 2l7.586 7.586" />
                    <circle cx="11" cy="11" r="2" />
                  </svg>
                  <p className="text-xs uppercase tracking-[0.25em] text-cs-gold animate-pulse">Signing contract...</p>
                </div>
              ) : (
                <>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">
                    Contract · {required}x {rarityById(rarity).name} → 1x{" "}
                    <span style={{ color: targetRarity ? rarityById(targetRarity).color : undefined }}>
                      {targetRarity ? rarityById(targetRarity).name : "?"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-center rounded-sm border border-white/5 bg-cs-900/60 p-3">
                    {Array.from({ length: required }, (_, i) => {
                      const item = inputs[i];
                      return item ? (
                        <div
                          key={item.uid}
                          className="relative w-12 h-12 rounded-sm border bg-cs-900/80 p-1"
                          style={{ borderColor: rarityById(item.skin.rarity).color + "66" }}
                          title={`${item.skin.weapon} | ${item.skin.name}`}
                        >
                          <SkinImage skin={item.skin} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div
                          key={`empty-${i}`}
                          className="w-12 h-12 rounded-sm border border-dashed border-white/15 bg-black/20"
                        />
                      );
                    })}
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-cs-gold shrink-0 mx-1" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                    <div
                      className="w-12 h-12 rounded-sm border border-dashed shrink-0"
                      style={{ borderColor: (targetRarity ? rarityById(targetRarity).color : "#666") + "88" }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-3 tabular-nums">
                    <span>
                      Input value <span className="text-zinc-200 font-bold">{formatMoney(inputValue)}</span>
                    </span>
                    {allStatTrak && <span className="text-orange-400 font-bold">StatTrak™ guaranteed</span>}
                  </div>

                  {outcomePool.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
                        Possible outcomes ({outcomePool.length})
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {outcomePool.slice(0, 12).map((s) => (
                          <div
                            key={s.id}
                            className="relative rounded-sm border bg-cs-900/80 p-1.5"
                            style={{ borderColor: rarityById(s.rarity).color + "44" }}
                            title={`${s.weapon} | ${s.name}`}
                          >
                            <SkinImage skin={s} className="w-full h-8 object-contain" />
                            <div className="text-[8px] text-zinc-500 truncate mt-0.5">{s.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={sign} disabled={!complete || busy} className="btn-gold px-8 py-3 text-sm w-full mt-4">
                    Sign contract ({inputs.length}/{required})
                  </button>
                  <p className="text-[11px] text-zinc-600 leading-relaxed mt-3">
                    All selected skins are consumed. StatTrak™ carries over only if every input has it. Rare Special
                    items are never StatTrak™.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
