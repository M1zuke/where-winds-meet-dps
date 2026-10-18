// Scoped to the unvalidated Silkbind Jade class and to placeholder skills on
// another class: wiring, not a damage anchor.
import { describe, expect, it } from "vitest"
import { buffEngineWith } from "../helpers/qiBars"
import { landDamageHit } from "../helpers/landDamageHit"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeBuff } from "../../src/engine/buff"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { meterDelta } from "../../src/definitions/skills/triggers"
import { pursuitChargedBoost } from "../../src/data/skills/buffs/pursuitChargedBoost"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { SKILL } from "../../src/data/skills/silkbind-jade/ids"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"
import { builtinSkill, testRotation } from "../builtins"
import type { Inputs } from "../../src/engine/types"

const JADE = "silkbindJade"
const FPS = 60
const FORSAKEN_FAME_DRAIN_PER_SECOND = 30
const FORSAKEN_FAME_DRAIN_SECONDS = 0.55
const FORSAKEN_FAME_ENDURANCE_GAIN = 10

function jadeInputs(skillIds: string[]): Inputs {
  return {
    ...defaultInputs,
    classId: JADE,
    buffParams: {},
    activeCustomRotation: testRotation(JADE, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
    }),
  }
}

function enduranceAtEachCast(skillIds: string[]) {
  const result = simulateTimeline(jadeInputs(skillIds), { collect: "full" })
  return result.casts!.map((cast) => {
    const level = cast.meterLevels!.find((candidate) => candidate.id === enduranceMeter.id)!
    return { amount: level.amount, capacity: level.capacity }
  })
}

describe("Startling Spring stacks", () => {
  const fiveHit = builtinSkill(JADE, SKILL.fanheavypursuit5Hit)
  const hitSeconds = fiveHit.hits.map((hit) => hit.frame / FPS)
  const engine = () => {
    const created = buffEngineWith({}, [], [pursuitChargedBoost])
    for (const second of hitSeconds) landDamageHit(created, second, fiveHit)
    return created
  }

  it("lands one stack on each Moon Shatter Spring hit, not spread across the cast", () => {
    const built = engine()
    hitSeconds.forEach((second, index) => {
      expect(built.getHistoricalBuffStacks(BUFF.pursuitChargedBoost, second - 0.001)).toBe(index)
      expect(built.getHistoricalBuffStacks(BUFF.pursuitChargedBoost, second + 0.001)).toBe(
        index + 1,
      )
    })
  })

  it("holds all five stacks for 15 s after the latest one", () => {
    const built = engine()
    const last = hitSeconds[hitSeconds.length - 1]!
    expect(built.getHistoricalBuffStacks(BUFF.pursuitChargedBoost, last + 14.9)).toBe(5)
    expect(built.isBuffActiveAtTime(BUFF.pursuitChargedBoost, last + 15.1)).toBe(false)
  })

  it("makes charging cost 4% more Endurance per stack", () => {
    const stacked = enduranceAtEachCast([
      SKILL.fanspecial,
      SKILL.fanheavypursuit3Hit,
      SKILL.fanlightcharged,
      SKILL.fanlightcharged,
    ])
    const unstacked = enduranceAtEachCast([SKILL.fanlightcharged, SKILL.fanlightcharged])
    const drain = FORSAKEN_FAME_DRAIN_PER_SECOND * FORSAKEN_FAME_DRAIN_SECONDS
    expect(unstacked[1]!.amount).toBeCloseTo(
      unstacked[0]!.capacity - drain + FORSAKEN_FAME_ENDURANCE_GAIN,
      6,
    )
    expect(stacked[3]!.amount).toBeCloseTo(
      stacked[2]!.capacity - drain * (1 + 0.04 * 3) + FORSAKEN_FAME_ENDURANCE_GAIN,
      6,
    )
  })

  it("caps the Endurance surcharge at five stacks", () => {
    const stacked = enduranceAtEachCast([
      SKILL.fanspecial,
      SKILL.fanheavypursuit5Hit,
      SKILL.fanlightcharged,
      SKILL.fanlightcharged,
    ])
    expect(stacked[3]!.amount).toBeCloseTo(
      stacked[2]!.capacity -
        FORSAKEN_FAME_DRAIN_PER_SECOND * FORSAKEN_FAME_DRAIN_SECONDS * (1 + 0.04 * 5) +
        FORSAKEN_FAME_ENDURANCE_GAIN,
      6,
    )
  })
})

