// The guard for CLASSES.md § "Naming": a modifier addresses an entity by a
// namespaced tag it declares, never by a string that happens to match its
// display name. Spans all eight classes on purpose — most of the name-based
// entries this replaced belong to the seven with no other test coverage.
import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import schools from "../../src/data/classes/schools.json"
import { join } from "node:path"

const BUFFS_DIR = join(process.cwd(), "src/data/skills/buffs")
const CLASS_IDS = (schools as { id: string }[]).map((school) => school.id)
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
  const excludes = Array.isArray(def.excludes) ? (def.excludes as string[]) : []
  const byPrefix = def.__statModByPrefix as { prefixes?: string[] } | undefined
  return [...affects, ...excludes, ...(byPrefix?.prefixes ?? [])]
}

function triggerEntries(def: Record<string, unknown>): string[] {
  const triggeredBy = Array.isArray(def.triggeredBy) ? (def.triggeredBy as string[]) : []
  const durations = (def.durationByTrigger ?? {}) as Record<string, number>
  return [...triggeredBy, ...Object.keys(durations)]
}

// Scope entries that no entity carries, and deliberately so: both were already
// dead references under name matching — they name mechanics this app never
// modelled. Listed rather than hidden, because under exact matching "reaches
// nothing" is otherwise indistinguishable from a typo.
const KNOWN_UNCARRIED = new Set(["role:fireOil", "role:fivefoldBleed"])

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

describe("triggers are addressed by cast tag, never by display name", () => {
  it("every triggeredBy / durationByTrigger key is namespaced", () => {
    const bare: string[] = []
    for (const { name, def } of defs)
      for (const entry of triggerEntries(def))
        if (!entry.startsWith("cast:")) bare.push(`${name}: ${entry}`)
    expect(bare).toEqual([])
  })
})

// Exact matching turns a mistyped tag into a silently inert buff, where prefix
// matching would at least still fire on a stem. This is the guard for that.
describe("every declared tag is actually carried by something", () => {
  const carried = new Set<string>()
  for (const classId of CLASS_IDS) {
    for (const skill of builtinSkillsForClass(classId)) {
      for (const tag of skill.tags ?? []) carried.add(tag)
      if (skill.castTag) carried.add(skill.castTag)
    }
    for (const debuff of builtinDebuffsForClass(classId))
      for (const tag of debuff.tags ?? []) carried.add(tag)
  }

  it("every scope entry reaches at least one skill or debuff", () => {
    const orphans = new Set<string>()
    for (const { def } of defs)
      for (const entry of scopeEntries(def))
        if (entry.startsWith("role:") && !carried.has(entry) && !KNOWN_UNCARRIED.has(entry))
          orphans.add(entry)
    expect([...orphans]).toEqual([])
  })

  it("every trigger entry reaches at least one skill", () => {
    const orphans = new Set<string>()
    for (const { def } of defs)
      for (const entry of triggerEntries(def)) if (!carried.has(entry)) orphans.add(entry)
    expect([...orphans]).toEqual([])
  })
})
