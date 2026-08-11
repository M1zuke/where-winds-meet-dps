// Nothing self-registers a mechanic outside the three owner barrels and the
// contract's own definition site — see docs/CLASSES.md § "One definition per
// class". `tests/engine/classExtensionPoints.test.ts` legitimately calls
// `registerMechanic(` too, for a fictional probe class; that file lives under
// `tests/`, outside the `src/` scope this guard checks.
import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const SRC_DIR = join(process.cwd(), "src")

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return tsFiles(path)
    return path.endsWith(".ts") ? [path] : []
  })
}

function repoRelative(path: string): string {
  return path
    .slice(process.cwd().length + 1)
    .split("\\")
    .join("/")
}

describe("registerMechanic call sites", () => {
  it("are exactly the three owner barrels plus the definition site", () => {
    const callSites = tsFiles(SRC_DIR)
      .filter((path) => /\bregisterMechanic\b/.test(readFileSync(path, "utf8")))
      .map(repoRelative)
      .sort()
    expect(callSites).toEqual([
      "src/data/classes/index.ts",
      "src/data/innerWays/index.ts",
      "src/data/sets/index.ts",
      "src/engine/mechanics/index.ts",
    ])
  })
})
