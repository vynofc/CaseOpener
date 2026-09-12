import { beforeEach, describe, expect, it } from "vitest";
import { findSkin, isAdminUnlocked, lockAdmin, runAdminCommand } from "./admin";
import { getLuckMultiplier } from "./game";
import { InventoryItem } from "./types";

function makeHandlers() {
  const calls = { funds: [] as number[], items: [] as InventoryItem[] };
  return {
    calls,
    handlers: {
      addFunds: (amount: number) => calls.funds.push(amount),
      addItem: (item: InventoryItem) => calls.items.push(item),
      getBalance: () => 42.5,
    },
  };
}

describe("admin commands", () => {
  beforeEach(() => {
    lockAdmin();
    runAdminCommand("login", "wrong-password", makeHandlers().handlers);
  });

  it("returns null for unknown commands", () => {
    const { handlers } = makeHandlers();
    expect(runAdminCommand("fly", "", handlers)).toBeNull();
  });

  it("requires login before any admin command", () => {
    const { handlers } = makeHandlers();
    for (const [name, arg] of [["luck", "10"], ["money", "100"], ["give", "ak"], ["status", ""], ["logout", ""]] as const) {
      const out = runAdminCommand(name, arg, handlers)!;
      expect(out[0].error).toBe(true);
      expect(out[0].text).toContain("Locked");
    }
    expect(isAdminUnlocked()).toBe(false);
  });

  it("rejects a wrong password and accepts the right one", () => {
    const { handlers } = makeHandlers();
    expect(runAdminCommand("login", "nope", handlers)![0].error).toBe(true);
    expect(isAdminUnlocked()).toBe(false);
    expect(runAdminCommand("login", "spiderman007", handlers)![0].error).toBeUndefined();
    expect(isAdminUnlocked()).toBe(true);
  });

  it("stays unlocked for the rest of the session after one login", () => {
    const { handlers } = makeHandlers();
    runAdminCommand("login", "spiderman007", handlers);
    const out = runAdminCommand("money", "100", handlers)!;
    expect(out[0].error).toBeUndefined();
  });

  it("luck sets and reports the multiplier", () => {
    const { handlers } = makeHandlers();
    runAdminCommand("login", "spiderman007", handlers);
    runAdminCommand("luck", "20", handlers);
    expect(getLuckMultiplier()).toBe(20);
    expect(runAdminCommand("luck", "", handlers)![0].text).toContain("20x");
    expect(runAdminCommand("luck", "abc", handlers)![0].error).toBe(true);
    runAdminCommand("luck", "1", handlers);
    expect(getLuckMultiplier()).toBe(1);
  });

  it("money adds funds and rejects invalid amounts", () => {
    const { handlers, calls } = makeHandlers();
    runAdminCommand("login", "spiderman007", handlers);
    runAdminCommand("money", "1000", handlers);
    expect(calls.funds).toEqual([1000]);
    expect(runAdminCommand("money", "0", handlers)![0].error).toBe(true);
    expect(runAdminCommand("money", "xyz", handlers)![0].error).toBe(true);
    expect(calls.funds).toHaveLength(1);
  });

  it("give adds the matched skin to the inventory", () => {
    const { handlers, calls } = makeHandlers();
    runAdminCommand("login", "spiderman007", handlers);
    const skin = findSkin("redline")!;
    expect(skin).not.toBeNull();
    const out = runAdminCommand("give", "redline", handlers)!;
    expect(out[0].error).toBeUndefined();
    expect(calls.items).toHaveLength(1);
    expect(calls.items[0].skin.id).toBe(skin.id);
    expect(calls.items[0].caseId).toBe("admin");
  });

  it("give reports unknown skins", () => {
    const { handlers } = makeHandlers();
    runAdminCommand("login", "spiderman007", handlers);
    expect(runAdminCommand("give", "no-such-skin-xyz", handlers)![0].error).toBe(true);
    expect(runAdminCommand("give", "", handlers)![0].error).toBe(true);
  });

  it("status reports unlock, luck and balance", () => {
    const { handlers } = makeHandlers();
    runAdminCommand("login", "spiderman007", handlers);
    const out = runAdminCommand("status", "", handlers)!;
    expect(out.map((l) => l.text).join(" ")).toContain("$42.50");
  });

  it("logout locks the console again", () => {
    const { handlers } = makeHandlers();
    runAdminCommand("login", "spiderman007", handlers);
    runAdminCommand("logout", "", handlers);
    expect(isAdminUnlocked()).toBe(false);
    expect(runAdminCommand("money", "1", handlers)![0].error).toBe(true);
  });
});

describe("findSkin", () => {
  it("matches by exact name, full name and substring", () => {
    const byName = findSkin("redline");
    expect(byName).not.toBeNull();
    expect(findSkin(`${byName!.weapon} | ${byName!.name}`)!.id).toBe(byName!.id);
    expect(findSkin("redlin")!.id).toBe(byName!.id);
  });

  it("returns null for empty or unknown queries", () => {
    expect(findSkin("")).toBeNull();
    expect(findSkin("no-such-skin-xyz")).toBeNull();
  });
});
