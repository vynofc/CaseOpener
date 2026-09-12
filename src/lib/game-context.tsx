"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { InventoryItem, Stats } from "./types";
import { playSell, setSoundEnabled } from "./audio";

interface GameContextValue {
  hydrated: boolean;
  balance: number;
  inventory: InventoryItem[];
  stats: Stats;
  soundOn: boolean;
  canAfford: (price: number) => boolean;
  deduct: (amount: number) => boolean;
  addFunds: (amount: number) => void;
  keepItem: (item: InventoryItem) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (uid: string) => void;
  sellDirect: (item: InventoryItem) => void;
  sellItem: (uid: string) => void;
  sellAll: () => void;
  toggleSound: () => void;
  resetAll: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

const STORAGE_KEY = "cs2-case-opener-v1";
const START_BALANCE = 50;

interface Persisted {
  balance: number;
  inventory: InventoryItem[];
  stats: Stats;
  soundOn: boolean;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [balance, setBalance] = useState(START_BALANCE);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<Stats>({ opened: 0, spent: 0, earned: 0, bestDrop: null });
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw) as Persisted;
          setBalance(data.balance ?? START_BALANCE);
          setInventory(data.inventory ?? []);
          setStats(data.stats ?? { opened: 0, spent: 0, earned: 0, bestDrop: null });
          setSoundOn(data.soundOn ?? true);
          setSoundEnabled(data.soundOn ?? true);
        }
      } catch {
        // ignore corrupted storage
      }
      setHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const data: Persisted = { balance, inventory, stats, soundOn };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [hydrated, balance, inventory, stats, soundOn]);

  const canAfford = useCallback((price: number) => balance >= price, [balance]);

  const deduct = useCallback(
    (amount: number) => {
      if (balance < amount) return false;
      setBalance((b) => Math.round((b - amount) * 100) / 100);
      setStats((s) => ({ ...s, spent: Math.round((s.spent + amount) * 100) / 100 }));
      return true;
    },
    [balance]
  );

  const addFunds = useCallback((amount: number) => {
    setBalance((b) => Math.round((b + amount) * 100) / 100);
  }, []);

  const recordOpen = useCallback((item: InventoryItem) => {
    setStats((s) => ({
      ...s,
      opened: s.opened + 1,
      bestDrop: !s.bestDrop || item.price > s.bestDrop.price ? item : s.bestDrop,
    }));
  }, []);

  const keepItem = useCallback(
    (item: InventoryItem) => {
      setInventory((inv) => [item, ...inv]);
      recordOpen(item);
    },
    [recordOpen]
  );

  const sellDirect = useCallback(
    (item: InventoryItem) => {
      setBalance((b) => Math.round((b + item.price) * 100) / 100);
      setStats((s) => ({ ...s, earned: Math.round((s.earned + item.price) * 100) / 100 }));
      recordOpen(item);
      playSell();
    },
    [recordOpen]
  );

  const addItem = useCallback((item: InventoryItem) => {
    setInventory((inv) => [item, ...inv]);
  }, []);

  const removeItem = useCallback((uid: string) => {
    setInventory((inv) => inv.filter((i) => i.uid !== uid));
  }, []);

  const sellItem = useCallback(
    (uid: string) => {
      const item = inventory.find((i) => i.uid === uid);
      if (!item) return;
      setBalance((b) => Math.round((b + item.price) * 100) / 100);
      setStats((s) => ({ ...s, earned: Math.round((s.earned + item.price) * 100) / 100 }));
      setInventory((inv) => inv.filter((i) => i.uid !== uid));
      playSell();
    },
    [inventory]
  );

  const sellAll = useCallback(() => {
    const total = inventory.reduce((sum, i) => sum + i.price, 0);
    if (total <= 0) return;
    setBalance((b) => Math.round((b + total) * 100) / 100);
    setStats((s) => ({ ...s, earned: Math.round((s.earned + total) * 100) / 100 }));
    setInventory([]);
    playSell();
  }, [inventory]);

  const toggleSound = useCallback(() => {
    setSoundOn((v) => {
      setSoundEnabled(!v);
      return !v;
    });
  }, []);

  const resetAll = useCallback(() => {
    setBalance(START_BALANCE);
    setInventory([]);
    setStats({ opened: 0, spent: 0, earned: 0, bestDrop: null });
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      balance,
      inventory,
      stats,
      soundOn,
      canAfford,
      deduct,
      addFunds,
      keepItem,
      addItem,
      removeItem,
      sellDirect,
      sellItem,
      sellAll,
      toggleSound,
      resetAll,
    }),
    [hydrated, balance, inventory, stats, soundOn, canAfford, deduct, addFunds, keepItem, addItem, removeItem, sellDirect, sellItem, sellAll, toggleSound, resetAll]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
