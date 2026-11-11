import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { buildContext } from "../../src/engine/panel"
import { makeSkill, makeHit, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeStep, type Rotation } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { makeDebuff, type Debuff } from "../../src/engine/debuff"
import type { EngineRunOptions, Inputs } from "../../src/engine/types"
import type { SwordTrialBossId } from "../../src/definitions/baseStats/swordTrialBosses"

const CLASS = "bellstrikeUmbra"

const BROKEN_FROM_START: EngineRunOptions = {
  fixedQiBreaks: [{ startSec: 0, durationSec: 10, lowQiLeadSec: 0 }],
}
const NEVER_BROKEN: EngineRunOptions = { fixedQiBreaks: [] }

const QI_BREAK_TALENT = 0.3

function inputsFor(
  rotation: Rotation,
  skills: Skill[],
  debuffs: Debuff[],
  swordTrialBoss: SwordTrialBossId,
  patch: Partial<Inputs> = {},
): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    divinecraft: null,
    customSkills: skills,
    customBuffs: [],
    customDebuffs: debuffs,
    activeCustomRotation: rotation,
    swordTrialBoss,
    ...patch,
  }
}

function singleHit(): { rotation: Rotation; skills: Skill[] } {
  const strike = makeSkill(CLASS, {
    name: "Strike",
    castFrames: 60,
    hits: [makeHit({ frame: 0, physMultiplier: 2, physFixed: 50 })],
  })
  return {
    rotation: makeRotation(CLASS, { steps: [makeStep({ skillId: strike.id })] }),
    skills: [strike],
  }
}

function damageOf(
  boss: SwordTrialBossId,
  options: EngineRunOptions,
  patch: Partial<Inputs> = {},
): number {
  const { rotation, skills } = singleHit()
  return simulateTimeline(inputsFor(rotation, skills, [], boss, patch), options).totalDamage
}

describe("a boss's Qi break talent", () => {
  it("adds the boss's Qi break talent to the additive boost inside a break", () => {
    const { rotation, skills } = singleHit()
    const inputs = inputsFor(rotation, skills, [], "sleepingDaoist")
    const boost = buildContext(inputs).generalDamageBoost
    const talented = damageOf("sleepingDaoist", BROKEN_FROM_START)
    const plain = damageOf("riverMaster", BROKEN_FROM_START)
    expect(talented / plain).toBeCloseTo((1 + boost + QI_BREAK_TALENT) / (1 + boost), 8)
  })

  it("leaves hits outside a break unchanged", () => {
    expect(damageOf("sleepingDaoist", NEVER_BROKEN)).toBe(damageOf("riverMaster", NEVER_BROKEN))
  })

  it("drops the Qi break talent in dummy mode", () => {
    expect(damageOf("sleepingDaoist", BROKEN_FROM_START, { dummyMode: true })).toBe(
      damageOf("riverMaster", BROKEN_FROM_START, { dummyMode: true }),
    )
  })

  it("drops the Qi break talent where the breakthrough's version of the boss carries none", () => {
    expect(damageOf("voidKing", BROKEN_FROM_START, { breakthrough: 14 })).toBe(
      damageOf("riverMaster", BROKEN_FROM_START, { breakthrough: 14 }),
    )
    expect(damageOf("voidKing", BROKEN_FROM_START, { breakthrough: 13 })).toBeGreaterThan(
      damageOf("riverMaster", BROKEN_FROM_START, { breakthrough: 13 }),
    )
  })

  it("reaches a damage-over-time tick inside a break", () => {
    const bleed = makeDebuff(CLASS, {
      name: "Bleed",
      activation: "triggered",
      durationFrames: 600,
      effects: [],
      maxStacks: 1,
      stackScaling: "flat",
      dot: {
        tickIntervalFrames: 100,
        physMultiplier: 1,
        physFixed: 0,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
    })
    const apply = makeSkill(CLASS, {
      name: "Apply",
      castFrames: 300,
      hits: [
        makeHit({
          frame: 0,
          triggers: [makeTrigger({ kind: "applyDebuff", targetId: bleed.id, stacks: 1 })],
        }),
      ],
    })
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: apply.id })] })
    const tickDamage = (boss: SwordTrialBossId): number =>
      simulateTimeline(inputsFor(rotation, [apply], [bleed], boss), BROKEN_FROM_START)
        .perSkill.filter((row) => row.name.includes("Bleed"))
        .reduce((sum, row) => sum + row.expectedDamage, 0)
    const boost = buildContext(
      inputsFor(rotation, [apply], [bleed], "sleepingDaoist"),
    ).generalDamageBoost
    expect(tickDamage("riverMaster")).toBeGreaterThan(0)
    expect(tickDamage("sleepingDaoist") / tickDamage("riverMaster")).toBeCloseTo(
      (1 + boost + QI_BREAK_TALENT) / (1 + boost),
      8,
    )
  })
})
