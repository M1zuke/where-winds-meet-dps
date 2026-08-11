// Nothing self-registers a mechanic, buff, skill behaviour, display gate or
// poison extension outside its owner registry and the contract's own
// definition site — see docs/CLASSES.md § "One definition per class".
// `tests/engine/classExtensionPoints.test.ts` legitimately calls
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

function callSitesOf(name: string): string[] {
  return tsFiles(SRC_DIR)
    .filter((path) => new RegExp(`\\b${name}\\b`).test(readFileSync(path, "utf8")))
    .map(repoRelative)
    .sort()
}

describe("registerMechanic call sites", () => {
  it("are exactly the three owner registries plus the definition site", () => {
    expect(callSitesOf("registerMechanic")).toEqual([
      "src/definitions/classes/registry.ts",
      "src/definitions/innerWays/registry.ts",
      "src/definitions/sets/registry.ts",
      "src/engine/mechanics/index.ts",
    ])
  })
})

describe("registerBuiltinBuffs call sites", () => {
  it("are exactly the class registry plus the definition site", () => {
    expect(callSitesOf("registerBuiltinBuffs")).toEqual([
      "src/definitions/classes/registry.ts",
      "src/engine/builtinBuffs.ts",
    ])
  })
})

describe("registerSkillBehavior call sites", () => {
  it("are exactly the class registry, the inner-way registry, plus the definition site", () => {
    expect(callSitesOf("registerSkillBehavior")).toEqual([
      "src/definitions/classes/registry.ts",
      "src/definitions/innerWays/registry.ts",
      "src/engine/behavior.ts",
    ])
  })
})

describe("registerDisplayGate call sites", () => {
  it("are exactly the class registry, the inner-way registry, plus the definition site", () => {
    expect(callSitesOf("registerDisplayGate")).toEqual([
      "src/definitions/classes/registry.ts",
      "src/definitions/innerWays/registry.ts",
      "src/engine/buffs/displayGates.ts",
    ])
  })
})

describe("registerPoisonExtension call sites", () => {
  it("are exactly the class registry plus the definition site", () => {
    expect(callSitesOf("registerPoisonExtension")).toEqual([
      "src/definitions/classes/poisonExtensions.ts",
      "src/definitions/classes/registry.ts",
    ])
  })
})
