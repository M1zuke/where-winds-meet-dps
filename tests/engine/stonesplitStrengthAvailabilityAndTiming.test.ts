// Scoped to Stonesplit Strength's user-placed modules; not a measured DPS
// anchor (docs/TESTING.md § "Class scoping").
import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass, groupBuffDefs } from "../../src/engine/buffs/data"
import { defaultInputs } from "../../src/engine/defaults"
import { hitDealsDamage } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { simulateTimeline } from "../../src/engine/timeline"
import type { Inputs } from "../../src/engine/types"
import { BUFF, PARAM } from "../../src/data/skills/buffs/ids"
import { CAST } from "../../src/data/skills/ids"
import { SKILL } from "../../src/data/skills/stonesplit-strength/ids"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import { builtinSkill, testRotation } from "../builtins"

const CLASS_ID = "stonesplitStrength"
const stonesplitSkill = (skillId: string) => builtinSkill(CLASS_ID, skillId)

const frostCladNight = (tier: number): Inputs["mindMethods"] => [
  { id: INNER_WAY_ID.frostCladNight, name: "Frost-Clad Night", stacks: String(tier) },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function runRotation(skillIds: readonly string[], tier = 6) {
  const steps = skillIds.map((skillId) => makeStep({ skillId }))
  const result = simulateTimeline({
    ...defaultInputs,
    classId: CLASS_ID,
    set: null,
    mindMethods: frostCladNight(tier),
    activeCustomRotation: testRotation(CLASS_ID, { steps }),
  })
  return { result, steps }
}

const failedBuffIds = (
  rotationRun: ReturnType<typeof runRotation>,
  stepIndex: number,
): string[] => {
  const reasons = rotationRun.result.invalidStepReasons?.[rotationRun.steps[stepIndex]!.id] ?? []
  return reasons.flatMap((reason) => ("id" in reason ? [reason.id] : []))
}

const invalidCount = (rotationRun: ReturnType<typeof runRotation>): number =>
  rotationRun.result.invalidStepIds?.length ?? 0

describe("Snowbreak Spring", () => {
  const snowbreakSpring = stonesplitSkill(SKILL.snowpartingvc)

  it("takes the lockout and the marker at the press, offers Forgetfulness 30 f in and strikes on frame 34", () => {
    expect(snowbreakSpring.hits.map((hit) => hit.frame)).toEqual([0, 30, 34])
    expect(snowbreakSpring.hits.map(hitDealsDamage)).toEqual([false, false, true])
    const [press, offer, strike] = snowbreakSpring.hits
    expect(press!.triggers.map((trigger) => [trigger.kind, trigger.targetId])).toEqual([
      ["applyBuff", BUFF.snowbreakSpringCooldown],
      ["clearStatus", BUFF.snowbreakSpringAvailable],
    ])
    expect(offer!.triggers).toMatchObject([
      {
        kind: "applyBuff",
        targetId: BUFF.forgetfulness,
        condition: { buffId: BUFF.forgetfulnessCooldown, op: "eq", stacks: 0 },
      },
    ])
    expect([
      strike!.physMultiplier,
      strike!.attributeMultiplier,
      strike!.physFixed,
      strike!.attributeFixed,
    ]).toEqual([2.07686, 3.11529, 575, 313])
  })

  it("resets the cooldown and offers Forgetfulness unconditionally on an Exhausted-phase strike", () => {
    const strike = snowbreakSpring.hits[2]!
    expect(strike.triggers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "applyBuff",
          targetId: BUFF.forgetfulness,
          phase: "exhausted",
          condition: null,
        }),
        expect.objectContaining({
          kind: "clearStatus",
          targetId: BUFF.forgetfulnessCooldown,
          phase: "exhausted",
        }),
      ]),
    )
  })

  it("spends Inner Passion at the press and still pays the 1.76 ratio on the strike 34 f later", () => {
    const engine = new BuffEngine(
      { classId: CLASS_ID, [PARAM.frostCladNight]: true, frostCladNightTier: 6 },
      buffDefsForClass(CLASS_ID),
      groupBuffDefs(),
    )
    engine.processSkillCast(CAST.snowpartingSpecial, 0, { castTime: 1 }, false, [BUFF.innerPassion])
    const stacksBefore = engine.getHistoricalBuffStacks(BUFF.innerPassion, 1.5)
    const press = engine.processSkillCast(CAST.snowpartingVC, 2, {
      consumesInnerPassion: true,
      castTime: 52 / 60,
      hitCount: 3,
    })
    expect(engine.getHistoricalBuffStacks(BUFF.innerPassion, 2.1)).toBe(stacksBefore - 1)
    const strike = engine.calculateDamageEffects(snowbreakSpring, 2 + 34 / 60, press.buffIds)
    expect(strike.damageFactor).toBeCloseTo(1.76, 9)
  })

  it("is legal after a Dual-Weapon Skill and spends the marker", () => {
    const once = runRotation([SKILL.snowpartingdual, SKILL.snowpartingvc])
    expect(invalidCount(once)).toBe(0)

    const twice = runRotation([SKILL.snowpartingdual, SKILL.snowpartingvc, SKILL.snowpartingvc])
    expect(failedBuffIds(twice, 2)).toEqual(
      expect.arrayContaining([BUFF.snowbreakSpringAvailable, BUFF.snowbreakSpringCooldown]),
    )
  })

  it("stays shut for 2 s after a cast unless Forgetfulness' Grave Frost lifts the lockout", () => {
    const deflected = runRotation([
      SKILL.snowpartingdual,
      SKILL.snowpartingvc,
      SKILL.deflect,
      SKILL.snowpartingvc,
    ])
    expect(failedBuffIds(deflected, 3)).toEqual([BUFF.snowbreakSpringCooldown])

    const lifted = runRotation([
      SKILL.snowpartingdual,
      SKILL.snowpartingvc,
      SKILL.snowpartingchargedForgetfulness,
      SKILL.snowpartingvc,
    ])
    expect(invalidCount(lifted)).toBe(0)
  })
})