describe("Startling Spring's damage bonus", () => {
  it.each([
    SKILL.fanlightcharged,
    SKILL.glowAndFlowStage1,
    SKILL.glowAndFlowStage2,
    SKILL.apricotHeavenNormal,
    SKILL.apricotHeavenEnhanced,
    SKILL.umblightcharge,
    SKILL.umblightcharge12,
  ])("reaches the Charged skill %s", (skillId) => {
    expect(builtinSkill(JADE, skillId).receives).toContain(BUFF.pursuitChargedBoost)
  })
})

describe("Forsaken Fame's Endurance gain", () => {
  it("is authored 0.03 s after the whirlwind's hit, not at the cast's end", () => {
    const trigger = builtinSkill(JADE, SKILL.fanlightcharged).hits[0]!.triggers[0]!
    expect(trigger).toMatchObject({ kind: "meterDelta", targetId: "endurance", stacks: 10 })
    expect(trigger.delayFrames).toBeCloseTo(0.03 * FPS, 9)
    expect(trigger.appliesOnCastEnd).toBeUndefined()
  })
})

describe("a delayed meter gain", () => {
  const CLASS = "bellstrikeUmbra"
  const spend = (atFrame: number) => ({
    meterId: enduranceMeter.id,
    amount: 50,
    atFrame,
  })
  const castWith = (gain: ReturnType<typeof meterDelta>) =>
    makeSkill(CLASS, {
      name: "Delayed gain (test)",
      castFrames: 40,
      meterCosts: [spend(2), spend(30)],
      hits: [makeHit({ frame: 10, triggers: [gain] })],
    })
  const probe = makeSkill(CLASS, { name: "Probe (test)", castFrames: 10, hits: [makeHit()] })

  function enduranceBeforeProbe(gain: ReturnType<typeof meterDelta>) {
    const delayed = castWith(gain)
    const rotation = makeRotation(CLASS, {
      pingMs: 0,
      averageFps: 60,
      steps: [delayed, probe].map((skill) => makeStep({ skillId: skill.id })),
    })
    const result = simulateTimeline(
      {
        ...defaultInputs,
        classId: CLASS,
        customSkills: [delayed, probe],
        activeCustomRotation: rotation,
      },
      { collect: "full" },
    )
    const level = result.casts![1]!.meterLevels!.find((entry) => entry.id === enduranceMeter.id)!
    return { amount: level.amount, capacity: level.capacity }
  }

  it("lands at the hit's frame plus the delay, before a later spend in the same cast", () => {
    const landed = enduranceBeforeProbe(
      meterDelta({ target: enduranceMeter.id, stacks: 1000, delayFrames: 1.8 }),
    )
    expect(landed.amount).toBeCloseTo(landed.capacity - 50, 6)
  })

  it("lands after that spend when it waits for the cast's end", () => {
    const landed = enduranceBeforeProbe(
      meterDelta({ target: enduranceMeter.id, stacks: 1000, appliesOnCastEnd: true }),
    )
    expect(landed.amount).toBeCloseTo(landed.capacity, 6)
  })
})

describe("a charge cost surcharge", () => {
  const CLASS = "bellstrikeUmbra"
  const surcharge = makeBuff(CLASS, {
    name: "Surcharge (test)",
    durationFrames: 5,
    meterModifiers: [{ meterId: enduranceMeter.id, kind: "chargeCost", amount: 1 }],
  })
  const hold = makeSkill(CLASS, {
    name: "Hold (test)",
    castFrames: 62,
    meterDrains: [{ meterId: enduranceMeter.id, perSecond: 30, fromFrame: 2, stopAfterSec: 1 }],
    hits: [
      makeHit({
        frame: 0,
        triggers: [{ kind: "applyBuff", targetId: surcharge.id, stacks: 1, condition: null }],
      }),
    ],
  })
  const probe = makeSkill(CLASS, { name: "Probe (test)", castFrames: 10, hits: [makeHit()] })

  it("is read where the charge starts, so it still applies after the status has lapsed", () => {
    const rotation = makeRotation(CLASS, {
      pingMs: 0,
      averageFps: 60,
      steps: [hold, probe].map((skill) => makeStep({ skillId: skill.id })),
    })
    const result = simulateTimeline(
      {
        ...defaultInputs,
        classId: CLASS,
        customSkills: [hold, probe],
        customBuffs: [surcharge],
        activeCustomRotation: rotation,
      },
      { collect: "full" },
    )
    const level = result.casts![1]!.meterLevels!.find((entry) => entry.id === enduranceMeter.id)!
    expect(level.amount).toBeCloseTo(level.capacity - 30 * 2, 6)
  })
})
