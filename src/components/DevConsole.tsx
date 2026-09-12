"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/game-context";
import { AdminHandlers, runAdminCommand } from "@/lib/admin";

type LineKind = "echo" | "out" | "err";

interface LogLine {
  id: number;
  kind: LineKind;
  text: string;
}

const SHORTCUTS = [
  { keys: "Ctrl+Q", desc: "Toggle this console" },
  { keys: "R", desc: "Open selected case / open again" },
  { keys: "V", desc: "Sell the drop (win screen)" },
  { keys: "B", desc: "Keep the drop (win screen)" },
  { keys: "Space / Esc", desc: "Skip the intro video" },
  { keys: "Esc", desc: "Close dialogs" },
];

interface CommandDef {
  name: string;
  desc: string;
  usage?: string;
  lines: () => string[];
}

const COMMANDS: CommandDef[] = [
  {
    name: "help",
    desc: "List available commands",
    lines: () => COMMANDS.map((c) => `${(c.usage ?? c.name).padEnd(22)} ${c.desc}`),
  },
  {
    name: "shortcuts",
    desc: "List keyboard shortcuts",
    lines: () => SHORTCUTS.map((s) => `${s.keys.padEnd(12)} ${s.desc}`),
  },
  { name: "clear", desc: "Clear the console output", lines: () => [] },
  { name: "login", usage: "login <password>", desc: "Unlock admin commands (once per session)", lines: () => [] },
  { name: "logout", desc: "Lock admin commands again", lines: () => [] },
  { name: "luck", usage: "luck <x>", desc: "Multiply the gold (rare) drop chance, e.g. luck 10; luck 1 resets", lines: () => [] },
  { name: "money", usage: "money <amount>", desc: "Add funds to your balance, e.g. money 1000", lines: () => [] },
  { name: "give", usage: "give <skin name>", desc: "Add a skin to your inventory, e.g. give redline", lines: () => [] },
  { name: "status", desc: "Show admin state (unlock, luck, balance)", lines: () => [] },
];

const BUILTINS = new Set(["help", "shortcuts", "clear"]);

const WELCOME: LogLine[] = [
  { id: 0, kind: "out", text: "CS2 Case Opener developer console" },
  { id: 1, kind: "out", text: 'Type "help" for a list of commands.' },
  { id: 2, kind: "out", text: "Press Ctrl+Q or Esc to close." },
];

