// Every inner-way/set mechanic module and its owning def import each other:
// the def needs the mechanic's value to build its `mechanics` field, and the
// mechanic needs the def's value inside its own deferred closures. The same
// hazard now also covers owner-declared `BuffModule` factories (Wolfchaser's
// Art's three buffs) and `SkillBehaviorFactory` factories
// (Sword Horizon's crosswind). Two rules keep any of these cycles safe,
// neither enforceable by the type checker: (1) the factory module must export
// a hoisted function, never a `const` bound to an object literal — entering
// through the factory file first would otherwise leave the def's binding in
// TDZ; (2) the factory module must not import `innerWays/registry.ts` or
// `classes/registry.ts`, both of which unconditionally load their own
// barrel, which is what is loading the factory in the first place. Either
// violation surfaces only as a runtime crash, and only for whichever entry
// point happens to load first.
import { describe, expect, it, vi } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { INNER_WAYS } from "../../src/data/innerWays"

const ROOT = process.cwd()
const SCAN_DIRS = ["src/data/innerWays", "src/data/sets"]

function tsFilesDirectlyUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    return !statSync(path).isDirectory() && path.endsWith(".ts") ? [path] : []
  })
}

function repoRelative(path: string): string {
  return path
    .slice(ROOT.length + 1)
    .split("\\")
    .join("/")
}

function importSpecifiers(text: string): string[] {
  const fromImports = [...text.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((match) => match[1])
  // `import "./registry"` has no `from` clause but still runs the target
  // module for its side effect — the exact form the barrel-import rule bans.
  const bareImports = [...text.matchAll(/^\s*import\s+["']([^"']+)["']/gm)].map((match) => match[1])
  return [...fromImports, ...bareImports]
}

function resolvedTarget(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null
  const resolved = resolve(dirname(fromFile), specifier)
  return (resolved.endsWith(".ts") ? resolved : `${resolved}.ts`).split("\\").join("/")
}

const allTopLevelFiles = SCAN_DIRS.flatMap((dir) => tsFilesDirectlyUnder(join(ROOT, dir)))
  .map(repoRelative)
  .sort()

const discovered = allTopLevelFiles.filter((path) =>
  /\bTimelineMechanic\b/.test(readFileSync(join(ROOT, path), "utf8")),
)

// Discovered from the real, loaded data rather than a type-name text scan —
// `factory.name` is the exported identifier for any hoisted `export function`
// (a `const` bound to an arrow would carry the same name too, which is
// exactly why the assertion below checks for the `const` form separately).
const skillBehaviorFactoryNames = [
  ...new Set(
    INNER_WAYS.flatMap((def) => def.skillBehaviors ?? []).map(({ factory }) => factory.name),
  ),
]

describe("mechanic modules under src/data/innerWays and src/data/sets", () => {
  it("are exactly the four known mechanic modules", () => {
    expect(discovered).toEqual([
      "src/data/innerWays/bitterSeasonMechanic.ts",
      "src/data/innerWays/insightfulStrikeMechanic.ts",
      "src/data/innerWays/moraleChantMechanic.ts",
      "src/data/sets/hawkwingMechanic.ts",
    ])
  })

  it("are all named *Mechanic.ts", () => {
    for (const path of discovered) expect(path.endsWith("Mechanic.ts")).toBe(true)
  })

  it("export a hoisted factory, never a const bound to a TimelineMechanic object", () => {
    for (const path of discovered) {
      const text = readFileSync(join(ROOT, path), "utf8")
      expect(text).not.toMatch(/export\s+const\s+\w+\s*:\s*TimelineMechanic/)
      expect(text).toMatch(/export\s+function\s+\w+\s*\([^)]*\)\s*:\s*TimelineMechanic/)
    }
  })
})

describe("every module under src/data/innerWays and src/data/sets", () => {
  it("imports no barrel-loading registry", () => {
    const forbidden = new Set([
      join(ROOT, "src/definitions/innerWays/registry.ts").split("\\").join("/"),
      join(ROOT, "src/definitions/classes/registry.ts").split("\\").join("/"),
    ])
    const offenders = allTopLevelFiles.filter((path) => {
      const targets = importSpecifiers(readFileSync(join(ROOT, path), "utf8"))
        .map((specifier) => resolvedTarget(join(ROOT, path), specifier))
        .filter((target): target is string => target !== null)
      return targets.some((target) => forbidden.has(target))
    })
    expect(offenders).toEqual([])
  })

  it("every registered skill-behaviour factory is a hoisted function, never a const", () => {
    expect(skillBehaviorFactoryNames).not.toEqual([])
    for (const name of skillBehaviorFactoryNames) {
      const declaredAsFunction = allTopLevelFiles.some((path) =>
        new RegExp(`export\\s+function\\s+${name}\\s*\\(`).test(
          readFileSync(join(ROOT, path), "utf8"),
        ),
      )
      const declaredAsConst = allTopLevelFiles.some((path) =>
        new RegExp(`export\\s+const\\s+${name}\\s*[:=]`).test(
          readFileSync(join(ROOT, path), "utf8"),
        ),
      )
      expect(declaredAsFunction, name).toBe(true)
      expect(declaredAsConst, name).toBe(false)
    }
  })

  it("evaluate correctly when the module loads before its barrel", async () => {
    for (const path of allTopLevelFiles) {
      vi.resetModules()
      await import(/* @vite-ignore */ "../../" + path.replace(/\.ts$/, ""))

      const barrelDir = dirname(path)
      const barrelModule: Record<string, unknown> = await import(
        /* @vite-ignore */ "../../" + barrelDir
      )
      const defs = (barrelModule.INNER_WAYS ?? barrelModule.SET_DEFS) as
        | readonly {
            mechanics?: readonly { mechanic: { id: string } }[]
            buffDefs?: readonly { id: string }[]
            skillBehaviors?: readonly { skillId: string; factory: unknown }[]
          }[]
        | undefined
      expect(defs, path).toBeDefined()
      for (const def of defs ?? []) {
        for (const { mechanic } of def.mechanics ?? []) {
          expect(typeof mechanic).toBe("object")
          expect(mechanic).not.toBeNull()
          expect(typeof mechanic.id).toBe("string")
          expect(mechanic.id.length).toBeGreaterThan(0)
        }
        for (const module of def.buffDefs ?? []) {
          expect(typeof module.id).toBe("string")
          expect(module.id.length).toBeGreaterThan(0)
        }
        for (const registration of def.skillBehaviors ?? []) {
          expect(typeof registration.skillId).toBe("string")
          expect(registration.skillId.length).toBeGreaterThan(0)
          expect(typeof registration.factory).toBe("function")
        }
      }
    }
  })
})
