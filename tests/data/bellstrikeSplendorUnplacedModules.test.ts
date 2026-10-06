// Scoped to Bellstrike Splendor's user-placed modules; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { simulateTimeline } from "../../src/engine/timeline"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../../src/data/skills/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import { BELLSTRIKE_SPLENDOR_GATES } from "../../src/data/classes/bellstrike-splendor/gates"
import { builtinSkill, testRotation } from "../builtins"

const CLASS_ID = "bellstrikeSplendor"
const splendorSkill = (skillId: string) => builtinSkill(CLASS_ID, skillId)

const hitValues = (skillId: string) =>
  splendorSkill(skillId).hits.map((skillHit) => [
    skillHit.frame,
    skillHit.physMultiplier,
    skillHit.attributeMultiplier,
    skillHit.physFixed,
    skillHit.attributeFixed,
  ])

describe.each([
  [SKILL.swordSpecialDash, CAST.swordSpecialDash, "Sword - Dash", 46],
  [SKILL.swordHeavyChargedTier1, CAST.swordHeavyChargedTier1, "Vagrant Sword", 82],
  [SKILL.swordLightAttack, CAST.splendorSwordLightChain, "Sword - Light Attack", 133],
  [SKILL.spearLightAttack, CAST.splendorSpearLightChain, "Spear - Light Attack", 153],
  [SKILL.swordHeavyAttack, CAST.splendorSwordHeavyChain, "Sword - Heavy Attack", 174],
  [SKILL.swordSprintDash, CAST.splendorSwordSprintDash, "Sword - Dash (sprint)", 41],
  [SKILL.cloudstep, CAST.splendorCloudstep, "Cloudstep", 43],
])("%s", (skillId, castTag, breakdownName, castFrames) => {
  it("is a triggerable Splendor weapon skill with its own cast tag", () => {
    expect(splendorSkill(skillId)).toMatchObject({
      breakdownName,
      castTag,
      castFrames,
      skillType: "weapon",
      attributeAttack: "Bellstrike",
      triggerable: true,
    })
    expect(classDefinition(CLASS_ID)!.skills.some((skill) => skill.id === skillId)).toBe(true)
  })

  it("appears in no built-in rotation", () => {
    for (const rotation of classDefinition(CLASS_ID)!.rotations) {
      expect(rotation.steps.some((step) => step.skillId === skillId)).toBe(false)
    }
  })

  it("lands every hit inside its cast", () => {
    for (const skillHit of splendorSkill(skillId).hits) {
      expect(skillHit.frame).toBeLessThan(castFrames)
    }
  })
})

describe("Sword - Dash after Shadow Step", () => {
  const dash = splendorSkill(SKILL.swordSpecialDash)

  it("hits once at 28 and spends 15 Endurance", () => {
    expect(hitValues(SKILL.swordSpecialDash)).toEqual([[28, 0.868016, 1.302024, 240.8, 131.2]])
    expect(dash.meterCosts).toEqual([{ meterId: "endurance", amount: 15 }])
    expect(dash.reachMeters).toBe(6.5)
    expect(dash.displacement).toEqual({ kind: "toTarget", meters: 1.5 })
  })

  it("registers the 2.5 s gate and consumes it on its hit", () => {
    expect(
      BELLSTRIKE_SPLENDOR_GATES.find((gate) => gate.id === BUFF.shadowStepDashWindow),
    ).toMatchObject({
      durationFrames: 150,
      maxStacks: 1,
    })
    expect(dash.castConditions).toContainEqual({
      buffId: BUFF.shadowStepDashWindow,
      op: "gte",
      stacks: 1,
    })
    expect(dash.hits[0]!.triggers).toMatchObject([
      { kind: "applyBuff", targetId: BUFF.shadowStepDashWindow, stacks: -1 },
    ])
  })

  it.each([
    [SKILL.swordSpecial, 144],
    [SKILL.swordSpecial2nd, 167],
    [SKILL.swordSpecialDeflect, 167],
  ])("is granted by %s so the window closes 167 f after the cast starts", (skillId, duration) => {
    expect(splendorSkill(skillId).hits[0]!.triggers).toContainEqual(
      expect.objectContaining({
        kind: "applyBuff",
        targetId: BUFF.shadowStepDashWindow,
        durationFrames: duration,
      }),
    )
  })

  const illegalDashWarnings = (skillIds: string[]) =>
    simulateTimeline({
      ...defaultInputs,
      classId: CLASS_ID,
      activeCustomRotation: testRotation(CLASS_ID, {
        steps: skillIds.map((skillId) => makeStep({ skillId })),
      }),
    }).warnings.filter((warning) => warning.includes("illegal") && warning.includes(dash.name))

  it("is illegal on its own and legal right after Shadow Step", () => {
    expect(illegalDashWarnings([SKILL.swordSpecialDash])).toHaveLength(1)
    expect(illegalDashWarnings([SKILL.swordSpecial, SKILL.swordSpecialDash])).toHaveLength(0)
  })

  it("is illegal a second time in a row, the window being spent", () => {
    expect(
      illegalDashWarnings([SKILL.swordSpecial, SKILL.swordSpecialDash, SKILL.swordSpecialDash]),
    ).toHaveLength(1)
  })
})

