"use client";

import { useEffect, useRef, useState } from "react";
import { playTick } from "@/lib/audio";

const SIZE = 280;
const R = 112;
const C = 2 * Math.PI * R;
const GOLD = "#fbd506";

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

export default function UpgradeWheel({
  chance,
  win,
  spinning,
  onDone,
}: {
  chance: number;
  win: boolean;
  spinning: boolean;
  onDone?: () => void;
}) {
  const pointerRef = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const winDeg = Math.max(4, chance * 360);
  const winArc = (winDeg / 360) * C;

  useEffect(() => {
    if (!spinning) return;
    const el = pointerRef.current;
    if (!el) return;
    const margin = Math.min(10, Math.max(2, winDeg * 0.2));
    const landAngle = win
      ? margin + Math.random() * Math.max(1, winDeg - margin * 2)
      : winDeg + margin + Math.random() * Math.max(1, 360 - winDeg - margin * 2);
    const total = 360 * (4 + Math.floor(Math.random() * 3)) + landAngle;
    const duration = 4200 + Math.random() * 600;
    let raf = 0;
    let lastTick = 0;
    let doneTimer: ReturnType<typeof setTimeout>;
    const start = performance.now();

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const rot = total * easeOutQuint(t);
      el.style.transform = `rotate(${rot}deg)`;
      if (rot - lastTick >= 15 && t < 1) {
        lastTick = rot;
        playTick();
      }
      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        el.style.transform = `rotate(${total}deg)`;
        setSettled(true);
        doneTimer = setTimeout(() => onDoneRef.current?.(), 1400);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(doneTimer);
    };
  }, [spinning, win, winDeg]);

  const resultColor = win ? "#44c987" : "#eb4b4b";
  const pointerColor = settled ? resultColor : GOLD;

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <div className="absolute inset-0 rounded-full border-[3px] border-[#101012]" />

      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "repeating-conic-gradient(rgba(255,255,255,0.16) 0deg 1deg, transparent 1deg 9deg)",
          WebkitMask: "radial-gradient(farthest-side, transparent 128px, #000 129px)",
          mask: "radial-gradient(farthest-side, transparent 128px, #000 129px)",
        }}
      />

      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "repeating-conic-gradient(#282828 0deg 1.5deg, transparent 1.5deg 20deg)",
          WebkitMask: "radial-gradient(farthest-side, transparent 98px, #000 99px, #000 126px, transparent 127px)",
          mask: "radial-gradient(farthest-side, transparent 98px, #000 99px, #000 126px, transparent 127px)",
        }}
      />

      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#24252b" strokeWidth="10" />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={GOLD}
          strokeWidth="10"
          strokeDasharray={`${winArc} ${C - winArc}`}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={
            settled && win
              ? { filter: "drop-shadow(0 0 10px rgba(251, 213, 6, 0.9))" }
              : { filter: "drop-shadow(0 0 4px rgba(251, 213, 6, 0.35))" }
          }
        />
      </svg>

      <div
        className="absolute rounded-full"
        style={{
          inset: 44,
          background: "radial-gradient(circle at 50% 32%, #3c3c3f 0%, #232427 45%, #19191b 100%)",
          boxShadow: "0 0 35px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      />

      <svg
        viewBox="0 0 64 44"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 opacity-70"
        fill="none"
        stroke="#2c2c2f"
        strokeWidth="7"
        strokeLinecap="square"
        aria-hidden
      >
        <path d="M8 20 32 4l24 16" />
        <path d="M8 40 32 24l24 16" />
      </svg>

      <div ref={pointerRef} className="absolute inset-0 will-change-transform" style={{ transformOrigin: "center" }}>
        <div
          className="absolute left-1/2 top-[2px] -translate-x-1/2 w-0 h-0 border-x-10 border-x-transparent border-t-16"
          style={{
            borderTopColor: pointerColor,
            filter: `drop-shadow(0 0 6px ${pointerColor})`,
          }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {settled ? (
          <span
            className="font-display text-2xl font-bold uppercase tracking-[0.14em]"
            style={{ color: resultColor, textShadow: `0 0 18px ${resultColor}` }}
          >
            {win ? "Won" : "Lost"}
          </span>
        ) : (
          <>
            <span
              className="font-display text-5xl leading-none font-bold tabular-nums"
              style={{ color: GOLD, textShadow: "0 0 24px rgba(251, 213, 6, 0.35)" }}
            >
              {Math.round(chance * 100)}
              <span className="text-2xl">%</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 mt-1.5">Win chance</span>
          </>
        )}
      </div>
    </div>
  );
}
