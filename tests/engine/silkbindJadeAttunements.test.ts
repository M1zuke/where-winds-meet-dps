// Scoped to the unvalidated Silkbind Jade: wiring of the Vernal Umbrella attunement lines, not a damage anchor.
import { describe, expect, it } from "vitest"
import { attunementsFor } from "../../src/engine/attunements"
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { defaultInputs } from "../../src/engine/defaults"
import { computeGearContribution } from "../../src/engine/gearStats"
import { buildContext } from "../../src/engine/panel"
import { computeSkillDamage } from "../../src/engine/formula"
import { hitToArtRow } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/silkbind-jade/ids"
import { ATTUNE } from "../../src/data/skills/ids"
import { droneDotSpec } from "../../src/data/skills/silkbind-jade/droneTick"
import type { GearPiece, GearSlot, Inputs } from "../../src/engine/types"

const CLASS = "silkbindJade"
const FREQUENT_AND_SPECIAL = [ATTUNE.umbFrequentProjectile, ATTUNE.umbSpecial]
const skills = builtinSkillsForClass(CLASS)
const skillTags = (skillId: string): string[] =>
  (skills.find((skill) => skill.id === skillId)!.tags ?? []).filter((tag) =>
    tag.startsWith("attune:"),
  )

function jadeInputs(classSpecificAttunement: Record<string, number> = {}): Inputs {
  return { ...defaultInputs, classId: CLASS, classSpecificAttunement }
}

function armourPiece(level: GearPiece["level"], attunement: string, value: number): GearPiece {
  return {
    id: `piece-${level}-${attunement}`,
    slot: "helm" as GearSlot,
    level,
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
    hp: 0,
    physDef: 0,
    words: Array.from({ length: 5 }, () => ({ word: "", value: 0, retuned: false })) as never,
    attunement,
    attunementValue: value,
    relayed: false,
  }
}

describe("which Vernal Umbrella hits carry which attunement lines", () => {
  it("gives both Spring Away bullet skills Frequent Projectile and Charged, and the lift none", () => {
    for (const skillId of [SKILL.umblightcharge, SKILL.umblightcharge12]) {
      expect(skillTags(skillId), skillId).toEqual([ATTUNE.umbFrequentProjectile, ATTUNE.umbCharged])
    }
    expect(skillTags(SKILL.umblightchargeLift)).toEqual([])
  })

  it("gives every drone tick skill and every drone debuff dot Frequent Projectile and Special", () => {
    const droneSkillIds = skills
      .filter((skill) => /^silkbindJade-umbdrone(-\d+hit)?$/.test(skill.id))
      .map((skill) => skill.id)
    expect(droneSkillIds).toHaveLength(6)
    for (const skillId of droneSkillIds) {
      expect(skillTags(skillId), skillId).toEqual(FREQUENT_AND_SPECIAL)
    }
    const droneDebuffs = builtinDebuffsForClass(CLASS).filter((debuff) =>
      /^debuff-silkbindJade-umbdrone/.test(debuff.id),
    )
    expect(droneDebuffs).toHaveLength(6)
    for (const debuff of droneDebuffs) {
      expect(debuff.dot?.attuneTags, debuff.id).toEqual(FREQUENT_AND_SPECIAL)
    }
    expect(droneDotSpec(false).attuneTags).toEqual(FREQUENT_AND_SPECIAL)
    expect(droneDotSpec(true).attuneTags).toEqual(FREQUENT_AND_SPECIAL)
  })

  it("gives the Apricot Heaven skills only the Charged line", () => {
    for (const skillId of [
      SKILL.apricotHeavenNormal,
      SKILL.apricotHeavenEnhanced,
      SKILL.apricotHeavenRise,
    ]) {
      expect(skillTags(skillId), skillId).toEqual([ATTUNE.umbCharged])
    }
  })
})

describe("a drone tick takes both of its attunement lines", () => {
  it("multiplies by one plus the Special roll at 86 plus the Frequent Projectile roll at 96", () => {
    const tick = skills.find((skill) => skill.id === SKILL.umbdrone)!
    const art = hitToArtRow(tick.hits[0], tick)
    const rolled = jadeInputs({ umbSpecial: 0.04, umbFrequentProjectile: 0.05 })
    const damage = (inputs: Inputs) =>
      computeSkillDamage(art, buildContext(inputs), 1).expectedDamage
    const bare = damage(jadeInputs())
    expect(damage(rolled)).toBeCloseTo(bare * 1.09, 6)
    expect(damage(jadeInputs({ umbSpecial: 0.04 }))).toBeCloseTo(bare * 1.04, 6)
  })
})

describe("which gear levels roll the Vernal Umbrella lines", () => {
  const offered = (level: GearPiece["level"]) =>
    attunementsFor("helm", CLASS, level)
      .map((option) => option.id)
      .filter((id) => id.startsWith("umb"))
      .sort()

  it("offers Charged and Special at 86 and 91 only", () => {
    for (const level of [86, 91] as const) {
      expect(offered(level)).toEqual(["umbCharged", "umbQ", "umbSpecial"])
    }
    for (const level of [96, 100, 105] as const) {
      expect(offered(level)).not.toContain("umbCharged")
      expect(offered(level)).not.toContain("umbSpecial")
    }
  })

  it("offers Frequent Projectile and Light/Heavy & Varied Combo at 96 to 105 only", () => {
    for (const level of [96, 100, 105] as const) {
      expect(offered(level)).toEqual(["umbFrequentProjectile", "umbLightHeavyVariedCombo", "umbQ"])
    }
    for (const level of [86, 91] as const) {
      expect(offered(level)).not.toContain("umbFrequentProjectile")
      expect(offered(level)).not.toContain("umbLightHeavyVariedCombo")
    }
  })

  it("keeps a level-96 piece storing Charged as stored and scores nothing for it", () => {
    const piece = armourPiece(96, "umbCharged", 0.05)
    const paths = computeGearContribution(piece, jadeInputs()).map((entry) => entry.path)
    expect(paths.some((path) => path.includes("umbCharged"))).toBe(false)
    expect(piece.attunement).toBe("umbCharged")
    expect(piece.attunementValue).toBe(0.05)
    expect(
      computeGearContribution(armourPiece(91, "umbCharged", 0.05), jadeInputs()).map(
        (entry) => entry.path,
      ),
    ).toContain("classSpecificAttunement.umbCharged")
  })
})
