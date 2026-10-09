// Scoped to Stonesplit Strength's user-placed modules; not a measured DPS
// anchor (docs/TESTING.md § "Class scoping").
import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass, groupBuffDefs } from "../../src/engine/buffs/data"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import type { Inputs } from "../../src/engine/types"
import { BUFF, PARAM } from "../../src/data/skills/buffs/ids"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../../src/data/skills/ids"
import { SKILL, STATUS } from "../../src/data/skills/stonesplit-strength/ids"
import { BREAK_DEFENSE_COOLDOWN_FRAMES } from "../../src/data/classes/stonesplit-strength/gates"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import { builtinSkill, testRotation } from "../builtins"

const CLASS_ID = "stonesplitStrength"
const stonesplitSkill = (skillId: string) => builtinSkill(CLASS_ID, skillId)

const hitValues = (skillId: string) =>
  stonesplitSkill(skillId).hits.map((skillHit) => [
    skillHit.frame,
    skillHit.physMultiplier,
    skillHit.attributeMultiplier,
    skillHit.physFixed,
    skillHit.attributeFixed,
  ])

describe.each([
  [SKILL.snowpartingqSlash, CAST.snowpartingQSlash, 40, [14, 30]],
  [SKILL.phalanxchargedS1, CAST.phalanxChargedS1, 79, [48, 55]],
  [SKILL.phalanxchargedS2, CAST.phalanxChargedS2, 137, [76, 115, 124]],
  [SKILL.phalanxchargedS2Innerpassion, CAST.phalanxChargedS2InnerPassion, 118, [57, 96, 105]],
  [SKILL.breakDefense, CAST.breakDefense, 80, [11, 47]],
  [SKILL.hengLightAttack1, CAST.hengLightAttack1, 24, [17]],
  [SKILL.hengLightAttack2, CAST.hengLightAttack2, 20, [16]],
  [SKILL.hengLightAttack3, CAST.hengLightAttack3, 66, [19, 32, 55]],
  [SKILL.hengLightAttack4, CAST.hengLightAttack4, 57, [11, 38]],
  [SKILL.hengHeavyAttack1, CAST.hengHeavyAttack1, 33, [21]],
  [SKILL.hengHeavyAttack2, CAST.hengHeavyAttack2, 43, [11, 28]],
  [SKILL.hengHeavyAttack3, CAST.hengHeavyAttack3, 26, [18]],
  [SKILL.hengHeavyAttack4, CAST.hengHeavyAttack4, 54, [28]],
  [SKILL.hengDash, CAST.hengDash, 40, [22]],
  [SKILL.moLightAttack1, CAST.moLightAttack1, 38, [17]],
  [SKILL.moLightAttack2, CAST.moLightAttack2, 65, [43]],
  [SKILL.moLightAttack3, CAST.moLightAttack3, 142, [44, 87]],
  [SKILL.moDash, CAST.moDash, 52, [25]],
])("%s", (skillId, castTag, castFrames, hitFrames) => {
  it("is a triggerable Stonesplit weapon skill with its own cast tag, length and hit frames", () => {
    const skill = stonesplitSkill(skillId)
    expect(skill).toMatchObject({
      castTag,
      castFrames,
      skillType: "weapon",
      attributeAttack: "Stonesplit",
      triggerable: true,
    })
    expect(skill.hits.map((skillHit) => skillHit.frame)).toEqual(hitFrames)
    expect(classDefinition(CLASS_ID)!.skills.some((candidate) => candidate.id === skillId)).toBe(
      true,
    )
  })

  it("appears in no built-in rotation", () => {
    for (const rotation of classDefinition(CLASS_ID)!.rotations) {
      expect(rotation.steps.some((step) => step.skillId === skillId)).toBe(false)
    }
  })

  it("lands every hit inside its cast", () => {
    for (const skillHit of stonesplitSkill(skillId).hits) {
      expect(skillHit.frame).toBeLessThan(castFrames)
    }
  })
})