describe("Vagrant Sword - first charge tier", () => {
  const tier1 = splendorSkill(SKILL.swordHeavyChargedTier1)

  it("launches one bolt at 57 at 36 m/s", () => {
    expect(hitValues(SKILL.swordHeavyChargedTier1)).toEqual([[57, 1.51032, 2.26548, 419, 228]])
    expect(tier1.hits[0]!.projectile).toEqual({ speedMetersPerSecond: 36, maxTravelFrames: 24 })
  })

  it("is a charged sword attack without the heavy tag, Mistwillow or Energy Surge", () => {
    expect(tier1.tags).toEqual([PROP.isCharged, WEAPON.sword, ATTUNE.swordCharged])
    expect(tier1.tags).not.toContain(ATTACK.heavy)
    expect(tier1.receives).not.toContain(BUFF.mistwillowBuff)
    expect(tier1.receives).not.toContain(BUFF.mistwillowLightBuff)
    expect(tier1.receives).not.toContain(BUFF.swordMorphEnduranceBoost)
    expect(tier1.receives).toEqual(
      expect.arrayContaining([
        BUFF.swordSlashDamageBoost,
        BUFF.battleAnthemChargedDamage,
        BUFF.battleAnthemEnduranceBoost,
      ]),
    )
    const triggerIds = tier1.hits[0]!.triggers.map((trigger) => trigger.targetId)
    expect(triggerIds).not.toContain(BUFF.swordMorphMultiWaveWindow)
    expect(triggerIds).not.toContain("energySurgeGrant")
  })

  it("drains 11 Endurance over its 45 f hold", () => {
    expect(tier1.meterDrains).toEqual([
      { meterId: "endurance", perSecond: 20, fromFrame: 12, stopAfterSec: 0.55 },
    ])
  })
})

describe("light-attack chains", () => {
  it("Sword - Light Attack lands six hits totalling 0.925 of the row", () => {
    expect(hitValues(SKILL.swordLightAttack).map((row) => row[0])).toEqual([
      22, 43, 63, 75, 88, 112,
    ])
    const physTotal = hitValues(SKILL.swordLightAttack).reduce((sum, row) => sum + row[1]!, 0)
    expect(physTotal).toBeCloseTo(0.925 * 2.15224, 5)
  })

  it("Spear - Light Attack lands seven hits totalling the whole row", () => {
    expect(hitValues(SKILL.spearLightAttack).map((row) => row[0])).toEqual([
      20, 41, 65, 82, 106, 116, 133,
    ])
    const physTotal = hitValues(SKILL.spearLightAttack).reduce((sum, row) => sum + row[1]!, 0)
    expect(physTotal).toBeCloseTo(2.19191, 5)
  })

  it("carry the light tag and the Mistwillow light grants", () => {
    for (const skillId of [SKILL.swordLightAttack, SKILL.spearLightAttack]) {
      const skill = splendorSkill(skillId)
      expect(skill.tags).toContain(ATTACK.light)
      expect(skill.receives).toEqual(
        expect.arrayContaining([BUFF.mistwillowHeavyBuff, BUFF.mistwillowBuff]),
      )
    }
    expect(splendorSkill(SKILL.swordLightAttack).reachMeters).toBe(2.5)
    expect(splendorSkill(SKILL.spearLightAttack).reachMeters).toBe(4.5)
  })
})

describe("Sword - Heavy Attack tap chain", () => {
  it("lands five hits totalling the whole row and carries the heavy tag", () => {
    const rows = hitValues(SKILL.swordHeavyAttack)
    expect(rows.map((row) => row[0])).toEqual([26, 48, 83, 115, 150])
    expect(rows.reduce((sum, row) => sum + row[1]!, 0)).toBeCloseTo(2.39637, 5)
    expect(splendorSkill(SKILL.swordHeavyAttack).tags).toEqual([WEAPON.sword, ATTACK.heavy])
  })
})

describe("sprint attacks", () => {
  it("Sword - Dash (sprint) hits at 8 and 26", () => {
    expect(hitValues(SKILL.swordSprintDash)).toEqual([
      [8, 0.173364, 0.260046, 48.2, 26.2],
      [26, 0.693456, 1.040184, 192.8, 104.8],
    ])
  })

  it("Cloudstep hits once at 29", () => {
    expect(hitValues(SKILL.cloudstep)).toEqual([[29, 0.591504, 0.887256, 164.4, 89.4]])
  })

  it("carry no cast condition", () => {
    expect(splendorSkill(SKILL.swordSprintDash).castConditions).toBeUndefined()
    expect(splendorSkill(SKILL.cloudstep).castConditions).toBeUndefined()
  })
})
