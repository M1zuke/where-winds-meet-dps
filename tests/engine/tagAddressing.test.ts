// The guard for CLASSES.md § "Naming": a modifier addresses an entity by a
// namespaced tag it declares, never by a string that happens to match its
// display name. Spans every registered class on purpose.
import { describe, expect, it } from "vitest"
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { CLASS_IDS, CLASS_DEFS } from "../../src/data/classes/registry"
import { GLOBAL_BUFF_DEFS, GROUP_BUFF_DEFS } from "../../src/data/skills/buffs"
import type { BuffModule } from "../../src/engine/buffs/buffModule"

const NAMESPACES = ["role:", "type:", "weapon:", "mystic:", "attune:", "prop:", "attack:", "cast:"]

// Every class's own class-buff and mechanic-buff modules, plus global/group.
const entries: { label: string; module: BuffModule }[] = [
  ...CLASS_DEFS().flatMap((classDef) =>
    classDef.classBuffDefs.map((module) => ({
      label: `${classDef.id}/classBuff/${module.id}`,
      module,
    })),
  ),
  ...CLASS_DEFS().flatMap((classDef) =>
    classDef.mechanicBuffDefs.map((module) => ({
      label: `${classDef.id}/mechanic/${module.id}`,
      module,
    })),
  ),
  ...GLOBAL_BUFF_DEFS.map((module) => ({ label: `global/${module.id}`, module })),
  ...GROUP_BUFF_DEFS.map((module) => ({ label: `group/${module.id}`, module })),
]

function scopeEntries(module: BuffModule): string[] {
  return [...(module.affects ?? []), ...(module.excludes ?? [])]
}

function triggerEntries(module: BuffModule): string[] {
  return module.triggeredBy ?? []
}

// Scope entries that no entity carries, and deliberately so: both were already
// dead references under name matching — they name mechanics this app never
// modelled. Listed rather than hidden, because under exact matching "reaches
// nothing" is otherwise indistinguishable from a typo.
const KNOWN_UNCARRIED = new Set(["role:fireOil", "role:fivefoldBleed"])

// Trigger entries for the seven classes now under `reference/classes/`
// (2026-08-11): `jadeware` and `rainwhisperShield` are set/global buffs
// whose trigger list spans every class's own "Q" cast so the buff still
// fires however a future class equips the set; `soulShaken` /
// `potentRiverFlow` / `wineGu` carry Bellstrike Rainbow's Spear Q variants
// alongside Umbra's; `healerBuff`'s own cast belonged to Silkbind Jade.
// Listed rather than hidden, same reasoning as `KNOWN_UNCARRIED` above.
const KNOWN_UNCARRIED_TRIGGERS = new Set([
  "cast:spearQ0HitCancel",
  "cast:spearQPrepull",
  "cast:fanQ",
  "cast:fanQCancel",
  "cast:fanQPrepull",
  "cast:moBladeQ",
  "cast:moBladeQPrepull",
  "cast:ropeQ",
  "cast:ropeQ1Hit",
  "cast:snowpartingSpecial",
  "cast:swordQ",
  "cast:swordQ2nd",
  "cast:umbQ",
  "cast:umbQPrepull",
  "cast:umbrellaQ",
  "cast:umbrellaQEmpoweredPerfectCatch",
  "cast:umbrellaQPerfectCatch",
  "cast:healerBuff",
])

describe("scope is addressed by tag, never by display name", () => {
  it("every affects entry is namespaced", () => {
    const bare: string[] = []
    for (const { label, module } of entries)
      for (const entry of scopeEntries(module))
        if (!NAMESPACES.some((ns) => entry.startsWith(ns))) bare.push(`${label}: ${entry}`)
    expect(bare).toEqual([])
  })

  // Bellstrike Umbra's own native set — six defs carry a scope entry
  // (2026-08-11, after the other seven classes' data moved to `reference/`).
  it("covers a non-trivial number of defs, so the check cannot pass vacuously", () => {
    const withScope = entries.filter(({ module }) => scopeEntries(module).length > 0)
    expect(withScope.length).toBeGreaterThanOrEqual(6)
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
  for (const classId of CLASS_IDS()) {
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
      for (const entry of triggerEntries(module))
        if (!carried.has(entry) && !KNOWN_UNCARRIED_TRIGGERS.has(entry)) orphans.add(entry)
    expect([...orphans]).toEqual([])
  })
})
