import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass, groupBuffDefs } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"
import { builtinBuffsForClass } from "../../src/engine/builtinBuffs"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { CAST, PROP, ROLE, WEAPON } from "../../src/data/skills/ids"
import { SKILL, STATUS } from "../../src/data/skills/stonesplit-strength/ids"
import {
  DREAD_DURATION_FRAMES,
  FEARFUL_BLADE_DURATION_FRAMES,
} from "../../src/data/classes/stonesplit-strength/gates"
import { shatteredRidge } from "../../src/data/sets/shatteredRidge"

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
})

describe("Shattered Ridge", () => {
  const boosted = () =>
    skill("SnowpartingVC", [WEAPON.hengBlade, PROP.shatteredRidgeBoost], CAST.snowpartingVC, [
      BUFF.shatteredRidgeDeflect,
    ])
  const plain = () => skill("SnowpartingSlide", [WEAPON.hengBlade], CAST.snowpartingSlide)

  it("registers only while the set is equipped", () => {
    expect(
      engine({ armorSet: shatteredRidge.siteKey }).definitions.has(BUFF.shatteredRidgeDeflect),
    ).toBe(true)
    expect(engine({ armorSet: "jadeware" }).definitions.has(BUFF.shatteredRidgeDeflect)).toBe(false)
  })

  it("pays out at five damage stacks and not before", () => {
    const ridged = engine({ armorSet: shatteredRidge.siteKey })
    for (let hit = 0; hit < 4; hit++) ridged.processDamageHit(hit * 0.1)
    expect(share(ridged, boosted(), 0.5, BUFF.shatteredRidgeDeflect)).toBe(0)

    ridged.processDamageHit(0.4)
    expect(share(ridged, boosted(), 0.5, BUFF.shatteredRidgeDeflect)).toBeCloseTo(0.08, 9)
  })

  it("stacks on any damaging hit, but reaches only the skills that carry the property", () => {
    const ridged = engine({ armorSet: shatteredRidge.siteKey })
    for (let hit = 0; hit < 5; hit++) ridged.processDamageHit(hit * 0.1)
    expect(share(ridged, plain(), 0.5, BUFF.shatteredRidgeDeflect)).toBe(0)
  })

  it("lets its five-second window lapse", () => {
    const ridged = engine({ armorSet: shatteredRidge.siteKey })
    for (let hit = 0; hit < 5; hit++) ridged.processDamageHit(hit * 0.1)
    expect(share(ridged, boosted(), 6, BUFF.shatteredRidgeDeflect)).toBe(0)
  })
})

describe("Iron Guards", () => {
  const any = () => skill("SnowpartingSlide", [WEAPON.hengBlade], CAST.snowpartingSlide)

  it("pays damage and both penetrations off Phalanx Special, on a 20-second cooldown", () => {
    const guarded = engine()
    guarded.processSkillCast(CAST.phalanxSpecial, 0, { castTime: 1 }, false, [BUFF.ironGuards])
    expect(statOf(guarded, any(), 1, "allDamageBoost")).toBeCloseTo(0.08, 9)
    expect(statOf(guarded, any(), 1, "phys.penetration")).toBeCloseTo(0.12, 9)
    expect(statOf(guarded, any(), 1, "stonesplit.penetration")).toBeCloseTo(0.12, 9)
    expect(statOf(guarded, any(), 41, "allDamageBoost")).toBe(0)
  })
})

describe("the class's flat skill crit damage", () => {
  it("is always on, and reaches everything", () => {
    const plainEngine = engine()
    const target = skill("SnowpartingSlide", [WEAPON.hengBlade], CAST.snowpartingSlide)
    expect(share(plainEngine, target, 0, BUFF.stonesplitStrengthSkillCritDamage)).toBeCloseTo(
      0.21,
      9,
    )
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
  it("the stab extends Dread by six seconds and lays Fearful Blade", () => {
    const stab = triggersOf(SKILL.snowpartingqStab)
    const extension = stab.find((trigger) => trigger.targetId === STATUS.dread)!
    expect(extension.stacks).toBe(0)
    expect(extension.extendFrames).toBe(360)
    expect(extension.extendOnly).toBe(true)

    const fearful = stab.find((trigger) => trigger.targetId === STATUS.fearfulBlade)!
    expect(fearful.stacks).toBe(1)
  })
})
