import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { graduationInputs } from "../../src/engine/graduation"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import {
  defaultCombatSettings,
  type Inputs,
  type UnclaimedOddityNodes,
} from "../../src/engine/types"
import { graduationBuildsFor } from "../../src/definitions/graduationBuilds/registry"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"
import { DEBUFF, SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import {
  BLEED_MECHANISM_ENHANCEMENT_GAIN,
  BLEED_MECHANISM_ENHANCEMENT_RELEASE,
} from "../../src/data/skills/bellstrike-umbra/buffs/bleedMechanismEnhancement"
import { SECOND_TRACK_SLASH_COST } from "../../src/data/skills/bellstrike-umbra/buffs/secondTrackSlashEndurance"
import { builtinSkill, testRotation } from "../builtins"

const CLASS = "bellstrikeUmbra"
const METER_ID = enduranceMeter.id

const NO_ODDITY_ENDURANCE: UnclaimedOddityNodes = {
  Qinghe: [101, 112, 126, 139],
  Kaifeng: [205, 222],
  Hexi: [305, 324],
}

const SWORD_SPECIAL_FORMS: readonly string[] = [
  SKILL.swordspecial1Hit,
  SKILL.swordspecial2Hit,
  SKILL.swordspecial3Hit,
  SKILL.swordspecial4Hit,
]
const SECOND_TRACK_SLASH_FORMS = [
  SKILL.swordChargeStage11Hit,
  SKILL.swordChargeStage12Hit,
  SKILL.swordChargeStage13Hit,
  SKILL.swordChargeStage14Hit,
  SKILL.swordChargeStage15Hit,
  SKILL.swordChargeStage24Hit,
  SKILL.swordChargeStage25Hit,
]
const REFUND_SKILLS = [
  ...SWORD_SPECIAL_FORMS,
  SKILL.swordMartialQqq,
  SKILL.swordRChargeFollowUp,
  SKILL.swordRChargeFollowUp1HitCancel,
  SKILL.crosswindBlade,
  SKILL.crosswindBladeCancel,
]

const triggersOf = (skill: Skill) => skill.hits.flatMap((hit) => hit.triggers)

function levelsOf(
  skills: Skill[],
  patch: Partial<Inputs> & { openingBleed?: number } = {},
): number[] {
  const { openingBleed, ...inputsPatch } = patch
  const result = simulateTimeline({
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills.filter((skill) => skill.id.startsWith("sk-")),
    activeCustomRotation: testRotation(CLASS, {
      steps: skills.map((skill) => makeStep({ skillId: skill.id })),
      openingStacks: openingBleed === undefined ? undefined : { [DEBUFF.bleedTick]: openingBleed },
    }),
    set: null,
    unclaimedOddityNodes: NO_ODDITY_ENDURANCE,
    buffParams: { swordHorizon: true, swordHorizonTier: 6 },
    ...inputsPatch,
  })
  return result.casts!.map((cast) => cast.meterLevels!.find((l) => l.id === METER_ID)!.amount)
}

const observer = makeSkill(CLASS, {
  id: "sk-observer",
  name: "Observer",
  castFrames: 6,
  hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
})
const spender = (amount: number) =>
  makeSkill(CLASS, {
    id: "sk-spender",
    name: "Spender",
    castFrames: 6,
    meterCosts: [{ meterId: METER_ID, amount }],
    hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
  })

describe("the Bleeding Endurance refund shares one lockout across its four skills", () => {
  it("authors the same gain, 180 frames in one group, on every hit of every skill that carries it", () => {
    for (const id of REFUND_SKILLS) {
      const gains = triggersOf(builtinSkill(CLASS, id)).filter(
        (trigger) => trigger.kind === "meterDelta" && trigger.targetId === METER_ID,
      )
      expect(gains.length, id).toBeGreaterThan(0)
      for (const gain of gains.filter((trigger) => trigger.stacks === 10)) {
        expect(gain, id).toEqual(BLEED_MECHANISM_ENHANCEMENT_GAIN)
      }
    }
    expect(BLEED_MECHANISM_ENHANCEMENT_GAIN.cooldownFrames).toBe(180)
    expect(BLEED_MECHANISM_ENHANCEMENT_GAIN.conditionsBeforeHit).toBe(true)
  })

  it("lets a Crosswind Blade cancelled out of an Inner Balance Strike III gain again, only because the Special's end released the lockout", () => {
    const withoutRelease: Skill = {
      ...builtinSkill(CLASS, SKILL.swordspecial3Hit),
      id: "sk-special-without-release",
      hits: builtinSkill(CLASS, SKILL.swordspecial3Hit).hits.map((hit) => ({
        ...hit,
        triggers: hit.triggers.filter((trigger) => trigger.kind !== "cooldownCut"),
      })),
    }
    const special = builtinSkill(CLASS, SKILL.swordspecial3Hit)
    const crosswind = builtinSkill(CLASS, SKILL.crosswindBladeCancel)
    const released = levelsOf([special, crosswind, observer], { openingBleed: 4 })
    const unreleased = levelsOf([withoutRelease, crosswind, observer], { openingBleed: 4 })
    expect(released[2]! - unreleased[2]!).toBe(10)
  })
})

describe("an Inner Balance Strike III releases the lockout at its end", () => {
  it("carries the release on the first hit of every form, and on no other skill", () => {
    for (const id of SWORD_SPECIAL_FORMS) {
      const releases = builtinSkill(CLASS, id).hits.flatMap((hit, index) =>
        hit.triggers.filter((trigger) => trigger.kind === "cooldownCut").map(() => index),
      )
      expect(releases, id).toEqual([0])
      expect(triggersOf(builtinSkill(CLASS, id))).toContainEqual(
        BLEED_MECHANISM_ENHANCEMENT_RELEASE,
      )
    }
    for (const id of REFUND_SKILLS.filter((id) => !SWORD_SPECIAL_FORMS.includes(id))) {
      expect(
        triggersOf(builtinSkill(CLASS, id)).some((trigger) => trigger.kind === "cooldownCut"),
        id,
      ).toBe(false)
    }
  })
})

describe("the refund reads Bleeding before the hit's own stack", () => {
  it("grants at 4 stacks before the hit and not at 3, although that hit's own stack makes 4", () => {
    const crosswind = builtinSkill(CLASS, SKILL.crosswindBlade)
    const atFour = levelsOf([spender(40), crosswind, observer], { openingBleed: 4 })
    const atThree = levelsOf([spender(40), crosswind, observer], { openingBleed: 3 })
    expect(atFour[2]! - atThree[2]!).toBe(10)
  })
})

describe("Second Track Slash under River Flow", () => {
  const spent = (skills: Skill[]) => {
    const levels = levelsOf([
      ...skills,
      spender(40),
      builtinSkill(CLASS, SKILL.swordChargeStage14Hit),
      observer,
    ])
    return levels[levels.length - 2]! - levels[levels.length - 1]!
  }

  it("drains 11.2 / s and spends 4.8 instead of 14 / s and 6", () => {
    const withoutRiverFlow = spent([])
    const withRiverFlow = spent([builtinSkill(CLASS, SKILL.spearq)])
    expect(withoutRiverFlow).toBeCloseTo(0.3 * 14 + 6, 1)
    expect(withRiverFlow).toBeCloseTo(0.3 * 11.2 + 4.8, 1)
  })

  it("spends the immediate cost 30 frames into the cast on every stage-1 and stage-2 form", () => {
    expect(SECOND_TRACK_SLASH_COST.atFrame).toBe(30)
    for (const id of SECOND_TRACK_SLASH_FORMS) {
      expect(builtinSkill(CLASS, id).meterCosts, id).toEqual([SECOND_TRACK_SLASH_COST])
    }
  })
})

describe("the 38 BB's rotation on the No ST Burst graduation build", () => {
  const build = graduationBuildsFor(CLASS).find(
    (candidate) => candidate.rotationId === "builtin-bellstrikeUmbra-38-bbs",
  )!
  const enduranceWarnings = (bean: boolean) => {
    const graduated = graduationInputs(
      { ...defaultInputs, classId: CLASS, graduationBuildId: build.id, breakthrough: 17 },
      "maxRolls",
    )!
    const inputs = applyBowSet(applyArmorSet(withDerivedStats(graduated)))
    return runEngine({
      ...inputs,
      combatSettings: {
        ...defaultCombatSettings(),
        ...inputs.combatSettings,
        fragrantOrchidBathBean: bean,
      },
    }).warnings.filter((warning) => warning.includes("Endurance"))
  }

  it("is fully castable with the Fragrant Orchid Bath Bean", () => {
    expect(enduranceWarnings(true)).toEqual([])
  })

  it("is not castable without it", () => {
    expect(enduranceWarnings(false).length).toBeGreaterThan(0)
  })

  it("carries the bean in the graduation inputs", () => {
    const graduated = graduationInputs(
      { ...defaultInputs, classId: CLASS, graduationBuildId: build.id, breakthrough: 17 },
      "maxRolls",
    )!
    expect(graduated.combatSettings?.fragrantOrchidBathBean).toBe(true)
  })
})
