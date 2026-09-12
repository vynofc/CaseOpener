"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGame } from "@/lib/game-context";
import { formatMoney } from "@/lib/types";
import { playClick, playSell } from "@/lib/audio";

const PRESETS = [5, 10, 25, 50, 100];
const MAX_AMOUNT = 10000;
const NAME_KEY = "cs2-cardholder-name";

type Phase = "form" | "processing" | "success";

function formatCardNumber(digits: string) {
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(digits: string) {
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2, 4);
}

export default function DepositModal({ onClose }: { onClose: () => void }) {
  const { addFunds } = useGame();
  const [phase, setPhase] = useState<Phase>("form");
  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState("");
  const [cardNumber, setCardNumber] = useState("4023861794558174");
  const [holder, setHolder] = useState(() => {
    try {
      return localStorage.getItem(NAME_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [expiry, setExpiry] = useState("1230");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const stash = timers.current;
    return () => stash.forEach((t) => clearTimeout(t));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "form") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  const effectiveAmount = custom !== "" ? Number(custom) : amount;

  const validate = (): string | null => {
    if (!Number.isFinite(effectiveAmount) || effectiveAmount < 1) return "Enter an amount of at least $1.00.";
    if (effectiveAmount > MAX_AMOUNT) return `Maximum deposit is ${formatMoney(MAX_AMOUNT)}.`;
    if (cardNumber.length !== 16) return "Card number must be 16 digits.";
    if (holder.trim().length === 0) return "Enter the cardholder name.";
    if (expiry.length !== 4) return "Enter the expiry date (MM/YY).";
    const month = Number(expiry.slice(0, 2));
    if (month < 1 || month > 12) return "Expiry month must be 01-12.";
    if (cvc.length !== 3) return "CVC must be 3 digits.";
    return null;
  };

  const pay = () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    playClick();
    try {
      localStorage.setItem(NAME_KEY, holder.trim().toUpperCase());
    } catch {
      // storage unavailable
    }
    setPhase("processing");
    timers.current.push(
      window.setTimeout(() => {
        setPhase("success");
        addFunds(Math.round(effectiveAmount * 100) / 100);
        playSell();
        timers.current.push(window.setTimeout(onClose, 1100));
      }, 1800)
    );
  };

  const inputCls =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#1a1f71] focus:ring-2 focus:ring-[#1a1f71]/20 transition tabular-nums";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm"
      onClick={() => phase === "form" && onClose()}
    >
      <div className="min-h-full flex items-center justify-center p-4">
        <div
          className="win-pop relative w-full max-w-md rounded-xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-black italic tracking-tight text-[#1a1f71]">VISA</span>
              <span className="text-sm font-medium text-gray-500">Secure Checkout</span>
            </div>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <button
                onClick={onClose}
                disabled={phase !== "form"}
                className="text-gray-400 hover:text-gray-700 transition disabled:opacity-30 cursor-pointer"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>

          {phase === "form" && (
            <div className="px-6 py-5">
              <div className="mb-5">
                <div className={labelCls}>Deposit amount</div>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setAmount(p);
                        setCustom("");
                        playClick();
                      }}
                      className={`rounded-md border px-1 py-2 text-xs font-bold tabular-nums transition cursor-pointer ${
                        custom === "" && amount === p
                          ? "border-[#1a1f71] bg-[#1a1f71] text-white"
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-500"
                      }`}
                    >
                      ${p}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  <input
                    value={custom}
                    onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ""))}
                    inputMode="decimal"
                    placeholder="Custom amount"
                    className={inputCls + " pl-7"}
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className={labelCls}>Card number</label>
                  <div className="relative">
                    <input
                      value={formatCardNumber(cardNumber)}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      inputMode="numeric"
                      placeholder="4023 8617 9455 8174"
                      className={inputCls + " font-mono tracking-wider pr-16"}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black italic text-[#1a1f71]">
                      VISA
                    </span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Cardholder name</label>
                  <input
                    value={holder}
                    onChange={(e) => setHolder(e.target.value.toUpperCase().slice(0, 26))}
                    placeholder="NAME ON CARD"
                    className={inputCls + " uppercase"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Expiry date</label>
                    <input
                      value={formatExpiry(expiry)}
                      onChange={(e) => setExpiry(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      inputMode="numeric"
                      placeholder="MM/YY"
                      className={inputCls + " font-mono"}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Security code (CVC)</label>
                    <input
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      inputMode="numeric"
                      placeholder="123"
                      type="password"
                      className={inputCls + " font-mono"}
                    />
                  </div>
                </div>
              </div>

              {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}

              <button
                onClick={pay}
                className="mt-5 w-full rounded-md bg-[#1a1f71] hover:bg-[#141a5e] active:scale-[0.98] transition px-3 py-3 text-sm font-bold text-white cursor-pointer tabular-nums"
              >
                Pay {formatMoney(Number.isFinite(effectiveAmount) ? effectiveAmount : 0)}
              </button>
            </div>
          )}

          {phase === "processing" && (
            <div className="flex flex-col items-center px-6 py-14 gap-4">
              <div className="w-10 h-10 rounded-full border-[3px] border-gray-200 border-t-[#1a1f71] animate-spin" />
              <div className="text-sm font-medium text-gray-700">Contacting your bank...</div>
              <div className="text-xs text-gray-400">Do not close this window</div>
            </div>
          )}

          {phase === "success" && (
            <div className="flex flex-col items-center px-6 py-14 gap-3">
              <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-sm font-bold text-gray-900">Payment approved</div>
              <div className="text-lg font-bold text-[#1a1f71] tabular-nums">+{formatMoney(effectiveAmount)}</div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 border-t border-gray-200 px-6 py-3">
            <svg viewBox="0 0 24 24" className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <span className="text-[11px] text-gray-400">256-bit SSL encrypted · Payments are processed securely</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
