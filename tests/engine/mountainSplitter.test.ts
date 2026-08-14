import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass, groupBuffDefs } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"
import { BUFF, PARAM } from "../../src/data/skills/buffs/ids"
import { CAST, PROP, ROLE, WEAPON } from "../../src/data/skills/ids"

const CLASS = "stonesplitStrength"

function engine(tier: number, overrides: Record<string, unknown> = {}) {
  return new BuffEngine(
    { classId: CLASS, steadfastDevotion: true, steadfastDevotionTier: tier, ...overrides },
    buffDefsForClass(CLASS),
    groupBuffDefs(),
  )
}

function skill(name: string, tags: string[], castTag: string, receives: string[] = []) {
  return makeSkill(CLASS, {
    name,
    castTag,
    weaponOrAttribute: "Modao",
    attributeAttack: "Stonesplit",
    tags,
    receives,
  })
}

const phalanxCharged = () =>
  skill(
    "PhalanxCharged-S3",
    [WEAPON.moBlade, ROLE.phalanxCharged, PROP.consumesInnerPassionBurningHeart],
    CAST.phalanxChargedS3,
    [BUFF.mountainSplitter],
  )

const anxiMoJump = () =>
  skill(
    "AnxiSoldierMoJump",
    [WEAPON.moBlade, ROLE.anxiSoldier, ROLE.anxiSoldierMoJump],
    CAST.anxiSoldierMoJump,
    [BUFF.mountainSplitter],
  )

// Keyed by def id, so the class's flat 21% crit damage does not get counted as
// Mountain Splitter's contribution.
const splitterShare = (engineUnderTest: BuffEngine, target: ReturnType<typeof skill>, at: number) =>
  engineUnderTest.calculateDamageEffects(target, at).breakdown[BUFF.mountainSplitter] ?? 0

describe("Mountain Splitter — the tier 3 window", () => {
  it("opens only while Inner Passion is live, and only for a generated Anxi attack", () => {
    const live = engine(3)
    live.processSkillCast(CAST.snowpartingSpecial, 0, { castTime: 1 }, false, [BUFF.innerPassion])
    expect(live.getHistoricalBuffStacks(BUFF.innerPassion, 1.5)).toBeGreaterThan(0)
    live.processSkillCast(CAST.anxiSoldierMoJump, 1.5, {}, true, [BUFF.mountainSplitter])
    expect(live.isBuffActive(BUFF.mountainSplitter, 2)).toBe(true)

    const withoutPassion = engine(3)
    withoutPassion.processSkillCast(CAST.anxiSoldierMoJump, 1.5, {}, true, [BUFF.mountainSplitter])
    expect(withoutPassion.isBuffActive(BUFF.mountainSplitter, 2)).toBe(false)
  })

  it("opts generated casts IN rather than shutting rotation casts out", () => {
    const rotationCast = engine(3)
    rotationCast.processSkillCast(CAST.snowpartingSpecial, 0, { castTime: 1 }, false, [
      BUFF.innerPassion,
    ])
    rotationCast.processSkillCast(CAST.anxiSoldierMoJump, 1.5, {}, false, [BUFF.mountainSplitter])
    expect(rotationCast.isBuffActive(BUFF.mountainSplitter, 2)).toBe(true)
  })

  it("is unavailable below tier 3", () => {
    const belowTier = engine(2)
    belowTier.processSkillCast(CAST.snowpartingSpecial, 0, { castTime: 1 }, false, [
      BUFF.innerPassion,
    ])
    belowTier.processSkillCast(CAST.anxiSoldierMoJump, 1.5, {}, true, [BUFF.mountainSplitter])
    expect(belowTier.isBuffActive(BUFF.mountainSplitter, 2)).toBe(false)
  })

  it("holds a 15-second cooldown on that activation route", () => {
    const cooling = engine(3)
    cooling.processSkillCast(CAST.snowpartingSpecial, 0, { castTime: 1 }, false, [
      BUFF.innerPassion,
    ])
    cooling.processSkillCast(CAST.anxiSoldierMoJump, 1.5, {}, true, [BUFF.mountainSplitter])
    const firstApplied = cooling.getHistoricalBuffStacks(BUFF.mountainSplitter, 2)
    cooling.processSkillCast(CAST.anxiSoldierMoJump, 12, {}, true, [BUFF.mountainSplitter])
    expect(cooling.isBuffActive(BUFF.mountainSplitter, 13)).toBe(false)
    expect(firstApplied).toBeGreaterThan(0)

    cooling.processSkillCast(CAST.snowpartingSpecial, 16, { castTime: 1 }, false, [
      BUFF.innerPassion,
    ])
    cooling.processSkillCast(CAST.anxiSoldierMoJump, 17.5, {}, true, [BUFF.mountainSplitter])
    expect(cooling.isBuffActive(BUFF.mountainSplitter, 18)).toBe(true)
  })

  it("reaches Phalanx Charged and the two Modao Anxi attacks, and nothing else", () => {
    const live = engine(3)
    live.processSkillCast(CAST.snowpartingSpecial, 0, { castTime: 1 }, false, [BUFF.innerPassion])
    live.processSkillCast(CAST.anxiSoldierMoJump, 1.5, {}, true, [BUFF.mountainSplitter])

    expect(splitterShare(live, phalanxCharged(), 2)).toBeCloseTo(0.1, 9)
    expect(splitterShare(live, anxiMoJump(), 2)).toBeCloseTo(0.1, 9)

    const unaffected = skill("SnowpartingSlide", [WEAPON.hengBlade], CAST.snowpartingSlide)
    expect(splitterShare(live, unaffected, 2)).toBe(0)
  })

  it("carries a final-crit rule that fires at 75% and adds 15 points below it", () => {
    const live = engine(3)
    live.processSkillCast(CAST.snowpartingSpecial, 0, { castTime: 1 }, false, [BUFF.innerPassion])
    live.processSkillCast(CAST.anxiSoldierMoJump, 1.5, {}, true, [BUFF.mountainSplitter])
    const result = live.calculateDamageEffects(phalanxCharged(), 2)
    expect(result.conditionalFinalCrit).toEqual({ threshold: 0.75, bonusBelowThreshold: 0.15 })
  })
})