describe("SnowpartingQ-Slash", () => {
  const slash = stonesplitSkill(SKILL.snowpartingqSlash)

  it("carries the Snowparting Q attunement and none of the Stab's triggers", () => {
    expect(slash.tags).toEqual([WEAPON.hengBlade, ATTUNE.snowpartingQ])
    expect(slash.triggersBuffs).toEqual([])
    expect(slash.hits.flatMap((skillHit) => skillHit.triggers)).toEqual([])
  })

  it("hits twice with the 0.4 / 0.6 split", () => {
    expect(hitValues(SKILL.snowpartingqSlash)).toEqual([
      [14, 0.596352, 0.894528, 165.2, 90],
      [30, 0.894528, 1.341792, 247.8, 135],
    ])
    expect(slash.reachMeters).toBe(4.5)
  })
})

describe("Burning Heart stages 1 and 2", () => {
  it("hit with the stage values", () => {
    expect(hitValues(SKILL.phalanxchargedS1)).toEqual([
      [48, 0.397233, 0.59585, 110.1, 60],
      [55, 0.926877, 1.390316, 256.9, 140],
    ])
    expect(hitValues(SKILL.phalanxchargedS2)).toEqual([
      [76, 0, 0, 0, 0],
      [115, 0.88272, 1.32408, 244.2, 133.2],
      [124, 2.05968, 3.08952, 569.8, 310.8],
    ])
    expect(hitValues(SKILL.phalanxchargedS2Innerpassion)).toEqual([
      [57, 0, 0, 0, 0],
      [96, 0.88272, 1.32408, 244.2, 133.2],
      [105, 2.05968, 3.08952, 569.8, 310.8],
    ])
  })

  it.each([SKILL.phalanxchargedS1, SKILL.phalanxchargedS2, SKILL.phalanxchargedS2Innerpassion])(
    "%s consumes through the low-stage property and never the stage-3 one",
    (skillId) => {
      const { tags } = stonesplitSkill(skillId)
      expect(tags).toContain(PROP.consumesInnerPassionBurningHeartLowStage)
      expect(tags).not.toContain(PROP.consumesInnerPassionBurningHeart)
      expect(tags).toEqual(
        expect.arrayContaining([ATTACK.charge, ATTUNE.phalanxbaneCharged, PROP.cleftpeakBoost]),
      )
    },
  )

  it("only the stage-2 forms spawn the downward-slash soldier, behind Iron Guards", () => {
    expect(
      stonesplitSkill(SKILL.phalanxchargedS1).hits.flatMap((skillHit) => skillHit.triggers),
    ).toEqual([])
    for (const skillId of [SKILL.phalanxchargedS2, SKILL.phalanxchargedS2Innerpassion]) {
      expect(stonesplitSkill(skillId).hits[0]!.triggers).toMatchObject([
        {
          kind: "castSkill",
          targetId: SKILL.anxisoldiermodown,
          condition: { buffId: BUFF.ironGuards, op: "gte", stacks: 1 },
        },
      ])
    }
  })

  it("stage 1 costs nothing, stage 2 costs 50 and needs more than 50", () => {
    expect(stonesplitSkill(SKILL.phalanxchargedS1).meterCosts).toBeUndefined()
    expect(stonesplitSkill(SKILL.phalanxchargedS2).meterCosts).toEqual([
      { meterId: "bladeMomentum", amount: 50 },
    ])
    expect(stonesplitSkill(SKILL.phalanxchargedS2).castConditions).toEqual([
      { buffId: "meter:bladeMomentum", op: "gt", stacks: 50 },
    ])
  })

  it("the Inner Passion form offers the charge above 25 Blade Momentum or from tier 4, with no equip gate", () => {
    expect(stonesplitSkill(SKILL.phalanxchargedS2Innerpassion).castConditions).toEqual([
      {
        anyOf: [
          { param: PARAM.steadfastDevotion, minTier: 4 },
          { buffId: "meter:bladeMomentum", op: "gt", stacks: 25 },
        ],
      },
    ])
  })

  const bladeMomentumAtSecondCast = (skillId: string, mindMethods: Inputs["mindMethods"]) => {
    const result = simulateTimeline({
      ...defaultInputs,
      classId: CLASS_ID,
      set: null,
      mindMethods,
      activeCustomRotation: testRotation(CLASS_ID, {
        steps: [makeStep({ skillId }), makeStep({ skillId })],
      }),
    })
    return result.casts?.[1]?.meterLevels?.find((level) => level.id === "bladeMomentum")?.amount
  }

  const steadfastAt = (tier: number): Inputs["mindMethods"] => [
    { id: INNER_WAY_ID.steadfastDevotion, name: "Steadfast Devotion", stacks: String(tier) },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
  ]
  const noInnerWays = defaultInputs.mindMethods

  it("the Inner Passion form pays 25 with Steadfast Devotion unequipped, and below tier 4", () => {
    const unequipped = bladeMomentumAtSecondCast(SKILL.phalanxchargedS2Innerpassion, noInnerWays)
    expect(unequipped).toBeGreaterThan(125)
    expect(unequipped).toBeLessThan(150)
    expect(
      bladeMomentumAtSecondCast(SKILL.phalanxchargedS2Innerpassion, steadfastAt(3)),
    ).toBeCloseTo(unequipped!, 9)
  })

  it("the Inner Passion form is free from Steadfast Devotion tier 4", () => {
    expect(bladeMomentumAtSecondCast(SKILL.phalanxchargedS2Innerpassion, steadfastAt(4))).toBe(150)
  })
})

