import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { resolveActiveSets } from "../../src/engine/setBonuses"
import { skillTagsOf } from "../../src/engine/buffs/tags"
import { SET_ID } from "../../src/data/sets/ids"
import { withBowSet, withGearSet } from "../helpers/withGearSet"
import { WEAPON_SLOTS } from "../../src/engine/types"
import type { Skill } from "../../src/engine/skill"

const equippedSet = withGearSet(defaultInputs, SET_ID.hawkwing, { fabricatePieces: true })

describe("resolveActiveSets cache", () => {
  it("returns the same object for the same inventory, equipped and bow gear", () => {
    expect(resolveActiveSets(equippedSet)).toBe(resolveActiveSets({ ...equippedSet }))
  })

  it("recomputes when the inventory reference changes", () => {
    const withoutSet = withGearSet(equippedSet, null)
    expect(resolveActiveSets(withoutSet)).not.toBe(resolveActiveSets(equippedSet))
    expect(resolveActiveSets(withoutSet).twoPiece).toEqual([])
  })

  it("recomputes when the equipped reference changes", () => {
    const unequipped = {
      ...equippedSet,
      equipped: {
        ...equippedSet.equipped,
        ...Object.fromEntries(WEAPON_SLOTS.map((slot) => [slot, null])),
      },
    }
    expect(resolveActiveSets(unequipped)).not.toBe(resolveActiveSets(equippedSet))
    expect(resolveActiveSets(unequipped).twoPiece).toEqual([])
  })

  it("recomputes when the bow gear reference changes", () => {
    const withBow = withBowSet(equippedSet, "crit", 96)
    expect(resolveActiveSets(withBow)).not.toBe(resolveActiveSets(equippedSet))
    expect(resolveActiveSets(withBow).bow).toEqual({ set: "crit", level: 96 })
    expect(resolveActiveSets(equippedSet).bow).toBeNull()
  })
})

describe("skillTagsOf cache", () => {
  const skill = {
    id: "cache-probe",
    name: "Cache Probe",
    skillType: "weapon",
    tags: ["weapon:sword"],
    receives: ["probeBuff"],
  } as unknown as Skill

  it("returns the same set for the same skill object", () => {
    expect(skillTagsOf(skill)).toBe(skillTagsOf(skill))
  })

  it("derives the namespaced tags", () => {
    expect([...skillTagsOf(skill)].sort()).toEqual([
      "buff:probeBuff",
      "type:weapon",
      "weapon:sword",
    ])
  })

  it("recomputes for a different skill object", () => {
    const edited = { ...skill, tags: ["weapon:spear"] } as Skill
    expect(skillTagsOf(edited)).not.toBe(skillTagsOf(skill))
    expect(skillTagsOf(edited).has("weapon:spear")).toBe(true)
    expect(skillTagsOf(edited).has("weapon:sword")).toBe(false)
  })
})
