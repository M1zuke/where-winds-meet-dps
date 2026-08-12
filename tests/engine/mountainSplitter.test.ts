import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { receivesForSkill } from "../../src/engine/buffs/catalog"
import { buffDefsForSpec, groupBuffDefs } from "../../src/engine/buffs/data"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { computeSkillDamage } from "../../src/engine/formula"
import { buildContext } from "../../src/engine/panel"
import { padSlots } from "../../src/engine/perSkillDamage"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill, makeTrigger } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultCombatSettings } from "../../src/engine/types"

const SPEC = "stonesplit_strength"
const CLASS = "stonesplitStrength"

function engine(tier: number, overrides: Record<string, unknown> = {}) {
  return new BuffEngine(
    { steadfastDevotion: true, steadfastDevotionTier: tier, ...overrides },
    buffDefsForSpec(SPEC),
    groupBuffDefs(),
  )
}

function affectedSkill(name = "PhalanxCharged-S3") {
  return makeSkill(CLASS, {
    name,
    weaponOrAttribute: "Modao",
    attributeAttack: "Stonesplit",
    tags: ["weapon:Mo Blade"],
  })
}

describe("Steadfast Devotion Mountain Splitter", () => {
  it("requires Inner Passion and accepts generated Modao Anxi Soldier triggers at tier 3", () => {
    const withoutInnerPassion = engine(3)
    withoutInnerPassion.processSkillCast("AnxiSoldierMoDown", 1, { generated: true })
    expect(withoutInnerPassion.isBuffActiveAtTime("mountainSplitter", 1)).toBe(false)

    const withInnerPassion = engine(3)
    withInnerPassion.processSkillCast("SnowpartingSpecial", 0, { castTime: 1 })
    withInnerPassion.processSkillCast("AnxiSoldierMoDown", 1.1, { generated: true })

    expect(withInnerPassion.isBuffActiveAtTime("mountainSplitter", 1.1)).toBe(true)
    expect(withInnerPassion.isBuffActiveAtTime("mountainSplitter", 11.099)).toBe(true)
    expect(withInnerPassion.isBuffActiveAtTime("mountainSplitter", 11.1)).toBe(false)
    const effects = withInnerPassion.calculateDamageEffects(affectedSkill(), 2)
    expect(effects.conditionalFinalCrit).toEqual({ threshold: 0.75, bonusBelowThreshold: 0.15 })
    expect(effects.effects).toContainEqual({ statKey: "critDamageBoost", amount: 0.1 })

    const unaffected = withInnerPassion.calculateDamageEffects(
      affectedSkill("AnxiSoldierMoSweep"),
      2,
    )
    expect(unaffected.conditionalFinalCrit).toBeNull()
    expect(unaffected.effects).not.toContainEqual({ statKey: "critDamageBoost", amount: 0.1 })
  })

  it("enforces the 15-second ICD only on the Inner Passion activation route", () => {
    const buffs = engine(3)
    buffs.processSkillCast("SnowpartingSpecial", 0, { castTime: 1 })
    buffs.processSkillCast("AnxiSoldierMoSweep", 1.1, { generated: true })
    buffs.processSkillCast("SnowpartingSpecial", 10, { castTime: 1 })
    buffs.processSkillCast("AnxiSoldierMoJump", 16.099, { generated: true })
    expect(buffs.isBuffActiveAtTime("mountainSplitter", 16.099)).toBe(false)

    buffs.processSkillCast("AnxiSoldierMoJump", 16.1, { generated: true })
    expect(buffs.isBuffActiveAtTime("mountainSplitter", 16.1)).toBe(true)
  })

  it("grants the tier 4 damage bonus only when a charge consumes a valid source", () => {
    const tier3 = engine(3)
    tier3.processSkillCast("SnowpartingSpecial", 0, { castTime: 1 })
    const tier3Cast = tier3.processSkillCast("PhalanxCharged-S3[InnerPassion]", 1.1, {
      consumesInnerPassionBurningHeart: true,
    })
    expect(tier3Cast.buffIds).not.toContain("burningHeartIPConsume")

    const tier4 = engine(4)
    tier4.processSkillCast("SnowpartingSpecial", 0, { castTime: 1 })
    const tier4Cast = tier4.processSkillCast("PhalanxCharged-S3[InnerPassion]", 1.1, {
      consumesInnerPassionBurningHeart: true,
    })
    expect(tier4Cast.buffIds).toContain("burningHeartIPConsume")
    expect(
      tier4.calculateDamageEffects(affectedSkill(), 1.1, tier4Cast.buffIds).damageMultiplier,
    ).toBe(1.32)

    const noSource = engine(4).processSkillCast("PhalanxCharged-S3[InnerPassion]", 1.1, {
      consumesInnerPassionBurningHeart: true,
    })
    expect(noSource.buffIds).not.toContain("burningHeartIPConsume")
  })

  it("shows the tier 4 consumption bonus in the affected skill's buff table", () => {
    const skill = makeSkill(CLASS, {
      name: "PhalanxCharged-S3[InnerPassion]",
      tags: ["prop:consumesInnerPassionBurningHeart"],
    })
    const row = receivesForSkill(skill, CLASS, {
      ...defaultInputs,
      classId: CLASS,
      mindMethods: [
        { name: "Steadfast Devotion", stacks: "tier 4" },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
      ],
    }).find((candidate) => candidate.id === "burningHeartIPConsume")

    expect(row).toMatchObject({
      effect: "×1.32 damage after resource consumption",
      requires: "Steadfast Devotion tier 4+",
      active: true,
    })
  })

  it("grants three tier 6 Enhanced Charge stacks for 18 seconds and consumes Inner Passion first", () => {
    const buffs = engine(6, { qiBreakTime: 0, bossBreakDuration: 1.5 })
    buffs.processSkillCast("PhalanxCharged-S3", 0, { castTime: 1 })
    expect(buffs.getHistoricalBuffStacks("chargeEnhancement", 1)).toBe(3)
    expect(buffs.getHistoricalBuffStacks("chargeEnhancement", 18.999)).toBe(3)
    expect(buffs.getHistoricalBuffStacks("chargeEnhancement", 19)).toBe(0)

    buffs.applyBuff("innerPassion", 1.1, null, 3)
    for (const time of [2, 3, 4]) {
      const result = buffs.processSkillCast("PhalanxCharged-S3[InnerPassion]", time, {
        consumesInnerPassionBurningHeart: true,
      })
      expect(result.buffIds).not.toContain("mountainSplitter")
      expect(buffs.getHistoricalBuffStacks("chargeEnhancement", time)).toBe(3)
    }
    expect(buffs.getHistoricalBuffStacks("innerPassion", 4)).toBe(0)
    expect(buffs.activeBuffsForDisplay(4).some((buff) => buff.id === "innerPassion")).toBe(false)

    const enhanced = buffs.processSkillCast("PhalanxCharged-S3[InnerPassion]", 5, {
      consumesInnerPassionBurningHeart: true,
    })
    expect(buffs.getHistoricalBuffStacks("chargeEnhancement", 5)).toBe(2)
    expect(enhanced.buffIds).toContain("mountainSplitter")
    expect(enhanced.propagatedBuffIds).toEqual(["mountainSplitter"])
    expect(buffs.isBuffActiveAtTime("mountainSplitter", 5)).toBe(false)
  })

  it("checks the threshold after precision and adds 15 percentage points below it", () => {
    const baseContext = buildContext({ ...defaultInputs, classId: CLASS, set: null })
    const art = {
      name: "Mountain Splitter Probe",
      physMultiplier: 1,
      attributeMultiplier: 1.5,
      skillType: "weapon",
      weaponOrAttribute: "Modao",
      attributeAttack: "Stonesplit",
      conditionalFinalCrit: { threshold: 0.75, bonusBelowThreshold: 0.15 },
    }
    const context = {
      ...baseContext,
      precisionPanel: 1,
      affinityPanel: 0,
      directCritPanel: 0,
      directAffinityPanel: 0,
      rateResistance: 0,
      set: null,
    }

    const guaranteed = computeSkillDamage(art, padSlots([]), { ...context, critPanel: 0.75 }, 1)
    const explicitGuaranteed = computeSkillDamage(
      { ...art, conditionalFinalCrit: undefined, guaranteedCrit: 1 },
      padSlots([]),
      { ...context, critPanel: 0.75 },
      1,
    )
    expect(guaranteed.expectedDamage).toBeCloseTo(explicitGuaranteed.expectedDamage, 10)

    const boosted = computeSkillDamage(art, padSlots([]), { ...context, critPanel: 0.74 }, 1)
    expect(boosted.cells.AN).toBeCloseTo(0.89, 10)
    expect(boosted.expectedDamage).not.toBeCloseTo(explicitGuaranteed.expectedDamage, 10)
  })

  it("propagates a consumed Enhanced Charge to the generated Anxi chain", () => {
    const controlAnxi = makeSkill(CLASS, {
      name: "AnxiSoldierMoDownControl",
      weaponOrAttribute: "Modao",
      attributeAttack: "Stonesplit",
      tags: ["weapon:Mo Blade"],
      hits: [makeHit({ physMultiplier: 1, attributeMultiplier: 1.5 })],
    })
    const enhancedAnxi = makeSkill(CLASS, {
      name: "AnxiSoldierMoDownEnhanced",
      weaponOrAttribute: "Modao",
      attributeAttack: "Stonesplit",
      tags: ["weapon:Mo Blade"],
      hits: [makeHit({ physMultiplier: 1, attributeMultiplier: 1.5 })],
    })
    const grant = makeSkill(CLASS, {
      name: "PhalanxCharged-Grant",
      weaponOrAttribute: "Modao",
      attributeAttack: "Stonesplit",
      tags: ["weapon:Mo Blade"],
      castFrames: 60,
      hits: [
        makeHit({
          physMultiplier: 1,
          attributeMultiplier: 1.5,
          triggers: [makeTrigger({ kind: "castSkill", targetId: controlAnxi.id, stacks: 0 })],
        }),
      ],
    })
    const consume = makeSkill(CLASS, {
      name: "PhalanxCharged-Consume",
      weaponOrAttribute: "Modao",
      attributeAttack: "Stonesplit",
      tags: ["weapon:Mo Blade", "prop:consumesInnerPassionBurningHeart"],
      castFrames: 60,
      hits: [
        makeHit({
          physMultiplier: 1,
          attributeMultiplier: 1.5,
          triggers: [makeTrigger({ kind: "castSkill", targetId: enhancedAnxi.id, stacks: 0 })],
        }),
      ],
    })
    const customSkills = [controlAnxi, enhancedAnxi, grant, consume]
    const result = simulateTimeline({
      ...defaultInputs,
      classId: CLASS,
      precision: 1.3,
      critRate: 1.3,
      affinityRate: 0,
      directAffinityRate: 0,
      mindMethods: [
        { name: "Steadfast Devotion", stacks: "tier 6" },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
      ],
      combatSettings: {
        ...defaultCombatSettings(),
        qiBreak: { enabled: true, startSec: 0, durationSec: 10 },
      },
      customSkills,
      activeCustomRotation: makeRotation(CLASS, {
        steps: [grant, consume].map((skill) =>
          makeStep({ skillId: skill.id, hitCount: skill.hits.length }),
        ),
      }),
    })
    const damage = (name: string) =>
      result.perSkill.find((row) => row.name === name)?.expectedDamage ?? 0

    expect(damage(enhancedAnxi.name)).toBeGreaterThan(damage(controlAnxi.name))
  })
})
