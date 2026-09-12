"use client";

import { useCallback, useState } from "react";
import { CASES } from "@/lib/cases";
import { CaseData, InventoryItem, formatMoney } from "@/lib/types";
import { rollDrop } from "@/lib/game";
import { useGame } from "@/lib/game-context";
import { playOpen, playClick } from "@/lib/audio";
import Header from "@/components/Header";
import MenuBackdrop from "@/components/MenuBackdrop";
import CaseCard from "@/components/CaseCard";
import CaseImage from "@/components/CaseImage";
import CaseContents from "@/components/CaseContents";
import Roulette from "@/components/Roulette";
import WinModal from "@/components/WinModal";
import CaseIntro from "@/components/CaseIntro";

type Phase = "idle" | "opening" | "spinning" | "result";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Home() {
  const { hydrated, canAfford, deduct, keepItem, sellDirect } = useGame();
  const [selected, setSelected] = useState<CaseData>(CASES[0]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [winner, setWinner] = useState<InventoryItem | null>(null);

  const openCase = useCallback(() => {
    if (phase === "opening" || phase === "spinning") return;
    if (!deduct(selected.price)) return;
    const drop = rollDrop(selected, uid());
    setWinner(drop);
    setPhase("opening");
    playOpen();
  }, [phase, selected, deduct]);

  const handleIntroDone = useCallback(() => {
    setPhase((p) => (p === "opening" ? "spinning" : p));
  }, []);

  const handleSettled = useCallback((item: InventoryItem) => {
    setWinner(item);
    setPhase("result");
  }, []);

  const closeModal = useCallback(
    (action: "keep" | "sell" | "again") => {
      if (!winner) return;
      if (action === "sell") {
        sellDirect(winner);
        setPhase("idle");
        setWinner(null);
      } else {
        keepItem(winner);
        if (action === "again") {
          playClick();
          setPhase("idle");
          setWinner(null);
          setTimeout(openCase, 50);
        } else {
          setPhase("idle");
          setWinner(null);
        }
      }
    },
    [winner, keepItem, sellDirect, openCase]
  );

  const affordable = hydrated && canAfford(selected.price);
  const busy = phase === "spinning" || phase === "opening";

  return (
    <div className="min-h-full flex flex-col">
      <MenuBackdrop />
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 flex flex-col gap-6">
        <section id="cases" className="scroll-mt-20">
          <div className="flex items-end justify-between mb-3">
            <h1 className="panel-heading">Select a case</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{CASES.length} cases available</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 case-row">
            {CASES.map((c) => (
              <CaseCard
                key={c.id}
                caseData={c}
                selected={selected.id === c.id}
                disabled={busy}
                onSelect={() => {
                  if (phase === "idle") {
                    setSelected(c);
                    setWinner(null);
                  }
                }}
              />
            ))}
          </div>
        </section>

        <section id="open" className="panel overflow-hidden scroll-mt-20">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <h2 className="panel-heading">{selected.name}</h2>
            <span className="text-xs font-bold text-cs-gold tabular-nums">{formatMoney(selected.price)}</span>
          </div>

          {(phase === "spinning" || phase === "result") && winner ? (
            <div className="p-4">
              <Roulette caseData={selected} winner={winner} onDone={handleSettled} />
            </div>
          ) : (
            <div className="relative flex flex-col items-center gap-6 px-6 py-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{ background: `radial-gradient(ellipse 50% 60% at 50% 45%, ${selected.accent}30, transparent 70%)` }}
              />
              <div className="relative">
                <CaseImage caseData={selected} eager className="w-56 sm:w-64 h-auto drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]" />
              </div>
              <div className="relative text-center">
                <div className="font-display text-2xl font-medium uppercase tracking-[0.1em] text-white">{selected.name}</div>
                <div className="text-xs text-zinc-400 mt-0.5">Case · {selected.skins.length} possible items</div>
              </div>
              <button
                onClick={openCase}
                disabled={phase !== "idle" || !affordable}
                className="btn-primary relative px-10 py-3.5 text-sm"
              >
                Open case · {formatMoney(selected.price)}
              </button>
              {!affordable && phase === "idle" && hydrated && (
                <p className="relative text-xs text-red-400 -mt-3">Not enough balance. Click &quot;Deposit&quot; above to add funds.</p>
              )}
            </div>
          )}
        </section>

        <CaseContents caseData={selected} />
      </main>

      {phase === "opening" && <CaseIntro onDone={handleIntroDone} />}

      {phase === "result" && winner && (
        <WinModal
          item={winner}
          caseData={selected}
          canOpenAgain={canAfford(selected.price)}
          onKeep={() => closeModal("keep")}
          onSell={() => closeModal("sell")}
          onOpenAgain={() => closeModal("again")}
        />
      )}
    </div>
  );
}
