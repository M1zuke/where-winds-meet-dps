import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { classDefinition } from "../../src/definitions/classes/registry"
import {
  DEFAULT_PREFERRED_DISTANCE_METERS,
  applyDisplacement,
  distanceAtCastStart,
  distanceReaderAtCast,
} from "../../src/engine/distance"
import { projectileTravelFrames, resolvedHitFrame } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import { VAGRANT_SWORD_WAVE_PROJECTILE } from "../../src/data/skills/bellstrike-splendor/vagrantSwordBolts"

const CLASS = "bellstrikeSplendor"

const skillOf = (skillId: string) =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === skillId)!

const defaultMeleeReach = classDefinition(CLASS)!.defaultMeleeReachMeters ?? 0

const castStartMeters = (skillId: string) =>
  distanceAtCastStart(
    skillOf(skillId),
    defaultMeleeReach,
    DEFAULT_PREFERRED_DISTANCE_METERS,
    DEFAULT_PREFERRED_DISTANCE_METERS,
  )

const variantDisplacement = (skillId: string) =>
  skillOf(skillId).hits[0]!.variants![0]!.displacement

const singleBoltForms = [
  [SKILL.swordHeavyCharged, 1.274],
  [SKILL.swordHeavyChargedTier1, 1.274],
  [SKILL.swordHeavyChargedWushuang, 1.274],
  [SKILL.swordHeavyChargedTier1Wushuang, 1.274],
  [SKILL.swordHeavyChargedPrepull, 1.274],
  [SKILL.swordHeavyCharged2Hit, 0.81],
  [SKILL.swordHeavyCharged2HitWushuang, 0.81],
] as const

const threeWaveForms = [
  SKILL.swordHeavyCharged,
  SKILL.swordHeavyChargedWushuang,
  SKILL.swordHeavyChargedPrepull,
]

describe("Vagrant Sword root motion", () => {
  it.each(singleBoltForms)(
    "%s moves %d m along the facing by its cast's end",
    (skillId, meters) => {
      const displacement = skillOf(skillId).displacement!
      expect(displacement.kind).toBe("rootMotion")
      expect(applyDisplacement(displacement, 3)).toBeCloseTo(3 - meters, 6)
      expect(applyDisplacement(displacement, 7)).toBeCloseTo(7 - meters, 6)
      expect(applyDisplacement(displacement, 12)).toBeCloseTo(12 - meters, 6)
    },
  )

  it.each(threeWaveForms)("%s moves 1.405 m in its three-wave form", (skillId) => {
    const displacement = variantDisplacement(skillId)!
    expect(applyDisplacement(displacement, 3)).toBeCloseTo(3 - 1.405, 6)
    expect(applyDisplacement(displacement, 12)).toBeCloseTo(12 - 1.405, 6)
  })

  it("stays still through the hold and starts moving at the release", () => {
    const displacement = skillOf(SKILL.swordHeavyChargedTier1).displacement!
    expect(applyDisplacement(displacement, 12, 40)).toBeCloseTo(12, 6)
    expect(applyDisplacement(displacement, 12, 60)).toBeCloseTo(12 - 0.543, 6)
  })

  it("leaves 1.726 m from the default 3 m distance", () => {
    expect(castStartMeters(SKILL.swordHeavyChargedTier1)).toBeCloseTo(1.726, 6)
  })

  it("never pushes a player already at body contact away", () => {
    const displacement = skillOf(SKILL.swordHeavyChargedTier1).displacement!
    expect(applyDisplacement(displacement, 1.2)).toBeCloseTo(1, 6)
    expect(applyDisplacement(displacement, 0.5)).toBeCloseTo(0.5, 6)
  })
})

describe("Energy Surge root motion", () => {
  it("moves 1.405 m along the facing by its cast's end", () => {
    const displacement = skillOf(SKILL.energySurge).displacement!
    expect(applyDisplacement(displacement, 3)).toBeCloseTo(1.595, 6)
    expect(applyDisplacement(displacement, 7)).toBeCloseTo(5.595, 6)
    expect(applyDisplacement(displacement, 12)).toBeCloseTo(10.595, 6)
  })

  it("leaves 1.595 m from the default 3 m distance", () => {
    expect(castStartMeters(SKILL.energySurge)).toBeCloseTo(1.595, 6)
  })

  it("flies each wave from where the player stands as it launches, not from where the cast ends", () => {
    const energySurge = skillOf(SKILL.energySurge)
    const reader = distanceReaderAtCast(
      energySurge,
      defaultMeleeReach,
      DEFAULT_PREFERRED_DISTANCE_METERS,
      DEFAULT_PREFERRED_DISTANCE_METERS,
    )
    const firstWave = energySurge.hits[0]!
    const holds = () => false
    const flightAtLaunch = projectileTravelFrames(
      VAGRANT_SWORD_WAVE_PROJECTILE,
      3 - (0.198 + (0.115 * 0.06) / 2),
    )
    expect(resolvedHitFrame(firstWave, holds, reader)).toBeCloseTo(6.06 + flightAtLaunch, 6)
    expect(resolvedHitFrame(firstWave, holds, reader)).toBeGreaterThan(
      resolvedHitFrame(firstWave, holds, reader(Infinity)),
    )
  })
})

describe("Shadow Step root motion", () => {
  it("hops backward 3.4 m, growing the distance", () => {
    const displacement = skillOf(SKILL.swordSpecial).displacement!
    expect(applyDisplacement(displacement, 3)).toBeCloseTo(6.4, 6)
    expect(applyDisplacement(displacement, 12)).toBeCloseTo(15.4, 6)
  })

  it("leaves 6.4 m from the default 3 m distance", () => {
    expect(castStartMeters(SKILL.swordSpecial)).toBeCloseTo(6.4, 6)
  })
})

describe("sword heavy attack root motion", () => {
  it("closes to body contact from the default 3 m distance", () => {
    expect(castStartMeters(SKILL.swordHeavyAttack)).toBeCloseTo(1, 6)
  })

  it("keeps closing from 12 m by the chain's 7.117 m", () => {
    expect(applyDisplacement(skillOf(SKILL.swordHeavyAttack).displacement!, 12)).toBeCloseTo(
      12 - 7.117,
      6,
    )
  })
})
