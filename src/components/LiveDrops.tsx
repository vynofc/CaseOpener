"use client";

import { useEffect, useRef, useState } from "react";
import { CASES } from "@/lib/cases";
import { InventoryItem, formatMoney, rarityById } from "@/lib/types";
import { rollDrop } from "@/lib/game";
import SkinImage from "./SkinImage";

const FAKE_USERS = [
  "NovaKing", "DerTyp", "Lena_", "K1llerbee", "ClutchOtto", "Mira.exe", "Joghurt",
  "SniperSven", "ToxicTobi", "AimbotAnna", "RushB_Rudi", "FlashbangFritz",
  "EcoRoundEmil", "HeadshotHanna", "SmurfSigi", "WallbangWilli", "OneTapOlli",
  "DefuseDora", "BaiterBen", "AWP_Andi", "GammaGustav", "PixelPaula",
];

const AVATAR_COLORS = ["#5f98d9", "#d32ce6", "#eb4b4b", "#e4ae39", "#44c987", "#8847ff"];

interface LiveDrop {
  id: string;
  user: string;
  color: string;
  item: InventoryItem;
}

function makeDrop(id: string): LiveDrop {
  const caseData = CASES[Math.floor(Math.random() * CASES.length)];
  const user = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
  return {
    id,
    user,
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    item: rollDrop(caseData, `live-${id}`),
  };
}

export default function LiveDrops() {
  const [drops, setDrops] = useState<LiveDrop[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const seed = setTimeout(() => {
      setDrops(Array.from({ length: 14 }, () => makeDrop(String(counter.current++))));
    }, 0);
    const timer = setInterval(() => {
      setDrops((prev) => [makeDrop(String(counter.current++)), ...prev].slice(0, 30));
    }, 3500);
    return () => {
      clearTimeout(seed);
      clearInterval(timer);
    };
  }, []);

  if (drops.length === 0) {
    return <div className="h-24" aria-hidden />;
  }

  return (
    <section aria-label="Live-Drops" className="panel px-4 py-3 overflow-hidden">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="live-dot inline-block w-2 h-2 rounded-full bg-cs-green shrink-0" />
        <span className="panel-heading text-[0.8rem]!">Live-Drops</span>
      </div>
      <div className="flex gap-2 overflow-x-auto case-row pb-1">
        {drops.map((d, i) => {
          const rarity = rarityById(d.item.skin.rarity);
          return (
            <div
              key={d.id}
              className={`relative shrink-0 w-36 rounded-sm border border-white/10 bg-cs-950/80 overflow-hidden ${i === 0 ? "drop-new" : ""}`}
            >
              <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: rarity.color }} />
              <div className="flex items-center gap-1.5 px-2 pt-1.5">
                <span
                  className="inline-flex w-4 h-4 rounded-full items-center justify-center text-[9px] font-bold text-black/70 shrink-0"
                  style={{ background: d.color }}
                >
                  {d.user.charAt(0)}
                </span>
                <span className="text-[10px] text-zinc-400 truncate">{d.user}</span>
              </div>
              <SkinImage skin={d.item.skin} className="w-full h-12 object-contain px-2" />
              <div className="px-2 pb-2 leading-tight">
                <div className="text-[10px] font-semibold text-zinc-100 truncate">
                  {d.item.skin.weapon} | {d.item.skin.name}
                </div>
                <div className="text-[10px] font-bold tabular-nums" style={{ color: rarity.color }}>
                  {formatMoney(d.item.price)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