describe("Forgetfulness' Grave Frost", () => {
  it("needs the window Snowbreak Spring offers, and spends it with the cooldown starting at the press", () => {
    expect(failedBuffIds(runRotation([SKILL.snowpartingchargedForgetfulness]), 0)).toEqual([
      BUFF.forgetfulness,
    ])

    const offered = runRotation([
      SKILL.snowpartingdual,
      SKILL.snowpartingvc,
      SKILL.snowpartingchargedForgetfulness,
    ])
    expect(invalidCount(offered)).toBe(0)

    const twice = runRotation([
      SKILL.snowpartingdual,
      SKILL.snowpartingvc,
      SKILL.snowpartingchargedForgetfulness,
      SKILL.snowpartingchargedForgetfulness,
    ])
    expect(failedBuffIds(twice, 3)).toEqual(
      expect.arrayContaining([BUFF.forgetfulness, BUFF.forgetfulnessCooldown]),
    )
  })

  it("is the form the press resolves to, so the held form is flagged while it is on offer", () => {
    const held = runRotation([SKILL.snowpartingdual, SKILL.snowpartingvc, SKILL.snowpartingcharged])
    expect(invalidCount(held)).toBe(1)

    const unoffered = runRotation([SKILL.snowpartingdual, SKILL.snowpartingcharged])
    expect(invalidCount(unoffered)).toBe(0)
  })

  it("grants the Snowbreak Spring marker on its own frame in either form", () => {
    const markerFrame = (skillId: string) => {
      const grantingHit = stonesplitSkill(skillId).hits.find((hit) =>
        hit.triggers.some((trigger) => trigger.targetId === BUFF.snowbreakSpringAvailable),
      )!
      return [grantingHit.frame, hitDealsDamage(grantingHit)]
    }
    expect(markerFrame(SKILL.snowpartingcharged)).toEqual([83, false])
    expect(markerFrame(SKILL.snowpartingchargedForgetfulness)).toEqual([44, false])
  })
})

