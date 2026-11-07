// Skills, debuffs and buffs below are placeholder content authored only for this file.
import { describe, expect, it, vi } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeDebuff, type Debuff } from "../../src/engine/debuff"
import { makeStep } from "../../src/engine/rotation"
import { testRotation } from "../builtins"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import type { EngineRunOptions, Inputs, Result } from "../../src/engine/types"

const FPS = 60
const CLASS = "bellstrikeUmbra"
const EMPTYING_QI = 1_000_000
const CAST_PROBE = "probeCastGate"
const AFTER_HIT_PROBE = "probeAfterHitGate"
const BEFORE_HIT_PROBE = "probeBeforeHitGate"
const TICK_PROBE = "probeTickGrant"

vi.mock("../../src/engine/buffs/data", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/engine/buffs/data")>()
  const probes: BuffModule[] = [
    {
      id: "probeCastGate",
      name: "Probe Cast Gate",
      affectsAll: true,
      duration: 5,
      triggerPhase: "exhausted",
      effects: [],
    },
    {
      id: "probeAfterHitGate",
      name: "Probe After-Hit Gate",
      affectsAll: true,
      duration: 5,
      triggerPhase: "exhausted",
      triggerPhaseTiming: "afterHits",
      buffAppliesAfterLastHitSec: 0,
      effects: [],
    },
    {
      id: "probeBeforeHitGate",
      name: "Probe Before-Hit Gate",
      affectsAll: true,
      duration: 5,
      triggerPhase: "exhausted",
      buffAppliesAfterLastHitSec: 0,
      effects: [],
    },
    {
      id: "probeTickGrant",
      name: "Probe Tick Grant",
      affectsAll: true,
      duration: 5,
      triggerPhase: "exhausted",
      effects: [{ kind: "stat", statKey: "allDamageBoost", amount: 1 }],
    },
  ]
  return {
    ...original,
    buffDefsForClass: (classId: string) => [...original.buffDefsForClass(classId), ...probes],
  }
})

function inputsFor(skills: Skill[], debuffs: Debuff[] = []): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customDebuffs: debuffs,
    activeCustomRotation: testRotation(CLASS, {
      steps: skills.map((skill) => makeStep({ skillId: skill.id })),
    }),
  }
}

function chipPresent(result: Result, castIndex: number, buffId: string): boolean {
  return !!result.casts?.[castIndex]?.buffs.some((chip) => chip.id === buffId)
}

const follower = makeSkill(CLASS, {
  name: "Follower",
  castFrames: 10,
  triggersBuffs: [CAST_PROBE],
  hits: [makeHit({ frame: 0, physFixed: 1 })],
})

describe("a cast that starts on the frame the Qi bar empties", () => {
  it("sees the break when a hit emptied the bar on that frame", () => {
    const emptier = makeSkill(CLASS, {
      name: "Emptier",
      castFrames: 10,
      hits: [makeHit({ frame: 10, physFixed: 1, qiFlat: EMPTYING_QI })],
    })
    const result = simulateTimeline(inputsFor([emptier, follower]))
    const [qiBreak] = result.qiBreaks!
    expect(result.casts![1].timeSec).toBeCloseTo(qiBreak.startSec, 9)
    expect(chipPresent(result, 1, CAST_PROBE)).toBe(true)
  })

  it("does not see the break when a tick empties the bar on that frame", () => {
    const hammer: Debuff = makeDebuff(CLASS, {
      name: "Hammer",
      maxStacks: 1,
      durationFrames: 600,
      dot: {
        tickIntervalFrames: 10,
        firstTickOffsetFrames: 10,
        physMultiplier: 0,
        physFixed: 1,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        qiFlat: EMPTYING_QI,
        count: 1,
      },
    })
    const emptier = makeSkill(CLASS, {
      name: "Emptier",
      castFrames: 10,
      hits: [
        makeHit({
          frame: 0,
          physFixed: 1,
          triggers: [makeTrigger({ kind: "applyDebuff", targetId: hammer.id, stacks: 1 })],
        }),
      ],
    })
    const result = simulateTimeline(inputsFor([emptier, follower], [hammer]))
    const [qiBreak] = result.qiBreaks!
    expect(result.casts![1].timeSec).toBeCloseTo(qiBreak.startSec, 9)
    expect(chipPresent(result, 1, CAST_PROBE)).toBe(false)
  })

  it("does see a break that began on an earlier frame", () => {
    const emptier = makeSkill(CLASS, {
      name: "Emptier",
      castFrames: 10,
      hits: [makeHit({ frame: 0, physFixed: 1, qiFlat: EMPTYING_QI })],
    })
    const result = simulateTimeline(inputsFor([emptier, follower]))
    expect(chipPresent(result, 1, CAST_PROBE)).toBe(true)
  })

  it("reads the scripted bar's break from its first frame", () => {
    const idle = makeSkill(CLASS, {
      name: "Idle",
      castFrames: 10,
      hits: [makeHit({ frame: 0, physFixed: 1 })],
    })
    const options: EngineRunOptions = {
      fixedQiBreaks: [{ startSec: 10 / FPS, durationSec: 5, lowQiLeadSec: 0 }],
    }
    const result = simulateTimeline(inputsFor([idle, follower]), options)
    expect(chipPresent(result, 1, CAST_PROBE)).toBe(true)
  })
})

