"use client";

import { useMemo, useState } from "react";
import { CASES } from "@/lib/cases";
import { buildSkinIndex } from "@/lib/skin-index";
import { RARITIES, RarityId, formatMoney, rarityById } from "@/lib/types";
import SkinImage from "./SkinImage";

const INDEX = buildSkinIndex(CASES);

export default function SkinIndex() {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<RarityId | "all">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INDEX.filter(
      (entry) =>
        (rarity === "all" || entry.skin.rarity === rarity) &&
        (!q ||
          `${entry.skin.weapon} | ${entry.skin.name}`.toLowerCase().includes(q) ||
          entry.id.toLowerCase().includes(q) ||
          entry.occurrences.some((o) => o.id.toLowerCase().includes(q)))
    );
  }, [query, rarity]);

  const copyId = (id: string) => {
    try {
      navigator.clipboard?.writeText(id).catch(() => {});
    } catch {
      // clipboard unavailable
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1200);
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <h1 className="font-display text-2xl uppercase tracking-[0.12em] text-white">
          Skin <span className="text-cs-green">Index</span>
        </h1>
        <span className="text-sm text-white/50">
          {filtered.length} of {INDEX.length} skins
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skin or command id..."
          spellCheck={false}
          className="md:ml-auto w-full md:w-72 rounded-sm border border-white/15 bg-[#12161f] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-cs-green/60"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setRarity("all")}
          className={`rounded-sm border px-2.5 py-1 font-display text-xs uppercase tracking-[0.1em] transition cursor-pointer ${
            rarity === "all" ? "border-white/60 text-white" : "border-white/15 text-white/50 hover:text-white"
          }`}
        >
          All
        </button>
        {RARITIES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRarity(r.id)}
            className={`rounded-sm border px-2.5 py-1 font-display text-xs uppercase tracking-[0.1em] transition cursor-pointer ${
              rarity === r.id ? "text-white" : "text-white/50 hover:text-white"
            }`}
            style={{ borderColor: rarity === r.id ? r.color : r.color + "44" }}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((entry) => {
          const r = rarityById(entry.skin.rarity);
          return (
            <div
              key={entry.key}
              className="flex flex-col gap-3 rounded-sm border border-white/10 bg-[#12161f] p-3 md:flex-row md:items-center"
              style={{ borderLeft: `3px solid ${r.color}` }}
            >
              <div className="flex items-center gap-3 min-w-0 md:w-72 shrink-0">
                <SkinImage skin={entry.skin} className="h-12 w-16 shrink-0 object-contain" />
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-white/45">{entry.skin.weapon}</div>
                  <div className="truncate text-sm font-medium text-white">{entry.skin.name}</div>
                  <div className="text-xs font-semibold" style={{ color: r.color }}>
                    {r.name} · {formatMoney(entry.basePrice)}
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {entry.occurrences.map((o) => (
                  <span
                    key={o.caseId}
                    title={`give ${o.id}`}
                    className="rounded-sm border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] text-white/60"
                  >
                    {o.caseName}
                  </span>
                ))}
              </div>

              <button
                onClick={() => copyId(entry.id)}
                title="Copy command id"
                className="md:w-64 shrink-0 truncate rounded-sm border border-white/10 bg-[#0d1119] px-2 py-1.5 text-left font-mono text-[11px] text-[#b5e853] hover:border-white/30 transition cursor-pointer"
              >
                {copiedId === entry.id ? "copied!" : entry.id}
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-white/40">No skins match your search.</p>}
      </div>
    </section>
  );
}
