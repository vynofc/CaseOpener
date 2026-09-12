import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { CASES } from "./cases";
import { caseImagePath } from "./case-images";

describe("caseImagePath", () => {
  it("has a mapped image for every case", () => {
    for (const c of CASES) {
      expect(caseImagePath(c.id), c.id).not.toBe("");
    }
  });

  it("points to files that exist on disk", () => {
    for (const c of CASES) {
      const p = caseImagePath(c.id);
      const file = path.join(process.cwd(), "public", decodeURIComponent(p));
      expect(existsSync(file), `${c.id} -> ${p}`).toBe(true);
    }
  });
});
