// Every inner-way/set mechanic module and its owning def import each other:
// the def needs the mechanic's value to build its `mechanics` field, and the
// mechanic needs the def's value inside its own deferred closures. Two rules
// keep that cycle safe, neither enforceable by the type checker: (1) the
// mechanic module must export a hoisted factory function, never a `const`
// bound to an object literal — entering through the mechanic file first would
// otherwise leave the def's binding in TDZ; (2) the mechanic module must not
// import `innerWays/registry.ts` or `classes/registry.ts`, both of which
// unconditionally load their own barrel, which is what is loading the
// mechanic in the first place. Either violation surfaces only as a runtime
// crash, and only for whichever entry point happens to load first.
import { describe, expect, it, vi } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

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

const discovered = SCAN_DIRS.flatMap((dir) => tsFilesDirectlyUnder(join(ROOT, dir)))
  .filter((path) => /\bTimelineMechanic\b/.test(readFileSync(path, "utf8")))
  .map(repoRelative)
  .sort()

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

  it("import no barrel-loading registry", () => {
    const forbidden = new Set([
      join(ROOT, "src/definitions/innerWays/registry.ts").split("\\").join("/"),
      join(ROOT, "src/definitions/classes/registry.ts").split("\\").join("/"),
    ])
    const offenders = discovered.filter((path) => {
      const targets = importSpecifiers(readFileSync(join(ROOT, path), "utf8"))
        .map((specifier) => resolvedTarget(join(ROOT, path), specifier))
        .filter((target): target is string => target !== null)
      return targets.some((target) => forbidden.has(target))
    })
    expect(offenders).toEqual([])
  })

  it("export a hoisted factory, never a const bound to a TimelineMechanic object", () => {
    for (const path of discovered) {
      const text = readFileSync(join(ROOT, path), "utf8")
      expect(text).not.toMatch(/export\s+const\s+\w+\s*:\s*TimelineMechanic/)
      expect(text).toMatch(/export\s+function\s+\w+\s*\([^)]*\)\s*:\s*TimelineMechanic/)
    }
  })

  it("evaluate correctly when the mechanic module loads before its barrel", async () => {
    for (const path of discovered) {
      vi.resetModules()
      const mechanicModule: Record<string, unknown> = await import(
        /* @vite-ignore */ "../../" + path.replace(/\.ts$/, "")
      )
      for (const [name, exported] of Object.entries(mechanicModule)) {
        if (!name.endsWith("Mechanic")) continue
        expect(typeof exported).toBe("function")
      }

      const barrelDir = dirname(path)
      const barrelModule: Record<string, unknown> = await import(
        /* @vite-ignore */ "../../" + barrelDir
      )
      const defs = (barrelModule.INNER_WAYS ?? barrelModule.SET_DEFS) as
        readonly { mechanics?: readonly { mechanic: { id: string } }[] }[] | undefined
      expect(defs).toBeDefined()
      for (const def of defs ?? []) {
        for (const { mechanic } of def.mechanics ?? []) {
          expect(typeof mechanic).toBe("object")
          expect(mechanic).not.toBeNull()
          expect(typeof mechanic.id).toBe("string")
          expect(mechanic.id.length).toBeGreaterThan(0)
        }
      }
    }
  })
})
