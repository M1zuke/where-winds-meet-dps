// The guard for CLASSES.md § "Naming": a modifier addresses an entity by a
// namespaced tag it declares, never by a string that happens to match its
// display name. Spans all eight classes on purpose — most of the name-based
// entries this replaced belong to the seven with no other test coverage.
import { describe, expect, it } from "vitest"
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import schools from "../../src/data/classes/schools.json"
import {
  SITE_BUFF_DEFS_BY_SPEC,
  GLOBAL_BUFF_DEFS,
  GROUP_BUFF_DEFS,
  MECHANIC_BUFF_DEFS,
} from "../../src/data/skills/buffs"
import { legacyDefOf } from "../../src/engine/buffs/legacyBuffModule"
import type { BuffModule } from "../../src/engine/buffs/buffModule"

const CLASS_IDS = (schools as { id: string }[]).map((school) => school.id)
const NAMESPACES = ["role:", "type:", "weapon:", "mystic:", "attune:", "prop:", "attack:", "cast:"]

// Every spec's own copy of a site-scoped module, plus global/group/mechanic —
// the same per-spec granularity the old per-JSON-variant scan had, so a
// spec-specific `affects`/`__statModByPrefix` divergence (e.g. throatPierced)
// stays checked once per spec rather than collapsing to one shared entry.
const entries: { label: string; module: BuffModule }[] = [
  ...Object.entries(SITE_BUFF_DEFS_BY_SPEC).flatMap(([spec, modules]) =>
    modules.map((module) => ({ label: `${spec}/${module.id}`, module })),
  ),
  ...GLOBAL_BUFF_DEFS.map((module) => ({ label: `global/${module.id}`, module })),
  ...GROUP_BUFF_DEFS.map((module) => ({ label: `group/${module.id}`, module })),
  ...MECHANIC_BUFF_DEFS.map((module) => ({ label: `mechanic/${module.id}`, module })),
]

function scopeEntries(module: BuffModule): string[] {
  const prefixes = legacyDefOf(module)?.__statModByPrefix?.prefixes ?? []
  return [...(module.affects ?? []), ...(module.excludes ?? []), ...prefixes]
}

function triggerEntries(module: BuffModule): string[] {
  return module.triggeredBy ?? []
}

// Scope entries that no entity carries, and deliberately so: both were already
// dead references under name matching — they name mechanics this app never
// modelled. Listed rather than hidden, because under exact matching "reaches
// nothing" is otherwise indistinguishable from a typo.
const KNOWN_UNCARRIED = new Set(["role:fireOil", "role:fivefoldBleed"])

describe("scope is addressed by tag, never by display name", () => {
  it("every affects / __statModByPrefix entry is namespaced", () => {
    const bare: string[] = []
    for (const { label, module } of entries)
      for (const entry of scopeEntries(module))
        if (!NAMESPACES.some((ns) => entry.startsWith(ns))) bare.push(`${label}: ${entry}`)
    expect(bare).toEqual([])
  })

  it("covers a non-trivial number of defs, so the check cannot pass vacuously", () => {
    const withScope = entries.filter(({ module }) => scopeEntries(module).length > 0)
    expect(withScope.length).toBeGreaterThan(20)
  })
})

describe("triggers are addressed by cast tag, never by display name", () => {
  it("every triggeredBy key is namespaced", () => {
    const bare: string[] = []
    for (const { label, module } of entries)
      for (const entry of triggerEntries(module))
        if (!entry.startsWith("cast:")) bare.push(`${label}: ${entry}`)
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
    for (const { module } of entries)
      for (const entry of scopeEntries(module))
        if (entry.startsWith("role:") && !carried.has(entry) && !KNOWN_UNCARRIED.has(entry))
          orphans.add(entry)
    expect([...orphans]).toEqual([])
  })

  it("every trigger entry reaches at least one skill", () => {
    const orphans = new Set<string>()
    for (const { module } of entries)
      for (const entry of triggerEntries(module)) if (!carried.has(entry)) orphans.add(entry)
    expect([...orphans]).toEqual([])
  })
})
