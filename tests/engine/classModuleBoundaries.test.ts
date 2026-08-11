// The generalization contract (docs/CLASSES.md § "One definition per class")
// mechanically enforced: a class module never reaches the panel/registry
// layer (the cycle criterion 11 exists to foreclose), and `defineClassBuff`
// is not a second buff system — its marker is inert everywhere `src/engine`
// looks, and every module carrying it is actually owned by a class.
import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { CLASS_DEFS } from "../../src/data/classes/registry"
import { GLOBAL_BUFF_DEFS, GROUP_BUFF_DEFS } from "../../src/data/skills/buffs"

const ROOT = process.cwd()

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return tsFiles(path)
    return path.endsWith(".ts") ? [path] : []
  })
}

function repoRelative(path: string): string {
  return path
    .slice(ROOT.length + 1)
    .split("\\")
    .join("/")
}

function importSpecifiers(text: string): string[] {
  return [...text.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1])
}

// What a relative specifier actually points at, not what it's spelled like —
// `../classes/registry` and `./registry` (from within `src/data/classes/`)
// resolve to the same file; `../innerWays/registry` resolves to a different
// one despite the shared file name. Every import in this repo is relative
// (no `paths`/`baseUrl` in tsconfig), so this covers every real specifier.
function resolvedTarget(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null
  const resolved = resolve(dirname(fromFile), specifier)
  return (resolved.endsWith(".ts") ? resolved : `${resolved}.ts`).split("\\").join("/")
}

function buffFolders(): string[] {
  const skillsDir = join(ROOT, "src/data/skills")
  return [join(skillsDir, "buffs")].concat(
    readdirSync(skillsDir)
      .map((entry) => join(skillsDir, entry, "buffs"))
      .filter((path) => {
        try {
          return statSync(path).isDirectory()
        } catch {
          return false
        }
      }),
  )
}

describe("no class module imports the panel/registry layer", () => {
  const FORBIDDEN_TARGETS = new Set(
    [
      "src/engine/panel.ts",
      "src/data/classes/registry.ts",
      "src/engine/builtinLibrary.ts",
      "src/engine/buffs/data.ts",
      "src/engine/buffs/catalog.ts",
    ].map((path) => join(ROOT, path).split("\\").join("/")),
  )
  // index.ts (the composition root) and registry.ts (the layer itself) are
  // exempt: index.ts pushes the assembled ClassDefs into registry.ts, which
  // is the one legitimate registry reference this directory contains.
  const EXEMPT = new Set(["index.ts", "registry.ts"])
  const sources = tsFiles(join(ROOT, "src/data/classes"))
    .filter((path) => !EXEMPT.has(repoRelative(path).split("/").pop()!))
    .map((path) => ({
      path: repoRelative(path),
      targets: importSpecifiers(readFileSync(path, "utf8"))
        .map((specifier) => resolvedTarget(path, specifier))
        .filter((target): target is string => target !== null),
    }))

  it("imports none of panel, registry, builtinLibrary, buffs/data or buffs/catalog", () => {
    const offenders = sources
      .filter(({ targets }) => targets.some((target) => FORBIDDEN_TARGETS.has(target)))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })
})

describe("defineClassBuff is not a second buff system", () => {
  it("every classBuffDefs / mechanicBuffDefs entry carries the marker", () => {
    const unmarked: string[] = []
    for (const classDef of CLASS_DEFS()) {
      for (const module of [...classDef.classBuffDefs, ...classDef.mechanicBuffDefs]) {
        if (!("classBuff" in module)) unmarked.push(`${classDef.id}/${module.id}`)
      }
    }
    expect(unmarked).toEqual([])
  })

  it("no GLOBAL_BUFF_DEFS or GROUP_BUFF_DEFS entry carries the marker", () => {
    const marked = [...GLOBAL_BUFF_DEFS, ...GROUP_BUFF_DEFS]
      .filter((module) => "classBuff" in module)
      .map((module) => module.id)
    expect(marked).toEqual([])
  })

  it("every declared class buff is listed by at least one class", async () => {
    const listedIds = new Set(
      CLASS_DEFS()
        .flatMap((classDef) => [...classDef.classBuffDefs, ...classDef.mechanicBuffDefs])
        .map((module) => module.id),
    )
    const orphaned: string[] = []
    for (const dir of buffFolders()) {
      for (const file of readdirSync(dir).filter((entry) => entry.endsWith(".ts"))) {
        const path = join(dir, file)
        const specifier = "../../" + repoRelative(path).replace(/\.ts$/, "")
        const module: Record<string, unknown> = await import(/* @vite-ignore */ specifier)
        for (const exported of Object.values(module)) {
          if (!exported || typeof exported !== "object" || !("classBuff" in exported)) continue
          const { id } = exported as { id: string; classBuff: true }
          if (!listedIds.has(id)) orphaned.push(`${repoRelative(path)}: ${id}`)
        }
      }
    }
    expect(orphaned).toEqual([])
  })
})

describe("src/data/skills/*/buffs/*.ts uses defineClassBuff only", () => {
  it("no per-class buffs folder declares a bare defineBuff(", () => {
    const offenders: string[] = []
    for (const dir of buffFolders()) {
      if (dir === join(ROOT, "src/data/skills/buffs")) continue
      for (const file of readdirSync(dir).filter((entry) => entry.endsWith(".ts"))) {
        const path = join(dir, file)
        if (/\bdefineBuff\(/.test(readFileSync(path, "utf8"))) offenders.push(repoRelative(path))
      }
    }
    expect(offenders).toEqual([])
  })
})

describe("the class-buff marker is inert at the engine layer", () => {
  // Word-boundary, not substring: `classBuffDefs` (a ClassDef field name that
  // legitimately flows through the engine) contains "classBuff" but is not
  // the marker this guards.
  it("no file under src/engine mentions classBuff", () => {
    const offenders = tsFiles(join(ROOT, "src/engine"))
      .filter((path) => /\bclassBuff\b/.test(readFileSync(path, "utf8")))
      .map(repoRelative)
    expect(offenders).toEqual([])
  })
})
