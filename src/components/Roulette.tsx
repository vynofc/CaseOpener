"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CaseData, InventoryItem, rarityById } from "@/lib/types";
import { buildStrip } from "@/lib/game";
import { playTick } from "@/lib/audio";
import SkinCard from "./SkinCard";

const CARD_FULL = 172; // 160 tile + 12 gap
const WIN_INDEX = 60;
const STRIP_LENGTH = 80;

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

export default function Roulette({
  caseData,
  winner,
  onDone,
}: {
  caseData: CaseData;
  winner: InventoryItem;
  onDone: (item: InventoryItem) => void;
}) {
  const strip = useMemo(() => buildStrip(caseData, winner, STRIP_LENGTH, WIN_INDEX), [caseData, winner]);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const containerW = container.clientWidth;
    const jitter = (Math.random() - 0.5) * CARD_FULL * 0.6;
    const targetX = WIN_INDEX * CARD_FULL + CARD_FULL / 2 - containerW / 2 + jitter;
    const duration = 6200 + Math.random() * 800;
    let raf = 0;
    let lastIndex = -1;
    let finished = false;
    let doneTimer: ReturnType<typeof setTimeout>;
    const start = performance.now();

    const settle = (delay: number) => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      track.style.transform = `translateX(${-targetX}px)`;
      setSettled(true);
      doneTimer = setTimeout(() => onDoneRef.current(winner), delay);
    };

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutQuint(t);
      const x = targetX * eased;
      track.style.transform = `translateX(${-x}px)`;
      const idx = Math.floor(x / CARD_FULL);
      if (idx !== lastIndex && t < 1) {
        lastIndex = idx;
        playTick();
      }
      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        settle(1200);
      }
    };
    raf = requestAnimationFrame(frame);

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "Escape") {
        e.preventDefault();
        settle(400);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(doneTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, [strip, winner]);

  const winnerRarity = rarityById(winner.skin.rarity);

  return (
    <div className="relative w-full overflow-hidden border-y border-white/10 bg-[#0b0d12]/85 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
      <div
        className={`absolute left-1/2 top-0 bottom-0 z-20 w-[2px] -translate-x-1/2 transition-all duration-300 ${
          settled ? "" : "bg-cs-gold"
        }`}
        style={
          settled
            ? { background: winnerRarity.color, boxShadow: `0 0 24px 5px ${winnerRarity.color}` }
            : { boxShadow: "0 0 16px 2px rgba(228,174,57,0.55)" }
        }
      />
      <div className="absolute left-1/2 top-0 z-20 h-0 w-0 -translate-x-1/2 border-x-[9px] border-x-transparent border-t-[12px] border-t-cs-gold drop-shadow-[0_0_6px_rgba(228,174,57,0.8)]" />
      <div className="absolute left-1/2 bottom-0 z-20 h-0 w-0 -translate-x-1/2 border-x-[9px] border-x-transparent border-b-[12px] border-b-cs-gold drop-shadow-[0_0_6px_rgba(228,174,57,0.8)]" />

      <div ref={containerRef} className="w-full overflow-hidden">
        <div ref={trackRef} className="flex gap-3 px-2 will-change-transform" style={{ width: STRIP_LENGTH * CARD_FULL }}>
          {strip.map((item, i) => (
            <SkinCard
              key={item.uid + i}
              item={item}
              highlight={settled && i === WIN_INDEX}
              dimmed={settled && i !== WIN_INDEX}
            />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[18%] bg-gradient-to-r from-[#0b0d12] via-[#0b0d12]/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[18%] bg-gradient-to-l from-[#0b0d12] via-[#0b0d12]/70 to-transparent" />
    </div>
  );
}