describe("the low-stage consume def", () => {
  const engineWith = (params: Record<string, unknown>) =>
    new BuffEngine({ classId: CLASS_ID, ...params }, buffDefsForClass(CLASS_ID), groupBuffDefs())

  const withInnerPassion = (params: Record<string, unknown>) => {
    const engine = engineWith(params)
    engine.processSkillCast(CAST.snowpartingSpecial, 0, { castTime: 1 }, false, [BUFF.innerPassion])
    return engine
  }

  it.each([
    ["without Steadfast Devotion equipped", {}],
    [
      "with Steadfast Devotion at tier 6",
      { [PARAM.steadfastDevotion]: true, steadfastDevotionTier: 6 },
    ],
  ])("spends one Inner Passion %s", (_label, params) => {
    const engine = withInnerPassion(params)
    const before = engine.getHistoricalBuffStacks(BUFF.innerPassion, 1.5)
    expect(before).toBeGreaterThan(0)
    engine.processSkillCast(CAST.phalanxChargedS2InnerPassion, 2, {
      consumesInnerPassionBurningHeartLowStage: true,
      castTime: 1,
    })
    expect(engine.getHistoricalBuffStacks(BUFF.innerPassion, 2.5)).toBe(before - 1)
  })

  it("adds no damage factor, where the stage-3 consume multiplies by 1.32", () => {
    const params = { [PARAM.steadfastDevotion]: true, steadfastDevotionTier: 6 }
    const lowStage = withInnerPassion(params)
    const lowCast = lowStage.processSkillCast(CAST.phalanxChargedS2InnerPassion, 2, {
      consumesInnerPassionBurningHeartLowStage: true,
      castTime: 1,
    })
    const stageThree = withInnerPassion(params)
    const stageThreeCast = stageThree.processSkillCast(CAST.phalanxChargedS3InnerPassion, 2, {
      consumesInnerPassionBurningHeart: true,
      castTime: 1,
    })
    const phalanxCharged = stonesplitSkill(SKILL.phalanxchargedS2Innerpassion)
    expect(lowStage.calculateDamageEffects(phalanxCharged, 2, lowCast.buffIds).damageFactor).toBe(1)
    expect(
      stageThree.calculateDamageEffects(phalanxCharged, 2, stageThreeCast.buffIds).damageFactor,
    ).toBeCloseTo(1.32, 9)
  })
})

describe("Break Defense", () => {
  const breakDefense = stonesplitSkill(SKILL.breakDefense)

  it("hits twice with the shared-row values and no reach of its own", () => {
    expect(hitValues(SKILL.breakDefense)).toEqual([
      [11, 0.19841, 0.297615, 1.2, 0],
      [47, 0.59523, 0.892845, 3.6, 0],
    ])
    expect(breakDefense.reachMeters).toBeUndefined()
    expect(breakDefense.displacement).toEqual({ kind: "towardTarget", referenceMeters: 1 })
  })

  it("opens a 10 s cooldown on its first hit", () => {
    expect(BREAK_DEFENSE_COOLDOWN_FRAMES).toBe(600)
    expect(breakDefense.hits[0]!.triggers).toMatchObject([
      { kind: "applyBuff", targetId: STATUS.breakDefenseCooldown },
    ])
  })

  it("lands again only after the cooldown has run out", () => {
    const wait = makeSkill(CLASS_ID, {
      name: "Wait",
      castFrames: BREAK_DEFENSE_COOLDOWN_FRAMES,
      hits: [makeHit({ frame: 0 })],
    })
    const hitsOf = (steps: ReturnType<typeof makeStep>[]) => {
      const result = simulateTimeline({
        ...defaultInputs,
        classId: CLASS_ID,
        set: null,
        customSkills: [wait],
        activeCustomRotation: testRotation(CLASS_ID, { steps }),
      })
      return result.perSkill.find((row) => row.name === breakDefense.name)?.count ?? 0
    }
    const castBreakDefense = () => makeStep({ skillId: SKILL.breakDefense })
    expect(hitsOf([castBreakDefense()])).toBe(2)
    expect(hitsOf([castBreakDefense(), castBreakDefense()])).toBe(2)
    expect(hitsOf([castBreakDefense(), makeStep({ skillId: wait.id }), castBreakDefense()])).toBe(4)
  })
})

