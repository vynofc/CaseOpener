"use client";

import { useCallback, useState } from "react";
import { CASES } from "@/lib/cases";
import { CaseData, InventoryItem, formatMoney } from "@/lib/types";
import { rollDrop } from "@/lib/game";
import { useGame } from "@/lib/game-context";
import { playOpen, playClick } from "@/lib/audio";
import Header from "@/components/Header";
import CaseCard from "@/components/CaseCard";
import CaseContents from "@/components/CaseContents";
import Roulette from "@/components/Roulette";
import WinModal from "@/components/WinModal";
import CaseIntro from "@/components/CaseIntro";
import Inventory from "@/components/Inventory";
import StatsPanel from "@/components/StatsPanel";

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

  return (
    <div className="min-h-full flex flex-col bg-[#0b0e14]">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 flex flex-col gap-6">
        <section>
          <h1 className="text-2xl font-black text-white mb-3">Wähle deine Kiste</h1>
          <div className="flex gap-3 overflow-x-auto pb-2 case-row">
            {CASES.map((c) => (
              <CaseCard
                key={c.id}
                caseData={c}
                selected={selected.id === c.id}
                disabled={phase === "spinning" || phase === "opening"}
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

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-white">{selected.name}</h2>
            <button
              onClick={openCase}
              disabled={phase !== "idle" || !affordable}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:cursor-not-allowed active:scale-95 transition px-8 py-3 text-lg font-black text-zinc-900 disabled:text-zinc-400 shadow-[0_0_30px_-8px] shadow-amber-500/60 cursor-pointer"
            >
              {phase === "spinning" ? "Öffnet..." : phase === "opening" ? "Kiste wird geöffnet..." : `Öffnen für ${formatMoney(selected.price)}`}
            </button>
          </div>
          {!affordable && phase === "idle" && hydrated && (
            <p className="text-sm text-red-400 -mt-2">Nicht genug Guthaben. Klicke oben auf „+ $100“.</p>
          )}

          {(phase === "spinning" || phase === "result") && winner ? (
            <Roulette caseData={selected} winner={winner} onDone={handleSettled} />
          ) : (
            <div className="relative w-full overflow-hidden rounded-xl border border-zinc-800 bg-[#0d1119] py-4 opacity-60">
              <div className="flex gap-2 px-2 justify-center text-sm text-zinc-500 py-10">
                Drücke „Öffnen“, um die Kiste zu drehen
              </div>
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-amber-400/40" />
            </div>
          )}
        </section>

        <CaseContents caseData={selected} />
        <Inventory />
        <StatsPanel />
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
