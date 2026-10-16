import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { classDefinition } from "../../src/definitions/classes/registry"
import {
  DEFAULT_PREFERRED_DISTANCE_METERS,
  applyDisplacement,
  distanceAtCastStart,
} from "../../src/engine/distance"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"

const CLASS = "bellstrikeSplendor"

const castStartMeters = (skillId: string) =>
  distanceAtCastStart(
    builtinSkillsForClass(CLASS).find((skill) => skill.id === skillId)!,
    classDefinition(CLASS)!.defaultMeleeReachMeters ?? 0,
    DEFAULT_PREFERRED_DISTANCE_METERS,
    DEFAULT_PREFERRED_DISTANCE_METERS,
  )

const vagrantSwordForms = [
  SKILL.swordHeavyCharged,
  SKILL.swordHeavyCharged2Hit,
  SKILL.swordHeavyChargedTier1,
  SKILL.swordHeavyChargedWushuang,
  SKILL.swordHeavyCharged2HitWushuang,
  SKILL.swordHeavyChargedTier1Wushuang,
  SKILL.swordHeavyChargedPrepull,
]

describe("Vagrant Sword displacement", () => {
  it.each(vagrantSwordForms)("%s scales its root motion toward the target by 1.75 m", (skillId) => {
    const skill = builtinSkillsForClass(CLASS).find((candidate) => candidate.id === skillId)!
    expect(skill.displacement).toEqual({ kind: "towardTarget", referenceMeters: 1.75 })
  })

  it("leaves 1.25 m from the default 3 m distance", () => {
    expect(castStartMeters(SKILL.swordHeavyChargedTier1)).toBeCloseTo(1.25, 6)
  })

  it("only shrinks the distance by 1.75 m from 9 to 20 m, with no 8 m dash", () => {
    const skill = builtinSkillsForClass(CLASS).find(
      (candidate) => candidate.id === SKILL.swordHeavyChargedTier1,
    )!
    for (const distanceMeters of [9, 12, 20]) {
      expect(applyDisplacement(skill.displacement, distanceMeters)).toBeCloseTo(
        distanceMeters - 1.75,
        6,
      )
    }
  })
})

describe("Energy Surge displacement", () => {
  it("scales its root motion toward the target by 1 m", () => {
    const skill = builtinSkillsForClass(CLASS).find(
      (candidate) => candidate.id === SKILL.energySurge,
    )!
    expect(skill.displacement).toEqual({ kind: "towardTarget", referenceMeters: 1 })
  })

  it("leaves 2 m from the default 3 m distance", () => {
    expect(castStartMeters(SKILL.energySurge)).toBeCloseTo(2, 6)
  })
})