describe("the basic attack and dash modules", () => {
  it("Heng Blade light attack stages carry the stage values", () => {
    expect(hitValues(SKILL.hengLightAttack1)).toEqual([[17, 0.365684, 0.548525, 101.25, 55.2]])
    expect(hitValues(SKILL.hengLightAttack2)).toEqual([[16, 0.365684, 0.548525, 101.25, 55.2]])
    expect(hitValues(SKILL.hengLightAttack3)).toEqual([
      [19, 0.243789, 0.365684, 67.5, 36.8],
      [32, 0.243789, 0.365684, 67.5, 36.8],
      [55, 0.365684, 0.548525, 101.25, 55.2],
    ])
    expect(hitValues(SKILL.hengLightAttack4)).toEqual([
      [11, 0.292547, 0.43882, 81, 44.16],
      [38, 0.560715, 0.841072, 155.25, 84.64],
    ])
  })

  it("Heng Blade heavy attack stages carry the stage values", () => {
    expect(hitValues(SKILL.hengHeavyAttack1)).toEqual([[21, 0.404708, 0.607062, 112, 61]])
    expect(hitValues(SKILL.hengHeavyAttack2)).toEqual([
      [11, 0.202354, 0.303531, 56, 30.5],
      [28, 0.303531, 0.455297, 84, 45.75],
    ])
    expect(hitValues(SKILL.hengHeavyAttack3)).toEqual([[18, 0.404708, 0.607062, 112, 61]])
    expect(hitValues(SKILL.hengHeavyAttack4)).toEqual([[28, 0.708239, 1.062359, 196, 106.75]])
  })

  it("Mo Blade light attack stages carry the stage values, the third at the earlier collider", () => {
    expect(hitValues(SKILL.moLightAttack1)).toEqual([[17, 0.763704, 1.145556, 211.2, 115.2]])
    expect(hitValues(SKILL.moLightAttack2)).toEqual([[43, 0.95463, 1.431945, 264, 144]])
    expect(hitValues(SKILL.moLightAttack3)).toEqual([
      [44, 0.95463, 1.431945, 264, 144],
      [87, 1.145556, 1.718334, 316.8, 172.8],
    ])
  })

  it("the dashes hit once and shrink or dash by distance", () => {
    expect(hitValues(SKILL.hengDash)).toEqual([[22, 0.43723, 0.655845, 122, 66]])
    expect(hitValues(SKILL.moDash)).toEqual([[25, 1.01266, 1.51899, 281, 153]])
    expect(stonesplitSkill(SKILL.hengDash).displacement).toEqual({
      kind: "byDistance",
      bands: [{ minMeters: 7, maxMeters: 100, then: { kind: "selfForward", meters: 6 } }],
      otherwise: { kind: "towardTarget", referenceMeters: 1 },
    })
    expect(stonesplitSkill(SKILL.moDash).displacement).toEqual({
      kind: "byDistance",
      bands: [{ minMeters: 6, maxMeters: 100, then: { kind: "selfForward", meters: 5 } }],
      otherwise: { kind: "towardTarget", referenceMeters: 1 },
    })
  })

  it("neither art's chain applies a buff or opens a trigger", () => {
    for (const skillId of [
      SKILL.hengLightAttack1,
      SKILL.hengHeavyAttack4,
      SKILL.hengDash,
      SKILL.moLightAttack3,
      SKILL.moDash,
    ]) {
      const skill = stonesplitSkill(skillId)
      expect(skill.triggersBuffs).toEqual([])
      expect(skill.hits.flatMap((skillHit) => skillHit.triggers)).toEqual([])
    }
  })
})