describe("Burning Heart — what a charge consumes, and what that grants", () => {
  it("drains Inner Passion before Charge Enhancement", () => {
    const both = engine(6, { [PARAM.frostCladNight]: true, frostCladNightTier: 6 })
    both.processSkillCast(CAST.snowpartingSpecial, 0, { castTime: 1 }, false, [BUFF.innerPassion])
    const passionBefore = both.getHistoricalBuffStacks(BUFF.innerPassion, 1.5)

    both.processSkillCast(CAST.phalanxChargedS3, 2, {
      consumesInnerPassionBurningHeart: true,
      castTime: 1,
    })
    expect(both.getHistoricalBuffStacks(BUFF.innerPassion, 2.5)).toBe(passionBefore - 1)
  })

  it("multiplies a consuming cast's damage by 1.32", () => {
    const consuming = engine(6, { [PARAM.frostCladNight]: true, frostCladNightTier: 6 })
    consuming.processSkillCast(CAST.snowpartingSpecial, 0, { castTime: 1 }, false, [
      BUFF.innerPassion,
    ])
    const cast = consuming.processSkillCast(CAST.phalanxChargedS3, 2, {
      consumesInnerPassionBurningHeart: true,
      castTime: 1,
    })
    const result = consuming.calculateDamageEffects(phalanxCharged(), 2, cast.buffIds)
    expect(result.damageFactor).toBeCloseTo(1.32, 9)
  })

  it("leaves a non-consuming cast at its plain damage", () => {
    const idle = engine(6, { [PARAM.frostCladNight]: true, frostCladNightTier: 6 })
    idle.processSkillCast(CAST.snowpartingSpecial, 0, { castTime: 1 }, false, [BUFF.innerPassion])
    const cast = idle.processSkillCast(CAST.phalanxChargedS3, 2, { castTime: 1 })
    expect(idle.calculateDamageEffects(phalanxCharged(), 2, cast.buffIds).damageFactor).toBe(1)
  })

  it("attaches Mountain Splitter only on the Charge Enhancement route, and propagates it", () => {
    const exhausted = engine(6, { qiBreakTime: 0, bossBreakDuration: 30 })
    exhausted.processSkillCast(CAST.phalanxChargedS3, 1, { castTime: 1 }, false, [
      BUFF.chargeEnhancement,
    ])
    expect(exhausted.getHistoricalBuffStacks(BUFF.chargeEnhancement, 3)).toBe(3)

    const cast = exhausted.processSkillCast(
      CAST.phalanxChargedS3,
      4,
      { consumesInnerPassionBurningHeart: true, castTime: 1 },
      false,
      [BUFF.chargeEnhancement],
    )
    expect(cast.buffIds).toContain(BUFF.mountainSplitter)
    expect(cast.propagatedBuffIds).toContain(BUFF.mountainSplitter)
    expect(exhausted.getHistoricalBuffStacks(BUFF.chargeEnhancement, 4.5)).toBe(2)
  })

  it("does not open the tier 3 window when Charge Enhancement is what was spent", () => {
    const exhausted = engine(6, { qiBreakTime: 0, bossBreakDuration: 30 })
    exhausted.processSkillCast(CAST.phalanxChargedS3, 1, { castTime: 1 }, false, [
      BUFF.chargeEnhancement,
    ])
    exhausted.processSkillCast(CAST.phalanxChargedS3, 4, {
      consumesInnerPassionBurningHeart: true,
      castTime: 1,
    })
    expect(exhausted.getHistoricalBuffStacks(BUFF.chargeEnhancement, 4.5)).toBe(2)
    expect(exhausted.isBuffActive(BUFF.mountainSplitter, 4.5)).toBe(false)
  })
})

describe("Charge Enhancement — the tier 6 pool", () => {
  it("grants three stacks for 18 seconds, and only during Qi break", () => {
    const exhausted = engine(6, { qiBreakTime: 0, bossBreakDuration: 30 })
    exhausted.processSkillCast(CAST.phalanxChargedS3, 1, { castTime: 1 }, false, [
      BUFF.chargeEnhancement,
    ])
    expect(exhausted.getHistoricalBuffStacks(BUFF.chargeEnhancement, 3)).toBe(3)
    expect(exhausted.getHistoricalBuffStacks(BUFF.chargeEnhancement, 21)).toBe(0)

    const normalPhase = engine(6, { qiBreakTime: 100, bossBreakDuration: 10 })
    normalPhase.processSkillCast(CAST.phalanxChargedS3, 1, { castTime: 1 }, false, [
      BUFF.chargeEnhancement,
    ])
    expect(normalPhase.getHistoricalBuffStacks(BUFF.chargeEnhancement, 3)).toBe(0)
  })

  it("is unavailable below tier 6", () => {
    const belowTier = engine(5, { qiBreakTime: 0, bossBreakDuration: 30 })
    belowTier.processSkillCast(CAST.phalanxChargedS3, 1, { castTime: 1 }, false, [
      BUFF.chargeEnhancement,
    ])
    expect(belowTier.getHistoricalBuffStacks(BUFF.chargeEnhancement, 3)).toBe(0)
  })
})