export default function DevConsole() {
  const { addFunds, addItem, balance } = useGame();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [lines, setLines] = useState<LogLine[]>(WELCOME);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [sugIndex, setSugIndex] = useState(0);
  const idRef = useRef(WELCOME.length);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const balanceRef = useRef(balance);
  const handlersRef = useRef<AdminHandlers>({ addFunds, addItem });
  useEffect(() => {
    balanceRef.current = balance;
    handlersRef.current = { addFunds, addItem, getBalance: () => balanceRef.current };
  });

  const query = value.trim().toLowerCase();
  const suggestions = query && !query.includes(" ")
    ? COMMANDS.filter((c) => c.name.startsWith(query) && c.name !== query)
    : [];
  const activeSug = Math.min(sugIndex, Math.max(0, suggestions.length - 1));

  const setConsoleOpen = useCallback((next: boolean) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (next) {
      setOpen(true);
      setClosing(false);
    } else {
      setClosing(true);
      closeTimer.current = setTimeout(() => {
        setOpen(false);
        setClosing(false);
        closeTimer.current = null;
      }, 160);
    }
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle = (e.ctrlKey || e.metaKey) && (e.code === "KeyQ" || e.key.toLowerCase() === "q");
      if (isToggle) {
        e.preventDefault();
        if (e.repeat) return;
        setConsoleOpen(!(open && !closing));
      } else if (e.key === "Escape" && open && !closing) {
        setConsoleOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closing, setConsoleOpen]);

  useEffect(() => {
    if (!open || closing) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open, closing]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, open]);

  const runCommand = useCallback((raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const name = cmd.toLowerCase().split(/\s+/)[0];
    if (name === "clear") {
      setLines([]);
      return;
    }
    const echo: LogLine = { id: idRef.current++, kind: "echo", text: `>    ${cmd}` };
    let out: LogLine[];
    if (BUILTINS.has(name)) {
      const def = COMMANDS.find((c) => c.name === name)!;
      out = def.lines().map((text) => ({ id: idRef.current++, kind: "out" as const, text }));
    } else {
      const arg = cmd.slice(name.length).trim();
      const result = runAdminCommand(name, arg, handlersRef.current);
      out = result
        ? result.map((r) => ({ id: idRef.current++, kind: (r.error ? "err" : "out") as LineKind, text: r.text }))
        : [{ id: idRef.current++, kind: "err" as const, text: `Unknown command "${name}" - type "help"` }];
    }
    setLines((ls) => [...ls, echo, ...out]);
  }, []);

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isToggle = (e.ctrlKey || e.metaKey) && (e.code === "KeyQ" || e.key.toLowerCase() === "q");
    if (isToggle) return;
    e.stopPropagation();
    if (e.key === "Enter") {
      const cmd = value.trim();
      runCommand(value);
      if (cmd) setHistory((h) => (h[h.length - 1] === cmd ? h : [...h, cmd]));
      setHistoryIndex(null);
      setSugIndex(0);
      setValue("");
    } else if (e.key === "Tab") {
      if (suggestions.length > 0) {
        e.preventDefault();
        setValue(suggestions[activeSug].name);
        setSugIndex(0);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSugIndex((activeSug - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (history.length === 0) return;
      const next = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setValue(history[next]);
      setSugIndex(0);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSugIndex((activeSug + 1) % suggestions.length);
        return;
      }
      if (historyIndex === null) return;
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(null);
        setValue("");
      } else {
        setHistoryIndex(next);
        setValue(history[next]);
      }
      setSugIndex(0);
    } else if (e.key === "Escape") {
      setConsoleOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100]" role="dialog" aria-label="Developer console">
      <div
        onClick={() => inputRef.current?.focus()}
        className={`${closing ? "console-lift" : "console-drop"} border-b-2 border-[#3d3b30] bg-[#0d0d0b]/95 shadow-[0_24px_70px_rgba(0,0,0,0.7)] backdrop-blur-sm`}
      >
        <div className="px-4 pt-2 font-mono text-[13px] leading-[1.45]">
          <div ref={logRef} className="h-[48vh] overflow-y-auto py-1">
            {lines.map((line) => (
              <div
                key={line.id}
                className={
                  line.kind === "echo"
                    ? "text-[#b5e853]"
                    : line.kind === "err"
                      ? "text-[#e06c60]"
                      : "text-[#c9c7bd]"
                }
              >
                {line.text}
              </div>
            ))}
          </div>
          <div className="relative border-t border-white/10 py-2">
            {suggestions.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-full max-w-md border border-white/10 bg-[#111110] py-1 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
                {suggestions.map((s, i) => (
                  <button
                    key={s.name}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setValue(s.name);
                      setSugIndex(0);
                      inputRef.current?.focus();
                    }}
                    className={`flex w-full items-baseline gap-3 px-3 py-1 text-left ${
                      i === activeSug ? "bg-white/10" : ""
                    }`}
                  >
                    <span className="text-[#b5e853]">{s.name}</span>
                    <span className="text-[11px] text-[#7a786c]">{s.desc}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#b5e853]">&gt;</span>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setSugIndex(0);
                }}
                onKeyDown={onInputKey}
                className="flex-1 bg-transparent text-[#e8e6dd] outline-none placeholder:text-[#5a584e]"
                placeholder='type a command, e.g. "shortcuts"'
                spellCheck={false}
                autoComplete="off"
                aria-label="Console input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
