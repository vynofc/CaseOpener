"use client";

import { CaseData, formatMoney } from "@/lib/types";
import { playClick } from "@/lib/audio";
import CaseImage from "./CaseImage";

export default function CaseCard({
  caseData,
  selected,
  disabled,
  onSelect,
}: {
  caseData: CaseData;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={() => {
        onSelect();
        playClick();
      }}
      disabled={disabled}
      className={`group relative shrink-0 w-44 rounded-sm border text-left transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        selected
          ? "border-cs-green bg-cs-green-dark/40 shadow-[inset_0_0_22px_rgba(68,201,135,0.25)]"
          : "border-white/10 bg-cs-800/70 hover:border-white/30 hover:bg-cs-800"
      }`}
    >
      {selected && <div className="absolute inset-x-0 top-0 h-0.5 bg-cs-green" />}
      <div
        className="relative h-24 m-2 flex items-center justify-center overflow-hidden rounded-sm"
        style={{ background: `linear-gradient(135deg, ${caseData.gradient[0]}33, ${caseData.gradient[1]}22)` }}
      >
        <CaseImage caseData={caseData} className="w-24 h-auto drop-shadow-lg transition-transform duration-300 group-hover:scale-110" />
        <div className="absolute inset-0 case-sheen" />
      </div>
      <div className="px-3 pb-3">
        <div className="font-display text-sm font-medium text-white uppercase tracking-wider leading-tight truncate">{caseData.name}</div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs font-bold text-cs-gold tabular-nums">{formatMoney(caseData.price)}</span>
          {selected && <span className="text-[9px] uppercase tracking-[0.2em] text-cs-green">Aktiv</span>}
        </div>
      </div>
    </button>
  );
}
