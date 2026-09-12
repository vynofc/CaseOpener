"use client";

import { useEffect, useRef, useState } from "react";
import { playTick } from "@/lib/audio";

const SIZE = 260;
const R = 110;
const C = 2 * Math.PI * R;

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

export default function UpgradeWheel({
  chance,
  win,
  onDone,
}: {
  chance: number;
  win: boolean;
  onDone: () => void;
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
        doneTimer = setTimeout(() => onDoneRef.current(), 1400);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(doneTimer);
    };
  }, [win, winDeg]);

  const resultColor = win ? "#44c987" : "#eb4b4b";

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="#3a3a3d"
          strokeWidth="14"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="#44c987"
          strokeWidth="14"
          strokeDasharray={`${winArc} ${C - winArc}`}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={settled && win ? { filter: "drop-shadow(0 0 10px #44c987)" } : undefined}
        />
      </svg>

      <div ref={pointerRef} className="absolute inset-0 will-change-transform" style={{ transformOrigin: "center" }}>
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-0 h-0 border-x-9 border-x-transparent border-t-14"
          style={{ borderTopColor: settled ? resultColor : "#e4ae39" }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {settled ? (
          <span className="font-display text-xl font-bold uppercase tracking-[0.12em]" style={{ color: resultColor }}>
            {win ? "Gewonnen" : "Verloren"}
          </span>
        ) : (
          <>
            <span className="font-display text-4xl font-bold text-white tabular-nums">{(chance * 100).toFixed(1)}%</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Gewinnchance</span>
          </>
        )}
      </div>
    </div>
  );
}
