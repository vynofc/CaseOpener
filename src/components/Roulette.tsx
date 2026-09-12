"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CaseData, InventoryItem, rarityById } from "@/lib/types";
import { buildStrip } from "@/lib/game";
import { playTick } from "@/lib/audio";
import SkinCard from "./SkinCard";

const CARD_FULL = 152; // 144 card + 8 gap
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
    let doneTimer: ReturnType<typeof setTimeout>;
    const start = performance.now();

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
        track.style.transform = `translateX(${-targetX}px)`;
        setSettled(true);
        doneTimer = setTimeout(() => onDoneRef.current(winner), 1200);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(doneTimer);
    };
  }, [strip, winner]);

  const winnerRarity = rarityById(winner.skin.rarity);

  return (
    <div className="relative w-full overflow-hidden rounded-sm border border-white/10 bg-cs-950/80 py-4">
      <div
        className={`absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 z-10 transition-all ${
          settled ? "pointer-won" : "bg-cs-gold/90"
        }`}
        style={settled ? { background: winnerRarity.color, boxShadow: `0 0 18px 3px ${winnerRarity.color}` } : undefined}
      />
      <div className="absolute left-1/2 -top-0.5 -translate-x-1/2 z-10 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-cs-gold" />
      <div className="absolute left-1/2 -bottom-0.5 -translate-x-1/2 z-10 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-cs-gold" />

      <div ref={containerRef} className="w-full overflow-hidden">
        <div ref={trackRef} className="flex gap-2 px-2 will-change-transform" style={{ width: STRIP_LENGTH * CARD_FULL }}>
          {strip.map((item, i) => (
            <SkinCard key={item.uid + i} item={item} highlight={settled && i === WIN_INDEX} />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-cs-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-cs-950 to-transparent" />
    </div>
  );
}