describe("Total Annihilation", () => {
  it("lands 18.65 f after a 7 f lead, and ends 42 f after it", () => {
    const plain = stonesplitSkill(SKILL.phalanxq)
    expect(plain.hits.map((hit) => hit.frame)).toEqual([26])
    expect(plain.castFrames).toBe(49)
    expect(plain.triggersBuffsAtFrame).toEqual({ [BUFF.jadeware]: 7 })
  })

  it("carries the 179.76 f Soul Burning hold of its Supreme form in its frames", () => {
    const supreme = stonesplitSkill(SKILL.phalanxqSupreme)
    expect(supreme.hits.map((hit) => hit.frame)).toEqual([194])
    expect(supreme.castFrames).toBe(222)
    expect(supreme.triggersBuffsAtFrame).toEqual({
      [BUFF.totalAnnihilationSupremeShield]: 222,
      [BUFF.jadeware]: 180,
    })
  })
})

describe("Jadeware", () => {
  const firing = (skillId: string) =>
    (stonesplitSkill(skillId).triggersBuffs ?? []).includes(BUFF.jadeware)

  it("fires off the class-108 skills only", () => {
    for (const skillId of [
      SKILL.snowpartingslide,
      SKILL.snowpartingslidePrepull,
      SKILL.snowpartingslidePrepullHit,
      SKILL.snowpartingqStab,
      SKILL.snowpartingqSlash,
      SKILL.phalanxq,
      SKILL.phalanxqSupreme,
    ])
      expect(firing(skillId), skillId).toBe(true)
    for (const skillId of [
      SKILL.snowpartingspecial,
      SKILL.snowpartingvc,
      SKILL.snowpartingcharged,
      SKILL.phalanxchargedS3,
    ])
      expect(firing(skillId), skillId).toBe(false)
  })
})

describe("Charge Enhancement", () => {
  const exhausted = () =>
    new BuffEngine(
      {
        classId: CLASS_ID,
        steadfastDevotion: true,
        steadfastDevotionTier: 6,
        qiBreakTime: 0,
        bossBreakDuration: 100,
      },
      buffDefsForClass(CLASS_ID),
      groupBuffDefs(),
    )

  const release = (target: BuffEngine, time: number, lastHitSec: number, consumes = false) =>
    target.processSkillCast(
      CAST.phalanxChargedS3,
      time,
      { castTime: 3, lastHitSec, ...(consumes && { consumesInnerPassionBurningHeart: true }) },
      false,
      [BUFF.chargeEnhancement],
    )

  it("is granted by the cast's last landed hit, not at its start or end", () => {
    const engine = exhausted()
    release(engine, 1, 2)
    expect(engine.getHistoricalBuffStacks(BUFF.chargeEnhancement, 2.9)).toBe(0)
    expect(engine.getHistoricalBuffStacks(BUFF.chargeEnhancement, 3.1)).toBe(3)
    expect(engine.getHistoricalBuffStacks(BUFF.chargeEnhancement, 20.9)).toBe(3)
    expect(engine.getHistoricalBuffStacks(BUFF.chargeEnhancement, 21.1)).toBe(0)
  })

  it("counts its 30 s cooldown from the grant, never from a stack spent", () => {
    const engine = exhausted()
    release(engine, 1, 2)
    release(engine, 5, 1, true)
    expect(engine.getHistoricalBuffStacks(BUFF.chargeEnhancement, 5.5)).toBe(2)
    release(engine, 31, 2.5)
    expect(engine.getHistoricalBuffStacks(BUFF.chargeEnhancement, 34)).toBe(3)
  })

  it("holds a second grant back until 30 s after the first", () => {
    const engine = exhausted()
    release(engine, 1, 2)
    release(engine, 10, 2)
    expect(engine.getHistoricalBuffStacks(BUFF.chargeEnhancement, 25)).toBe(0)
  })
})
