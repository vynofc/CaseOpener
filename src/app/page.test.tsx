// @vitest-environment jsdom
import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CASES } from "@/lib/cases";
import { rollDrop } from "@/lib/game";
import { GameProvider } from "@/lib/game-context";
import { formatMoney, type InventoryItem } from "@/lib/types";
import Home from "./page";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true });

const drop = vi.hoisted(() => ({
  uid: "test-uid-1",
  skin: {
    id: "skin-unit-test",
    weapon: "ZT-9",
    name: "Unit Test",
    rarity: "classified" as const,
    basePrice: 50,
  },
  caseId: "case-unit-test",
  wear: { name: "Field-Tested", short: "FT", min: 0.15, max: 0.38, mult: 1 },
  floatValue: 0.25,
  stattrak: false,
  price: 42.5,
  wonAt: 0,
}));

vi.mock("@/lib/audio");
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/CaseIntro", () => ({
  default: ({ onDone, children }: { onDone: () => void; children?: ReactNode }) => (
    <div data-testid="intro">
      <button data-testid="intro-done" onClick={onDone} />
      {children}
    </div>
  ),
}));
vi.mock("@/components/Roulette", () => ({
  default: ({ winner, onDone }: { winner: InventoryItem; onDone: (item: InventoryItem) => void }) => (
    <div data-testid="roulette">
      <button data-testid="roulette-done" onClick={() => onDone(winner)} />
    </div>
  ),
}));
vi.mock("@/lib/game", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/game")>();
  return { ...mod, rollDrop: vi.fn(() => drop) };
});

const STORAGE_KEY = "cs2-case-opener-v1";
const selectedCase = CASES[0];

function seedStorage(balance: number) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      balance,
      inventory: [],
      stats: { opened: 0, spent: 0, earned: 0, bestDrop: null },
      soundOn: false,
    })
  );
}

function storedState() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)!) as {
    balance: number;
    inventory: InventoryItem[];
    stats: { opened: number; spent: number; earned: number };
  };
}

function renderHome() {
  return render(
    <GameProvider>
      <Home />
    </GameProvider>
  );
}

function openButton() {
  return screen.getByRole("button", { name: /^open case/i });
}

async function reachResultPhase(user: ReturnType<typeof userEvent.setup>) {
  await user.click(openButton());
  await user.click(await screen.findByTestId("intro-done"));
  await user.click(await screen.findByTestId("roulette-done"));
  await screen.findByRole("button", { name: /open again/i });
}

describe("page phase state machine", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("blocks opening while balance is too low", async () => {
    renderHome();
    await screen.findByText(/not enough balance/i);
    expect(openButton()).toHaveProperty("disabled", true);
    expect(vi.mocked(rollDrop)).not.toHaveBeenCalled();
  });

  it("walks idle -> opening -> spinning -> result -> idle on keep", async () => {
    seedStorage(1000);
    const user = userEvent.setup();
    renderHome();
    await screen.findByText(formatMoney(1000));

    await user.click(openButton());
    expect(await screen.findByTestId("intro")).toBeTruthy();
    expect(openButton()).toHaveProperty("disabled", true);
    expect(storedState().stats.spent).toBeCloseTo(selectedCase.price);

    await user.click(screen.getByTestId("intro-done"));
    expect(await screen.findByTestId("roulette")).toBeTruthy();

    await user.click(screen.getByTestId("roulette-done"));
    expect(await screen.findByText("Unit Test")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /^keep/i }));
    expect(screen.queryByRole("button", { name: /open again/i })).toBeNull();
    expect(openButton()).toHaveProperty("disabled", false);

    const stored = storedState();
    expect(stored.inventory).toHaveLength(1);
    expect(stored.inventory[0].uid).toBe(drop.uid);
    expect(stored.stats.opened).toBe(1);
  });

  it("credits the item price when selling the drop", async () => {
    seedStorage(1000);
    const user = userEvent.setup();
    renderHome();
    await screen.findByText(formatMoney(1000));

    await reachResultPhase(user);
    await user.click(screen.getByRole("button", { name: /^sell/i }));

    const afterDeduct = Math.round((1000 - selectedCase.price) * 100) / 100;
    const expected = Math.round((afterDeduct + drop.price) * 100) / 100;
    expect(await screen.findByText(formatMoney(expected))).toBeTruthy();

    const stored = storedState();
    expect(stored.inventory).toHaveLength(0);
    expect(stored.stats.opened).toBe(1);
    expect(stored.stats.earned).toBeCloseTo(drop.price);
  });

  it("open again keeps the item and chains a new opening", async () => {
    seedStorage(1000);
    const user = userEvent.setup();
    renderHome();
    await screen.findByText(formatMoney(1000));

    await reachResultPhase(user);
    await user.click(screen.getByRole("button", { name: /open again/i }));

    expect(screen.queryByRole("button", { name: /open again/i })).toBeNull();
    expect(await screen.findByTestId("intro")).toBeTruthy();
    expect(vi.mocked(rollDrop)).toHaveBeenCalledTimes(2);

    const stored = storedState();
    expect(stored.inventory).toHaveLength(1);
    expect(stored.stats.spent).toBeCloseTo(2 * selectedCase.price);
  });

  it("space skips an ongoing opening straight to the result", async () => {
    seedStorage(1000);
    const user = userEvent.setup();
    renderHome();
    await screen.findByText(formatMoney(1000));

    await user.click(openButton());
    expect(await screen.findByTestId("intro")).toBeTruthy();

    fireEvent.keyDown(document.body, { key: " ", code: "Space" });
    expect(await screen.findByRole("button", { name: /open again/i })).toBeTruthy();
    expect(screen.getByText("Unit Test")).toBeTruthy();
  });

  it("opens via the R hotkey only while idle", async () => {
    seedStorage(1000);
    renderHome();
    await screen.findByText(formatMoney(1000));

    fireEvent.keyDown(document.body, { key: "r", code: "KeyR" });
    expect(await screen.findByTestId("intro")).toBeTruthy();
    expect(vi.mocked(rollDrop)).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document.body, { key: "r", code: "KeyR" });
    expect(vi.mocked(rollDrop)).toHaveBeenCalledTimes(1);
  });
});
