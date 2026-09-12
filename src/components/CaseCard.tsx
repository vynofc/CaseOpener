"use client";

import { CaseData, formatMoney } from "@/lib/types";
import { playClick } from "@/lib/audio";

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
      className={`relative shrink-0 w-44 rounded-xl border p-3 text-left transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        selected ? "border-amber-400 bg-amber-400/5 shadow-[0_0_24px_-6px_var(--tw-shadow-color)] shadow-amber-400/40" : "border-zinc-800 bg-[#12161f] hover:border-zinc-600"
      }`}
    >
      <div
        className="relative h-24 rounded-lg flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${caseData.gradient[0]}, ${caseData.gradient[1]})` }}
      >
        <svg viewBox="0 0 64 48" className="w-20 h-auto drop-shadow-lg">
          <rect x="8" y="12" width="48" height="28" rx="4" fill={caseData.accent} opacity="0.9" />
          <rect x="8" y="12" width="48" height="10" rx="4" fill="rgba(255,255,255,0.18)" />
          <rect x="26" y="6" width="12" height="10" rx="2" fill={caseData.accent} />
          <rect x="8" y="24" width="48" height="3" fill="rgba(0,0,0,0.25)" />
        </svg>
        <div className="absolute inset-0 case-sheen" />
      </div>
      <div className="mt-2 text-sm font-bold text-white leading-tight">{caseData.name}</div>
      <div className="text-xs font-semibold text-amber-300">{formatMoney(caseData.price)}</div>
    </button>
  );
}
