// Fictional meter, skills and buff: the contract of a meter that settles after the buff engine.
import { describe, expect, it } from "vitest"
import { defineMeter, meterStatusId } from "../../src/definitions/resources/meterDef"
import { meterDelta } from "../../src/definitions/skills/triggers"
import {
  settleLateMeters,
  type LateMeterEnvironment,
  type LateMeterHit,
  type LateMeterStep,
} from "../../src/engine/lateMeter"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"

const FPS = 60
const PARTICLES = 10
const CHARGE = 900

const charges = defineMeter({
  id: "test-charges",
  name: "Test charges",
  capacity: 3 * CHARGE,
  start: "full",
  regenPerSecond: CHARGE / 15,
  displayUnitSize: CHARGE,
  dependsOnBuffs: true,
})

const COMBO = "test-combo"
const gainOnCombo = meterDelta({
  target: charges.id,
  stacks: 300,
  conditions: [{ buffId: COMBO, op: "gte", stacks: 1, source: "buffEngine" }],
  cooldownFrames: 60,
})

const caster = makeSkill("test", {
  name: "Caster (test)",
  meterCosts: [{ meterId: charges.id, amount: CHARGE }],
  castConditions: [{ buffId: meterStatusId(charges.id), op: "gte", stacks: CHARGE }],
  hits: [makeHit({ frame: 50, triggers: [gainOnCombo] })],
})

const stepAt = (startFrame: number, stepId = `step-${startFrame}`): LateMeterStep => ({
  stepId,
  skill: caster,
  startFrame,
  prePull: false,
})

const hitOf = (step: LateMeterStep, skill: Skill = caster, frame = step.startFrame + 50) =>
  ({
    skill,
    hit: skill.hits[0]!,
    stepStart: step.startFrame,
    frame,
    exactFrame: frame,
  }) satisfies LateMeterHit

function settle(
  steps: LateMeterStep[],
  hits: LateMeterHit[],
  liveParticles: LateMeterEnvironment["liveParticles"],
) {
  return settleLateMeters({
    defs: [charges],
    fps: FPS,
    startFrame: 0,
    maxContext: {
      paramTier: () => 0,
      paramOn: () => false,
      paramValue: () => 0,
      whiteAffinityRate: 0,
    },
    particleCount: PARTICLES,
    steps,
    hits,
    costApplies: () => true,
    delayedCostFrame: (startFrame, atFrame) => startFrame + atFrame,
    castEndFrame: (landed) => landed.stepStart + 100,
    guardsHold: () => true,
    liveParticles,
  })
}

const levelBefore = (settlement: ReturnType<typeof settle>, step: LateMeterStep) =>
  settlement.levelBeforeCast.get(step.stepId)!.get(charges.id)!

describe("a meter that settles after the buff engine", () => {
  it("spends at each cast's start and regenerates between casts", () => {
    const steps = [stepAt(0), stepAt(100)]
    const settlement = settle(steps, [], () => false)
    expect(levelBefore(settlement, steps[0]!)).toBe(3 * CHARGE)
    expect(levelBefore(settlement, steps[1]!)).toBe(2 * CHARGE + 100)
    expect(settlement.capacities.get(charges.id)).toBe(3 * CHARGE)
  })

  it("applies a gain only where the buff is up", () => {
    const steps = [stepAt(0), stepAt(100), stepAt(200)]
    const hits = [hitOf(steps[0]!), hitOf(steps[1]!)]
    const live = (_buffId: string, frame: number) => frame >= 150
    const settlement = settle(steps, hits, live)
    expect(levelBefore(settlement, steps[1]!)).toBe(2 * CHARGE + 100)
    expect(levelBefore(settlement, steps[2]!)).toBe(2 * CHARGE + 100 - CHARGE + 100 + 300)
  })

  it("splits into trajectories when only some keep the buff up and averages them", () => {
    const steps = [stepAt(0), stepAt(200)]
    const hits = [hitOf(steps[0]!)]
    const mask = new Uint8Array(PARTICLES)
    mask.fill(1, 0, 4)
    const settlement = settle(steps, hits, () => mask)
    expect(levelBefore(settlement, steps[1]!)).toBeCloseTo(2 * CHARGE + 200 + 0.4 * 300, 9)
  })

  it("flags a cast that lacks a charge in any trajectory and reports the expected level", () => {
    const steps = [stepAt(0), stepAt(1), stepAt(2), stepAt(3)]
    const hits = steps.slice(0, 3).map((step) => hitOf(step, caster, step.startFrame + 1))
    const mask = new Uint8Array(PARTICLES)
    mask.fill(1, 0, 5)
    const settlement = settle(steps, hits, () => mask)
    expect(settlement.illegalCasts.map((cast) => cast.stepId)).toEqual(["step-3"])
    const [reason] = settlement.illegalCasts[0]!.reasons
    expect(reason).toMatchObject({
      kind: "meter",
      id: charges.id,
      required: CHARGE,
      unitSize: CHARGE,
    })
    if (reason?.kind !== "meter") throw new Error("expected a meter reason")
    expect(reason.actual).toBeLessThan(CHARGE)
  })

  it("holds a gain back while its cooldown runs and starts the cooldown only where it fired", () => {
    const steps = [stepAt(0), stepAt(300)]
    const hits = [hitOf(steps[0]!, caster, 10), hitOf(steps[0]!, caster, 40)]
    const settlement = settle(steps, hits, () => true)
    expect(levelBefore(settlement, steps[1]!)).toBe(3 * CHARGE - CHARGE + 300 + 300)
  })

  it("leaves a pre-pull cast untouched", () => {
    const prePull: LateMeterStep = { ...stepAt(-100), prePull: true }
    const steps = [prePull, stepAt(0)]
    const settlement = settle(steps, [hitOf(prePull)], () => true)
    expect(levelBefore(settlement, steps[1]!)).toBe(3 * CHARGE)
    expect(settlement.levelBeforeCast.has(prePull.stepId)).toBe(false)
  })
})
