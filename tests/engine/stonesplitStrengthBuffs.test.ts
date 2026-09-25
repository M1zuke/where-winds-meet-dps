import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass, groupBuffDefs } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"
import { builtinBuffsForClass } from "../../src/engine/builtinBuffs"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { BUFF, PARAM } from "../../src/data/skills/buffs/ids"
import { CAST, PROP, ROLE, WEAPON } from "../../src/data/skills/ids"
import { SKILL, STATUS } from "../../src/data/skills/stonesplit-strength/ids"
import {
  DREAD_DURATION_FRAMES,
  FEARFUL_BLADE_DURATION_FRAMES,
} from "../../src/data/classes/stonesplit-strength/gates"
import { cleftpeak } from "../../src/data/sets/cleftpeak"

const CLASS = "stonesplitStrength"

function engine(params: Record<string, unknown> = {}) {
  return new BuffEngine({ classId: CLASS, ...params }, buffDefsForClass(CLASS), groupBuffDefs())
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

const share = (
  engineUnderTest: BuffEngine,
  target: ReturnType<typeof skill>,
  at: number,
  defId: string,
) => engineUnderTest.calculateDamageEffects(target, at).breakdown[defId] ?? 0

const statOf = (
  engineUnderTest: BuffEngine,
  target: ReturnType<typeof skill>,
  at: number,
  statKey: string,
) =>
  engineUnderTest
    .calculateDamageEffects(target, at)
    .effects.filter((effect) => effect.statKey === statKey)
    .reduce((total, effect) => total + effect.amount, 0)

describe("Throat-Pierced", () => {
  const applying = () => skill("PhalanxQ", [WEAPON.moBlade, ROLE.phalanxQ], CAST.phalanxQ)
  const bystander = () => skill("SnowpartingSlide", [WEAPON.hengBlade], CAST.snowpartingSlide)

  it("stacks once per hit of an applying cast, to a ceiling of five", () => {
    const pierced = engine({ throatPierced: true, throatPiercedTier: 6 })
    pierced.processSkillCast(CAST.phalanxQ, 0, { hitCount: 3, castTime: 1, duration: 1 }, false, [
      BUFF.throatPierced,
    ])
    expect(pierced.getHistoricalBuffStacks(BUFF.throatPierced, 1.5)).toBe(3)
    pierced.processSkillCast(
      CAST.snowpartingQStab,
      2,
      { hitCount: 4, castTime: 1, duration: 1 },
      false,
      [BUFF.throatPierced],
    )
    expect(pierced.getHistoricalBuffStacks(BUFF.throatPierced, 3.5)).toBe(5)
  })

  it("takes stacks from every family that applies it, generated attacks included", () => {
    for (const castTag of [
      CAST.anxiSoldierHeng,
      CAST.anxiSoldierMoDown,
      CAST.anxiSoldierMoJump,
      CAST.anxiSoldierMoSweep,
      CAST.snowpartingQStab,
      CAST.snowpartingVC,
      CAST.phalanxChargedS3,
      CAST.phalanxQ,
    ]) {
      const pierced = engine({ throatPierced: true, throatPiercedTier: 6 })
      pierced.processSkillCast(castTag, 0, { castTime: 1 }, true, [BUFF.throatPierced])
      expect(pierced.getHistoricalBuffStacks(BUFF.throatPierced, 1.5), castTag).toBe(1)
    }
  })

  it("pays the applying families 3 points a stack and everything else 2", () => {
    const pierced = engine({ throatPierced: true, throatPiercedTier: 6 })
    pierced.processSkillCast(CAST.phalanxQ, 0, { hitCount: 5, castTime: 1, duration: 1 }, false, [
      BUFF.throatPierced,
    ])

    expect(statOf(pierced, applying(), 1.5, "phys.penetration")).toBeCloseTo(0.15, 9)
    expect(share(pierced, applying(), 1.5, BUFF.throatPierced)).toBeCloseTo(0.15 + 0.15, 9)
    expect(statOf(pierced, bystander(), 1.5, "phys.penetration")).toBeCloseTo(0.1, 9)
  })

  it("contributes nothing without the inner way slotted", () => {
    const unslotted = engine()
    unslotted.processSkillCast(CAST.phalanxQ, 0, { hitCount: 5, castTime: 1, duration: 1 }, false, [
      BUFF.throatPierced,
    ])
    expect(statOf(unslotted, applying(), 1.5, "phys.penetration")).toBe(0)
  })

  it("pays every hit the same 2 points a stack below tier 3, applying families included", () => {
    const pierced = engine({ throatPierced: true, throatPiercedTier: 2 })
    pierced.processSkillCast(CAST.phalanxQ, 0, { hitCount: 5, castTime: 1, duration: 1 }, false, [
      BUFF.throatPierced,
    ])
    expect(statOf(pierced, applying(), 1.5, "phys.penetration")).toBeCloseTo(0.1, 9)
    expect(statOf(pierced, bystander(), 1.5, "phys.penetration")).toBeCloseTo(0.1, 9)
  })

  it("lasts 8 s at rank 0, 15 s from tier 1", () => {
    const rankZero = engine({ throatPierced: true, throatPiercedTier: 0 })
    rankZero.processSkillCast(CAST.phalanxQ, 0, { hitCount: 1, castTime: 1, duration: 1 }, false, [
      BUFF.throatPierced,
    ])
    expect(rankZero.isBuffActiveAtTime(BUFF.throatPierced, 7)).toBe(true)
    expect(rankZero.isBuffActiveAtTime(BUFF.throatPierced, 9)).toBe(false)

    const tierOne = engine({ throatPierced: true, throatPiercedTier: 1 })
    tierOne.processSkillCast(CAST.phalanxQ, 0, { hitCount: 1, castTime: 1, duration: 1 }, false, [
      BUFF.throatPierced,
    ])
    expect(tierOne.isBuffActiveAtTime(BUFF.throatPierced, 14)).toBe(true)
    expect(tierOne.isBuffActiveAtTime(BUFF.throatPierced, 16)).toBe(false)
  })
})

describe("Cleftpeak", () => {
  const boosted = () =>
    skill("SnowpartingVC", [WEAPON.hengBlade, PROP.cleftpeakBoost], CAST.snowpartingVC, [
      BUFF.cleftpeakDeflect,
    ])
  const plain = () => skill("SnowpartingSlide", [WEAPON.hengBlade], CAST.snowpartingSlide)

  it("registers only while the set is equipped", () => {
    expect(engine({ armorSet: cleftpeak.siteKey }).definitions.has(BUFF.cleftpeakDeflect)).toBe(
      true,
    )
    expect(engine({ armorSet: "jadeware" }).definitions.has(BUFF.cleftpeakDeflect)).toBe(false)
  })

  it("adds a +1%/stack allDamageBoost on any damaging hit, reaching every skill", () => {
    const ridged = engine({ armorSet: cleftpeak.siteKey })
    for (let hit = 0; hit < 4; hit++) ridged.processDamageHit(hit * 0.1)
    expect(statOf(ridged, plain(), 0.5, "allDamageBoost")).toBeCloseTo(0.04, 9)

    ridged.processDamageHit(0.4)
    expect(statOf(ridged, plain(), 0.5, "allDamageBoost")).toBeCloseTo(0.05, 9)
  })

  it("adds a further +8% allDamageBoost at five stacks, only on the skills that carry the property", () => {
    const ridged = engine({ armorSet: cleftpeak.siteKey })
    for (let hit = 0; hit < 4; hit++) ridged.processDamageHit(hit * 0.1)
    expect(statOf(ridged, boosted(), 0.5, "allDamageBoost")).toBeCloseTo(0.04, 9)

    ridged.processDamageHit(0.4)
    expect(statOf(ridged, boosted(), 0.5, "allDamageBoost")).toBeCloseTo(0.05 + 0.08, 9)
    expect(statOf(ridged, plain(), 0.5, "allDamageBoost")).toBeCloseTo(0.05, 9)
  })

  it("lets its 5.1-second window lapse", () => {
    const ridged = engine({ armorSet: cleftpeak.siteKey })
    for (let hit = 0; hit < 5; hit++) ridged.processDamageHit(hit * 0.1)
    expect(statOf(ridged, boosted(), 6, "allDamageBoost")).toBe(0)
    expect(statOf(ridged, plain(), 6, "allDamageBoost")).toBe(0)
  })
})

describe("Iron Guards", () => {
  const any = () => skill("SnowpartingSlide", [WEAPON.hengBlade], CAST.snowpartingSlide)

  it("pays damage and both penetrations off Phalanx Special, on a 20-second cooldown", () => {
    const guarded = engine({ maxPhysAttack: 750 })
    guarded.processSkillCast(CAST.phalanxSpecial, 0, { castTime: 1 }, false, [BUFF.ironGuards])
    expect(statOf(guarded, any(), 1, "allDamageBoost")).toBeCloseTo(0.08, 9)
    expect(statOf(guarded, any(), 1, "phys.penetration")).toBeCloseTo(0.12, 9)
    expect(statOf(guarded, any(), 1, "stonesplit.penetration")).toBeCloseTo(0.12, 9)
    expect(statOf(guarded, any(), 41, "allDamageBoost")).toBe(0)
  })

  it("scales penetration by 1 point per full 62.5 Max Physical Attack, capped at 12", () => {
    const below = engine({ maxPhysAttack: 400 })
    below.processSkillCast(CAST.phalanxSpecial, 0, { castTime: 1 }, false, [BUFF.ironGuards])
    expect(statOf(below, any(), 1, "phys.penetration")).toBeCloseTo(0.06, 9)

    const overCap = engine({ maxPhysAttack: 2000 })
    overCap.processSkillCast(CAST.phalanxSpecial, 0, { castTime: 1 }, false, [BUFF.ironGuards])
    expect(statOf(overCap, any(), 1, "phys.penetration")).toBeCloseTo(0.12, 9)
  })

  it("lasts 30 s on a 20 s cooldown without Steadfast Devotion, 40 s on a 1 s cooldown with it", () => {
    const withoutSteadfastDevotion = engine({ maxPhysAttack: 750 })
    withoutSteadfastDevotion.processSkillCast(CAST.phalanxSpecial, 0, { castTime: 1 }, false, [
      BUFF.ironGuards,
    ])
    expect(withoutSteadfastDevotion.isBuffActiveAtTime(BUFF.ironGuards, 29)).toBe(true)
    expect(withoutSteadfastDevotion.isBuffActiveAtTime(BUFF.ironGuards, 31)).toBe(false)
    withoutSteadfastDevotion.processSkillCast(CAST.phalanxSpecial, 19, { castTime: 1 }, false, [
      BUFF.ironGuards,
    ])
    expect(withoutSteadfastDevotion.isBuffActiveAtTime(BUFF.ironGuards, 32)).toBe(false)

    const withSteadfastDevotion = engine({
      maxPhysAttack: 750,
      [PARAM.steadfastDevotion]: true,
      steadfastDevotionTier: 1,
    })
    withSteadfastDevotion.processSkillCast(CAST.phalanxSpecial, 0, { castTime: 1 }, false, [
      BUFF.ironGuards,
    ])
    expect(withSteadfastDevotion.isBuffActiveAtTime(BUFF.ironGuards, 39)).toBe(true)
    expect(withSteadfastDevotion.isBuffActiveAtTime(BUFF.ironGuards, 41)).toBe(false)
    withSteadfastDevotion.processSkillCast(CAST.phalanxSpecial, 2, { castTime: 1 }, false, [
      BUFF.ironGuards,
    ])
    expect(withSteadfastDevotion.isBuffActiveAtTime(BUFF.ironGuards, 41)).toBe(true)
  })
})

describe("the class's skill critical damage — steps by white Critical Rate", () => {
  const target = () => skill("SnowpartingSlide", [WEAPON.hengBlade], CAST.snowpartingSlide)

  it("is always on and reaches everything, at whatever the build's white Critical Rate scales to", () => {
    const plainEngine = engine({ whiteCritRate: 0.6 })
    expect(share(plainEngine, target(), 0, BUFF.stonesplitStrengthSkillCritDamage)).toBeCloseTo(
      0.21,
      9,
    )
  })

  it("steps by 1.4% per full 4% white Critical Rate below the cap", () => {
    const low = engine({ whiteCritRate: 0.2 })
    expect(share(low, target(), 0, BUFF.stonesplitStrengthSkillCritDamage)).toBeCloseTo(0.07, 9)

    const mid = engine({ whiteCritRate: 0.43 })
    expect(share(mid, target(), 0, BUFF.stonesplitStrengthSkillCritDamage)).toBeCloseTo(0.14, 9)
  })

  it("caps at 21% from 60% white Critical Rate on, and contributes nothing at 0", () => {
    const capped = engine({ whiteCritRate: 1.33 })
    expect(share(capped, target(), 0, BUFF.stonesplitStrengthSkillCritDamage)).toBeCloseTo(0.21, 9)

    const none = engine()
    expect(share(none, target(), 0, BUFF.stonesplitStrengthSkillCritDamage)).toBe(0)
  })
})

describe("Dread and Fearful Blade — the two gate buffs", () => {
  const gates = builtinBuffsForClass(CLASS)
  const dread = gates.find((buff) => buff.id === STATUS.dread)!
  const fearfulBlade = gates.find((buff) => buff.id === STATUS.fearfulBlade)!

  it("carry their measured stat effects", () => {
    expect(dread.effects).toEqual([{ statKey: "allDamageBoost", amount: 0.12 }])
    expect(fearfulBlade.effects).toEqual([
      { statKey: "allDamageBoost", amount: 0.08 },
      { statKey: "bellstrike.penetration", amount: 0.16 },
      { statKey: "stonesplit.penetration", amount: 0.16 },
      { statKey: "silkbind.penetration", amount: 0.16 },
      { statKey: "bamboocut.penetration", amount: 0.16 },
    ])
  })

  it("are a player buff and a team buff, at their configured durations", () => {
    expect(dread.scope).toBe("player")
    expect(dread.durationFrames).toBe(DREAD_DURATION_FRAMES)
    expect(fearfulBlade.scope).toBe("team")
    expect(fearfulBlade.durationFrames).toBe(FEARFUL_BLADE_DURATION_FRAMES)
  })
})

describe("what lays the two gate buffs", () => {
  const skills = builtinSkillsForClass(CLASS)
  const triggersOf = (id: string) =>
    skills.find((s) => s.id === id)!.hits.flatMap((hit) => hit.triggers)

  it("Snowparting Special opens Dread", () => {
    const opening = triggersOf(SKILL.snowpartingspecial).find(
      (trigger) => trigger.targetId === STATUS.dread,
    )!
    expect(opening.stacks).toBe(1)
    expect(opening.extendFrames).toBeUndefined()
  })

  // The stab EXTENDS Dread rather than reopening it — without `extendOnly` the
  // window collapses from thirteen seconds to seven.
  it("the stab extends Dread by two seconds and lays Fearful Blade", () => {
    const stab = triggersOf(SKILL.snowpartingqStab)
    const extension = stab.find((trigger) => trigger.targetId === STATUS.dread)!
    expect(extension.stacks).toBe(0)
    expect(extension.extendFrames).toBe(120)
    expect(extension.extendOnly).toBe(true)

    const fearful = stab.find((trigger) => trigger.targetId === STATUS.fearfulBlade)!
    expect(fearful.stacks).toBe(1)
  })
})
