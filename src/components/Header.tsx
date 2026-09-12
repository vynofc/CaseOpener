"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/game-context";
import { formatMoney } from "@/lib/types";
import { playClick } from "@/lib/audio";

const NAV = [
  { href: "#cases", label: "Kisten" },
  { href: "#open", label: "Öffnen" },
  { href: "#inventory", label: "Inventar" },
  { href: "#stats", label: "Statistik" },
];

export default function Header() {
  const { balance, addFunds, soundOn, toggleSound, hydrated } = useGame();
  const [online, setOnline] = useState(0);

  useEffect(() => {
    const init = setTimeout(() => setOnline(1800 + Math.floor(Math.random() * 900)), 0);
    const timer = setInterval(() => {
      setOnline((v) => Math.max(1200, v + Math.floor(Math.random() * 41) - 20));
    }, 5000);
    return () => {
      clearTimeout(init);
      clearInterval(timer);
    };
  }, []);

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md"
      style={{
        background:
          "linear-gradient(rgba(20,22,26,0.72), rgba(20,22,26,0.72)), radial-gradient(21.52% 105.47% at 53.02% 105.47%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%), #2d3540",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-6">
        <a href="#cases" className="flex items-center gap-2.5 shrink-0" onClick={() => playClick()}>
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-cs-green" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="7" />
            <path d="M12 1v6M12 17v6M1 12h6M17 12h6" />
          </svg>
          <span className="font-display font-medium text-white tracking-[0.1em] uppercase text-lg leading-none">
            CS2 <span className="text-cs-green">Case Opener</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-1 ml-2">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => playClick()}
              className="px-3 py-2 font-display text-sm uppercase tracking-[0.12em] text-white/60 hover:text-white transition border-b-2 border-transparent hover:border-cs-green/70"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-2 rounded-sm bg-black/35 px-2.5 py-1.5">
            <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-cs-green" />
            <span className="text-xs font-semibold text-white/70 tabular-nums">
              {online > 0 ? online.toLocaleString("de-DE") : "…"} online
            </span>
          </div>
          <button
            onClick={toggleSound}
            className="rounded-sm border border-white/15 hover:border-white/35 hover:bg-white/5 p-2 text-zinc-300 transition cursor-pointer"
            title={soundOn ? "Sound aus" : "Sound an"}
          >
            {soundOn ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
                <path d="M3 9v6h4l5 5V4L7 9H3z" />
                <path d="M16 8a5 5 0 0 1 0 8" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
                <path d="M3 9v6h4l5 5V4L7 9H3z" />
                <path d="M16 9l6 6M22 9l-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>
          <div className="rounded-sm border border-cs-gold/30 bg-black/40 px-3 py-1.5 min-w-28 text-right">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block leading-none mb-0.5">Guthaben</span>
            <span className="text-sm font-bold text-cs-gold tabular-nums leading-none">
              {hydrated ? formatMoney(balance) : "..."}
            </span>
          </div>
          <button
            onClick={() => {
              addFunds(100);
              playClick();
            }}
            className="btn-primary px-4 py-2 text-[11px]"
          >
            + $100
          </button>
        </div>
      </div>
    </header>
  );
}
