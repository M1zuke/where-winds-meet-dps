import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { classDefinition } from "../../src/definitions/classes/registry"
import {
  DEFAULT_PREFERRED_DISTANCE_METERS,
  applyDisplacement,
  distanceAtCastStart,
} from "../../src/engine/distance"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"

const CLASS = "bellstrikeUmbra"

const skillOf = (skillId: string) =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === skillId)!

const endDistanceFrom = (skillId: string, startMeters: number) =>
  applyDisplacement(skillOf(skillId).displacement, startMeters)

const castStartMeters = (skillId: string) =>
  distanceAtCastStart(
    skillOf(skillId),
    classDefinition(CLASS)!.defaultMeleeReachMeters ?? 0,
    DEFAULT_PREFERRED_DISTANCE_METERS,
    DEFAULT_PREFERRED_DISTANCE_METERS,
  )

describe("Sword Charge release passes through the target", () => {
  it.each([
    [SKILL.swordChargeStage11Hit, 1.274],
    [SKILL.swordChargeStage12Hit, 7.257],
    [SKILL.swordChargeStage13Hit, 7.38],
    [SKILL.swordChargeStage14Hit, 7.5],
    [SKILL.swordChargeStage24Hit, 7.5],
    [SKILL.swordChargeStage15Hit, 8.436],
    [SKILL.swordChargeStage25Hit, 8.435],
  ])("%s ends |d - %d| from the target at 3 m and 12 m", (skillId, meters) => {
    expect(castStartMeters(skillId)).toBeCloseTo(Math.abs(3 - meters), 6)
    expect(endDistanceFrom(skillId, 12)).toBeCloseTo(Math.abs(12 - meters), 6)
  })

  it.each([
    [SKILL.swordChargeStage12Hit, 8.7],
    [SKILL.swordChargeStage13Hit, 8.7],
    [SKILL.swordChargeStage14Hit, 8.7],
    [SKILL.swordChargeStage24Hit, 8.7],
    [SKILL.swordChargeStage15Hit, 11],
    [SKILL.swordChargeStage25Hit, 11],
  ])("%s dashes %d m forward from 7 m", (skillId, meters) => {
    expect(endDistanceFrom(skillId, 7)).toBeCloseTo(Math.abs(7 - meters), 6)
  })

  it("keeps the 1-hit form's earlier reading between 6 and 9 m", () => {
    expect(endDistanceFrom(SKILL.swordChargeStage11Hit, 7)).toBeCloseTo(1, 6)
  })

  it("stays in place through the hold and moves from the release", () => {
    const displacement = skillOf(SKILL.swordChargeStage12Hit).displacement!
    expect(applyDisplacement(displacement, 12, 30)).toBeCloseTo(12, 6)
    expect(applyDisplacement(displacement, 12, 50)).toBeCloseTo(12 - 6.813, 6)
  })
})

describe("Sword Charge level 0", () => {
  it("stays under 1.5 m, stops 1.1 m short from 1.5 to 3 m, and follows its animation from 3 m", () => {
    const level0 = SKILL.swordChargeStage1Level0
    expect(endDistanceFrom(level0, 1)).toBeCloseTo(1, 6)
    expect(endDistanceFrom(level0, 2)).toBeCloseTo(1.1, 6)
    expect(endDistanceFrom(level0, 7)).toBeCloseTo(7 - 2.041, 6)
    expect(endDistanceFrom(level0, 12)).toBeCloseTo(12 - 2.041, 6)
  })

  it("stops at body contact from the default 3 m distance", () => {
    expect(castStartMeters(SKILL.swordChargeStage1Level0)).toBeCloseTo(1, 6)
  })
})

describe("forward moves stop at body contact", () => {
  it.each([
    [SKILL.swordqfollowup, 3.96],
    [SKILL.swordqFollowUp2HitCancel, 2.442],
    [SKILL.swordqFollowUp1HitCancel, 0.875],
    [SKILL.swordRChargeFollowUp, 6.823],
    [SKILL.swordRChargeFollowUp1HitCancel, 1.386],
    [SKILL.swordMartialQqq, 1.244],
    [SKILL.swordHeavy2, 2.9],
    [SKILL.swordHeavy3, 2.176],
  ])("%s covers %d m at most", (skillId, meters) => {
    expect(castStartMeters(skillId)).toBeCloseTo(Math.max(3 - meters, 1), 6)
    expect(endDistanceFrom(skillId, 7)).toBeCloseTo(Math.max(7 - meters, 1), 6)
    expect(endDistanceFrom(skillId, 12)).toBeCloseTo(Math.max(12 - meters, 1), 6)
  })

  it("never pushes a player already inside contact range away", () => {
    expect(endDistanceFrom(SKILL.swordRChargeFollowUp, 0.4)).toBeCloseTo(0.4, 6)
  })

  it("covers 3.966 m in the Sword Horizon variant that ends at 61 f", () => {
    const variant = skillOf(SKILL.swordqfollowup).hits[0]!.variants![0]!
    expect(applyDisplacement(variant.displacement, 12)).toBeCloseTo(12 - 3.966, 6)
  })
})

describe("Inner Balance Strike backward moves grow the distance", () => {
  it.each([
    [SKILL.swordspecial1Hit, 0.902],
    [SKILL.swordspecial2Hit, 1.421],
    [SKILL.swordspecial3Hit, 3.708],
    [SKILL.swordspecial4Hit, 3.708],
  ])("%s moves %d m away", (skillId, meters) => {
    expect(castStartMeters(skillId)).toBeCloseTo(3 + meters, 6)
    expect(endDistanceFrom(skillId, 7)).toBeCloseTo(7 + meters, 6)
    expect(endDistanceFrom(skillId, 12)).toBeCloseTo(12 + meters, 6)
  })
})

describe("Inner Track Slash and Crosswind Blade distance bands", () => {
  it("snaps 1.5 m from the target between 2.5 and 10 m and follows its animation outside", () => {
    expect(endDistanceFrom(SKILL.swordq, 3)).toBeCloseTo(1.5, 6)
    expect(endDistanceFrom(SKILL.swordq, 7)).toBeCloseTo(1.5, 6)
    expect(endDistanceFrom(SKILL.swordq, 2)).toBeCloseTo(1.2, 6)
    expect(endDistanceFrom(SKILL.swordq, 12)).toBeCloseTo(11.2, 6)
  })

  it.each([SKILL.crosswindBlade, SKILL.crosswindBladeCancel])(
    "%s dashes 11 m forward from 6 to 9 m and stays elsewhere",
    (skillId) => {
      expect(endDistanceFrom(skillId, 7)).toBeCloseTo(4, 6)
      expect(endDistanceFrom(skillId, 3)).toBeCloseTo(3, 6)
      expect(endDistanceFrom(skillId, 12)).toBeCloseTo(12, 6)
    },
  )
})