describe("a Qi-gated grant that lands after the last hit of its cast", () => {
  const closer = makeSkill(CLASS, {
    name: "Closer",
    castFrames: 20,
    triggersBuffs: [AFTER_HIT_PROBE],
    hits: [makeHit({ frame: 10, physFixed: 1, qiFlat: EMPTYING_QI })],
  })

  it("is decided against the bar the last hit left when it declares an after-hits read", () => {
    const result = simulateTimeline(inputsFor([closer]))
    expect(result.qiBreaks).toHaveLength(1)
    expect(chipPresent(result, 0, AFTER_HIT_PROBE)).toBe(true)
  })

  it("is decided against the bar before the last hit's Qi when it declares no read", () => {
    const unflagged = makeSkill(CLASS, {
      name: "Unflagged Closer",
      castFrames: 20,
      triggersBuffs: [BEFORE_HIT_PROBE],
      hits: [makeHit({ frame: 10, physFixed: 1, qiFlat: EMPTYING_QI })],
    })
    const result = simulateTimeline(inputsFor([unflagged]))
    expect(result.qiBreaks).toHaveLength(1)
    expect(chipPresent(result, 0, BEFORE_HIT_PROBE)).toBe(false)
  })

  it("waits for the hits of its frame even when it lands on the cast's own first frame", () => {
    const instant = makeSkill(CLASS, {
      name: "Instant Closer",
      castFrames: 20,
      triggersBuffs: [AFTER_HIT_PROBE],
      hits: [makeHit({ frame: 0, physFixed: 1, qiFlat: EMPTYING_QI })],
    })
    const result = simulateTimeline(inputsFor([instant]))
    expect(result.qiBreaks).toHaveLength(1)
    expect(chipPresent(result, 0, AFTER_HIT_PROBE)).toBe(true)
  })

  it("is refused while the bar still stands", () => {
    const gentle = makeSkill(CLASS, {
      name: "Gentle",
      castFrames: 20,
      triggersBuffs: [AFTER_HIT_PROBE],
      hits: [makeHit({ frame: 10, physFixed: 1 })],
    })
    const result = simulateTimeline(inputsFor([gentle]))
    expect(result.qiBreaks).toHaveLength(0)
    expect(chipPresent(result, 0, AFTER_HIT_PROBE)).toBe(false)
  })
})

describe("a buff a damage-over-time tick's debuff declares", () => {
  const emptyingTickDebuff = (declaredBuffs: string[]): Debuff =>
    makeDebuff(CLASS, {
      name: "Hammer",
      maxStacks: 1,
      durationFrames: 600,
      triggersBuffs: declaredBuffs,
      dot: {
        tickIntervalFrames: 10,
        firstTickOffsetFrames: 10,
        physMultiplier: 0,
        physFixed: 1,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        qiFlat: EMPTYING_QI,
        count: 1,
      },
    })

  function damageOf(result: Result, rowPrefix: string): number {
    return result.perSkill.find((row) => row.name.startsWith(rowPrefix))!.expectedDamage
  }

  function runWith(declaredBuffs: string[]): Result {
    const hammer = emptyingTickDebuff(declaredBuffs)
    const applier = makeSkill(CLASS, {
      name: "Applier",
      castFrames: 10,
      hits: [
        makeHit({
          frame: 0,
          physFixed: 1,
          triggers: [makeTrigger({ kind: "applyDebuff", targetId: hammer.id, stacks: 1 })],
        }),
      ],
    })
    const follower = makeSkill(CLASS, {
      name: "Follower",
      castFrames: 20,
      hits: [makeHit({ frame: 5, physFixed: 1 })],
    })
    return simulateTimeline(inputsFor([applier, follower], [hammer]))
  }

  it("never reaches the damage of the tick that grants it, and reaches what follows", () => {
    const without = runWith([])
    const granting = runWith([TICK_PROBE])
    expect(without.qiBreaks).toHaveLength(1)
    expect(damageOf(granting, "Hammer")).toBeCloseTo(damageOf(without, "Hammer"), 9)
    expect(damageOf(granting, "Follower")).toBeGreaterThan(damageOf(without, "Follower"))
  })
})
