import { CASES } from "./cases";
import { buildItemFromSkin, getLuckMultiplier, setLuckMultiplier } from "./game";
import { InventoryItem, Skin, formatMoney } from "./types";

const ADMIN_PASSWORD = "spiderman007";
const SESSION_KEY = "cs2-admin-unlocked";

let unlocked = false;

function readSessionUnlock(): boolean {
  try {
    return typeof window !== "undefined" && window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSessionUnlock(value: boolean): void {
  try {
    if (typeof window === "undefined") return;
    if (value) window.sessionStorage.setItem(SESSION_KEY, "1");
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // storage unavailable, fall back to in-memory flag only
  }
}

export function isAdminUnlocked(): boolean {
  return unlocked || readSessionUnlock();
}

export function unlockAdmin(password: string): boolean {
  if (password !== ADMIN_PASSWORD) return false;
  unlocked = true;
  writeSessionUnlock(true);
  return true;
}

export function lockAdmin(): void {
  unlocked = false;
  writeSessionUnlock(false);
}

function fullName(skin: Skin): string {
  return `${skin.weapon} | ${skin.name}`;
}

export function findSkin(query: string): Skin | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const all = CASES.flatMap((c) => c.skins);
  const unique = [...new Map(all.map((s) => [s.id, s])).values()];
  return (
    unique.find((s) => s.id.toLowerCase() === q) ??
    unique.find((s) => fullName(s).toLowerCase() === q) ??
    unique.find((s) => s.name.toLowerCase() === q) ??
    unique.find((s) => fullName(s).toLowerCase().includes(q)) ??
    null
  );
}

export interface AdminHandlers {
  addFunds: (amount: number) => void;
  addItem: (item: InventoryItem) => void;
  getBalance?: () => number;
}

export interface AdminOutput {
  text: string;
  error?: boolean;
}

export const ADMIN_COMMANDS = ["login", "logout", "luck", "money", "give", "status"] as const;

function locked(): AdminOutput[] {
  return [{ text: 'Locked. Use "login <password>" first.', error: true }];
}

export function runAdminCommand(name: string, arg: string, handlers: AdminHandlers): AdminOutput[] | null {
  if (!(ADMIN_COMMANDS as readonly string[]).includes(name)) return null;

  if (name === "login") {
    if (isAdminUnlocked()) return [{ text: "Already unlocked." }];
    if (!arg) return [{ text: "Usage: login <password>", error: true }];
    if (unlockAdmin(arg)) return [{ text: "Admin unlocked for this session." }];
    return [{ text: "Wrong password.", error: true }];
  }

  if (!isAdminUnlocked()) return locked();

  switch (name) {
    case "logout":
      lockAdmin();
      return [{ text: "Admin locked." }];
    case "luck": {
      if (!arg) return [{ text: `Luck multiplier: ${getLuckMultiplier()}x` }];
      const mult = Number(arg);
      if (!Number.isFinite(mult) || mult <= 0) return [{ text: "Usage: luck <positiveMultiplier>, e.g. luck 10", error: true }];
      setLuckMultiplier(mult);
      const chance = Math.min(100, 0.26 * getLuckMultiplier());
      return [{ text: `Luck set to ${getLuckMultiplier()}x (gold chance ${chance.toFixed(2)}%).` }];
    }
    case "money": {
      const amount = Number(arg);
      if (!Number.isFinite(amount) || amount === 0) return [{ text: "Usage: money <amount>, e.g. money 1000", error: true }];
      handlers.addFunds(amount);
      return [{ text: `Added ${formatMoney(amount)}.` }];
    }
    case "give": {
      if (!arg) return [{ text: 'Usage: give <skin name>, e.g. give redline', error: true }];
      const skin = findSkin(arg);
      if (!skin) return [{ text: `No skin found for "${arg}".`, error: true }];
      const item = buildItemFromSkin(skin, "admin", `admin-${Date.now()}`);
      handlers.addItem(item);
      return [{ text: `Added ${fullName(skin)} (${formatMoney(item.price)}) to your inventory.` }];
    }
    case "status": {
      const lines = [`Unlocked: yes`, `Luck: ${getLuckMultiplier()}x`];
      if (handlers.getBalance) lines.push(`Balance: ${formatMoney(handlers.getBalance())}`);
      return lines.map((text) => ({ text }));
    }
    default:
      return null;
  }
}
