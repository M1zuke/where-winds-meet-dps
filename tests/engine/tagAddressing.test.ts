// The guard for GENERALIZATION.md § P2: a modifier addresses an entity by a
// namespaced tag it declares, never by a string that happens to match its
// display name. Spans all eight classes on purpose — most of the name-based
// entries this replaced belong to the seven with no other test coverage.
import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const BUFFS_DIR = join(process.cwd(), "src/data/skills/buffs")
const NAMESPACES = ["role:", "type:", "weapon:", "mystic:", "attune:", "prop:", "attack:", "cast:"]

interface DefFile {
  variants: { def: Record<string, unknown> }[]
}

const defs = readdirSync(BUFFS_DIR)
  .filter((name) => name.endsWith(".json"))
  .flatMap((name) => {
    const file = JSON.parse(readFileSync(join(BUFFS_DIR, name), "utf8")) as DefFile
    return file.variants.map((variant) => ({ name, def: variant.def }))
  })

function scopeEntries(def: Record<string, unknown>): string[] {
  const affects = Array.isArray(def.affects) ? (def.affects as string[]) : []
  const byPrefix = def.__statModByPrefix as { prefixes?: string[] } | undefined
  return [...affects, ...(byPrefix?.prefixes ?? [])]
}

describe("scope is addressed by tag, never by display name", () => {
  it("every affects / __statModByPrefix entry is namespaced", () => {
    const bare: string[] = []
    for (const { name, def } of defs)
      for (const entry of scopeEntries(def))
        if (!NAMESPACES.some((ns) => entry.startsWith(ns))) bare.push(`${name}: ${entry}`)
    expect(bare).toEqual([])
  })

  it("covers a non-trivial number of defs, so the check cannot pass vacuously", () => {
    const withScope = defs.filter(({ def }) => scopeEntries(def).length > 0)
    expect(withScope.length).toBeGreaterThan(20)
  })
})
